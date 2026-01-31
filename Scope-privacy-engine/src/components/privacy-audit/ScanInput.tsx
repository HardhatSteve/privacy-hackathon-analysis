'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface ScanInputProps {
  onScan: (address: string) => void;
  isLoading: boolean;
}

export function ScanInput({ onScan, isLoading }: ScanInputProps) {
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim() && !isLoading) {
      onScan(address.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      {/* Input Group */}
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        
        {/* Input Field */}
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Solana wallet address..."
          disabled={isLoading}
          className="w-full pl-14 pr-40 py-5 
                     bg-gray-100 rounded-2xl
                     text-base font-medium text-gray-900
                     placeholder:text-gray-400
                     border-2 border-transparent
                     focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100
                     disabled:opacity-60 disabled:cursor-not-allowed
                     transition-all duration-200"
        />
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !address.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2
                     px-6 py-3 
                     bg-black text-white font-semibold text-sm
                     rounded-xl
                     hover:bg-gray-800 hover:scale-[1.02]
                     active:scale-[0.98]
                     disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100
                     transition-all duration-200
                     flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <span>Scan Wallet</span>
          )}
        </button>
      </div>

      {/* Helper Text */}
      <p className="text-center text-sm text-gray-400 mt-4">
        Paste any Solana wallet address to analyze its privacy score
      </p>
    </form>
  );
}
