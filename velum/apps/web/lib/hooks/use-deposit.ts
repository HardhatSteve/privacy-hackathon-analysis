"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useVelum } from "./use-velum";
import { SUPPORTED_TOKENS } from "@/lib/config/tokens";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";
import {
  InsufficientBalanceError,
  DepositLimitError,
  ZKProofError,
  NetworkError,
  TransactionTimeoutError,
  RelayerError,
} from "@velumdotcash/sdk";
import { parseRelayerError } from "@/lib/utils/parse-relayer-error";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { Transaction } from "@solana/web3.js";
import {
  loadCircuits,
  areCircuitsLoaded,
  type CircuitLoadProgress,
} from "../circuit-loader";
import {
  useProofProgress,
  type ProofProgressState,
} from "./use-proof-progress";
import {
  addTransaction,
  updateTransactionStatus,
  type TransactionToken,
} from "../transaction-history";

export type DepositToken = "SOL" | "USDC" | "USDT";

export interface DepositParams {
  amount: bigint; // For SPL this is base units, for SOL lamports
  token: DepositToken;
  // For third-party deposits (paylinks)
  recipientUtxoPubkey?: string;
  recipientEncryptionKey?: string;
  paylinkId?: string; // For tracking which paylink this deposit is for
}

export interface DepositResult {
  signature: string;
  success: boolean;
}

export type CircuitLoadProgressCallback = (progress: CircuitLoadProgress) => void;

export function useDeposit() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { velum, isInitialized: isReady } = useVelum();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCircuits, setIsLoadingCircuits] = useState(false);
  const [circuitProgress, setCircuitProgress] =
    useState<CircuitLoadProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const proofProgress = useProofProgress();

  const deposit = useCallback(
    async (
      params: DepositParams,
      onCircuitProgress?: CircuitLoadProgressCallback
    ): Promise<DepositResult | null> => {
      if (!publicKey || !velum || !isReady) {
        setError(new Error("Wallet not connected or SDK not ready"));
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Load circuit files if not already loaded
        if (!areCircuitsLoaded()) {
          setIsLoadingCircuits(true);
          try {
            await loadCircuits((progress) => {
              setCircuitProgress(progress);
              onCircuitProgress?.(progress);
            });
          } catch (circuitError) {
            const message =
              circuitError instanceof Error
                ? circuitError.message
                : "Failed to load circuit files";
            throw new Error(`Circuit loading failed: ${message}`);
          } finally {
            setIsLoadingCircuits(false);
          }
        }

        let txSignature: string;
        const amountNumber = Number(params.amount); // SDK expects number

        // Resolve token configuration from SUPPORTED_TOKENS
        const tokenConfig = SUPPORTED_TOKENS.find(
          (t) => t.symbol === params.token
        );

        if (!tokenConfig) {
          throw new Error(
            `Token ${params.token} not found in supported tokens configuration`
          );
        }

        // Start proof progress tracking
        proofProgress.startProgress();

        try {
          if (params.token === "SOL") {
            const res = await velum.deposit({
              lamports: amountNumber,
              recipientUtxoPublicKey: params.recipientUtxoPubkey,
              recipientEncryptionKey: params.recipientEncryptionKey
                ? Buffer.from(params.recipientEncryptionKey, "base64")
                : undefined,
            });
            txSignature = res.tx;
          } else {
          // SPL tokens (USDC, USDT)
          const mintAddress = new PublicKey(tokenConfig.mintAddress);

          // Check if user has an Associated Token Account (ATA) for this token
          // If not, create it automatically
          const ata = getAssociatedTokenAddressSync(mintAddress, publicKey);
          let ataExists = false;

          try {
            await getAccount(connection, ata);
            ataExists = true;
          } catch (ataError: unknown) {
            // Check if it's a TokenAccountNotFoundError
            const isTokenAccountNotFound =
              ataError instanceof Error &&
              ataError.name === "TokenAccountNotFoundError";
            if (isTokenAccountNotFound) {
              ataExists = false;
            } else {
              // Re-throw other errors
              throw ataError;
            }
          }

          // If ATA doesn't exist, create it first
          if (!ataExists && signTransaction) {
            toast.info(
              `Creating ${params.token} account in your wallet. Please approve the transaction.`
            );

            const createAtaIx = createAssociatedTokenAccountInstruction(
              publicKey, // payer
              ata, // associated token address
              publicKey, // owner
              mintAddress // mint
            );

            const transaction = new Transaction().add(createAtaIx);
            transaction.feePayer = publicKey;
            transaction.recentBlockhash = (
              await connection.getLatestBlockhash()
            ).blockhash;

            const signed = await signTransaction(transaction);
            const ataSignature = await connection.sendRawTransaction(
              signed.serialize()
            );

            // Wait for confirmation
            await connection.confirmTransaction(ataSignature, "confirmed");

            toast.success(`${params.token} account created successfully!`);
          }

            const res = await velum.depositSPL({
              base_units: amountNumber,
              mintAddress: mintAddress.toBase58(),
              recipientUtxoPublicKey: params.recipientUtxoPubkey,
              recipientEncryptionKey: params.recipientEncryptionKey
                ? Buffer.from(params.recipientEncryptionKey, "base64")
                : undefined,
            });
            txSignature = res.tx;
          }

          // Proof generation and transaction complete
          proofProgress.completeProgress();
        } catch (proofErr) {
          // Handle proof generation errors
          const errorMessage =
            proofErr instanceof ZKProofError
              ? "Failed to generate privacy proof. Please try again."
              : proofErr instanceof Error
                ? proofErr.message
                : "Proof generation failed";
          proofProgress.setError(errorMessage);
          throw proofErr;
        }

        // Record transaction in history
        const decimals = params.token === "SOL" ? 9 : 6;
        const humanAmount = (amountNumber / Math.pow(10, decimals)).toString();

        addTransaction({
          type: "deposit",
          token: params.token as TransactionToken,
          amount: humanAmount,
          amountRaw: params.amount.toString(),
          timestamp: Date.now(),
          signature: txSignature,
          status: "confirmed",
          paylinkId: params.paylinkId,
          walletAddress: publicKey.toBase58(),
        }).catch((err) => console.warn("Failed to record transaction:", err));

        return {
          signature: txSignature,
          success: true,
        };
      } catch (err) {
        console.error("Deposit error:", err);

        // Map SDK errors to user-friendly messages
        let userMessage: string;

        if (err instanceof InsufficientBalanceError) {
          userMessage = "Insufficient funds for this deposit.";
        } else if (err instanceof DepositLimitError) {
          userMessage = "Deposit limit exceeded. Try a smaller amount.";
        } else if (err instanceof ZKProofError) {
          userMessage = "Failed to generate privacy proof. Please try again.";
        } else if (err instanceof NetworkError) {
          userMessage =
            "Network error. Please check your connection and try again.";
        } else if (err instanceof TransactionTimeoutError) {
          userMessage =
            "Transaction timed out. Please check your wallet for status.";
        } else if (err instanceof RelayerError) {
          userMessage = parseRelayerError(err.message);
        } else if (err instanceof Error && err.message.includes("token account")) {
          // Handle our custom ATA error message
          userMessage = err.message;
        } else {
          userMessage = "Deposit failed. Please try again.";
        }

        toast.error(userMessage);
        setError(new Error(userMessage));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey, velum, isReady, connection, signTransaction, proofProgress],
  );

  return {
    deposit,
    isLoading,
    isLoadingCircuits,
    circuitProgress,
    proofProgressState: proofProgress.state,
    resetProofProgress: proofProgress.reset,
    error,
  };
}
