/**
 * Check Vault Balance and Recent Transactions
 * 
 * Usage: node scripts/check-vault.js
 */

import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getAccount,
} from '@solana/spl-token';

const VAULT_ADDRESS = new PublicKey('FT9VLSyzvZSkysvJMkQUoQ1ZmAjAa8eB6w4jh1dCnCzt');
const USDC_MINT = new PublicKey('6QMo13mtRuUhcRtFReCKUfuNd5GVkdAg9oz2tNGzaufy');
const USDC_DECIMALS = 6;

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║  AuroraZK Dark Pool Vault Status                                  ║
╚═══════════════════════════════════════════════════════════════════╝
  `);

  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  console.log(`🔐 Vault Address: ${VAULT_ADDRESS.toBase58()}`);
  console.log(`🔗 https://solscan.io/account/${VAULT_ADDRESS.toBase58()}?cluster=devnet\n`);
  
  // Get SOL balance
  const solBalance = await connection.getBalance(VAULT_ADDRESS);
  console.log(`💰 SOL Balance: ${(solBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  
  // Get USDC balance
  try {
    const usdcAta = await getAssociatedTokenAddress(USDC_MINT, VAULT_ADDRESS);
    const usdcAccount = await getAccount(connection, usdcAta);
    const usdcBalance = Number(usdcAccount.amount) / Math.pow(10, USDC_DECIMALS);
    console.log(`💵 USDC Balance: ${usdcBalance.toFixed(2)} USDC`);
  } catch {
    console.log(`💵 USDC Balance: 0.00 USDC (no token account)`);
  }
  
  // Get recent transactions
  console.log(`\n📜 Recent Transactions (last 10):\n`);
  
  const signatures = await connection.getSignaturesForAddress(VAULT_ADDRESS, { limit: 10 });
  
  if (signatures.length === 0) {
    console.log('   No recent transactions');
  } else {
    for (const sig of signatures) {
      const date = new Date(sig.blockTime * 1000);
      const status = sig.err ? '❌' : '✅';
      console.log(`   ${status} ${date.toLocaleString()}`);
      console.log(`      ${sig.signature.slice(0, 32)}...`);
      console.log(`      https://solscan.io/tx/${sig.signature}?cluster=devnet\n`);
    }
  }
}

main().catch(console.error);
