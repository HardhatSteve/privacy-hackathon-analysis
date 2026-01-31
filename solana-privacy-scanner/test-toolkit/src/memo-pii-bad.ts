/**
 * BAD EXAMPLE - PII in memos that the analyzer detects
 */

import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

// DETECTED: Email in memo
export async function transferWithEmail(connection: Connection, to: PublicKey) {
  const from = Keypair.generate();

  const transaction = new Transaction();

  // CRITICAL: Email detected
  const memo = "Payment from john.doe@example.com";

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: 1000000,
    })
  );

  await connection.sendTransaction(transaction, [from]);
}

// DETECTED: Phone number in memo
export async function transferWithPhone(connection: Connection, to: PublicKey) {
  const from = Keypair.generate();

  const transaction = new Transaction();

  // CRITICAL: Phone number detected
  const memo = "Contact: 555-123-4567";

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: 1000000,
    })
  );

  await connection.sendTransaction(transaction, [from]);
}

// DETECTED: SSN in memo
export async function transferWithSSN(connection: Connection, to: PublicKey) {
  const from = Keypair.generate();

  // CRITICAL: SSN detected
  const memoData = "User ID: 123-45-6789";

  const transaction = new Transaction();
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: 1000000,
    })
  );

  await connection.sendTransaction(transaction, [from]);
}

// DETECTED: Credit card number in memo
export async function transferWithCC(connection: Connection, to: PublicKey) {
  const from = Keypair.generate();

  const transaction = new Transaction();

  // CRITICAL: Credit card detected
  const memo = "Card: 4532-1234-5678-9010";

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: 1000000,
    })
  );

  await connection.sendTransaction(transaction, [from]);
}

// DETECTED: URL with query params in memo
export async function transferWithURL(connection: Connection, to: PublicKey) {
  const from = Keypair.generate();

  const transaction = new Transaction();

  // HIGH: URL with params detected
  const memo = "Ref: https://example.com/payment?user=12345&session=abc";

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: 1000000,
    })
  );

  await connection.sendTransaction(transaction, [from]);
}

// DETECTED: Personal name in memo
export async function transferWithName(connection: Connection, to: PublicKey) {
  const from = Keypair.generate();

  const transaction = new Transaction();

  // HIGH: Personal name detected
  const memo = "Customer: John Smith";

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: 1000000,
    })
  );

  await connection.sendTransaction(transaction, [from]);
}

// DETECTED: Multiple PII types
export async function transferWithMultiplePII(connection: Connection, to: PublicKey) {
  const from = Keypair.generate();

  const transaction = new Transaction();

  // CRITICAL: Multiple PII detected - email AND phone
  const memo = "User contact.doe@company.com phone 555-987-6543";

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: 1000000,
    })
  );

  await connection.sendTransaction(transaction, [from]);
}
