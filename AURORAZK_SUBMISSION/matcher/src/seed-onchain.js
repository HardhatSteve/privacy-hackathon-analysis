/**
 * Seed REAL on-chain orders for testing matches
 * 
 * This creates actual Solana accounts for orders that the matcher
 * can then match with user orders.
 */

import 'dotenv/config';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import anchor from '@coral-xyz/anchor';
const { Program, AnchorProvider, BN } = anchor;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROGRAM_ID = new PublicKey('4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi');
const SOLANA_RPC = clusterApiUrl('devnet');

// Compute commitment hash (same as on-chain)
function computeCommitment(price, size, nonce) {
  const priceBytes = Buffer.alloc(8);
  priceBytes.writeBigUInt64LE(BigInt(price));
  
  const sizeBytes = Buffer.alloc(8);
  sizeBytes.writeBigUInt64LE(BigInt(size));
  
  const data = Buffer.concat([priceBytes, sizeBytes, Buffer.from(nonce)]);
  return crypto.createHash('sha256').update(data).digest();
}

async function fetchPythPrice() {
  try {
    const response = await fetch(
      'https://hermes.pyth.network/api/latest_price_feeds?ids[]=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d'
    );
    const data = await response.json();
    if (data && data[0] && data[0].price) {
      return Number(data[0].price.price) * Math.pow(10, data[0].price.expo);
    }
  } catch (e) {
    console.warn('Failed to fetch Pyth price');
  }
  return 145.00; // Fallback
}

async function main() {
  console.log('\n🌟 Seeding REAL On-Chain Orders');
  console.log('═══════════════════════════════════════════════════════\n');

  // Load matcher wallet
  const walletPath = process.env.MATCHER_WALLET || join(__dirname, '../../matcher-wallet.json');
  let wallet;
  try {
    const keypairData = JSON.parse(readFileSync(walletPath, 'utf-8'));
    wallet = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  } catch (e) {
    console.error('❌ Could not load matcher wallet');
    process.exit(1);
  }
  
  console.log(`🔑 Matcher wallet: ${wallet.publicKey.toBase58()}`);
  
  // Connect to Solana
  const connection = new Connection(SOLANA_RPC, 'confirmed');
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Balance: ${(balance / 1e9).toFixed(4)} SOL\n`);
  
  if (balance < 0.1 * 1e9) {
    console.error('❌ Need at least 0.1 SOL. Run:');
    console.log(`   solana airdrop 1 ${wallet.publicKey.toBase58()} --url devnet`);
    process.exit(1);
  }

  // Load program - use the on-chain IDL with fill_type support
  // Load IDL from frontend lib folder
  const idlPath = join(__dirname, '../../app/lib/idl/aurorazk.json');
  const idl = JSON.parse(readFileSync(idlPath, 'utf-8'));
  
  // Create a proper wallet adapter
  const walletAdapter = {
    publicKey: wallet.publicKey,
    signTransaction: async (tx) => {
      tx.partialSign(wallet);
      return tx;
    },
    signAllTransactions: async (txs) => {
      txs.forEach(tx => tx.partialSign(wallet));
      return txs;
    },
  };
  
  const provider = new AnchorProvider(
    connection,
    walletAdapter,
    { commitment: 'confirmed' }
  );
  
  const program = new Program(idl, provider);

  // Get current Pyth price
  const currentPrice = await fetchPythPrice();
  console.log(`📊 Current SOL/USDC: $${currentPrice.toFixed(2)}\n`);

  // Order book PDA (v2)
  const [orderBookPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('order_book_v3')],
    PROGRAM_ID
  );

  // Check if order book exists, if not initialize it
  const orderBookAccount = await connection.getAccountInfo(orderBookPda);
  if (!orderBookAccount) {
    console.log('📦 Initializing order book...');
    try {
      const baseMint = new PublicKey('So11111111111111111111111111111111111111112'); // SOL
      const quoteMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
      
      await program.methods
        .initialize(baseMint, quoteMint)
        .accounts({
          order_book: orderBookPda,
          authority: wallet.publicKey,
          system_program: '11111111111111111111111111111111',
        })
        .rpc();
      console.log('✅ Order book initialized\n');
    } catch (e) {
      if (e.message.includes('already in use')) {
        console.log('✅ Order book already exists\n');
      } else {
        throw e;
      }
    }
  } else {
    console.log('✅ Order book exists\n');
  }

  // Initialize matcher's UserBalance PDA (required for reveal_and_match)
  const [matcherBalancePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_balance'), wallet.publicKey.toBuffer()],
    PROGRAM_ID
  );
  
  const matcherBalanceAccount = await connection.getAccountInfo(matcherBalancePda);
  if (!matcherBalanceAccount) {
    console.log('💳 Initializing matcher UserBalance PDA...');
    try {
      await program.methods
        .initUserBalance()
        .accounts({
          userBalance: matcherBalancePda,
          owner: wallet.publicKey,
          systemProgram: '11111111111111111111111111111111',
        })
        .rpc();
      console.log('✅ Matcher UserBalance initialized');
    } catch (e) {
      if (e.message.includes('already in use')) {
        console.log('✅ Matcher UserBalance already exists');
      } else {
        console.error('❌ Failed to init UserBalance:', e.message);
      }
    }
  } else {
    console.log('✅ Matcher UserBalance exists');
  }
  
  // Deposit SOL and USDC to matcher's dark pool balance for seeded orders
  // This is required so the matcher can be the counterparty for trades
  const DEPOSIT_SOL = 10_000_000_000; // 10 SOL in lamports
  const DEPOSIT_USDC = 2_000_000_000;  // 2000 USDC in micro-units
  
  console.log('💰 Depositing to matcher dark pool balance...');
  try {
    // Deposit SOL (for SELL orders)
    await program.methods
      .depositDarkPool({ sol: {} }, new BN(DEPOSIT_SOL))
      .accounts({
        userBalance: matcherBalancePda,
        owner: wallet.publicKey,
      })
      .rpc();
    console.log(`   ✅ Deposited ${DEPOSIT_SOL / 1e9} SOL`);
    
    // Deposit USDC (for BUY orders)  
    await program.methods
      .depositDarkPool({ usdc: {} }, new BN(DEPOSIT_USDC))
      .accounts({
        userBalance: matcherBalancePda,
        owner: wallet.publicKey,
      })
      .rpc();
    console.log(`   ✅ Deposited ${DEPOSIT_USDC / 1e6} USDC\n`);
  } catch (e) {
    console.log(`   ℹ️  Balance deposit: ${e.message.slice(0, 50)}...\n`);
  }

  const expiration = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
  const createdOrders = [];

  // Create BUY orders below market with VARIED SIZES (for testing market sells)
  // Users can SELL into these orders
  // Using WIDER spreads (2-5%) to handle price volatility
  console.log('📗 Creating BUY orders (users can SELL to match):');
  const buyOrders = [
    { price: currentPrice * 0.98,  size: 0.10 }, // 2% below - tightest
    { price: currentPrice * 0.97,  size: 0.15 }, // 3% below
    { price: currentPrice * 0.96,  size: 0.20 }, // 4% below
    { price: currentPrice * 0.95,  size: 0.25 }, // 5% below
    { price: currentPrice * 0.93,  size: 0.30 }, // 7% below
  ];
  // Total buy liquidity: 1.0 SOL
  
  for (let i = 0; i < buyOrders.length; i++) {
    const price = Math.floor(buyOrders[i].price * 1e6); // micro USDC
    const size = Math.floor(buyOrders[i].size * 1e9); // SOL in lamports
    const nonce = Array.from(crypto.randomBytes(32));
    const commitment = computeCommitment(price, size, nonce);
    
    const orderKeypair = Keypair.generate();
    
    try {
      const instruction = await program.methods
        .placeOrder(
          Array.from(commitment),
          Buffer.from([]), // Empty range proof
          true, // isBuy
          new BN(expiration),
          { gtc: {} } // OrderFillType::GTC - fill_type argument
        )
        .accounts({
          order: orderKeypair.publicKey,
          order_book: orderBookPda,
          owner: wallet.publicKey,
          system_program: '11111111111111111111111111111111',
        })
        .instruction();
      
      const { Transaction } = await import('@solana/web3.js');
      const tx = new Transaction().add(instruction);
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.sign(wallet, orderKeypair);
      
      const signature = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');
      
      const sizeInSol = size / 1e9;
      console.log(`   ✅ BUY @ $${(price / 1e6).toFixed(2)} x ${sizeInSol.toFixed(2)} SOL`);
      console.log(`      Order: ${orderKeypair.publicKey.toBase58().slice(0,20)}...`);
      
      createdOrders.push({
        pubkey: orderKeypair.publicKey.toBase58(),
        side: 'buy',
        price: price / 1e6,
        size: sizeInSol,
        nonce,
        priceRaw: price,
        sizeRaw: size,
      });
      
      // Small delay between orders
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`   ❌ Failed: ${e.message}`);
    }
  }

  // Create SELL orders above market with VARIED SIZES (for testing market buys)
  // Users can BUY into these orders
  // Using WIDER spreads (2-5%) to handle price volatility
  console.log('\n📕 Creating SELL orders (users can BUY to match):');
  const sellOrders = [
    { price: currentPrice * 1.02,  size: 0.10 }, // 2% above - tightest
    { price: currentPrice * 1.03,  size: 0.15 }, // 3% above
    { price: currentPrice * 1.04,  size: 0.20 }, // 4% above
    { price: currentPrice * 1.05,  size: 0.25 }, // 5% above
    { price: currentPrice * 1.07,  size: 0.30 }, // 7% above
  ];
  // Total sell liquidity: 1.0 SOL
  
  for (let i = 0; i < sellOrders.length; i++) {
    const price = Math.floor(sellOrders[i].price * 1e6); // micro USDC
    const size = Math.floor(sellOrders[i].size * 1e9); // SOL in lamports
    const nonce = Array.from(crypto.randomBytes(32));
    const commitment = computeCommitment(price, size, nonce);
    
    const orderKeypair = Keypair.generate();
    
    try {
      const instruction = await program.methods
        .placeOrder(
          Array.from(commitment),
          Buffer.from([]), // Empty range proof
          false, // isBuy = false (sell)
          new BN(expiration),
          { gtc: {} } // OrderFillType::GTC
        )
        .accounts({
          order: orderKeypair.publicKey,
          order_book: orderBookPda,
          owner: wallet.publicKey,
          system_program: '11111111111111111111111111111111',
        })
        .instruction();
      
      const { Transaction } = await import('@solana/web3.js');
      const tx = new Transaction().add(instruction);
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.sign(wallet, orderKeypair);
      
      const signature = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');
      
      const sizeInSol = size / 1e9;
      console.log(`   ✅ SELL @ $${(price / 1e6).toFixed(2)} x ${sizeInSol.toFixed(2)} SOL`);
      console.log(`      Order: ${orderKeypair.publicKey.toBase58().slice(0,20)}...`);
      
      createdOrders.push({
        pubkey: orderKeypair.publicKey.toBase58(),
        side: 'sell',
        price: price / 1e6,
        size: sizeInSol,
        nonce,
        priceRaw: price,
        sizeRaw: size,
      });
      
      // Small delay between orders
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`   ❌ Failed: ${e.message}`);
    }
  }

  // Save orders for matcher to use
  const outputPath = join(__dirname, 'seeded-orders.json');
  const { writeFileSync } = await import('fs');
  writeFileSync(outputPath, JSON.stringify(createdOrders, null, 2));
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📋 ORDER BOOK LIQUIDITY SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\nCurrent Price: $${currentPrice.toFixed(2)}`);
  
  const buys = createdOrders.filter(o => o.side === 'buy');
  const sells = createdOrders.filter(o => o.side === 'sell');
  const totalBuyLiq = buys.reduce((sum, o) => sum + o.size, 0);
  const totalSellLiq = sells.reduce((sum, o) => sum + o.size, 0);
  
  console.log(`\n📗 BUY side (for market SELL orders):`);
  buys.forEach(o => console.log(`     ${o.size.toFixed(2)} SOL @ $${o.price.toFixed(2)}`));
  console.log(`     Total: ${totalBuyLiq.toFixed(2)} SOL`);
  
  console.log(`\n📕 SELL side (for market BUY orders):`);
  sells.forEach(o => console.log(`     ${o.size.toFixed(2)} SOL @ $${o.price.toFixed(2)}`));
  console.log(`     Total: ${totalSellLiq.toFixed(2)} SOL`);
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🧪 TEST SCENARIOS:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n  Market BUY 0.10 SOL → fills 0.10 sell order');
  console.log('  Market BUY 0.25 SOL → fills 0.10 + 0.15 = 0.25');
  console.log('  Market BUY 0.45 SOL → fills 0.10 + 0.15 + 0.20 = 0.45');
  console.log('  Market BUY 1.00 SOL → fills ALL sell orders (1.00)');
  console.log('\n  Market SELL 0.10 SOL → fills 0.10 buy order');
  console.log('  Market SELL 0.25 SOL → fills 0.10 + 0.15 = 0.25');
  console.log('  Market SELL 1.00 SOL → fills ALL buy orders (1.00)');
  
  console.log('\n✨ Orders saved to seeded-orders.json');
  console.log('   Loading into matcher automatically...\n');
}

main().catch(console.error);
