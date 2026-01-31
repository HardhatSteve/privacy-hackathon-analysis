import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionSignature,
  SendOptions,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import type { Currency, FeeBreakdown } from "@/types";
import { TOKEN_ADDRESSES } from "@/types";

export interface SendTransactionParams {
  connection: Connection;
  wallet: WalletContextState;
  recipient: string;
  amount: number;
  currency: Currency;
}

export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}

// Token decimals
const TOKEN_DECIMALS: Record<Currency, number> = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
  USD1: 6, // USD1 stablecoin
  BONK: 5, // BONK token
  AOL: 9, // AOL token
  RADR: 9, // RADR token
  ORE: 9, // ORE token
};

export async function sendSOL(
  params: SendTransactionParams
): Promise<TransactionResult> {
  const { connection, wallet, recipient, amount } = params;

  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  try {
    const recipientPubkey = new PublicKey(recipient);
    const lamports = Math.round(amount * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: recipientPubkey,
        lamports,
      })
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      }
    );

    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    return {
      signature,
      success: true,
    };
  } catch (error) {
    console.error("Error sending SOL:", error);
    return {
      signature: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendSPLToken(
  params: SendTransactionParams
): Promise<TransactionResult> {
  const { connection, wallet, recipient, amount, currency } = params;

  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  const mintAddress = TOKEN_ADDRESSES[currency];
  if (!mintAddress || currency === "SOL") {
    throw new Error("Invalid token");
  }

  try {
    const mintPubkey = new PublicKey(mintAddress);
    const recipientPubkey = new PublicKey(recipient);

    // Get associated token accounts
    const senderATA = await getAssociatedTokenAddress(
      mintPubkey,
      wallet.publicKey
    );
    const recipientATA = await getAssociatedTokenAddress(
      mintPubkey,
      recipientPubkey
    );

    const instructions: TransactionInstruction[] = [];

    // Check if recipient ATA exists
    try {
      await getAccount(connection, recipientATA);
    } catch {
      // Create ATA for recipient if it doesn't exist
      instructions.push(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          recipientATA,
          recipientPubkey,
          mintPubkey
        )
      );
    }

    // Calculate amount in smallest units
    const decimals = TOKEN_DECIMALS[currency];
    const tokenAmount = BigInt(Math.round(amount * Math.pow(10, decimals)));

    // Add transfer instruction
    instructions.push(
      createTransferInstruction(
        senderATA,
        recipientATA,
        wallet.publicKey,
        tokenAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    const transaction = new Transaction().add(...instructions);

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      }
    );

    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    return {
      signature,
      success: true,
    };
  } catch (error) {
    console.error("Error sending SPL token:", error);
    return {
      signature: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendTransaction(
  params: SendTransactionParams
): Promise<TransactionResult> {
  if (params.currency === "SOL") {
    return sendSOL(params);
  }
  return sendSPLToken(params);
}

export async function estimateTransactionFee(
  connection: Connection,
  transaction: Transaction
): Promise<number> {
  try {
    const { value } = await connection.getFeeForMessage(
      transaction.compileMessage()
    );
    return value ? value / LAMPORTS_PER_SOL : 0.000005; // Default fee estimate
  } catch {
    return 0.000005;
  }
}

export function calculateFeeBreakdown(
  networkFee: number,
  privacyLevel: "none" | "medium" | "high",
  amount: number
): FeeBreakdown {
  // Privacy fees based on level
  const privacyFeeRates: Record<string, number> = {
    none: 0,
    medium: 0.001, // 0.1%
    high: 0.005, // 0.5%
  };

  const privacyFee = amount * privacyFeeRates[privacyLevel];
  const serviceFee = amount * 0.001; // 0.1% service fee

  return {
    networkFee,
    privacyFee,
    serviceFee,
    total: networkFee + privacyFee + serviceFee,
    currency: "SOL",
  };
}
