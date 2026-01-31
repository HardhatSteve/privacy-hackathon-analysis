/**
 * Anchor Program Integration for Privacy Report Anchoring
 * Uses custom Anchor program when deployed, falls back to SPL Memo
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  clusterApiUrl,
} from "@solana/web3.js";
import type { AnchorResult, WalletAdapter } from "./anchor-service";

// Replace with your deployed program ID after running `anchor deploy`
// Set to null to use SPL Memo fallback
export const ANCHOR_PROGRAM_ID: string | null = null;
// Example: "PRiVRpT1111111111111111111111111111111111111"

// SPL Memo Program ID (fallback)
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

// Devnet RPC endpoint
const DEVNET_RPC = clusterApiUrl("devnet");

// Anchor instruction discriminator for "anchor_report"
// This is the first 8 bytes of SHA256("global:anchor_report")
const ANCHOR_REPORT_DISCRIMINATOR = Buffer.from([
  0x5c, 0x73, 0x6d, 0x9f, 0x6e, 0x2c, 0x8a, 0x1b
]);

/**
 * Derives the PDA for an anchored report
 */
export function deriveReportPDA(
  programId: PublicKey,
  reporter: PublicKey,
  reportHash: Uint8Array
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("report"),
      reporter.toBuffer(),
      Buffer.from(reportHash),
    ],
    programId
  );
}

/**
 * Creates the instruction data for anchor_report
 */
function createAnchorReportInstructionData(
  analyzedWallet: PublicKey,
  reportHash: Uint8Array
): Buffer {
  // Layout: discriminator (8) + analyzed_wallet (32) + report_hash (32)
  const data = Buffer.alloc(8 + 32 + 32);
  
  // Write discriminator
  ANCHOR_REPORT_DISCRIMINATOR.copy(data, 0);
  
  // Write analyzed_wallet pubkey
  analyzedWallet.toBuffer().copy(data, 8);
  
  // Write report_hash
  Buffer.from(reportHash).copy(data, 40);
  
  return data;
}

/**
 * Creates anchor_report instruction for custom program
 */
function createAnchorProgramInstruction(
  programId: PublicKey,
  reporter: PublicKey,
  analyzedWallet: PublicKey,
  reportHash: Uint8Array
): TransactionInstruction {
  const [reportPDA] = deriveReportPDA(programId, reporter, reportHash);
  
  const data = createAnchorReportInstructionData(analyzedWallet, reportHash);
  
  return new TransactionInstruction({
    keys: [
      { pubkey: reportPDA, isSigner: false, isWritable: true },
      { pubkey: reporter, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data,
  });
}

/**
 * Creates memo instruction (fallback)
 */
function createMemoInstruction(
  signer: PublicKey,
  analyzedWallet: string,
  hashHex: string
): TransactionInstruction {
  const memoContent = `PRIV_REPORT|${analyzedWallet}|${hashHex}`;
  
  return new TransactionInstruction({
    keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoContent, "utf-8"),
  });
}

/**
 * Anchors a report using custom program or memo fallback
 */
export async function anchorReportWithProgram(
  wallet: WalletAdapter,
  analyzedWallet: string,
  hashHex: string,
  hashBytes: Uint8Array
): Promise<AnchorResult & { usedCustomProgram: boolean; pda?: string }> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  const connection = new Connection(DEVNET_RPC, "confirmed");
  const transaction = new Transaction();
  
  let usedCustomProgram = false;
  let pda: string | undefined;

  if (ANCHOR_PROGRAM_ID) {
    // Use custom Anchor program
    const programId = new PublicKey(ANCHOR_PROGRAM_ID);
    const analyzedWalletPubkey = new PublicKey(analyzedWallet);
    
    const ix = createAnchorProgramInstruction(
      programId,
      wallet.publicKey,
      analyzedWalletPubkey,
      hashBytes
    );
    transaction.add(ix);
    
    const [reportPDA] = deriveReportPDA(programId, wallet.publicKey, hashBytes);
    pda = reportPDA.toBase58();
    usedCustomProgram = true;
  } else {
    // Fallback to SPL Memo
    const memoIx = createMemoInstruction(wallet.publicKey, analyzedWallet, hashHex);
    transaction.add(memoIx);
  }

  // Get latest blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  // Sign and send
  const signedTx = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTx.serialize());

  const confirmation = await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });

  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
  }

  const slot = await connection.getSlot();

  return {
    signature,
    explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    timestamp: Date.now(),
    hash: hashHex,
    slot,
    usedCustomProgram,
    pda,
  };
}

/**
 * Fetches an anchored report from the custom program
 */
export async function fetchAnchoredReport(
  reporter: PublicKey,
  reportHash: Uint8Array
): Promise<{
  reporter: string;
  analyzedWallet: string;
  reportHash: string;
  createdAt: number;
} | null> {
  if (!ANCHOR_PROGRAM_ID) {
    return null;
  }

  const connection = new Connection(DEVNET_RPC, "confirmed");
  const programId = new PublicKey(ANCHOR_PROGRAM_ID);
  const [reportPDA] = deriveReportPDA(programId, reporter, reportHash);

  try {
    const accountInfo = await connection.getAccountInfo(reportPDA);
    if (!accountInfo) {
      return null;
    }

    // Parse account data
    // Layout: discriminator (8) + reporter (32) + analyzed_wallet (32) + report_hash (32) + created_at (8)
    const data = accountInfo.data;
    
    const reporterPubkey = new PublicKey(data.slice(8, 40));
    const analyzedWallet = new PublicKey(data.slice(40, 72));
    const storedHash = data.slice(72, 104);
    const createdAt = data.readBigInt64LE(104);

    return {
      reporter: reporterPubkey.toBase58(),
      analyzedWallet: analyzedWallet.toBase58(),
      reportHash: Buffer.from(storedHash).toString("hex"),
      createdAt: Number(createdAt),
    };
  } catch (err) {
    console.error("Error fetching anchored report:", err);
    return null;
  }
}

/**
 * Checks if a report is already anchored
 */
export async function isReportAnchored(
  reporter: PublicKey,
  reportHash: Uint8Array
): Promise<boolean> {
  if (!ANCHOR_PROGRAM_ID) {
    return false;
  }

  const connection = new Connection(DEVNET_RPC, "confirmed");
  const programId = new PublicKey(ANCHOR_PROGRAM_ID);
  const [reportPDA] = deriveReportPDA(programId, reporter, reportHash);

  try {
    const accountInfo = await connection.getAccountInfo(reportPDA);
    return accountInfo !== null;
  } catch {
    return false;
  }
}
