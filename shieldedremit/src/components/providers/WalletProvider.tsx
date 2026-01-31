"use client";

import { useMemo, useCallback, useEffect, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletError } from "@solana/wallet-adapter-base";
import { useWalletStore } from "@/stores/walletStore";
import { toast } from "@/hooks/useToast";

// Import wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletProviderProps {
  children: ReactNode;
}

// Inner component that syncs wallet state
function WalletStateSync({ children }: { children: ReactNode }) {
  const { publicKey, connected, connecting } = useWallet();
  const { setConnected, setConnecting, setPublicKey, reset } = useWalletStore();

  useEffect(() => {
    setConnected(connected);
    setConnecting(connecting);
    setPublicKey(publicKey?.toString() || null);

    if (!connected) {
      reset();
    }
  }, [connected, connecting, publicKey, setConnected, setConnecting, setPublicKey, reset]);

  return <>{children}</>;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { selectedNetwork } = useWalletStore();

  // Get RPC endpoint based on network
  const endpoint = useMemo(() => {
    if (typeof window !== "undefined") {
      const heliusKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
      if (heliusKey) {
        return selectedNetwork === "mainnet-beta"
          ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
          : `https://devnet.helius-rpc.com/?api-key=${heliusKey}`;
      }
    }
    // Fallback to public RPC
    return selectedNetwork === "mainnet-beta"
      ? "https://api.mainnet-beta.solana.com"
      : "https://api.devnet.solana.com";
  }, [selectedNetwork]);

  // Configure wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  // Handle wallet errors
  const onError = useCallback((error: WalletError) => {
    console.error("Wallet error:", error);
    toast({
      title: "Wallet Error",
      description: error.message || "An error occurred with your wallet",
      variant: "destructive",
    });
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>
          <WalletStateSync>{children}</WalletStateSync>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
