import type { FC } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import "@solana/wallet-adapter-react-ui/styles.css";

const Navbar: FC = () => {
  const { connected, publicKey } = useWallet();

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-[#1A1A1A] border-b border-gray-700">
      <div className="text-xl font-bold text-white">Richee Rich</div>
      <div className="flex items-center gap-4">
        {connected && publicKey && (
          <div className="text-sm text-gray-400">
            {publicKey.toString().slice(0, 8)}...
          </div>
        )}
        <WalletMultiButton />
      </div>
    </nav>
  );
};

export default Navbar;
