"use client";

import { useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

interface BalanceData {
  token: string;
  balanceLamports: string;
  utxoCount: number;
}

interface SyncedBalance {
  token: string;
  balanceLamports: string;
  utxoCount: number;
  lastSyncedAt: string;
}

/**
 * Hook for syncing balance state with the backend.
 * This ensures balance visibility persists across browser clears and deployments.
 */
export function useBalanceSync() {
  const { publicKey, signMessage } = useWallet();
  const lastSyncRef = useRef<number>(0);

  /**
   * Create a signed authentication payload
   */
  const createAuthPayload = useCallback(async () => {
    if (!publicKey || !signMessage) {
      throw new Error("Wallet not connected");
    }

    const nonce = crypto.randomUUID();
    const timestamp = Date.now();
    const message = `Velum Balance Sync

Wallet: ${publicKey.toBase58()}
Nonce: ${nonce}
Timestamp: ${timestamp}`;

    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = await signMessage(messageBytes);
    const signature = bs58.encode(signatureBytes);

    return {
      walletAddress: publicKey.toBase58(),
      signature,
      message,
      nonce,
      timestamp,
    };
  }, [publicKey, signMessage]);

  /**
   * Fetch balance from backend (requires wallet signature)
   */
  const fetchSyncedBalance = useCallback(
    async (utxoPubkey: string): Promise<SyncedBalance[]> => {
      if (!publicKey || !signMessage) {
        return [];
      }

      try {
        // Create signed auth for GET request
        const timestamp = Date.now();
        const message = `Velum Balance Fetch

Wallet: ${publicKey.toBase58()}
Timestamp: ${timestamp}`;

        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = await signMessage(messageBytes);
        const signature = bs58.encode(signatureBytes);

        const params = new URLSearchParams({
          walletAddress: publicKey.toBase58(),
          utxoPubkey,
          signature,
          message,
          timestamp: timestamp.toString(),
        });

        const response = await fetch(`/api/internal/balance?${params}`);

        if (!response.ok) {
          console.warn("Failed to fetch synced balance:", response.status);
          return [];
        }

        const data = await response.json();
        return data.snapshots || [];
      } catch (error) {
        console.error("Error fetching synced balance:", error);
        return [];
      }
    },
    [publicKey, signMessage]
  );

  /**
   * Sync current balance to backend
   * Debounced to avoid excessive API calls
   */
  const syncBalance = useCallback(
    async (
      utxoPubkey: string,
      balances: BalanceData[],
      lastBlockSlot: string
    ): Promise<boolean> => {
      if (!publicKey || !signMessage) {
        console.warn("Cannot sync balance: wallet not connected");
        return false;
      }

      // Debounce: only sync every 10 seconds minimum
      const now = Date.now();
      if (now - lastSyncRef.current < 10000) {
        return false;
      }

      try {
        const auth = await createAuthPayload();
        lastSyncRef.current = now;

        const response = await fetch("/api/internal/balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth,
            utxoPubkey,
            balances,
            lastBlockSlot,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          console.error("Failed to sync balance:", error);
          return false;
        }

        return true;
      } catch (error) {
        console.error("Error syncing balance:", error);
        return false;
      }
    },
    [publicKey, signMessage, createAuthPayload]
  );

  return {
    fetchSyncedBalance,
    syncBalance,
    isReady: !!publicKey && !!signMessage,
  };
}
