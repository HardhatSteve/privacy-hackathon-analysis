/**
 * Reset Dark Pool Balance to Zero
 * This script zeros out your ledger balance for a fresh start
 */

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import pkg from '@coral-xyz/anchor';
const { Program, AnchorProvider, BN } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROGRAM_ID = new PublicKey('4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi');
const RPC_URL = 'https://api.devnet.solana.com';

async function main() {
  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Load wallet from WSL
  const wslWalletPath = '\\\\wsl.localhost\\Ubuntu\\root\\.config\\solana\\id.json';
  let wallet;
  
  try {
    const secret = JSON.parse(fs.readFileSync(wslWalletPath, 'utf-8'));
    wallet = Keypair.fromSecretKey(Uint8Array.from(secret));
    console.log('\n✅ Loaded wallet:', wallet.publicKey.toBase58());
  } catch (e) {
    console.error('❌ Could not load wallet from WSL path');
    console.error('   Expected:', wslWalletPath);
    console.error('   Error:', e.message);
    process.exit(1);
  }
  
  // Get current balance
  const [userBalancePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_balance'), wallet.publicKey.toBuffer()],
    PROGRAM_ID
  );
  
  const accountInfo = await connection.getAccountInfo(userBalancePda);
  if (!accountInfo) {
    console.log('No balance account found - already clean!');
    return;
  }
  
  const data = accountInfo.data;
  const currentSol = Number(data.readBigUInt64LE(8 + 32 + 1));
  const currentUsdc = Number(data.readBigUInt64LE(8 + 32 + 1 + 8));
  
  console.log('\n📊 Current Balance:');
  console.log(`   SOL:  ${(currentSol / LAMPORTS_PER_SOL).toFixed(9)} SOL`);
  console.log(`   USDC: ${(currentUsdc / 1e6).toFixed(6)} USDC`);
  
  if (currentSol === 0 && currentUsdc === 0) {
    console.log('\n✅ Balance is already zero!');
    return;
  }
  
  // Load IDL
  const idlPath = path.join(__dirname, '../../app/lib/idl/aurorazk.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  
  // Create provider and program
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: wallet.publicKey,
      signTransaction: async (tx) => {
        tx.partialSign(wallet);
        return tx;
      },
      signAllTransactions: async (txs) => {
        txs.forEach(tx => tx.partialSign(wallet));
        return txs;
      },
    },
    { commitment: 'confirmed' }
  );
  
  const program = new Program(idl, provider);
  
  console.log('\n🔄 Resetting balance to zero...');
  
  // Withdraw SOL (ledger only - zeros out the balance)
  if (currentSol > 0) {
    try {
      console.log('   Zeroing SOL balance...');
      await program.methods
        .withdrawDarkPool({ sol: {} }, new BN(currentSol))
        .accounts({
          userBalance: userBalancePda,
          owner: wallet.publicKey,
        })
        .signers([wallet])
        .rpc({ skipPreflight: true });
      console.log('   ✅ SOL zeroed');
    } catch (e) {
      console.error('   ❌ Failed to zero SOL:', e.message);
    }
  }
  
  // Withdraw USDC (ledger only)
  if (currentUsdc > 0) {
    try {
      console.log('   Zeroing USDC balance...');
      await program.methods
        .withdrawDarkPool({ usdc: {} }, new BN(currentUsdc))
        .accounts({
          userBalance: userBalancePda,
          owner: wallet.publicKey,
        })
        .signers([wallet])
        .rpc({ skipPreflight: true });
      console.log('   ✅ USDC zeroed');
    } catch (e) {
      console.error('   ❌ Failed to zero USDC:', e.message);
    }
  }
  
  // Verify
  const newAccountInfo = await connection.getAccountInfo(userBalancePda);
  const newData = newAccountInfo.data;
  const newSol = Number(newData.readBigUInt64LE(8 + 32 + 1)) / LAMPORTS_PER_SOL;
  const newUsdc = Number(newData.readBigUInt64LE(8 + 32 + 1 + 8)) / 1e6;
  
  console.log('\n📊 New Balance:');
  console.log(`   SOL:  ${newSol.toFixed(9)} SOL`);
  console.log(`   USDC: ${newUsdc.toFixed(6)} USDC`);
  
  console.log('\n✨ Fresh start complete!');
  console.log('   You can now deposit new funds via the frontend.');
}

main().catch(console.error);
