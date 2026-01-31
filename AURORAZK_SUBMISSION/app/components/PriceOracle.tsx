'use client';

import { useEffect, useState } from 'react';
import { priceOracle, PriceData, OracleStatus } from '@/lib/price-oracle';
import { motion, AnimatePresence } from 'framer-motion';

interface PriceOracleProps {
  onPriceUpdate?: (price: number) => void;
  compact?: boolean;
}

export function PriceOracle({ onPriceUpdate, compact = false }: PriceOracleProps) {
  const [status, setStatus] = useState<OracleStatus | null>(null);
  const [solUsdcPrice, setSolUsdcPrice] = useState<PriceData | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    // Subscribe to price updates
    const unsubscribe = priceOracle.subscribe((prices) => {
      const newStatus = priceOracle.getStatus();
      setStatus(newStatus);
      
      const newPrice = priceOracle.getSolUsdcPrice();
      if (newPrice) {
        // Detect price direction
        if (previousPrice && newPrice.price !== previousPrice) {
          setPriceDirection(newPrice.price > previousPrice ? 'up' : 'down');
          // Reset direction indicator after animation
          setTimeout(() => setPriceDirection(null), 1000);
        }
        setPreviousPrice(newPrice.price);
        setSolUsdcPrice(newPrice);
        
        if (onPriceUpdate && !newPrice.isStale) {
          onPriceUpdate(newPrice.price);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [previousPrice, onPriceUpdate]);

  if (!status) {
    return (
      <div className={`bg-slate-800/50 rounded-lg border border-slate-700 p-4 ${compact ? 'p-2' : 'p-4'}`}>
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-sm">Connecting to Pyth...</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">SOL/USDC</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={solUsdcPrice?.price}
              initial={{ opacity: 0, y: priceDirection === 'up' ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`font-mono font-bold ${
                priceDirection === 'up' ? 'text-green-400' :
                priceDirection === 'down' ? 'text-red-400' :
                'text-white'
              }`}
            >
              ${solUsdcPrice?.price?.toFixed(2) || '-.--'}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className={`w-2 h-2 rounded-full ${
          status.connected && !solUsdcPrice?.isStale ? 'bg-green-500' : 
          solUsdcPrice?.isStale ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-medium text-white">Pyth Price Oracle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status.connected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-slate-400">
            {status.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Main Price */}
      <div className="text-center mb-4">
        <div className="text-xs text-slate-400 mb-1">SOL/USDC</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={solUsdcPrice?.price}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <span className={`text-3xl font-mono font-bold ${
              priceDirection === 'up' ? 'text-green-400' :
              priceDirection === 'down' ? 'text-red-400' :
              solUsdcPrice?.isStale ? 'text-yellow-400' :
              'text-white'
            }`}>
              ${solUsdcPrice?.price?.toFixed(2) || '-.--'}
            </span>
            {priceDirection && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`absolute -right-6 top-1/2 -translate-y-1/2 ${
                  priceDirection === 'up' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {priceDirection === 'up' ? '↑' : '↓'}
              </motion.span>
            )}
          </motion.div>
        </AnimatePresence>
        
        {solUsdcPrice?.confidence && (
          <div className="text-xs text-slate-500 mt-1">
            ±${solUsdcPrice.confidence.toFixed(4)} confidence
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-900/50 rounded p-2">
          <div className="text-slate-400">Source</div>
          <div className="text-white font-medium capitalize">{solUsdcPrice?.source || 'N/A'}</div>
        </div>
        <div className="bg-slate-900/50 rounded p-2">
          <div className="text-slate-400">Status</div>
          <div className={`font-medium ${solUsdcPrice?.isStale ? 'text-yellow-400' : 'text-green-400'}`}>
            {solUsdcPrice?.isStale ? 'Stale' : 'Fresh'}
          </div>
        </div>
        <div className="bg-slate-900/50 rounded p-2 col-span-2">
          <div className="text-slate-400">Last Update</div>
          <div className="text-white font-medium font-mono">
            {solUsdcPrice?.publishTime 
              ? new Date(solUsdcPrice.publishTime).toLocaleTimeString()
              : 'N/A'
            }
          </div>
        </div>
      </div>

      {/* Warning for stale prices */}
      {solUsdcPrice?.isStale && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400"
        >
          ⚠️ Price data may be stale. Market orders disabled.
        </motion.div>
      )}
    </div>
  );
}

// Inline price display for forms
export function InlinePrice({ label = 'Market Price' }: { label?: string }) {
  const [price, setPrice] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const unsubscribe = priceOracle.subscribe(() => {
      const priceData = priceOracle.getSolUsdcPrice();
      if (priceData) {
        setPrice(priceData.price);
        setIsStale(priceData.isStale);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-400">{label}:</span>
      <span className={`font-mono font-medium ${isStale ? 'text-yellow-400' : 'text-white'}`}>
        ${price?.toFixed(2) || '-.--'}
      </span>
      {isStale && <span className="text-xs text-yellow-400">(stale)</span>}
    </div>
  );
}

// Hook for using oracle price
export function useOraclePrice() {
  const [price, setPrice] = useState<PriceData | null>(null);

  useEffect(() => {
    const unsubscribe = priceOracle.subscribe(() => {
      setPrice(priceOracle.getSolUsdcPrice());
    });

    return () => unsubscribe();
  }, []);

  return price;
}
