import type { FC, PropsWithChildren } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";
import type { Cluster } from "@solana/web3.js";
import { envConfig } from "./config";

export const WalletContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const network = envConfig.walletNetwork as Cluster;

  const rpcUrl = useMemo(() => {
    try {
      return clusterApiUrl(network);
    } catch (error) {
      console.error("Invalid network:", network, error);
      return clusterApiUrl("mainnet-beta");
    }
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={rpcUrl}>
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
        onError={(error) => {
          console.error("Wallet connection error:", error?.message || error);
        }}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
