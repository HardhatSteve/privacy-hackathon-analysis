/**
 * BAD EXAMPLE - Fee payer reuse patterns the analyzer detects
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

// DETECTED PATTERN #1: Fee payer declared outside loop, used in sendAndConfirmTransaction
export async function batchWithSharedFeePayer(
  connection: Connection,
  recipients: PublicKey[],
  amounts: number[]
) {
  // Fee payer declared OUTSIDE loop
  const feePayer = Keypair.generate();

  // Using feePayer inside loop with sendAndConfirmTransaction
  for (let i = 0; i < recipients.length; i++) {
    const sender = Keypair.generate();

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: recipients[i],
        lamports: amounts[i],
      })
    );

    // DETECTED: feePayer used in transaction call
    await sendAndConfirmTransaction(
      connection,
      transaction,
      [sender, feePayer] // feePayer is in signer array
    );
  }
}

// DETECTED PATTERN #2: Sequential reuse of same fee payer
export async function sequentialPayments(
  connection: Connection,
  recipient1: PublicKey,
  recipient2: PublicKey,
  recipient3: PublicKey
) {
  const sharedFeePayer = Keypair.generate(); // Declared once

  const tx1 = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: Keypair.generate().publicKey,
      toPubkey: recipient1,
      lamports: 1000000,
    })
  );

  // First usage
  await sendAndConfirmTransaction(connection, tx1, [sharedFeePayer]);

  const tx2 = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: Keypair.generate().publicKey,
      toPubkey: recipient2,
      lamports: 2000000,
    })
  );

  // Second usage - DETECTED: reusing same fee payer
  await sendAndConfirmTransaction(connection, tx2, [sharedFeePayer]);

  const tx3 = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: Keypair.generate().publicKey,
      toPubkey: recipient3,
      lamports: 3000000,
    })
  );

  // Third usage - DETECTED
  await sendAndConfirmTransaction(connection, tx3, [sharedFeePayer]);
}

// DETECTED PATTERN #3: Fee payer in options object
export async function withOptionsObject(
  connection: Connection,
  recipients: PublicKey[]
) {
  const myFeePayer = Keypair.generate();

  for (const recipient of recipients) {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: Keypair.generate().publicKey,
        toPubkey: recipient,
        lamports: 1000000,
      })
    );

    // DETECTED: feePayer in options
    await connection.sendTransaction(transaction, [Keypair.generate()], {
      feePayer: myFeePayer, // Reused fee payer
    });
  }
}
