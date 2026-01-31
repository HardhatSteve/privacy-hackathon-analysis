import type { FC } from "react";

const AssetSelector: FC = () => (
  <div className="bg-[#222] border border-[#333] rounded-lg px-4 py-3 flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className="w-6 h-6 bg-[#555] rounded-full"></div>
      <div>
        <p>SOL</p>
        <p className="text-xs text-gray-400">Solana</p>
      </div>
    </div>
    <span className="text-gray-400">▼</span>
  </div>
);

export default AssetSelector;
