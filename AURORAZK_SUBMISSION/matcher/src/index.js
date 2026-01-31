/**
 * AuroraZK Dark Pool Matcher Service
 * 
 * This is the "black box" that:
 * 1. Receives encrypted orders from users
 * 2. Decrypts and maintains a private order book
 * 3. Runs matching algorithm (price-time priority)
 * 4. Submits reveal_and_match transactions to Solana
 */

import 'dotenv/config';
import express from 'express';
import { WebSocketServer } from 'ws';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { 
  Connection, 
  PublicKey, 
  Keypair, 
  clusterApiUrl,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getOrCreateAssociatedTokenAccount
} from '@solana/spl-token';
import anchor from '@coral-xyz/anchor';
const { Program, AnchorProvider, BN } = anchor;
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ═══════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3001;
const SOLANA_RPC = process.env.SOLANA_RPC || clusterApiUrl('devnet');
const PROGRAM_ID = new PublicKey('4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi');

// Treasury wallet for fee collection
const TREASURY_WALLET = new PublicKey('AHgcoqgpn9HQUtae9fx3mf5ESR1Ftbwagmha4TmYtDdX');

// USDC Mint address for devnet
const USDC_MINT = new PublicKey('6QMo13mtRuUhcRtFReCKUfuNd5GVkdAg9oz2tNGzaufy');

// Fee configuration (basis points) - DISABLED for hackathon demo
// Matches app/lib/constants.ts FEE_CONFIG
const FEE_CONFIG = {
  marketOrderBps: 0,   // 0% - disabled
  limitOrderBps: 0,    // 0% - disabled
  getFeeBps: (orderType) => 0,
  calculateFee: (amount, orderType) => 0,
};

// Load matcher keypair for signing transactions
// Priority: 1) MATCHER_WALLET_KEY env var (for deployment), 2) File path, 3) Generate ephemeral
let matcherKeypair;

function loadMatcherWallet() {
  // Option 1: Load from environment variable (for Railway/Render deployment)
  if (process.env.MATCHER_WALLET_KEY) {
    try {
      // Support both base64-encoded and JSON array formats
      let keyData;
      const envKey = process.env.MATCHER_WALLET_KEY.trim();
      
      if (envKey.startsWith('[')) {
        // JSON array format: [1,2,3,...]
        keyData = JSON.parse(envKey);
      } else {
        // Base64 encoded format
        keyData = JSON.parse(Buffer.from(envKey, 'base64').toString('utf-8'));
      }
      
      const keypair = Keypair.fromSecretKey(Uint8Array.from(keyData));
      console.log(`🔑 Loaded matcher wallet from MATCHER_WALLET_KEY env`);
      console.log(`   Public key: ${keypair.publicKey.toBase58()}`);
      return keypair;
    } catch (e) {
      console.error('❌ Failed to load MATCHER_WALLET_KEY:', e.message);
    }
  }
  
  // Option 2: Load from file path (for local development)
  const walletPath = process.env.MATCHER_WALLET || join(__dirname, '../../matcher-wallet.json');
  try {
    const keypairData = JSON.parse(readFileSync(walletPath, 'utf-8'));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
    console.log(`🔑 Loaded matcher wallet from file: ${walletPath}`);
    console.log(`   Public key: ${keypair.publicKey.toBase58()}`);
    return keypair;
  } catch (e) {
    // File not found or invalid
  }
  
  // Option 3: Generate ephemeral (for testing only - NOT recommended for production)
  console.warn('⚠️  No matcher wallet found, generating ephemeral...');
  console.warn('   This wallet will be lost on restart!');
  console.warn('   Set MATCHER_WALLET_KEY env var for production.');
  const keypair = Keypair.generate();
  console.log(`🔑 Generated ephemeral wallet: ${keypair.publicKey.toBase58()}`);
  return keypair;
}

matcherKeypair = loadMatcherWallet();

// Load encryption secret key
let encryptionSecretKey;
if (process.env.MATCHER_ENCRYPTION_SECRET) {
  encryptionSecretKey = naclUtil.decodeBase64(process.env.MATCHER_ENCRYPTION_SECRET);
  console.log('🔐 Loaded encryption key from env');
} else {
  // Generate ephemeral for development
  const keypair = nacl.box.keyPair();
  encryptionSecretKey = keypair.secretKey;
  console.log('⚠️  Using ephemeral encryption key');
  console.log(`   Public key for frontend: ${naclUtil.encodeBase64(keypair.publicKey)}`);
}

// ═══════════════════════════════════════════════════════════════════
// Order Book State
// ═══════════════════════════════════════════════════════════════════

class PrivateOrderBook {
  constructor() {
    // Orders indexed by orderId (on-chain public key)
    this.orders = new Map();
    // Sorted buy orders (highest price first)
    this.buyOrders = [];
    // Sorted sell orders (lowest price first)
    this.sellOrders = [];
    // Matched pairs waiting for settlement
    this.pendingMatches = [];
    // Completed matches
    this.completedMatches = [];
  }

  addOrder(order, skipAutoMatch = false) {
    this.orders.set(order.orderId, order);
    
    if (order.side === 'buy') {
      this.buyOrders.push(order);
      // Sort by price desc (highest first), then timestamp asc
      this.buyOrders.sort((a, b) => {
        if (b.price !== a.price) return b.price - a.price;
        return a.timestamp - b.timestamp;
      });
    } else {
      this.sellOrders.push(order);
      // Sort by price asc (lowest first), then timestamp asc
      this.sellOrders.sort((a, b) => {
        if (a.price !== b.price) return a.price - b.price;
        return a.timestamp - b.timestamp;
      });
    }

    console.log(`📥 Added ${order.side.toUpperCase()} order: ${order.orderId.slice(0, 8)}...`);
    console.log(`   Price: $${order.price}, Size: ${order.size} SOL`);
    console.log(`   Order type: ${order.orderType}`);
    
    // Skip auto-matching for user orders - they should use /trigger-match
    if (skipAutoMatch) {
      console.log(`   ⏸️  Auto-match skipped (use /trigger-match to execute)`);
      return [];
    }
    
    return this.tryMatch();
  }

  removeOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) return false;
    
    this.orders.delete(orderId);
    
    if (order.side === 'buy') {
      this.buyOrders = this.buyOrders.filter(o => o.orderId !== orderId);
    } else {
      this.sellOrders = this.sellOrders.filter(o => o.orderId !== orderId);
    }
    
    return true;
  }

  tryMatch() {
    const matches = [];
    
    // Keep matching while there are compatible orders
    while (this.buyOrders.length > 0 && this.sellOrders.length > 0) {
      const bestBuy = this.buyOrders[0];
      const bestSell = this.sellOrders[0];
      
      // For limit orders: buy price >= sell price
      // For market orders: always match if available
      const canMatch = 
        bestBuy.orderType === 'market' ||
        bestSell.orderType === 'market' ||
        bestBuy.price >= bestSell.price;
      
      if (!canMatch) break;
      
      // Determine execution price (midpoint for equal priority, or taker's price)
      let executionPrice;
      if (bestBuy.orderType === 'market') {
        executionPrice = bestSell.price;
      } else if (bestSell.orderType === 'market') {
        executionPrice = bestBuy.price;
      } else {
        // Both limit orders - use midpoint
        executionPrice = (bestBuy.price + bestSell.price) / 2;
      }
      
      // Check slippage for market orders
      if (bestBuy.orderType === 'market' && bestBuy.slippage) {
        const maxPrice = bestBuy.price * (1 + bestBuy.slippage / 100);
        if (executionPrice > maxPrice) {
          console.log(`⚠️  Market buy would exceed slippage: $${executionPrice} > $${maxPrice}`);
          break;
        }
      }
      
      if (bestSell.orderType === 'market' && bestSell.slippage) {
        const minPrice = bestSell.price * (1 - bestSell.slippage / 100);
        if (executionPrice < minPrice) {
          console.log(`⚠️  Market sell would exceed slippage: $${executionPrice} < $${minPrice}`);
          break;
        }
      }
      
      // Determine execution size (minimum of both)
      const executionSize = Math.min(bestBuy.size, bestSell.size);
      
      const match = {
        buyOrder: bestBuy,
        sellOrder: bestSell,
        price: executionPrice,
        size: executionSize,
        timestamp: Date.now(),
      };
      
      matches.push(match);
      this.pendingMatches.push(match);
      
      console.log('\n🎯 ═══════════════════════════════════════════════════════');
      console.log('   MATCH FOUND!');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`   Buy:   ${bestBuy.orderId.slice(0, 8)}... @ $${bestBuy.price}`);
      console.log(`   Sell:  ${bestSell.orderId.slice(0, 8)}... @ $${bestSell.price}`);
      console.log(`   Exec:  ${executionSize} SOL @ $${executionPrice.toFixed(2)}`);
      console.log(`   Value: $${(executionSize * executionPrice).toFixed(2)}`);
      console.log('═══════════════════════════════════════════════════════\n');
      
      // Update or remove orders based on fill
      const buyRemaining = bestBuy.size - executionSize;
      const sellRemaining = bestSell.size - executionSize;
      
      if (buyRemaining <= 0.0001) {
        this.buyOrders.shift();
        this.orders.delete(bestBuy.orderId);
      } else {
        this.buyOrders[0] = { ...bestBuy, size: buyRemaining };
        this.orders.set(bestBuy.orderId, this.buyOrders[0]);
      }
      
      if (sellRemaining <= 0.0001) {
        this.sellOrders.shift();
        this.orders.delete(bestSell.orderId);
      } else {
        this.sellOrders[0] = { ...bestSell, size: sellRemaining };
        this.orders.set(bestSell.orderId, this.sellOrders[0]);
      }
    }
    
    return matches;
  }

  getStats() {
    return {
      totalOrders: this.orders.size,
      buyOrders: this.buyOrders.length,
      sellOrders: this.sellOrders.length,
      pendingMatches: this.pendingMatches.length,
      completedMatches: this.completedMatches.length,
      bestBid: this.buyOrders[0]?.price || null,
      bestAsk: this.sellOrders[0]?.price || null,
      spread: this.buyOrders[0] && this.sellOrders[0]
        ? this.sellOrders[0].price - this.buyOrders[0].price
        : null,
    };
  }
}

const orderBook = new PrivateOrderBook();

// ═══════════════════════════════════════════════════════════════════
// Solana Connection
// ═══════════════════════════════════════════════════════════════════

const connection = new Connection(SOLANA_RPC, 'confirmed');
let program;

async function initializeProgram() {
  try {
    // Load IDL (prefer on-chain snapshot, fallback to local)
    const onchainIdlPath = join(__dirname, '../../app/idl/aurorazk.onchain.json');
    const localIdlPath = join(__dirname, '../../app/lib/idl/aurorazk.json');
    const idlPath = existsSync(onchainIdlPath) ? onchainIdlPath : localIdlPath;
    const idl = JSON.parse(readFileSync(idlPath, 'utf-8'));
    
    // Create provider (using matcher wallet)
    const provider = new AnchorProvider(
      connection,
      {
        publicKey: matcherKeypair.publicKey,
        signTransaction: async (tx) => {
          tx.sign(matcherKeypair);
          return tx;
        },
        signAllTransactions: async (txs) => {
          txs.forEach(tx => tx.sign(matcherKeypair));
          return txs;
        },
      },
      { commitment: 'confirmed' }
    );
    
    program = new Program(idl, provider);
    console.log('✅ Solana program initialized');
    
    // Check matcher wallet balance
    const balance = await connection.getBalance(matcherKeypair.publicKey);
    console.log(`💰 Matcher wallet balance: ${(balance / 1e9).toFixed(4)} SOL`);
    
    if (balance < 0.01 * 1e9) {
      console.warn('⚠️  Matcher wallet needs SOL for transaction fees!');
      console.log(`   Run: solana airdrop 1 ${matcherKeypair.publicKey.toBase58()} --url devnet`);
    }
  } catch (error) {
    console.error('Failed to initialize program:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Match Execution
// ═══════════════════════════════════════════════════════════════════

const ORDER_BOOK_SEED = 'order_book_v3';
const USER_BALANCE_SEED = 'user_balance';

function getUserBalancePda(owner) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(USER_BALANCE_SEED), owner.toBuffer()],
    PROGRAM_ID
  );
}

async function executeMatch(match) {
  console.log(`\n⚡ Executing match on-chain...`);
  
  try {
    const { buyOrder, sellOrder, price, size } = match;
    
    // IMPORTANT: Round prices to avoid floating point precision issues
    // The on-chain commitment uses integer micro-prices, so we must match exactly
    const roundedBuyPrice = Math.round(buyOrder.price * 1e6) / 1e6;
    const roundedSellPrice = Math.round(sellOrder.price * 1e6) / 1e6;
    const roundedBuySize = Math.round(buyOrder.size * 1e9) / 1e9;
    const roundedSellSize = Math.round(sellOrder.size * 1e9) / 1e9;
    
    // Convert to on-chain format using rounded values
    const buyPriceInMicro = Math.round(roundedBuyPrice * 1e6);
    const buySizeInLamports = Math.round(roundedBuySize * 1e9);
    const buyNonce = new Uint8Array(buyOrder.nonce);
    
    const sellPriceInMicro = Math.round(roundedSellPrice * 1e6);
    const sellSizeInLamports = Math.round(roundedSellSize * 1e9);
    const sellNonce = new Uint8Array(sellOrder.nonce);
    
    const executionPriceInMicro = Math.floor(price * 1e6);
    const executionSizeInLamports = Math.floor(size * 1e9);
    
    const [orderBookPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(ORDER_BOOK_SEED)],
      PROGRAM_ID
    );
    const [buyBalancePda] = getUserBalancePda(new PublicKey(buyOrder.owner));
    const [sellBalancePda] = getUserBalancePda(new PublicKey(sellOrder.owner));
    
    console.log(`   Buy Order:  ${buyOrder.orderId}`);
    console.log(`     Price: $${buyOrder.price} (${buyPriceInMicro} micro)`);
    console.log(`     Size:  ${buyOrder.size} SOL (${buySizeInLamports} lamports)`);
    console.log(`   Sell Order: ${sellOrder.orderId}`);
    console.log(`     Price: $${sellOrder.price} (${sellPriceInMicro} micro)`);
    console.log(`     Size:  ${sellOrder.size} SOL (${sellSizeInLamports} lamports)`);
    console.log(`   Execution:`);
    console.log(`     Price: $${price} (${executionPriceInMicro} micro)`);
    console.log(`     Size:  ${size} SOL (${executionSizeInLamports} lamports)`);
    
    const tx = await program.methods
      .revealAndMatch(
        new BN(buyPriceInMicro),
        new BN(buySizeInLamports),
        Array.from(buyNonce),
        new BN(sellPriceInMicro),
        new BN(sellSizeInLamports),
        Array.from(sellNonce),
        new BN(executionPriceInMicro),
        new BN(executionSizeInLamports)
      )
      .accounts({
        buyOrder: new PublicKey(buyOrder.orderId),
        sellOrder: new PublicKey(sellOrder.orderId),
        orderBook: orderBookPda,
        buyBalance: buyBalancePda,
        sellBalance: sellBalancePda,
        matcher: matcherKeypair.publicKey,
      })
      .signers([matcherKeypair])
      .rpc();
    
    console.log(`\n✅ Match executed on-chain!`);
    console.log(`   Transaction: ${tx}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    
    // Move from pending to completed
    const idx = orderBook.pendingMatches.indexOf(match);
    if (idx > -1) {
      orderBook.pendingMatches.splice(idx, 1);
    }
    orderBook.completedMatches.push({ ...match, txSignature: tx });
    
    // Broadcast to connected clients
    broadcastMatch(match, tx);
    
    return tx;
  } catch (error) {
    console.error('❌ Match execution failed:', error.message);
    
    // Check for specific errors
    if (error.message.includes('InvalidCommitment')) {
      console.error('   Commitment hash mismatch - order data may have been tampered');
    } else if (error.message.includes('OrderAlreadyFilled')) {
      console.error('   One or both orders already filled');
    } else if (error.message.includes('PriceIncompatible')) {
      console.error('   Buy price is less than sell price - cannot match');
    } else if (error.message.includes('InvalidExecutionPrice')) {
      console.error('   Execution price is outside the valid range');
    }
    
    return null;
  }
}

// Process pending matches periodically
async function processPendingMatches() {
  while (orderBook.pendingMatches.length > 0) {
    const match = orderBook.pendingMatches[0];
    await executeMatch(match);
    // Small delay between transactions
    await new Promise(r => setTimeout(r, 500));
  }
}

// ═══════════════════════════════════════════════════════════════════
// API Server
// ═══════════════════════════════════════════════════════════════════

const app = express();
app.use(express.json());

// CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    stats: orderBook.getStats(),
    wallet: matcherKeypair.publicKey.toBase58(),
  });
});

// Get order book stats (privacy-preserving)
app.get('/stats', (req, res) => {
  const stats = orderBook.getStats();
  res.json({
    totalOrders: stats.totalOrders,
    buyOrders: stats.buyOrders,
    sellOrders: stats.sellOrders,
    pendingMatches: stats.pendingMatches,
    completedMatches: stats.completedMatches,
    // Only reveal if there's liquidity, not exact prices
    hasLiquidity: stats.buyOrders > 0 && stats.sellOrders > 0,
    spreadTier: stats.spread !== null
      ? stats.spread < 0.5 ? 'tight' : stats.spread < 2 ? 'normal' : 'wide'
      : null,
  });
});

// Submit encrypted order
app.post('/order', async (req, res) => {
  try {
    const { ciphertext, nonce, ephemeralPubKey } = req.body;
    
    if (!ciphertext || !nonce || !ephemeralPubKey) {
      return res.status(400).json({ error: 'Missing encrypted order data' });
    }
    
    // Decrypt order
    const ciphertextBytes = naclUtil.decodeBase64(ciphertext);
    const nonceBytes = naclUtil.decodeBase64(nonce);
    const ephemeralPubKeyBytes = naclUtil.decodeBase64(ephemeralPubKey);
    
    const decrypted = nacl.box.open(
      ciphertextBytes,
      nonceBytes,
      ephemeralPubKeyBytes,
      encryptionSecretKey
    );
    
    if (!decrypted) {
      return res.status(400).json({ error: 'Failed to decrypt order' });
    }
    
    const orderData = JSON.parse(naclUtil.encodeUTF8(decrypted));
    console.log(`\n📨 Received encrypted order from ${orderData.owner.slice(0, 8)}...`);
    
    // Validate order
    if (!orderData.price || !orderData.size || !orderData.orderId) {
      return res.status(400).json({ error: 'Invalid order data' });
    }
    
    // Add to order book
    const matches = orderBook.addOrder(orderData);
    
    // Process any matches
    if (matches.length > 0) {
      // Don't await - process in background
      processPendingMatches();
    }
    
    res.json({
      success: true,
      orderId: orderData.orderId,
      matchesFound: matches.length,
      stats: orderBook.getStats(),
    });
  } catch (error) {
    console.error('Order submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get matcher's public encryption key
app.get('/pubkey', (req, res) => {
  // Derive public key from secret
  const keypair = nacl.box.keyPair.fromSecretKey(encryptionSecretKey);
  res.json({
    publicKey: naclUtil.encodeBase64(keypair.publicKey),
    publicKeyArray: Array.from(keypair.publicKey),
  });
});

// Cancel order
app.post('/cancel', async (req, res) => {
  const { orderId } = req.body;
  
  if (!orderId) {
    return res.status(400).json({ error: 'Missing orderId' });
  }
  
  const removed = orderBook.removeOrder(orderId);
  
  res.json({
    success: removed,
    message: removed ? 'Order removed from matcher' : 'Order not found',
  });
});

// Clear all orders from matcher (for testing)
app.post('/clear', (req, res) => {
  const stats = orderBook.getStats();
  orderBook.orders.clear();
  orderBook.buyOrders = [];
  orderBook.sellOrders = [];
  orderBook.pendingMatches = [];
  
  console.log('🗑️  Cleared all orders from matcher');
  broadcastStats();
  
  res.json({
    success: true,
    cleared: stats.totalOrders,
  });
});

// Seed orders around current Pyth price (for testing)
app.post('/seed', async (req, res) => {
  try {
    const { numOrders = 5, priceStep = 0.5 } = req.body;
    
    // Fetch current Pyth price
    console.log('📊 Fetching Pyth price for seeding...');
    let currentPrice;
    try {
      const response = await fetch(
        'https://hermes.pyth.network/api/latest_price_feeds?ids[]=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d'
      );
      const data = await response.json();
      if (data && data[0] && data[0].price) {
        currentPrice = Number(data[0].price.price) * Math.pow(10, data[0].price.expo);
      }
    } catch (e) {
      console.warn('Failed to fetch Pyth price, using fallback');
    }
    
    if (!currentPrice) {
      currentPrice = 95.50; // Fallback
    }
    
    console.log(`   Current SOL/USDC: $${currentPrice.toFixed(2)}`);
    
    const seededOrders = [];
    
    // Create buy orders below market
    for (let i = 1; i <= numOrders; i++) {
      const priceOffset = 1 - (i * priceStep / 100);
      const price = currentPrice * priceOffset;
      const size = 0.1 + Math.random() * 0.05;
      const nonce = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
      
      const order = {
        orderId: `seed-buy-${Date.now()}-${i}`,
        owner: matcherKeypair.publicKey.toBase58(),
        side: 'buy',
        orderType: 'limit',
        price,
        size,
        nonce,
        timestamp: Date.now(),
      };
      
      orderBook.addOrder(order);
      seededOrders.push({ side: 'buy', price: price.toFixed(2), size: size.toFixed(3) });
    }
    
    // Create sell orders above market
    for (let i = 1; i <= numOrders; i++) {
      const priceOffset = 1 + (i * priceStep / 100);
      const price = currentPrice * priceOffset;
      const size = 0.1 + Math.random() * 0.05;
      const nonce = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
      
      const order = {
        orderId: `seed-sell-${Date.now()}-${i}`,
        owner: matcherKeypair.publicKey.toBase58(),
        side: 'sell',
        orderType: 'limit',
        price,
        size,
        nonce,
        timestamp: Date.now(),
      };
      
      orderBook.addOrder(order);
      seededOrders.push({ side: 'sell', price: price.toFixed(2), size: size.toFixed(3) });
    }
    
    console.log(`✅ Seeded ${numOrders * 2} orders around $${currentPrice.toFixed(2)}`);
    broadcastStats();
    
    res.json({
      success: true,
      marketPrice: currentPrice,
      orders: seededOrders,
      stats: orderBook.getStats(),
    });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Load seeded on-chain orders into matcher
app.post('/load-onchain-orders', async (req, res) => {
  try {
    const { readFileSync } = await import('fs');
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    const ordersPath = join(__dirname, 'seeded-orders.json');
    const orders = JSON.parse(readFileSync(ordersPath, 'utf-8'));
    
    let loaded = 0;
    for (const order of orders) {
      const orderData = {
        orderId: order.pubkey,
        owner: matcherKeypair.publicKey.toBase58(),
        side: order.side,
        orderType: 'limit',
        price: order.price,
        size: order.size,
        nonce: order.nonce,
        timestamp: Date.now(),
      };
      
      orderBook.addOrder(orderData);
      loaded++;
    }
    
    console.log(`📥 Loaded ${loaded} on-chain orders into matcher`);
    broadcastStats();
    
    res.json({
      success: true,
      loaded,
      stats: orderBook.getStats(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// DIRECT ORDER SUBMISSION (No encryption - for fallback/testing)
// ═══════════════════════════════════════════════════════════════════

app.post('/direct-order', async (req, res) => {
  try {
    const { 
      price, size, side, orderType, orderId, owner, timestamp, nonce,
      proof, publicInputs // Optional ZK proof data
    } = req.body;
    
    if (!price || !size || !side || !orderId || !owner) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if order already exists
    if (orderBook.orders.has(orderId)) {
      console.log(`📋 Order already exists: ${orderId.slice(0, 16)}...`);
      return res.json({
        success: true,
        alreadyExists: true,
        orderId,
        stats: orderBook.getStats(),
      });
    }
    
    // Round prices to micro precision to avoid floating point issues
    const roundedPrice = Math.round(parseFloat(price) * 1e6) / 1e6;
    const roundedSize = Math.round(parseFloat(size) * 1e9) / 1e9;
    
    const orderData = {
      orderId,
      owner,
      side,
      orderType: orderType || 'limit',
      price: roundedPrice,
      size: roundedSize,
      nonce: nonce || Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)),
      timestamp: timestamp || Date.now(),
      // ZK proof data (optional)
      proof: proof || null,
      publicInputs: publicInputs || null,
      proofVerified: false,
    };
    
    const hasProof = proof && proof.length > 0;
    console.log(`\n📨 Direct order: ${side.toUpperCase()} ${orderData.size} SOL @ $${orderData.price}${hasProof ? ' [ZK proof attached]' : ''}`);
    
    // Skip auto-matching for user orders - they should use /trigger-match explicitly
    // This prevents orders from being removed from the book before on-chain execution succeeds
    const skipAutoMatch = true;
    orderBook.addOrder(orderData, skipAutoMatch);
    
    res.json({
      success: true,
      orderId,
      matchesFound: 0, // Matches happen via /trigger-match
      hasProof,
      stats: orderBook.getStats(),
    });
  } catch (error) {
    console.error('Direct order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// TRIGGER MATCH - Actively find and execute a match for an order
// ═══════════════════════════════════════════════════════════════════

app.post('/trigger-match', async (req, res) => {
  try {
    const { orderId, orderData } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId' });
    }
    
    console.log(`\n🎯 Trigger match requested for: ${orderId.slice(0, 16)}...`);
    
    // Get our order (either from book or provided data)
    let ourOrder = orderBook.orders.get(orderId);
    
    if (!ourOrder && orderData) {
      // Add order to book first
      console.log('   Adding order to book from provided data...');
      // Round to micro precision to match on-chain values
      const roundedPrice = Math.round(parseFloat(orderData.price) * 1e6) / 1e6;
      const roundedSize = Math.round(parseFloat(orderData.size) * 1e9) / 1e9;
      
      ourOrder = {
        orderId,
        owner: orderData.owner,
        side: orderData.side,
        orderType: orderData.orderType || 'limit',
        price: roundedPrice,
        size: roundedSize,
        nonce: orderData.nonce || Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)),
        timestamp: Date.now(),
      };
      orderBook.addOrder(ourOrder);
    }
    
    if (!ourOrder) {
      return res.json({
        success: false,
        error: 'Order not found in matcher. Submit order first.',
      });
    }
    
    const isBuy = ourOrder.side === 'buy';
    const counterOrders = isBuy ? orderBook.sellOrders : orderBook.buyOrders;
    
    console.log(`   Our order: ${isBuy ? 'BUY' : 'SELL'} ${ourOrder.size} SOL @ $${ourOrder.price}`);
    console.log(`   Counter orders available: ${counterOrders.length}`);
    
    if (counterOrders.length === 0) {
      return res.json({
        success: false,
        error: 'No counterparty orders available',
        hint: `No ${isBuy ? 'sell' : 'buy'} orders in the book. Wait for liquidity or use /seed to add test orders.`,
      });
    }
    
    // Find best matching counterparty
    // For BUY: find sell orders where sell_price <= our buy_price
    // For SELL: find buy orders where buy_price >= our sell_price
    let bestMatch = null;
    
    for (const counterOrder of counterOrders) {
      if (isBuy) {
        // We're buying, counter is selling
        // Match if their sell price <= our buy price
        if (counterOrder.price <= ourOrder.price) {
          if (!bestMatch || counterOrder.price < bestMatch.price) {
            bestMatch = counterOrder;
          }
        }
      } else {
        // We're selling, counter is buying
        // Match if their buy price >= our sell price
        if (counterOrder.price >= ourOrder.price) {
          if (!bestMatch || counterOrder.price > bestMatch.price) {
            bestMatch = counterOrder;
          }
        }
      }
    }
    
    if (!bestMatch) {
      const bestCounter = counterOrders[0];
      const spread = isBuy 
        ? (bestCounter?.price || 0) - ourOrder.price
        : ourOrder.price - (bestCounter?.price || 0);
      
      return res.json({
        success: false,
        error: 'No matching price - prices do not cross',
        hint: isBuy 
          ? `Your buy @ $${ourOrder.price.toFixed(2)} < best sell @ $${bestCounter?.price?.toFixed(2) || 'N/A'}`
          : `Your sell @ $${ourOrder.price.toFixed(2)} > best buy @ $${bestCounter?.price?.toFixed(2) || 'N/A'}`,
        bestCounterPrice: bestCounter?.price,
        spread: Math.abs(spread).toFixed(2),
        ourPrice: ourOrder.price,
      });
    }
    
    console.log(`   ✅ Match found! Counter: ${bestMatch.side.toUpperCase()} ${bestMatch.size} SOL @ $${bestMatch.price}`);
    
    // Determine execution parameters
    const executionPrice = isBuy ? bestMatch.price : ourOrder.price; // Price-time priority
    const executionSize = Math.min(ourOrder.size, bestMatch.size);
    
    // Construct match object
    const match = {
      buyOrder: isBuy ? ourOrder : bestMatch,
      sellOrder: isBuy ? bestMatch : ourOrder,
      price: executionPrice,
      size: executionSize,
      timestamp: Date.now(),
    };
    
    console.log(`   Executing: ${executionSize} SOL @ $${executionPrice}`);
    
    // Execute the match on-chain
    const txSignature = await executeMatch(match);
    
    if (txSignature) {
      // Remove filled orders from book
      orderBook.removeOrder(ourOrder.orderId);
      orderBook.removeOrder(bestMatch.orderId);
      broadcastStats();
      
      res.json({
        success: true,
        txSignature,
        executionPrice,
        executedSize: executionSize,
        counterparty: bestMatch.orderId,
        explorer: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
      });
    } else {
      res.json({
        success: false,
        error: 'On-chain match execution failed',
        hint: 'Check matcher logs for details. Ensure both orders have valid on-chain accounts.',
      });
    }
  } catch (error) {
    console.error('Trigger match error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// REAL WITHDRAWAL ENDPOINT - Actually transfers tokens
// ═══════════════════════════════════════════════════════════════════

app.post('/withdraw', async (req, res) => {
  try {
    const { token, amount, recipientWallet, requestingWallet, signature } = req.body;
    
    // Validate inputs
    if (!token || !amount || !recipientWallet || !requestingWallet) {
      return res.status(400).json({ 
        error: 'Missing required fields: token, amount, recipientWallet, requestingWallet' 
      });
    }
    
    if (!['SOL', 'USDC'].includes(token)) {
      return res.status(400).json({ error: 'Invalid token. Must be SOL or USDC' });
    }
    
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    let recipientPubkey;
    try {
      recipientPubkey = new PublicKey(recipientWallet);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid recipient wallet address' });
    }
    
    console.log(`\n💸 Processing withdrawal request:`);
    console.log(`   Token:     ${token}`);
    console.log(`   Amount:    ${withdrawAmount}`);
    console.log(`   From:      ${requestingWallet.slice(0, 8)}...`);
    console.log(`   To:        ${recipientPubkey.toBase58().slice(0, 8)}...`);
    
    // Check vault balance
    const vaultBalance = token === 'SOL'
      ? await connection.getBalance(matcherKeypair.publicKey)
      : await (async () => {
          try {
            const vaultAta = await getAssociatedTokenAddress(USDC_MINT, matcherKeypair.publicKey);
            const account = await getAccount(connection, vaultAta);
            return Number(account.amount);
          } catch {
            return 0;
          }
        })();
    
    const requiredAmount = token === 'SOL' 
      ? withdrawAmount * LAMPORTS_PER_SOL 
      : withdrawAmount * 1e6; // USDC has 6 decimals
    
    const vaultBalanceFormatted = token === 'SOL' 
      ? vaultBalance / LAMPORTS_PER_SOL 
      : vaultBalance / 1e6;
    
    console.log(`   Vault ${token}: ${vaultBalanceFormatted.toFixed(4)}`);
    
    if (vaultBalance < requiredAmount) {
      console.error(`   ❌ Insufficient vault balance!`);
      return res.status(400).json({ 
        error: `Insufficient vault ${token} balance. Available: ${vaultBalanceFormatted.toFixed(4)}` 
      });
    }
    
    // Build transaction
    const transaction = new Transaction();
    let txSignature;
    
    if (token === 'SOL') {
      // Transfer SOL
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: matcherKeypair.publicKey,
          toPubkey: recipientPubkey,
          lamports: Math.floor(withdrawAmount * LAMPORTS_PER_SOL),
        })
      );
    } else {
      // Transfer USDC
      const vaultAta = await getAssociatedTokenAddress(USDC_MINT, matcherKeypair.publicKey);
      let recipientAta;
      
      try {
        recipientAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey);
        // Check if recipient ATA exists
        try {
          await getAccount(connection, recipientAta);
        } catch {
          // Create ATA for recipient if it doesn't exist
          console.log(`   Creating USDC ATA for recipient...`);
          transaction.add(
            createAssociatedTokenAccountInstruction(
              matcherKeypair.publicKey, // payer
              recipientAta,
              recipientPubkey,
              USDC_MINT
            )
          );
        }
      } catch (e) {
        return res.status(400).json({ error: 'Failed to get recipient token account' });
      }
      
      const usdcAmount = Math.floor(withdrawAmount * 1e6); // 6 decimals
      transaction.add(
        createTransferInstruction(
          vaultAta,
          recipientAta,
          matcherKeypair.publicKey,
          usdcAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      );
    }
    
    // Send transaction
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = matcherKeypair.publicKey;
    
    transaction.sign(matcherKeypair);
    
    txSignature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: true,
    });
    
    console.log(`   ⏳ Sent: ${txSignature.slice(0, 12)}...`);
    
    // Wait for confirmation
    await connection.confirmTransaction({
      signature: txSignature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');
    
    console.log(`   ✅ Confirmed!`);
    console.log(`   Explorer: https://solscan.io/tx/${txSignature}?cluster=devnet\n`);
    
    res.json({
      success: true,
      txSignature,
      token,
      amount: withdrawAmount,
      recipient: recipientPubkey.toBase58(),
      explorer: `https://solscan.io/tx/${txSignature}?cluster=devnet`,
    });
    
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: error.message || 'Withdrawal failed' });
  }
});

// Get vault balances (for transparency)
app.get('/vault-balance', async (req, res) => {
  try {
    // SOL balance
    const solBalance = await connection.getBalance(matcherKeypair.publicKey);
    
    // USDC balance
    let usdcBalance = 0;
    try {
      const vaultAta = await getAssociatedTokenAddress(USDC_MINT, matcherKeypair.publicKey);
      const account = await getAccount(connection, vaultAta);
      usdcBalance = Number(account.amount);
    } catch {
      // No USDC ATA or zero balance
    }
    
    res.json({
      vault: matcherKeypair.publicKey.toBase58(),
      sol: solBalance / LAMPORTS_PER_SOL,
      usdc: usdcBalance / 1e6,
      solLamports: solBalance,
      usdcMicroUnits: usdcBalance,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ZK RANGE PROOF VERIFICATION
// Verifies Noir proofs via on-chain verifier program
// ═══════════════════════════════════════════════════════════════════

const VERIFIER_PROGRAM_ID = new PublicKey('Ef8SgV5RCp4e7g3tKKQHwvpYcPoGXqZkoTTVTrhnG2MZ');

// Verify a ZK range proof on-chain
app.post('/verify-proof', async (req, res) => {
  try {
    const { proof, publicInputs, orderId } = req.body;
    
    if (!proof || !publicInputs) {
      return res.status(400).json({ 
        error: 'Missing proof or publicInputs',
        hint: 'Provide proof (base64 or array) and publicInputs (array of strings)'
      });
    }
    
    console.log(`\n🔐 Verifying ZK proof for order: ${orderId?.slice(0, 8) || 'unknown'}...`);
    
    // Convert proof if needed
    let proofBytes;
    if (Array.isArray(proof)) {
      proofBytes = new Uint8Array(proof);
    } else if (typeof proof === 'string') {
      proofBytes = Buffer.from(proof, 'base64');
    } else {
      proofBytes = proof;
    }
    
    // Skip verification if proof is empty (fallback mode)
    if (!proofBytes || proofBytes.length === 0) {
      console.log('   ⚠️  Empty proof - skipping verification (fallback mode)');
      return res.json({
        verified: true,
        fallback: true,
        message: 'Proof empty - fallback mode accepted',
      });
    }
    
    // Build verification instruction
    // Format: [discriminator][proof_bytes][public_inputs]
    const publicInputsBuffer = new Uint8Array(publicInputs.length * 32);
    publicInputs.forEach((input, i) => {
      const bn = BigInt(input);
      const bytes = new Uint8Array(32);
      for (let j = 0; j < 32; j++) {
        bytes[31 - j] = Number((bn >> BigInt(j * 8)) & 0xFFn);
      }
      publicInputsBuffer.set(bytes, i * 32);
    });
    
    const instructionData = Buffer.concat([
      Buffer.from([0]), // Verify discriminator
      proofBytes,
      publicInputsBuffer,
    ]);
    
    // Create verification transaction
    const verifyIx = new (await import('@solana/web3.js')).TransactionInstruction({
      keys: [
        { pubkey: matcherKeypair.publicKey, isSigner: true, isWritable: true },
      ],
      programId: VERIFIER_PROGRAM_ID,
      data: instructionData,
    });
    
    const { Transaction } = await import('@solana/web3.js');
    const transaction = new Transaction().add(verifyIx);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = matcherKeypair.publicKey;
    transaction.sign(matcherKeypair);
    
    const txSignature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: true,
    });
    
    await connection.confirmTransaction(txSignature, 'confirmed');
    
    console.log(`   ✅ Proof verified on-chain: ${txSignature}`);
    
    res.json({
      verified: true,
      txSignature,
      explorer: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
    });
  } catch (error) {
    console.error('   ❌ Proof verification failed:', error.message);
    
    // Check for specific verifier errors
    if (error.message?.includes('custom program error')) {
      res.json({
        verified: false,
        error: 'Proof invalid - verification failed on-chain',
      });
    } else {
      res.status(500).json({
        verified: false,
        error: error.message,
      });
    }
  }
});

// Get verification status for an order
app.get('/proof-status/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = orderBook.orders.get(orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json({
    orderId,
    hasProof: order.proof && order.proof.length > 0,
    proofLength: order.proof?.length || 0,
    publicInputsCount: order.publicInputs?.length || 0,
    verified: order.proofVerified || false,
  });
});

// ═══════════════════════════════════════════════════════════════════
// WebSocket for Real-time Updates
// ═══════════════════════════════════════════════════════════════════

const server = app.listen(PORT, async () => {
  console.log(`\n🚀 AuroraZK Matcher Service running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Stats:  http://localhost:${PORT}/stats`);
  console.log(`   PubKey: http://localhost:${PORT}/pubkey\n`);
  
  await initializeProgram();
  
  // Auto-load seeded orders on startup
  try {
    const ordersPath = join(__dirname, 'seeded-orders.json');
    if (existsSync(ordersPath)) {
      const orders = JSON.parse(readFileSync(ordersPath, 'utf-8'));
      let loaded = 0;
      for (const order of orders) {
        const orderData = {
          orderId: order.pubkey,
          owner: matcherKeypair.publicKey.toBase58(),
          side: order.side,
          orderType: 'limit',
          price: order.price,
          size: order.size,
          nonce: order.nonce,
          timestamp: Date.now(),
        };
        orderBook.addOrder(orderData);
        loaded++;
      }
      console.log(`📥 Auto-loaded ${loaded} seeded orders on startup`);
    }
  } catch (e) {
    console.log('⚠️  No seeded orders to auto-load:', e.message);
  }
});

const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`👤 Client connected (${clients.size} total)`);
  
  // Send current stats
  ws.send(JSON.stringify({
    type: 'stats',
    data: orderBook.getStats(),
  }));
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`👤 Client disconnected (${clients.size} total)`);
  });
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      if (msg.type === 'order') {
        // Handle encrypted order via WebSocket
        // Similar to POST /order
      }
    } catch (e) {
      console.error('WebSocket message error:', e);
    }
  });
});

function broadcastStats() {
  const stats = orderBook.getStats();
  const msg = JSON.stringify({ type: 'stats', data: stats });
  clients.forEach(ws => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

function broadcastMatch(match, txSignature) {
  const buyOrder = match.buyOrder;
  const sellOrder = match.sellOrder;
  const executionPrice = match.price;
  
  // Calculate slippage for both sides
  const buySlippage = ((executionPrice - buyOrder.price) / buyOrder.price) * 100;
  const sellSlippage = ((executionPrice - sellOrder.price) / sellOrder.price) * 100;
  
  // Calculate fees based on order type
  // Market orders: 0.50%, Limit orders: 0.20%
  const totalValue = executionPrice * match.size;
  const buyFeeRate = FEE_CONFIG.getFeeBps(buyOrder.orderType || 'limit') / 10000;
  const sellFeeRate = FEE_CONFIG.getFeeBps(sellOrder.orderType || 'limit') / 10000;
  const buyFee = totalValue * buyFeeRate;
  const sellFee = totalValue * sellFeeRate;
  const totalFees = buyFee + sellFee;
  
  console.log(`💰 Fee breakdown:`);
  console.log(`   Buy side (${buyOrder.orderType || 'limit'}): $${buyFee.toFixed(4)} (${buyFeeRate * 100}%)`);
  console.log(`   Sell side (${sellOrder.orderType || 'limit'}): $${sellFee.toFixed(4)} (${sellFeeRate * 100}%)`);
  console.log(`   Total to treasury: $${totalFees.toFixed(4)}`);
  console.log(`   Treasury: ${TREASURY_WALLET.toBase58()}`);
  
  const msg = JSON.stringify({
    type: 'match',
    data: {
      buyOrderId: buyOrder.orderId,
      sellOrderId: sellOrder.orderId,
      executionPrice: executionPrice,
      executionSize: match.size,
      price: match.price, // Keep for backwards compatibility
      size: match.size,
      txSignature,
      timestamp: Date.now(),
      treasury: TREASURY_WALLET.toBase58(),
      totalFees,
      // Execution details for buy side
      buyExecution: {
        limitPrice: buyOrder.price,
        executedPrice: executionPrice,
        slippage: buySlippage,
        size: match.size,
        orderType: buyOrder.orderType || 'limit',
        feeRate: buyFeeRate * 100,
        fee: buyFee,
        netCost: totalValue + buyFee,
        counterparty: sellOrder.orderId.slice(0, 4) + '...' + sellOrder.orderId.slice(-4),
      },
      // Execution details for sell side
      sellExecution: {
        limitPrice: sellOrder.price,
        executedPrice: executionPrice,
        slippage: sellSlippage,
        size: match.size,
        orderType: sellOrder.orderType || 'limit',
        feeRate: sellFeeRate * 100,
        fee: sellFee,
        netReceived: totalValue - sellFee,
        counterparty: buyOrder.orderId.slice(0, 4) + '...' + buyOrder.orderId.slice(-4),
      },
    },
  });
  clients.forEach(ws => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

// Broadcast stats every 5 seconds
setInterval(broadcastStats, 5000);

// ═══════════════════════════════════════════════════════════════════
// Graceful Shutdown
// ═══════════════════════════════════════════════════════════════════

process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down matcher...');
  console.log(`   Final stats: ${JSON.stringify(orderBook.getStats())}`);
  server.close();
  process.exit(0);
});

console.log('\n════════════════════════════════════════════════════════════');
console.log('   AuroraZK Dark Pool Matcher');
console.log('   Privacy-preserving order matching service');
console.log('════════════════════════════════════════════════════════════\n');
