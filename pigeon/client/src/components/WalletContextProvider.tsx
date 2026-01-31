import { type FC, type ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = import.meta.env.VITE_RPC_URL || "https://api.devnet.solana.com";
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  // Connection config with consistent commitment
  const config = useMemo(() => ({
    commitment: 'confirmed' as const,
    confirmTransactionInitialTimeout: 60000,
  }), []);

  return (
    <ConnectionProvider endpoint={endpoint} config={config}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
