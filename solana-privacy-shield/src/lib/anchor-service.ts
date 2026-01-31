/**
 * Devnet Anchoring Service
 * Submits report hash to Solana Devnet using SPL Memo program
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
} from "@solana/web3.js";

// SPL Memo Program ID (works on all networks)
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

// Devnet RPC endpoint
const DEVNET_RPC = clusterApiUrl("devnet");

export interface AnchorResult {
  signature: string;
  explorerUrl: string;
  timestamp: number;
  hash: string;
  slot: number;
}

export interface WalletAdapter {
  publicKey: PublicKey | null;
  signTransaction: ((tx: Transaction) => Promise<Transaction>) | undefined;
  connected: boolean;
}

/**
 * Creates a memo instruction with the report hash and metadata
 */
function createMemoInstruction(
  signer: PublicKey,
  analyzedWallet: string,
  hashHex: string
): TransactionInstruction {
  // Format: "PRIV_REPORT|<analyzed_wallet>|<hash>"
  const memoContent = `PRIV_REPORT|${analyzedWallet}|${hashHex}`;
  
  return new TransactionInstruction({
    keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoContent, "utf-8"),
  });
}

/**
 * Anchors a report hash on Solana Devnet
 */
export async function anchorReport(
  wallet: WalletAdapter,
  analyzedWallet: string,
  hashHex: string
): Promise<AnchorResult> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  const connection = new Connection(DEVNET_RPC, "confirmed");
  
  // Create transaction with memo instruction
  const transaction = new Transaction();
  const memoIx = createMemoInstruction(wallet.publicKey, analyzedWallet, hashHex);
  transaction.add(memoIx);
  
  // Get latest blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;
  
  // Sign transaction with user's wallet
  const signedTx = await wallet.signTransaction(transaction);
  
  // Send and confirm transaction
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  
  const confirmation = await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });
  
  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
  }
  
  // Get slot for timestamp reference
  const slot = await connection.getSlot();
  
  return {
    signature,
    explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    timestamp: Date.now(),
    hash: hashHex,
    slot,
  };
}

/**
 * Checks if user has enough SOL for transaction fee on devnet
 */
export async function checkDevnetBalance(publicKey: PublicKey): Promise<{
  balance: number;
  sufficient: boolean;
}> {
  const connection = new Connection(DEVNET_RPC, "confirmed");
  const balance = await connection.getBalance(publicKey);
  const balanceSOL = balance / 1e9;
  
  return {
    balance: balanceSOL,
    sufficient: balanceSOL >= 0.001, // Need ~0.000005 SOL for memo tx
  };
}

/**
 * Requests airdrop of devnet SOL if needed
 */
export async function requestDevnetAirdrop(publicKey: PublicKey): Promise<string> {
  const connection = new Connection(DEVNET_RPC, "confirmed");
  const signature = await connection.requestAirdrop(publicKey, 0.1 * 1e9); // 0.1 SOL
  
  await connection.confirmTransaction(signature);
  return signature;
}
