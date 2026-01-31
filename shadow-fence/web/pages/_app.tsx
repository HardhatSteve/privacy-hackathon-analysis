import React from 'react';
import type { AppProps } from 'next/app';
import { SolanaWalletProvider } from '../components/WalletProvider';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SolanaWalletProvider>
      <Component {...pageProps} />
    </SolanaWalletProvider>
  );
}
