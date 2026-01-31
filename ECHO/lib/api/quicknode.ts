/**
 * QuickNode RPC Client
 * MEV detection, high-performance queries, and custom RPC methods
 */

import { Connection, PublicKey, ParsedTransactionWithMeta } from "@solana/web3.js";

const connection = new Connection(
  process.env.QUICKNODE_API_URL || "https://api.devnet.solana.com",
  "confirmed"
);

export interface MEVDetection {
  isMEV: boolean;
  type: "sandwich" | "frontrun" | "backrun" | "jit" | null;
  extractedValue: number;
  confidence: number;
}

/**
 * Detect MEV in a transaction
 */
export async function detectMEV(signature: string): Promise<MEVDetection> {
  try {
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { isMEV: false, type: null, extractedValue: 0, confidence: 0 };
    }

    // Analyze transaction for MEV patterns
    const analysis = analyzeMEVPattern(tx);
    return analysis;
  } catch (error) {
    console.error("QuickNode MEV detection error:", error);
    return { isMEV: false, type: null, extractedValue: 0, confidence: 0 };
  }
}

/**
 * Analyze MEV patterns in transaction
 */
function analyzeMEVPattern(tx: ParsedTransactionWithMeta): MEVDetection {
  const preBalances = tx.meta?.preBalances || [];
  const postBalances = tx.meta?.postBalances || [];
  const accountKeys = tx.transaction.message.accountKeys;

  // Check for sandwich attack pattern
  // (same address appears multiple times with balance changes)
  const balanceChanges = accountKeys.map((key, index) => ({
    address: key.pubkey.toBase58(),
    change: postBalances[index] - preBalances[index],
  }));

  // Detect if first and last instruction benefit the same address
  const firstChange = balanceChanges[0]?.change || 0;
  const lastChange = balanceChanges[balanceChanges.length - 1]?.change || 0;

  if (
    firstChange > 0 &&
    lastChange > 0 &&
    balanceChanges[0].address === balanceChanges[balanceChanges.length - 1].address
  ) {
    return {
      isMEV: true,
      type: "sandwich",
      extractedValue: firstChange + lastChange,
      confidence: 85,
    };
  }

  // Check for front-running (large balance gain before target tx)
  const largeGains = balanceChanges.filter((bc) => bc.change > 1e9); // >1 SOL gain
  if (largeGains.length > 0) {
    return {
      isMEV: true,
      type: "frontrun",
      extractedValue: Math.max(...largeGains.map((g) => g.change)),
      confidence: 70,
    };
  }

  return { isMEV: false, type: null, extractedValue: 0, confidence: 0 };
}

/**
 * Get account balance
 */
export async function getBalance(address: string): Promise<number> {
  try {
    const pubkey = new PublicKey(address);
    const balance = await connection.getBalance(pubkey);
    return balance;
  } catch (error) {
    console.error("QuickNode balance error:", error);
    return 0;
  }
}

/**
 * Get recent block hash
 */
export async function getRecentBlockhash(): Promise<string> {
  try {
    const { blockhash } = await connection.getLatestBlockhash();
    return blockhash;
  } catch (error) {
    console.error("QuickNode blockhash error:", error);
    throw error;
  }
}

/**
 * Send transaction
 */
export async function sendTransaction(
  serializedTx: string
): Promise<string> {
  try {
    const buffer = Buffer.from(serializedTx, "base64");
    const signature = await connection.sendRawTransaction(buffer);
    return signature;
  } catch (error) {
    console.error("QuickNode send tx error:", error);
    throw error;
  }
}
