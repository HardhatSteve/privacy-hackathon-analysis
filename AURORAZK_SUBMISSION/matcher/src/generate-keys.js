/**
 * Generate matcher keypair and export for deployment
 * 
 * Usage:
 *   node src/generate-keys.js           # Generate all keys and save wallet file
 *   node src/generate-keys.js --export  # Export existing wallet for deployment
 */

import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { Keypair } from '@solana/web3.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check both possible wallet locations
const walletPathLocal = join(__dirname, '../matcher-wallet.json');
const walletPathRoot = join(__dirname, '../../matcher-wallet.json');
const walletPath = existsSync(walletPathLocal) ? walletPathLocal : 
                   existsSync(walletPathRoot) ? walletPathRoot : walletPathLocal;

const isExportMode = process.argv.includes('--export') || process.argv.includes('--export-env');

// ═══════════════════════════════════════════════════════════════════
// SOLANA WALLET (for signing transactions)
// ═══════════════════════════════════════════════════════════════════

let solanaKeypair;

if (isExportMode && existsSync(walletPath)) {
  // Export existing wallet
  console.log('🔑 Exporting existing matcher wallet for deployment...\n');
  const keypairData = JSON.parse(readFileSync(walletPath, 'utf-8'));
  solanaKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
} else {
  // Generate new wallet
  console.log('🔐 Generating new matcher keys...\n');
  solanaKeypair = Keypair.generate();
  
  // Save to file for local development
  const secretKeyArray = Array.from(solanaKeypair.secretKey);
  writeFileSync(walletPath, JSON.stringify(secretKeyArray));
  console.log(`✅ Saved wallet to: ${walletPath}\n`);
}

console.log('═══════════════════════════════════════════════════════════');
console.log('💳 SOLANA WALLET (for signing match transactions)');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`Public Key: ${solanaKeypair.publicKey.toBase58()}`);
console.log(`\n⚠️  Fund this wallet with devnet SOL:`);
console.log(`   solana airdrop 2 ${solanaKeypair.publicKey.toBase58()} --url devnet\n`);

// Export format for deployment platforms (Railway, Render, etc.)
const secretKeyArray = Array.from(solanaKeypair.secretKey);
const base64Key = Buffer.from(JSON.stringify(secretKeyArray)).toString('base64');

console.log('═══════════════════════════════════════════════════════════');
console.log('🚀 DEPLOYMENT ENV VAR (for Railway/Render)');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Copy this entire line to your deployment platform:\n');
console.log(`MATCHER_WALLET_KEY=${base64Key}\n`);

// ═══════════════════════════════════════════════════════════════════
// ENCRYPTION KEYS (for decrypting orders)
// ═══════════════════════════════════════════════════════════════════

if (!isExportMode) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 ENCRYPTION KEYPAIR (for decrypting incoming orders)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const encryptionKeypair = nacl.box.keyPair();

  console.log('Public Key (share with frontend):');
  console.log(`  Base64: ${naclUtil.encodeBase64(encryptionKeypair.publicKey)}`);

  console.log('\nSecret Key (KEEP PRIVATE):');
  console.log(`  MATCHER_ENCRYPTION_SECRET=${naclUtil.encodeBase64(encryptionKeypair.secretKey)}`);

  // ═══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📝 COMPLETE .env FILE FOR LOCAL DEVELOPMENT:');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`PORT=3001`);
  console.log(`SOLANA_RPC=https://api.devnet.solana.com`);
  console.log(`MATCHER_WALLET=./matcher-wallet.json`);
  console.log(`MATCHER_ENCRYPTION_SECRET=${naclUtil.encodeBase64(encryptionKeypair.secretKey)}`);
  console.log(`PROGRAM_ID=4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi`);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🚀 COMPLETE ENV VARS FOR DEPLOYMENT (Railway/Render):');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`PORT=3001`);
  console.log(`SOLANA_RPC=https://api.devnet.solana.com`);
  console.log(`MATCHER_WALLET_KEY=${base64Key}`);
  console.log(`MATCHER_ENCRYPTION_SECRET=${naclUtil.encodeBase64(encryptionKeypair.secretKey)}`);
  console.log(`PROGRAM_ID=4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi`);
}

console.log('\n✅ Done! Keep these keys secure and never commit them to git.');
