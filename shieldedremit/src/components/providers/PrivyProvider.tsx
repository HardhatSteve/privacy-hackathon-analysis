"use client";

import { ReactNode, useCallback, useEffect, useMemo } from "react";
import { PrivyProvider as PrivyAuthProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { useWalletStore } from "@/stores/walletStore";
import { toast } from "@/hooks/useToast";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

interface PrivyWalletProviderProps {
  children: ReactNode;
}

// Inner component to sync wallet state with our store
function WalletStateSync({ children }: { children: ReactNode }) {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { setConnected, setConnecting, setPublicKey, reset, setPrivyUser } = useWalletStore();

  // Get the first connected wallet
  const activeWallet = useMemo(() => {
    if (!wallets || wallets.length === 0) return null;
    return wallets[0];
  }, [wallets]);

  useEffect(() => {
    if (!ready) {
      setConnecting(true);
      return;
    }

    setConnecting(false);

    if (authenticated && activeWallet) {
      setConnected(true);
      setPublicKey(activeWallet.address);

      if (user) {
        setPrivyUser({
          id: user.id,
          wallet: activeWallet.address ? {
            address: activeWallet.address,
            chainType: "solana",
          } : undefined,
          email: user.email?.address,
          phone: user.phone?.number,
          createdAt: Date.now(),
          linkedAccounts: user.linkedAccounts?.map((acc) => ({
            type: acc.type as "wallet" | "email" | "phone" | "google" | "twitter" | "discord",
            address: "address" in acc ? (acc as { address: string }).address : undefined,
            verified: true,
          })) || [],
        });
      }
    } else {
      setConnected(false);
      setPublicKey(null);
      reset();
    }
  }, [ready, authenticated, activeWallet, user, setConnected, setConnecting, setPublicKey, reset, setPrivyUser]);

  return <>{children}</>;
}

export function PrivyWalletProvider({ children }: PrivyWalletProviderProps) {
  if (!PRIVY_APP_ID) {
    console.warn("Privy App ID not configured. Wallet features may not work.");
    return <>{children}</>;
  }

  return (
    <PrivyAuthProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#6366f1",
          showWalletLoginFirst: true,
        },
        loginMethods: ["wallet", "email", "sms", "google", "twitter"],
      }}
    >
      <WalletStateSync>{children}</WalletStateSync>
    </PrivyAuthProvider>
  );
}

// Hook to use Privy wallet operations
export function usePrivyWallet() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  const activeWallet = useMemo(() => {
    if (!wallets || wallets.length === 0) return null;
    return wallets[0];
  }, [wallets]);

  const connect = useCallback(async () => {
    try {
      await login();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  }, [login]);

  const disconnect = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  }, [logout]);

  const signMessage = useCallback(
    async (message: string): Promise<Uint8Array | null> => {
      if (!activeWallet) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet first.",
          variant: "destructive",
        });
        return null;
      }

      try {
        // Privy wallet sign method uses string input/output
        if ('sign' in activeWallet && typeof activeWallet.sign === 'function') {
          const signatureString = await activeWallet.sign(message);
          // Convert base64/hex string signature to Uint8Array
          try {
            // Try base64 decoding first
            const binaryString = atob(signatureString);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
          } catch {
            // If not base64, try hex decoding
            const hexMatch = signatureString.match(/.{1,2}/g);
            if (hexMatch) {
              return new Uint8Array(hexMatch.map(byte => parseInt(byte, 16)));
            }
            // Return as UTF-8 bytes as fallback
            return new TextEncoder().encode(signatureString);
          }
        }
        return null;
      } catch (error) {
        console.error("Failed to sign message:", error);
        toast({
          title: "Signing Failed",
          description: "Failed to sign message. Please try again.",
          variant: "destructive",
        });
        return null;
      }
    },
    [activeWallet]
  );

  return {
    ready,
    authenticated,
    user,
    wallet: activeWallet,
    wallets,
    publicKey: activeWallet?.address || null,
    connect,
    disconnect,
    signMessage,
  };
}
