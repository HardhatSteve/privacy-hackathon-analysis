'use client';

import { useMemo, type ReactNode } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { VelumProvider } from '../lib/hooks/use-velum';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  'https://api.mainnet-beta.solana.com';

export function Providers({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <VelumProvider>{children}</VelumProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
