import { useMemo } from 'react'
import type { FC, ReactNode } from 'react'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

import '@solana/wallet-adapter-react-ui/styles.css'

interface Props {
  children: ReactNode
}

export const WalletProvider: FC<Props> = ({ children }) => {
  // Use Helius RPC for production (avoids 403 from public Solana RPC)
  const endpoint = useMemo(() => 
    import.meta.env.VITE_HELIUS_RPC_URL || 'https://api.devnet.solana.com', 
  [])
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
