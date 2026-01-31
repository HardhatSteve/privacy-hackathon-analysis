"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";
import { useVelum } from "./use-velum";
import { SUPPORTED_TOKENS } from "../config/tokens";
import {
  InsufficientBalanceError,
  ZKProofError,
  NetworkError,
  TransactionTimeoutError,
  RelayerError,
} from "@velumdotcash/sdk";
import { parseRelayerError } from "@/lib/utils/parse-relayer-error";
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
  type TransactionToken,
} from "../transaction-history";

export type WithdrawToken = "SOL" | "USDC" | "USDT";

export interface WithdrawParams {
  amount: bigint;
  token: WithdrawToken;
  destinationAddress: string;
}

export interface WithdrawResult {
  signature: string;
  success: boolean;
}

export type CircuitLoadProgressCallback = (progress: CircuitLoadProgress) => void;

export function useWithdraw() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { velum, isInitialized } = useVelum();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCircuits, setIsLoadingCircuits] = useState(false);
  const [circuitProgress, setCircuitProgress] =
    useState<CircuitLoadProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const proofProgress = useProofProgress();

  const validateAddress = useCallback((address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }, []);

  const withdraw = useCallback(
    async (
      params: WithdrawParams,
      onCircuitProgress?: CircuitLoadProgressCallback
    ): Promise<WithdrawResult | null> => {
      if (!publicKey || !signTransaction || !velum || !isInitialized) {
        setError(new Error("Wallet not connected or SDK not ready"));
        return null;
      }

      if (!validateAddress(params.destinationAddress)) {
        setError(new Error("Invalid destination address"));
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
        const amountNumber = Number(params.amount);

        // Start proof progress tracking
        proofProgress.startProgress();

        try {
          if (params.token === "SOL") {
            const res = await velum.withdraw({
              lamports: amountNumber,
              recipientAddress: params.destinationAddress,
            });
            txSignature = res.tx;
          } else if (params.token === "USDC") {
            const res = await velum.withdrawUSDC({
              base_units: amountNumber,
              recipientAddress: params.destinationAddress,
            });
            txSignature = res.tx;
          } else if (params.token === "USDT") {
            const usdtToken = SUPPORTED_TOKENS.find((t) => t.symbol === "USDT");
            if (!usdtToken) {
              throw new Error("USDT token configuration not found");
            }
            const res = await velum.withdrawSPL({
              base_units: amountNumber,
              mintAddress: usdtToken.mintAddress,
              recipientAddress: params.destinationAddress,
            });
            txSignature = res.tx;
          } else {
            throw new Error("Unsupported token");
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
          type: "withdraw",
          token: params.token as TransactionToken,
          amount: humanAmount,
          amountRaw: params.amount.toString(),
          timestamp: Date.now(),
          signature: txSignature,
          status: "confirmed",
          walletAddress: publicKey.toBase58(),
        }).catch((err) => console.warn("Failed to record transaction:", err));

        return {
          signature: txSignature,
          success: true,
        };
      } catch (err) {
        console.error("Withdraw error:", err);

        // Map SDK errors to user-friendly messages
        let userMessage: string;

        if (err instanceof InsufficientBalanceError) {
          userMessage = "Insufficient private balance for this withdrawal.";
        } else if (err instanceof ZKProofError) {
          userMessage = "Failed to generate privacy proof. Please try again.";
        } else if (err instanceof NetworkError) {
          userMessage =
            "Network error. Please check your connection and try again.";
        } else if (err instanceof TransactionTimeoutError) {
          userMessage =
            "Transaction confirmation timed out. Check your wallet for status.";
        } else if (err instanceof RelayerError) {
          userMessage = parseRelayerError(err.message);
        } else {
          userMessage = "Withdrawal failed. Please try again.";
        }

        toast.error(userMessage);
        setError(new Error(userMessage));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey, signTransaction, velum, isInitialized, validateAddress, proofProgress],
  );

  return {
    withdraw,
    validateAddress,
    isLoading,
    isLoadingCircuits,
    circuitProgress,
    proofProgressState: proofProgress.state,
    resetProofProgress: proofProgress.reset,
    error,
  };
}
