'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ImbalanceMetric, getImbalanceLabel, getImbalanceColor } from '@/lib/market-metrics';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ImbalanceGaugeProps {
  imbalance: ImbalanceMetric;
  className?: string;
  compact?: boolean;
}

export function ImbalanceGauge({ imbalance, className, compact = false }: ImbalanceGaugeProps) {
  const { ratio, pressure, buyCount, sellCount, confidence } = imbalance;
  
  // Calculate buy and sell percentages
  const buyPercent = ratio;
  const sellPercent = 100 - ratio;
  
  // Get icon based on pressure
  const PressureIcon = useMemo(() => {
    if (pressure.includes('buying')) return TrendingUp;
    if (pressure.includes('selling')) return TrendingDown;
    return Minus;
  }, [pressure]);

  // Compact mode
  if (compact) {
    return (
      <div className={cn("bg-zinc-900 p-3", className)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Buy/Sell</span>
          <span className="text-xs font-mono text-zinc-100">
            {ratio}/{100 - ratio}
          </span>
        </div>
        
        {/* Mini gauge bar */}
        <div className="relative h-1.5 bg-zinc-800 overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${buyPercent}%` }}
          />
          <div 
            className="absolute right-0 top-0 h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${sellPercent}%` }}
          />
        </div>
        
        <div className="flex justify-between mt-2 text-[10px] text-zinc-500 font-mono">
          <span>{buyCount} buys</span>
          <span>{sellCount} sells</span>
        </div>
      </div>
    );
  }
  
  // Full mode
  return (
    <div className={cn("bg-zinc-900 p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Buy / Sell Pressure</span>
        <span className="text-lg font-mono text-zinc-100">
          <span className="text-emerald-400">{ratio}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-rose-400">{100 - ratio}</span>
        </span>
      </div>
      
      {/* Main gauge bar */}
      <div className="relative h-3 bg-zinc-800 mb-3">
        {/* Buy side (green) */}
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-500"
          style={{ width: `${buyPercent}%` }}
        />
        {/* Sell side (red) */}
        <div 
          className="absolute right-0 top-0 h-full bg-gradient-to-l from-rose-600 to-rose-500 transition-all duration-500"
          style={{ width: `${sellPercent}%` }}
        />
        {/* Center marker */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-zinc-600 -translate-x-1/2" />
      </div>
      
      {/* Labels and counts */}
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500" />
          <span className="text-zinc-400 font-mono">{buyCount} buys</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-mono">{sellCount} sells</span>
          <div className="w-2 h-2 bg-rose-500" />
        </div>
      </div>
    </div>
  );
}
