/**
 * GOOD EXAMPLE - Follows privacy best practices
 * This file should pass privacy analysis with minimal warnings
 */

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

// GOOD: Each account pays its own fees
export async function transferWithSelfPaidFees(
  connection: Connection,
  sender: Keypair,
  recipient: PublicKey,
  amount: number
) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipient,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  // GOOD: Sender pays own fees
  transaction.feePayer = sender.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.sign(sender);

  return await connection.sendRawTransaction(transaction.serialize());
}

// GOOD: No PII in memos
export async function transferWithGenericMemo(
  connection: Connection,
  sender: Keypair,
  recipient: PublicKey,
  amount: number,
  reference: string // Generic reference, not PII
) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipient,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  // GOOD: Generic reference without PII
  const memoInstruction = {
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: Buffer.from(`ref:${reference}`), // GOOD: UUID or generic reference
  };

  transaction.add(memoInstruction);
  transaction.feePayer = sender.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.sign(sender);

  return await connection.sendRawTransaction(transaction.serialize());
}

// GOOD: Each payment uses a fresh derived address
export async function sendMultiplePaymentsPrivately(
  connection: Connection,
  masterKey: Keypair,
  recipients: PublicKey[],
  amounts: number[] // Different amounts for each payment
) {
  const signatures: string[] = [];

  for (let i = 0; i < recipients.length; i++) {
    // GOOD: Derive a new keypair for each payment (in production, use proper derivation)
    const derivedSender = Keypair.generate(); // Simulating address rotation

    // Fund the derived address (in practice, you'd do this more efficiently)
    const fundTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: masterKey.publicKey,
        toPubkey: derivedSender.publicKey,
        lamports: amounts[i] * LAMPORTS_PER_SOL + 5000, // Amount + fee
      })
    );
    fundTx.feePayer = masterKey.publicKey;
    fundTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    fundTx.sign(masterKey);
    await connection.sendRawTransaction(fundTx.serialize());

    // Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send from derived address
    const paymentTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: derivedSender.publicKey,
        toPubkey: recipients[i],
        lamports: amounts[i] * LAMPORTS_PER_SOL, // GOOD: Varying amounts
      })
    );

    paymentTx.feePayer = derivedSender.publicKey; // GOOD: Self-paid fees
    paymentTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    paymentTx.sign(derivedSender);

    const sig = await connection.sendRawTransaction(paymentTx.serialize());
    signatures.push(sig);

    // GOOD: Random delays to avoid timing patterns
    const randomDelay = Math.floor(Math.random() * 30000) + 10000; // 10-40s
    await new Promise(resolve => setTimeout(resolve, randomDelay));
  }

  return signatures;
}

// GOOD: Batched payments in single transaction (more efficient, less pattern)
export async function batchPayments(
  connection: Connection,
  sender: Keypair,
  recipients: PublicKey[],
  amounts: number[]
) {
  const transaction = new Transaction();

  // GOOD: Multiple transfers in one transaction
  for (let i = 0; i < recipients.length; i++) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: recipients[i],
        lamports: amounts[i] * LAMPORTS_PER_SOL,
      })
    );
  }

  transaction.feePayer = sender.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.sign(sender);

  return await connection.sendRawTransaction(transaction.serialize());
}
