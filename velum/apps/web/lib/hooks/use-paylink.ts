"use client";

import { useState, useCallback } from "react";

export type TokenType = "ANY" | "SOL" | "USDC" | "USDT";

export interface Paylink {
  id: string;
  recipientUtxoPubkey: string;
  recipientEncryptionKey: string;
  token: TokenType;
  amountLamports: bigint | null;
  memo: string | null;
  createdAt: string;
  expiresAt: string | null;
  viewCount: number;
  expired?: boolean;
}

export interface CreatePaylinkParams {
  recipientUtxoPubkey: string;
  recipientEncryptionKey: string;
  token?: TokenType;
  amountLamports?: bigint;
  memo?: string;
  expiresAt?: Date;
}

export function usePaylink() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPaylink = useCallback(
    async (
      params: CreatePaylinkParams,
    ): Promise<{ id: string; url: string } | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/paylinks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...params,
            amountLamports: params.amountLamports?.toString(),
            expiresAt: params.expiresAt?.toISOString(),
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to create paylink");
        }

        const data = await response.json();
        return {
          id: data.id,
          url: `${window.location.origin}/pay/${data.id}`,
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchPaylink = useCallback(
    async (id: string): Promise<Paylink | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/paylinks/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Paylink not found");
          }
          throw new Error("Failed to fetch paylink");
        }

        const data = await response.json();
        return {
          ...data,
          amountLamports: data.amountLamports
            ? BigInt(data.amountLamports)
            : null,
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    createPaylink,
    fetchPaylink,
    isLoading,
    error,
  };
}
