/**
 * Retrieve funds from old dark pool balance
 * This script reads your UserBalance PDA and helps transfer funds
 */

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROGRAM_ID = new PublicKey('4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi');
const RPC_URL = 'https://api.devnet.solana.com';

async function main() {
  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Target wallet with dark pool balance
  const targetWallet = new PublicKey('FT9VLSyzvZSkysvJMkQUoQ1ZmAjAa8eB6w4jh1dCnCzt');
  
  console.log('\n========================================');
  console.log('  Dark Pool Balance Retrieval');
  console.log('========================================\n');
  console.log('Wallet:', targetWallet.toBase58());
  
  // Derive the UserBalance PDA
  const [userBalancePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_balance'), targetWallet.toBuffer()],
    PROGRAM_ID
  );
  console.log('UserBalance PDA:', userBalancePda.toBase58());
  
  // Fetch account data
  const accountInfo = await connection.getAccountInfo(userBalancePda);
  
  if (!accountInfo) {
    console.log('\n❌ No UserBalance account found for this wallet');
    return;
  }
  
  // Parse balance from account data
  // Layout: 8 byte discriminator + 32 byte owner + 1 byte bump + 8 byte sol + 8 byte usdc
  const data = accountInfo.data;
  const solBalance = Number(data.readBigUInt64LE(8 + 32 + 1)) / LAMPORTS_PER_SOL;
  const usdcBalance = Number(data.readBigUInt64LE(8 + 32 + 1 + 8)) / 1e6;
  
  console.log('\n📊 Your Dark Pool Balance:');
  console.log(`   SOL:  ${solBalance.toFixed(9)} SOL`);
  console.log(`   USDC: ${usdcBalance.toFixed(6)} USDC`);
  
  // Check matcher wallet balance (the vault)
  const matcherWalletPath = path.join(__dirname, '../../matcher-wallet.json');
  if (fs.existsSync(matcherWalletPath)) {
    const matcherSecret = JSON.parse(fs.readFileSync(matcherWalletPath, 'utf-8'));
    const matcherWallet = Keypair.fromSecretKey(Uint8Array.from(matcherSecret));
    const matcherBalance = await connection.getBalance(matcherWallet.publicKey);
    console.log('\n💰 Current Matcher Vault (NEW):');
    console.log(`   Address: ${matcherWallet.publicKey.toBase58()}`);
    console.log(`   SOL: ${(matcherBalance / LAMPORTS_PER_SOL).toFixed(9)} SOL`);
    console.log('\n⚠️  NOTE: This is a NEW vault wallet. Your old balance');
    console.log('   was tracked on a different vault that no longer exists.');
  }
  
  console.log('\n========================================');
  console.log('  Important Information');
  console.log('========================================\n');
  console.log('The dark pool uses a LEDGER system:');
  console.log('- Your balance is tracked on-chain in a PDA');  
  console.log('- Actual tokens were held in a matcher vault');
  console.log('- The old vault keypair was cleaned up\n');
  console.log('Options:');
  console.log('1. These funds represent DEVNET test tokens');
  console.log('2. You can proceed with fresh deposits to the new vault');
  console.log('3. The on-chain ledger balance can be zeroed if needed\n');
}

main().catch(console.error);
