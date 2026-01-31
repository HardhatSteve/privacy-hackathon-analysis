/**
 * BAD EXAMPLE - For static analyzer detection
 * This file contains patterns the static analyzer actually detects
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

// PRIVACY ISSUE #1: Fee payer declared OUTSIDE loop, reused INSIDE loop
export async function batchTransfersWithSharedFeePayer(
  connection: Connection,
  recipients: PublicKey[],
  amounts: number[]
) {
  // Fee payer declared outside - will be flagged
  const feePayer = Keypair.generate();

  // Using same fee payer inside loop - DETECTED
  for (let i = 0; i < recipients.length; i++) {
    const sender = Keypair.generate();

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: recipients[i],
        lamports: amounts[i],
      })
    );

    // PRIVACY ISSUE: Reusing feePayer across multiple transactions in loop
    transaction.feePayer = feePayer.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    transaction.partialSign(sender);
    transaction.partialSign(feePayer);

    await connection.sendRawTransaction(transaction.serialize());
  }
}

// PRIVACY ISSUE #2: PII in memo field
export async function transferWithUserEmail(
  connection: Connection,
  sender: Keypair,
  recipient: PublicKey,
  userEmail: string // Email will be in memo - BAD!
) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipient,
      lamports: 1000000,
    })
  );

  // DETECTED: Email in memo
  const memoInstruction = {
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: Buffer.from(`Payment from ${userEmail}`), // PRIVACY ISSUE: Contains email
  };

  transaction.add(memoInstruction);
  transaction.feePayer = sender.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.sign(sender);

  return await connection.sendRawTransaction(transaction.serialize());
}

// PRIVACY ISSUE #3: Phone number in memo
export async function transferWithPhoneNumber(
  connection: Connection,
  sender: Keypair,
  recipient: PublicKey,
  phoneNumber: string
) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipient,
      lamports: 1000000,
    })
  );

  // DETECTED: Phone number pattern in memo
  const memoInstruction = {
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: Buffer.from(`ref:${phoneNumber}`), // PRIVACY ISSUE: Phone number
  };

  transaction.add(memoInstruction);
  transaction.feePayer = sender.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.sign(sender);

  return await connection.sendRawTransaction(transaction.serialize());
}

// PRIVACY ISSUE #4: Multiple fee payer reuse patterns
export async function complexBatchOperation(
  connection: Connection,
  operations: number
) {
  const sharedFeePayer = Keypair.generate(); // Declared outside

  for (let i = 0; i < operations; i++) {
    const sender = Keypair.generate();
    const recipient = Keypair.generate();

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: recipient.publicKey,
        lamports: 1000000,
      })
    );

    // DETECTED: sharedFeePayer reused in loop
    transaction.feePayer = sharedFeePayer.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    transaction.partialSign(sender);
    transaction.partialSign(sharedFeePayer);

    await connection.sendRawTransaction(transaction.serialize());
  }
}
