'use client';

import dynamic from 'next/dynamic';

// Use the standard wallet multi-button - it handles everything correctly
const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export function ClientWalletButton() {
  return (
    <WalletMultiButtonDynamic 
      style={{
        backgroundColor: '#27272a',
        border: '1px solid #3f3f46',
        borderRadius: '0',
        fontSize: '12px',
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        height: '40px',
      }}
    />
  );
}
