/**
 * Check a user's deposit history with the vault
 */

import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from '@solana/web3.js';

const VAULT_ADDRESS = new PublicKey('FT9VLSyzvZSkysvJMkQUoQ1ZmAjAa8eB6w4jh1dCnCzt');

async function main() {
  const userWallet = process.argv[2] || 'F11yMeJadLp3FfGt5Q16XMYWnte2SxW57oc58G6PP3rs';
  const user = new PublicKey(userWallet);
  
  console.log(`\n🔍 Analyzing deposits from: ${userWallet}`);
  console.log(`📦 To vault: ${VAULT_ADDRESS.toBase58()}\n`);
  
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  // Get user's recent transactions
  const signatures = await connection.getSignaturesForAddress(user, { limit: 50 });
  
  console.log(`Found ${signatures.length} recent transactions\n`);
  
  let totalSolDeposited = 0;
  let totalSolWithdrawn = 0;
  
  for (const sig of signatures) {
    try {
      const tx = await connection.getTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });
      
      if (!tx || !tx.meta) continue;
      
      // Check if vault is involved
      const accountKeys = tx.transaction.message.staticAccountKeys || 
                          tx.transaction.message.accountKeys;
      
      const vaultIndex = accountKeys.findIndex(k => k.equals(VAULT_ADDRESS));
      const userIndex = accountKeys.findIndex(k => k.equals(user));
      
      if (vaultIndex === -1) continue;
      
      // Calculate balance changes
      const preBalances = tx.meta.preBalances;
      const postBalances = tx.meta.postBalances;
      
      const userBalanceChange = (postBalances[userIndex] - preBalances[userIndex]) / LAMPORTS_PER_SOL;
      const vaultBalanceChange = (postBalances[vaultIndex] - preBalances[vaultIndex]) / LAMPORTS_PER_SOL;
      
      const date = new Date(sig.blockTime * 1000).toLocaleString();
      
      if (vaultBalanceChange > 0.001) {
        // Deposit to vault
        console.log(`📥 DEPOSIT: ${vaultBalanceChange.toFixed(4)} SOL`);
        console.log(`   Date: ${date}`);
        console.log(`   Tx: ${sig.signature.slice(0, 32)}...`);
        console.log(`   https://solscan.io/tx/${sig.signature}?cluster=devnet\n`);
        totalSolDeposited += vaultBalanceChange;
      } else if (vaultBalanceChange < -0.001) {
        // Withdrawal from vault
        console.log(`📤 WITHDRAWAL: ${Math.abs(vaultBalanceChange).toFixed(4)} SOL`);
        console.log(`   Date: ${date}`);
        console.log(`   Tx: ${sig.signature.slice(0, 32)}...`);
        console.log(`   https://solscan.io/tx/${sig.signature}?cluster=devnet\n`);
        totalSolWithdrawn += Math.abs(vaultBalanceChange);
      }
    } catch (e) {
      // Skip errors
    }
  }
  
  console.log(`\n════════════════════════════════════════`);
  console.log(`📊 SUMMARY FOR ${userWallet.slice(0, 8)}...`);
  console.log(`════════════════════════════════════════`);
  console.log(`   Total Deposited:  ${totalSolDeposited.toFixed(4)} SOL`);
  console.log(`   Total Withdrawn:  ${totalSolWithdrawn.toFixed(4)} SOL`);
  console.log(`   Net Balance:      ${(totalSolDeposited - totalSolWithdrawn).toFixed(4)} SOL`);
  console.log(`════════════════════════════════════════\n`);
}

main().catch(console.error);
