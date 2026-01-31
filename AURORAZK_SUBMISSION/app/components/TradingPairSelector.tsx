'use client';

import { useState, useEffect, useRef } from 'react';
import { TRADING_PAIRS } from '@/lib/constants';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradingPairSelectorProps {
  selectedPairId: string;
  onSelect: (pairId: string) => void;
  pythPrice?: number | null; // Live price from Pyth oracle
}

// Fetch 24h price change from CoinGecko
async function fetch24hChange(): Promise<number> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true',
      { cache: 'no-store' }
    );
    const data = await res.json();
    return data?.solana?.usd_24h_change || 0;
  } catch {
    return 0;
  }
}

export function TradingPairSelector({ selectedPairId, onSelect, pythPrice }: TradingPairSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [isLoading24h, setIsLoading24h] = useState(true);
  const priceRef = useRef<number | null>(null);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  
  const selectedPair = TRADING_PAIRS.find(p => p.id === selectedPairId) || TRADING_PAIRS[0];
  
  // Fetch 24h change on mount and every 60 seconds
  useEffect(() => {
    const fetchChange = async () => {
      setIsLoading24h(true);
      const change = await fetch24hChange();
      setPriceChange24h(change);
      setIsLoading24h(false);
    };
    
    fetchChange();
    const interval = setInterval(fetchChange, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Flash effect when price changes
  useEffect(() => {
    if (pythPrice && priceRef.current && pythPrice !== priceRef.current) {
      setPriceFlash(pythPrice > priceRef.current ? 'up' : 'down');
      const timeout = setTimeout(() => setPriceFlash(null), 300);
      return () => clearTimeout(timeout);
    }
    if (pythPrice) {
      priceRef.current = pythPrice;
    }
  }, [pythPrice]);
  
  const displayPrice = pythPrice || 0;
  const isPositive = priceChange24h >= 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group flex items-center gap-4 px-5 py-3.5",
          "bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/80",
          "border border-zinc-800/50 hover:border-zinc-700/80",
          "rounded-lg transition-all duration-300",
          "hover:shadow-lg hover:shadow-purple-500/5"
        )}
      >
        {/* Solana Logo */}
        <div className="relative">
          {/* Glowing effect on hover */}
          <div className="absolute -inset-2 bg-gradient-to-r from-[#9945FF]/20 via-[#14F195]/20 to-[#9945FF]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Main icon container */}
          <div className="relative w-11 h-11 flex items-center justify-center">
            {/* Official Solana logo style */}
            <svg viewBox="0 0 397.7 311.7" className="w-9 h-7" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="solGradA" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#9945FF" />
                  <stop offset="100%" stopColor="#14F195" />
                </linearGradient>
                <linearGradient id="solGradB" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#19FB9B" />
                  <stop offset="100%" stopColor="#8752F3" />
                </linearGradient>
                <linearGradient id="solGradC" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#DC1FFF" />
                  <stop offset="100%" stopColor="#8752F3" />
                </linearGradient>
              </defs>
              {/* Top bar */}
              <path fill="url(#solGradA)" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
              {/* Middle bar */}
              <path fill="url(#solGradB)" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
              {/* Bottom bar */}
              <path fill="url(#solGradC)" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"/>
            </svg>
          </div>
          
          {/* Live indicator pulse */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900">
            <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
          </div>
        </div>
        
        {/* Pair Info */}
        <div className="text-left flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white tracking-tight">{selectedPair.id}</span>
            <ChevronDown className={cn(
              "w-4 h-4 text-zinc-500 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </div>
          
          <div className="flex items-center gap-3 mt-0.5">
            {/* Price with flash effect */}
            <span className={cn(
              "text-lg font-mono font-semibold transition-colors duration-300",
              priceFlash === 'up' && "text-emerald-400",
              priceFlash === 'down' && "text-rose-400",
              !priceFlash && "text-white"
            )}>
              ${displayPrice > 0 ? displayPrice.toFixed(2) : '---'}
            </span>
            
            {displayPrice > 0 && (
              /* 24h Change */
              <span className={cn(
                "flex items-center gap-1 text-sm font-mono font-medium px-2 py-0.5 rounded-md",
                isPositive 
                  ? "text-emerald-400 bg-emerald-500/10" 
                  : "text-rose-400 bg-rose-500/10"
              )}>
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {isLoading24h ? (
                  <span className="animate-pulse">--</span>
                ) : (
                  `${isPositive ? '+' : ''}${priceChange24h.toFixed(2)}%`
                )}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Dropdown - future multi-pair support */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/50 rounded-lg z-20 overflow-hidden shadow-xl shadow-black/20 animate-fade-in">
          {TRADING_PAIRS.map((pair) => (
            <button
              key={pair.id}
              onClick={() => {
                onSelect(pair.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors",
                pair.id === selectedPairId && "bg-purple-500/10 border-l-2 border-purple-500"
              )}
            >
              {/* Mini Solana logo */}
              <div className="w-7 h-7 flex items-center justify-center">
                <svg viewBox="0 0 397.7 311.7" className="w-5 h-4" xmlns="http://www.w3.org/2000/svg">
                  <path fill="url(#solGradA)" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
                  <path fill="url(#solGradB)" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
                  <path fill="url(#solGradC)" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"/>
                </svg>
              </div>
              
              <span className="text-sm text-white font-semibold tracking-tight">{pair.id}</span>
              
              {pair.id === selectedPairId && (
                <span className="ml-auto text-xs text-purple-400 font-medium uppercase tracking-wider flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  Active
                </span>
              )}
            </button>
          ))}
          
          {/* Coming Soon */}
          <div className="px-4 py-3 border-t border-zinc-800/50 bg-zinc-900/50">
            <p className="text-xs text-zinc-500">More trading pairs coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
}
