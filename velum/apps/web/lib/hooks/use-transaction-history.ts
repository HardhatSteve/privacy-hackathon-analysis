"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  TransactionRecord,
  TransactionType,
  TransactionToken,
  TransactionStatus,
  addTransaction,
  getTransactions,
  clearTransactions,
  updateTransactionStatus,
} from "../transaction-history";

export interface TransactionFilters {
  type?: TransactionType;
  token?: TransactionToken;
}

export interface UseTransactionHistoryReturn {
  transactions: TransactionRecord[];
  isLoading: boolean;
  error: Error | null;
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  addTransaction: (
    transaction: Omit<TransactionRecord, "id" | "walletAddress">
  ) => Promise<TransactionRecord | null>;
  updateStatus: (id: string, status: TransactionStatus) => Promise<void>;
  clearHistory: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTransactionHistory(): UseTransactionHistoryReturn {
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({});

  const walletAddress = publicKey?.toBase58() ?? null;

  // Load transactions when wallet or filters change
  const loadTransactions = useCallback(async () => {
    if (!walletAddress) {
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const records = await getTransactions(walletAddress, filters);
      setTransactions(records);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setError(err instanceof Error ? err : new Error("Failed to load history"));
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, filters]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Add a new transaction
  const add = useCallback(
    async (
      transaction: Omit<TransactionRecord, "id" | "walletAddress">
    ): Promise<TransactionRecord | null> => {
      if (!walletAddress) {
        console.warn("Cannot add transaction: wallet not connected");
        return null;
      }

      try {
        const record = await addTransaction({
          ...transaction,
          walletAddress,
        });

        // Optimistically add to local state
        setTransactions((prev) => {
          const updated = [record, ...prev];
          // Keep sorted and limited
          return updated.slice(0, 100);
        });

        return record;
      } catch (err) {
        console.error("Failed to add transaction:", err);
        return null;
      }
    },
    [walletAddress]
  );

  // Update transaction status
  const updateStatus = useCallback(
    async (id: string, status: TransactionStatus): Promise<void> => {
      try {
        await updateTransactionStatus(id, status);

        // Update local state
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status } : t))
        );
      } catch (err) {
        console.error("Failed to update transaction status:", err);
      }
    },
    []
  );

  // Clear all history for current wallet
  const clearHistory = useCallback(async (): Promise<void> => {
    if (!walletAddress) return;

    try {
      await clearTransactions(walletAddress);
      setTransactions([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to clear history")
      );
    }
  }, [walletAddress]);

  return {
    transactions,
    isLoading,
    error,
    filters,
    setFilters,
    addTransaction: add,
    updateStatus,
    clearHistory,
    refresh: loadTransactions,
  };
}
