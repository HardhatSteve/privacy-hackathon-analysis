import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useArcium } from '../hooks/useArciumClient';

const WalletConnection: React.FC = () => {
  const { publicKey } = useWallet();
  const { isInitialized, error } = useArcium();

  return (
    <div className="wallet-connection" style={{ 
      marginBottom: '30px', 
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap'
    }}>
      <WalletMultiButton />
      {publicKey && (
        <div style={{ color: 'white', fontSize: '0.9rem' }}>
          {isInitialized ? (
            <span style={{ color: '#4ade80' }}>✓ Arcium Ready</span>
          ) : error ? (
            <span style={{ color: '#f87171' }}>✗ Arcium Error: {error}</span>
          ) : (
            <span style={{ color: '#fbbf24' }}>⏳ Initializing Arcium...</span>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
