import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-black border-b border-lime-500">
      <div className="text-xl font-bold tracking-widest uppercase font-mono">
        <span className="text-white">HARD HAT</span>
        <span className="text-lime-500">TECHBONES</span>
      </div>
      <WalletMultiButton className="!bg-lime-500 hover:!bg-lime-600 !text-black font-mono uppercase" />
    </header>
  );
};
