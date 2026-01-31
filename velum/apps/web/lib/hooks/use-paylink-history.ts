"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  PaylinkRecord,
  addPaylink as addPaylinkToDb,
  getPaylinks,
  clearPaylinks,
} from "../paylink-history";

export interface PaylinkStatus {
  viewCount: number;
  transactionCount: number;
  expired: boolean;
}

export interface PaylinkWithStatus extends PaylinkRecord {
  status?: PaylinkStatus;
  statusLoading?: boolean;
}

export interface UsePaylinkHistoryReturn {
  paylinks: PaylinkWithStatus[];
  isLoading: boolean;
  error: Error | null;
  addPaylink: (paylink: Omit<PaylinkRecord, "walletAddress">) => Promise<void>;
  clearHistory: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Batch fetch status for multiple paylinks in a single API call
 * Avoids N+1 query pattern
 */
async function fetchPaylinkStatusesBatch(
  ids: string[]
): Promise<Record<string, PaylinkStatus>> {
  if (ids.length === 0) return {};

  const response = await fetch("/api/paylinks/batch-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch paylink statuses");
  }

  const data = await response.json();
  return data.statuses || {};
}

export function usePaylinkHistory(): UsePaylinkHistoryReturn {
  const { publicKey } = useWallet();
  const [paylinks, setPaylinks] = useState<PaylinkWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const walletAddress = publicKey?.toBase58() ?? null;

  const fetchStatuses = useCallback(async (records: PaylinkRecord[]) => {
    if (records.length === 0) return;

    setPaylinks(records.map((r) => ({ ...r, statusLoading: true })));

    try {
      const ids = records.map((r) => r.id);
      const statuses = await fetchPaylinkStatusesBatch(ids);

      setPaylinks(
        records.map((r) => ({
          ...r,
          status: statuses[r.id],
          statusLoading: false,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch paylink statuses:", error);
      setPaylinks(records.map((r) => ({ ...r, statusLoading: false })));
    }
  }, []);

  const loadPaylinks = useCallback(async () => {
    if (!walletAddress) {
      setPaylinks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const records = await getPaylinks(walletAddress);
      setPaylinks(records);
      setIsLoading(false);
      await fetchStatuses(records);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load paylinks"));
      setPaylinks([]);
      setIsLoading(false);
    }
  }, [walletAddress, fetchStatuses]);

  useEffect(() => {
    loadPaylinks();
  }, [loadPaylinks]);

  const addPaylink = useCallback(
    async (paylink: Omit<PaylinkRecord, "walletAddress">): Promise<void> => {
      if (!walletAddress) return;

      const record: PaylinkRecord = { ...paylink, walletAddress };
      await addPaylinkToDb(record);
      setPaylinks((prev) => [record, ...prev]);
    },
    [walletAddress]
  );

  const clearHistory = useCallback(async (): Promise<void> => {
    if (!walletAddress) return;

    await clearPaylinks(walletAddress);
    setPaylinks([]);
  }, [walletAddress]);

  return {
    paylinks,
    isLoading,
    error,
    addPaylink,
    clearHistory,
    refresh: loadPaylinks,
  };
}
