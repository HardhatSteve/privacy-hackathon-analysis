/**
 * BAD EXAMPLE - Contains multiple privacy anti-patterns
 * This file should trigger privacy warnings from the static analyzer
 */

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

// PRIVACY ISSUE #1: Fee payer reuse - using one wallet to pay fees for multiple accounts
export async function transferWithExternalFeePayer(
  connection: Connection,
  sender: Keypair,
  recipient: PublicKey,
  amount: number,
  feePayer: Keypair // Different wallet pays the fee - links accounts!
) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipient,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  transaction.feePayer = feePayer.publicKey; // DETECTED: Fee payer reuse
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  transaction.partialSign(sender);
  transaction.partialSign(feePayer);

  return await connection.sendRawTransaction(transaction.serialize());
}

// PRIVACY ISSUE #2: Hardcoded memo with PII
export async function transferWithMemo(
  connection: Connection,
  sender: Keypair,
  recipient: PublicKey,
  amount: number,
  userEmail: string // Email in memo - bad!
) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipient,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  // DETECTED: PII in memo field
  const memoInstruction = {
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: Buffer.from(`Payment from ${userEmail}`), // BAD: Email exposed on-chain
  };

  transaction.add(memoInstruction);
  transaction.feePayer = sender.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.sign(sender);

  return await connection.sendRawTransaction(transaction.serialize());
}

// PRIVACY ISSUE #3: Address reuse - always using the same wallet
export async function sendMultiplePayments(
  connection: Connection,
  sender: Keypair, // Same sender for all payments - creates pattern
  recipients: PublicKey[],
  amount: number
) {
  const signatures: string[] = [];

  for (const recipient of recipients) {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey, // DETECTED: Address reuse
        toPubkey: recipient,
        lamports: amount * LAMPORTS_PER_SOL, // DETECTED: Amount reuse (same amount each time)
      })
    );

    transaction.feePayer = sender.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.sign(sender);

    const sig = await connection.sendRawTransaction(transaction.serialize());
    signatures.push(sig);
  }

  return signatures;
}

// PRIVACY ISSUE #4: Predictable timing pattern
export async function scheduledPayments(
  connection: Connection,
  sender: Keypair,
  recipient: PublicKey,
  amount: number,
  count: number
) {
  for (let i = 0; i < count; i++) {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: recipient,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    transaction.feePayer = sender.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.sign(sender);

    await connection.sendRawTransaction(transaction.serialize());

    // DETECTED: Regular timing pattern
    await new Promise(resolve => setTimeout(resolve, 60000)); // Every 60 seconds - predictable!
  }
}
