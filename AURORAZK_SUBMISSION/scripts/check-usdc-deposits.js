/**
 * Check USDC deposits specifically
 */

import { 
  Connection, 
  PublicKey, 
  clusterApiUrl,
} from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

const VAULT_ADDRESS = new PublicKey('FT9VLSyzvZSkysvJMkQUoQ1ZmAjAa8eB6w4jh1dCnCzt');
const USDC_MINT = new PublicKey('6QMo13mtRuUhcRtFReCKUfuNd5GVkdAg9oz2tNGzaufy');
const USDC_DECIMALS = 6;

async function main() {
  const userWallet = process.argv[2] || 'F11yMeJadLp3FfGt5Q16XMYWnte2SxW57oc58G6PP3rs';
  const user = new PublicKey(userWallet);
  
  console.log(`\n🔍 Checking USDC transactions for: ${userWallet}`);
  
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  // Get user's USDC ATA
  const userUsdcAta = await getAssociatedTokenAddress(USDC_MINT, user);
  const vaultUsdcAta = await getAssociatedTokenAddress(USDC_MINT, VAULT_ADDRESS);
  
  console.log(`   User USDC ATA: ${userUsdcAta.toBase58()}`);
  console.log(`   Vault USDC ATA: ${vaultUsdcAta.toBase58()}\n`);
  
  // Check user's current USDC balance
  try {
    const userBalance = await connection.getTokenAccountBalance(userUsdcAta);
    console.log(`💵 Your current USDC balance: ${userBalance.value.uiAmount} USDC`);
  } catch {
    console.log(`💵 Your current USDC balance: 0 USDC (no token account)`);
  }
  
  // Get signatures for the vault's USDC ATA
  console.log(`\n📜 Checking vault USDC account transactions...`);
  
  const signatures = await connection.getSignaturesForAddress(vaultUsdcAta, { limit: 50 });
  
  let userDeposits = [];
  
  for (const sig of signatures) {
    try {
      const tx = await connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });
      
      if (!tx || !tx.meta) continue;
      
      // Look for token transfers
      const instructions = tx.transaction.message.instructions;
      
      for (const ix of instructions) {
        if (ix.programId && ix.programId.toBase58() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
          const parsed = ix.parsed;
          if (parsed && parsed.type === 'transfer' || parsed?.type === 'transferChecked') {
            const info = parsed.info;
            
            // Check if this involves the user and vault
            if (info.source && info.destination) {
              const isFromUser = info.authority === userWallet || info.source === userUsdcAta.toBase58();
              const isToVault = info.destination === vaultUsdcAta.toBase58();
              
              if (isFromUser && isToVault) {
                const amount = info.tokenAmount?.uiAmount || (parseInt(info.amount) / Math.pow(10, USDC_DECIMALS));
                const date = new Date(sig.blockTime * 1000).toLocaleString();
                
                console.log(`\n📥 USDC DEPOSIT FOUND:`);
                console.log(`   Amount: ${amount} USDC`);
                console.log(`   Date: ${date}`);
                console.log(`   Tx: ${sig.signature.slice(0, 32)}...`);
                console.log(`   https://solscan.io/tx/${sig.signature}?cluster=devnet`);
                
                userDeposits.push({ amount, date, sig: sig.signature });
              }
            }
          }
        }
      }
    } catch (e) {
      // Skip errors
    }
  }
  
  if (userDeposits.length === 0) {
    console.log(`\n❌ No USDC deposits found from your wallet to the vault.`);
    console.log(`   The 1M+ USDC in the vault is likely from testing/other sources.`);
  } else {
    const total = userDeposits.reduce((sum, d) => sum + d.amount, 0);
    console.log(`\n════════════════════════════════════════`);
    console.log(`📊 YOUR USDC DEPOSITS: ${total.toFixed(2)} USDC`);
    console.log(`════════════════════════════════════════`);
  }
}

main().catch(console.error);
