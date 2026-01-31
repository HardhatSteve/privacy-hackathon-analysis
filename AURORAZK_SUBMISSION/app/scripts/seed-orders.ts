/**
 * Seed Orders Script
 * 
 * Creates buy and sell orders layered around the current Pyth price.
 * This script should be run from the app directory:
 *   npx ts-node scripts/seed-orders.ts
 * 
 * Or use the matcher service to automatically seed orders.
 */

import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Configuration
const SOLANA_RPC = clusterApiUrl('devnet');
const PROGRAM_ID = new PublicKey('4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi');

// Price spread configuration
const NUM_BUY_ORDERS = 5;
const NUM_SELL_ORDERS = 5;
const PRICE_STEP_PERCENT = 0.5; // 0.5% between each price level
const BASE_SIZE_SOL = 0.1; // Base order size in SOL
const DEFAULT_FILL_TYPE = { gtc: {} };

// Helper to compute commitment hash (same as on-chain)
function computeCommitment(price: number, size: number, nonce: Uint8Array): Uint8Array {
  const priceBytes = Buffer.alloc(8);
  priceBytes.writeBigUInt64LE(BigInt(price));
  
  const sizeBytes = Buffer.alloc(8);
  sizeBytes.writeBigUInt64LE(BigInt(size));
  
  const data = Buffer.concat([priceBytes, sizeBytes, Buffer.from(nonce)]);
  return crypto.createHash('sha256').update(data).digest();
}

async function fetchPythPrice(): Promise<number> {
  try {
    // Fetch from Pyth Hermes API
    const response = await fetch(
      'https://hermes.pyth.network/api/latest_price_feeds?ids[]=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d'
    );
    const data = await response.json();
    
    if (data && data[0] && data[0].price) {
      const price = Number(data[0].price.price) * Math.pow(10, data[0].price.expo);
      return price;
    }
    throw new Error('Invalid Pyth response');
  } catch (error) {
    console.error('Failed to fetch Pyth price, using fallback:', error);
    return 95.50; // Fallback price
  }
}

async function main() {
  console.log('\n🌟 AuroraZK Order Seeding Script');
  console.log('═══════════════════════════════════════════════════════\n');

  // Fetch current Pyth price
  console.log('📊 Fetching current SOL/USDC price from Pyth...');
  const currentPrice = await fetchPythPrice();
  console.log(`   Current price: $${currentPrice.toFixed(2)}\n`);

  // Connect to Solana
  const connection = new Connection(SOLANA_RPC, 'confirmed');
  
  // Load wallet
  const walletPath = process.env.WALLET_PATH || path.join(process.env.HOME || '', '.config/solana/id.json');
  let wallet: Keypair;
  
  try {
    const keypairData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
    wallet = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  } catch (e) {
    console.error('❌ Could not load wallet from', walletPath);
    console.log('   Set WALLET_PATH environment variable or ensure default Solana wallet exists');
    process.exit(1);
  }
  
  console.log(`🔑 Using wallet: ${wallet.publicKey.toBase58()}`);
  
  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Wallet balance: ${(balance / 1e9).toFixed(4)} SOL\n`);
  
  if (balance < 0.1 * 1e9) {
    console.error('❌ Insufficient balance. Need at least 0.1 SOL');
    process.exit(1);
  }

  // Load program
  const idlPath = path.join(__dirname, '../lib/idl/aurorazk.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: wallet.publicKey,
      signTransaction: async (tx: any) => {
        if (tx.partialSign) {
          tx.partialSign(wallet);
        }
        return tx;
      },
      signAllTransactions: async (txs: any[]) => {
        txs.forEach(tx => {
          if (tx.partialSign) {
            tx.partialSign(wallet);
          }
        });
        return txs;
      },
    },
    { commitment: 'confirmed' }
  );
  
  const program = new Program(idl, provider);

  // Get order book PDA
  const [orderBookPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('order_book')],
    PROGRAM_ID
  );

  // Generate orders
  const orders: Array<{
    side: 'buy' | 'sell';
    price: number;
    size: number;
    nonce: Uint8Array;
    commitment: Uint8Array;
  }> = [];

  // Create buy orders below market price
  console.log('📗 Creating BUY orders (below market price):');
  for (let i = 1; i <= NUM_BUY_ORDERS; i++) {
    const priceOffset = 1 - (i * PRICE_STEP_PERCENT / 100);
    const price = Math.floor(currentPrice * priceOffset * 1e6); // micro USDC
    const size = Math.floor((BASE_SIZE_SOL + Math.random() * 0.1) * 1e9); // lamports
    const nonce = crypto.randomBytes(32);
    const commitment = computeCommitment(price, size, nonce);
    
    orders.push({ side: 'buy', price, size, nonce, commitment });
    console.log(`   Buy  #${i}: $${(price / 1e6).toFixed(2)} x ${(size / 1e9).toFixed(3)} SOL`);
  }

  // Create sell orders above market price
  console.log('\n📕 Creating SELL orders (above market price):');
  for (let i = 1; i <= NUM_SELL_ORDERS; i++) {
    const priceOffset = 1 + (i * PRICE_STEP_PERCENT / 100);
    const price = Math.floor(currentPrice * priceOffset * 1e6); // micro USDC
    const size = Math.floor((BASE_SIZE_SOL + Math.random() * 0.1) * 1e9); // lamports
    const nonce = crypto.randomBytes(32);
    const commitment = computeCommitment(price, size, nonce);
    
    orders.push({ side: 'sell', price, size, nonce, commitment });
    console.log(`   Sell #${i}: $${(price / 1e6).toFixed(2)} x ${(size / 1e9).toFixed(3)} SOL`);
  }

  // Submit orders to chain
  console.log('\n⛓️  Submitting orders to Solana...\n');
  
  const expiration = Math.floor(Date.now() / 1000) + (48 * 60 * 60); // 48 hours
  const orderData: Array<{ pubkey: string; price: number; size: number; nonce: string; side: string }> = [];

  for (const order of orders) {
    try {
      const orderKeypair = Keypair.generate();
      
      const tx = await program.methods
        .placeOrder(
          Array.from(order.commitment),
          Buffer.from([]), // Empty range proof for demo
          order.side === 'buy',
          new BN(expiration),
          DEFAULT_FILL_TYPE
        )
        .accounts({
          order: orderKeypair.publicKey,
          order_book: orderBookPda,
          owner: wallet.publicKey,
          system_program: '11111111111111111111111111111111',
        })
        .signers([orderKeypair])
        .rpc();
      
      console.log(`   ✅ ${order.side.toUpperCase()} order placed: ${orderKeypair.publicKey.toBase58().slice(0, 16)}...`);
      console.log(`      Tx: ${tx.slice(0, 32)}...`);
      
      orderData.push({
        pubkey: orderKeypair.publicKey.toBase58(),
        price: order.price,
        size: order.size,
        nonce: Buffer.from(order.nonce).toString('base64'),
        side: order.side,
      });
      
      // Small delay between orders
      await new Promise(r => setTimeout(r, 500));
    } catch (error: any) {
      console.error(`   ❌ Failed to place ${order.side} order:`, error.message);
    }
  }

  // Save order data for matcher
  const outputPath = path.join(__dirname, '../seeded-orders.json');
  fs.writeFileSync(outputPath, JSON.stringify(orderData, null, 2));
  console.log(`\n📄 Order data saved to: ${outputPath}`);

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   Market Price: $${currentPrice.toFixed(2)}`);
  console.log(`   Buy Orders:   ${NUM_BUY_ORDERS} (from $${(currentPrice * (1 - NUM_BUY_ORDERS * PRICE_STEP_PERCENT / 100)).toFixed(2)} to $${(currentPrice * (1 - PRICE_STEP_PERCENT / 100)).toFixed(2)})`);
  console.log(`   Sell Orders:  ${NUM_SELL_ORDERS} (from $${(currentPrice * (1 + PRICE_STEP_PERCENT / 100)).toFixed(2)} to $${(currentPrice * (1 + NUM_SELL_ORDERS * PRICE_STEP_PERCENT / 100)).toFixed(2)})`);
  console.log(`   Expiration:   48 hours`);
  console.log('\n✨ Done! Orders are now live on devnet.\n');
}

main().catch(console.error);
