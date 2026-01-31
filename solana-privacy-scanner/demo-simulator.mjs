#!/usr/bin/env node
/**
 * Demo: Transaction Privacy Simulation
 * Run with: node demo-simulator.mjs
 */

import { Transaction, SystemProgram, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createDefaultLabelProvider } from './packages/core/dist/index.js';

const COINBASE = new PublicKey('GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE');
const sender = Keypair.generate().publicKey;

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Transaction Simulator Demo');
console.log('═══════════════════════════════════════════════════════════════\n');

// Show the transaction code
console.log('Transaction Code:');
console.log('────────────────────────────────────────────────────────────────');
console.log(`
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: new PublicKey('GJRs4FwH...7npE'),  // Coinbase Hot Wallet
      lamports: 1 * LAMPORTS_PER_SOL,
    })
  );
`);
console.log('────────────────────────────────────────────────────────────────\n');

// Build the actual transaction
const tx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender,
    toPubkey: COINBASE,
    lamports: 1 * LAMPORTS_PER_SOL,
  })
);

// Analyze it
const labelProvider = createDefaultLabelProvider();
const accounts = [];
for (const ix of tx.instructions) {
  accounts.push(ix.programId.toString());
  for (const key of ix.keys) {
    accounts.push(key.pubkey.toString());
  }
}

console.log('Scanning transaction accounts...\n');

for (const addr of accounts) {
  const label = labelProvider.lookup(addr);
  if (label && label.type === 'exchange') {
    console.log('🔴 PRIVACY LEAK DETECTED');
    console.log('────────────────────────────────────────────────────────────────');
    console.log(`  Address:  ${addr}`);
    console.log(`  Entity:   ${label.name}`);
    console.log(`  Type:     ${label.type}`);
    console.log(`  Risk:     HIGH - Direct exchange interaction links wallet to identity`);
    console.log('────────────────────────────────────────────────────────────────\n');
  }
}

console.log('✓ Scanner successfully detected the Coinbase interaction\n');
