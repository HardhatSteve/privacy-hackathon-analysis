"use client";

import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { DEFAULT_RPC } from '../config/rpc';

// Import wallet adapters
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  TrustWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import '@solana/wallet-adapter-react-ui/styles.css';

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    // Auto-detect network from wallet connection or use environment variable
    const endpoint = useMemo(() => {
        // If environment variable is set, use it
        if (process.env.NEXT_PUBLIC_RPC_URL) {
            return process.env.NEXT_PUBLIC_RPC_URL;
        }
        
        // Default to mainnet for now, but we can enhance this to auto-detect
        return DEFAULT_RPC.MAINNET;
    }, []);

    const wallets = useMemo(() => [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new CoinbaseWalletAdapter(),
        new TrustWalletAdapter(),
        new LedgerWalletAdapter(),
    ], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
