/**
 * AuroraZK Order Expiration Crank
 * 
 * This script periodically checks for expired orders and marks them as cancelled.
 * Can be run as a background process alongside the matcher service.
 */

import 'dotenv/config';
import { Connection, PublicKey, Keypair, clusterApiUrl } from '@solana/web3.js';
import anchor from '@coral-xyz/anchor';
const { Program, AnchorProvider, BN } = anchor;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SOLANA_RPC = process.env.SOLANA_RPC || clusterApiUrl('devnet');
const PROGRAM_ID = new PublicKey('4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi');
const CHECK_INTERVAL = 60000; // Check every 60 seconds

// Load matcher keypair
const MATCHER_WALLET_PATH = process.env.MATCHER_WALLET || join(__dirname, '../../matcher-wallet.json');
let matcherKeypair;
try {
  const keypairData = JSON.parse(readFileSync(MATCHER_WALLET_PATH, 'utf-8'));
  matcherKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  console.log(`🔑 Loaded crank wallet: ${matcherKeypair.publicKey.toBase58()}`);
} catch (e) {
  console.error('Failed to load matcher wallet:', e);
  process.exit(1);
}

const connection = new Connection(SOLANA_RPC, 'confirmed');

// Initialize program
async function initializeProgram() {
  const idlPath = join(__dirname, '../../app/idl/aurorazk.json');
  const idl = JSON.parse(readFileSync(idlPath, 'utf-8'));
  
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
  
  return new Program(idl, provider);
}

// Fetch all orders
async function fetchAllOrders(program) {
  try {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        // Order discriminator
        {
          memcmp: {
            offset: 0,
            bytes: anchor.utils.bytes.bs58.encode(Buffer.from([134, 173, 223, 185, 77, 86, 28, 51])),
          },
        },
      ],
    });
    
    return accounts.map(({ pubkey, account }) => ({
      publicKey: pubkey,
      data: program.coder.accounts.decode('Order', account.data),
    }));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
}

// Check and expire orders
async function checkAndExpireOrders(program) {
  const currentTime = Math.floor(Date.now() / 1000);
  console.log(`\n⏰ Checking for expired orders at ${new Date().toISOString()}`);
  
  const orders = await fetchAllOrders(program);
  
  let expiredCount = 0;
  let processedCount = 0;
  
  for (const order of orders) {
    // Skip filled or already cancelled orders
    if (order.data.filled || order.data.cancelled) {
      continue;
    }
    
    // Check if expired
    const expiration = order.data.expiration.toNumber();
    if (currentTime > expiration) {
      expiredCount++;
      console.log(`\n🔴 Found expired order: ${order.publicKey.toBase58()}`);
      console.log(`   Expiration: ${new Date(expiration * 1000).toISOString()}`);
      console.log(`   Owner: ${order.data.owner.toBase58().slice(0, 8)}...`);
      
      try {
        const tx = await program.methods
          .expireOrder()
          .accounts({
            order: order.publicKey,
            caller: matcherKeypair.publicKey,
          })
          .signers([matcherKeypair])
          .rpc();
        
        processedCount++;
        console.log(`   ✅ Expired successfully: ${tx}`);
      } catch (error) {
        console.error(`   ❌ Failed to expire:`, error.message);
      }
    }
  }
  
  console.log(`\n📊 Summary: ${expiredCount} expired orders found, ${processedCount} processed`);
}

// Main loop
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   AuroraZK Order Expiration Crank');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const program = await initializeProgram();
  console.log('✅ Program initialized');
  
  // Check balance
  const balance = await connection.getBalance(matcherKeypair.publicKey);
  console.log(`💰 Wallet balance: ${(balance / 1e9).toFixed(4)} SOL`);
  
  if (balance < 0.01 * 1e9) {
    console.warn('⚠️  Low balance - may fail to process expirations!');
  }
  
  // Run immediately
  await checkAndExpireOrders(program);
  
  // Then run periodically
  console.log(`\n🔄 Running expiration check every ${CHECK_INTERVAL / 1000} seconds...`);
  setInterval(() => checkAndExpireOrders(program), CHECK_INTERVAL);
}

main().catch(console.error);
