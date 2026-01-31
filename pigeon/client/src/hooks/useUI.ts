import { useEffect, useState, useCallback } from "react";
import type { Connection } from "@solana/web3.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

// Hook for fetching and auto-refreshing wallet SOL balance.
export function useBalance(
    wallet: WalletContextState,
    connection: Connection,
    refreshInterval = 10000
) {
    const [balance, setBalance] = useState<number | null>(null);

    useEffect(() => {
        if (!wallet.publicKey) {
            setBalance(null);
            return;
        }

        const fetchBalance = async () => {
            try {
                const bal = await connection.getBalance(wallet.publicKey!);
                setBalance(bal / LAMPORTS_PER_SOL);
            } catch {
                setBalance(null);
            }
        };

        fetchBalance();
        const interval = setInterval(fetchBalance, refreshInterval);
        return () => clearInterval(interval);
    }, [wallet.publicKey, connection, refreshInterval]);

    return balance;
}

interface SidebarResizeState {
    width: number;
    isResizing: boolean;
    startResizing: (e: React.MouseEvent) => void;
}

// Hook for managing resizable sidebar state.
export function useSidebarResize(
    initialWidth = 280,
    minWidth = 160,
    maxWidth = 520
): SidebarResizeState {
    const [width, setWidth] = useState(initialWidth);
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsResizing(true);

            const startX = e.clientX;
            const startWidth = width;

            const onMove = (ev: MouseEvent) => {
                const delta = ev.clientX - startX;
                setWidth(Math.min(maxWidth, Math.max(minWidth, startWidth + delta)));
            };

            const onUp = () => {
                setIsResizing(false);
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
            };

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        },
        [width, minWidth, maxWidth]
    );

    return { width, isResizing, startResizing };
}

// Hook for auto-clearing error messages after a timeout.
export function useAutoError(timeout = 5000) {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => setError(null), timeout);
        return () => clearTimeout(timer);
    }, [error, timeout]);

    return [error, setError] as const;
}
