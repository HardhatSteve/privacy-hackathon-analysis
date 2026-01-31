'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MomentumMetric, getMomentumLabel, getMomentumColor } from '@/lib/market-metrics';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';

interface MomentumIndicatorProps {
  momentum: MomentumMetric;
  className?: string;
  compact?: boolean;
}

export function MomentumIndicator({ momentum, className, compact = false }: MomentumIndicatorProps) {
  const { momentum: score, interpretation, confidence, recentBuyActivity, recentSellActivity, windowMinutes } = momentum;
  
  // Calculate marker position (score is -100 to +100, map to 0-100%)
  const markerPosition = (score + 100) / 2;
  
  // Get icon based on interpretation
  const MomentumIcon = useMemo(() => {
    if (interpretation.includes('accumulation')) return ArrowUpCircle;
    if (interpretation.includes('distribution')) return ArrowDownCircle;
    return MinusCircle;
  }, [interpretation]);

  // Compact mode
  if (compact) {
    return (
      <div className={cn("bg-zinc-900 p-3", className)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Momentum</span>
          <span className="text-xs font-mono" style={{ color: getMomentumColor(interpretation) }}>
            {score > 0 ? '+' : ''}{score}
          </span>
        </div>
        
        {/* Mini gauge - gradient bar with marker */}
        <div className="relative h-1.5 bg-zinc-800 overflow-hidden">
          <div 
            className="h-full w-full"
            style={{
              background: 'linear-gradient(to right, #ef4444 0%, #71717a 50%, #22c55e 100%)'
            }}
          />
          {/* Center line */}
          <div className="absolute left-1/2 top-0 h-full w-px bg-zinc-500 -translate-x-1/2" />
          {/* Position marker */}
          <div 
            className="absolute top-0 h-full w-0.5 bg-white transition-all duration-300"
            style={{ left: `${markerPosition}%`, transform: 'translateX(-50%)' }}
          />
        </div>
        
        <div className="flex justify-between mt-2 text-[10px] text-zinc-500 font-mono">
          <span>Dist</span>
          <span style={{ color: getMomentumColor(interpretation) }}>{getMomentumLabel(interpretation)}</span>
          <span>Acc</span>
        </div>
      </div>
    );
  }
  
  // Full mode
  return (
    <div className={cn("bg-zinc-900 p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Order Momentum</span>
        <div className="flex items-center gap-2">
          <MomentumIcon 
            className="w-4 h-4" 
            style={{ color: getMomentumColor(interpretation) }}
          />
          <span 
            className="text-lg font-mono"
            style={{ color: getMomentumColor(interpretation) }}
          >
            {score > 0 ? '+' : ''}{score}
          </span>
        </div>
      </div>
      
      {/* Main gauge */}
      <div className="relative h-3 bg-zinc-800 mb-3">
        {/* Gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, #ef4444 0%, #71717a 50%, #22c55e 100%)'
          }}
        />
        {/* Center line */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-zinc-950 -translate-x-1/2" />
        {/* Position marker */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-4 bg-white transition-all duration-500"
          style={{ left: `${markerPosition}%`, transform: `translateX(-50%) translateY(-50%)` }}
        />
      </div>
      
      {/* Scale labels */}
      <div className="flex justify-between text-[10px] mb-3">
        <span className="text-rose-400 font-mono">Distribution</span>
        <span className="text-zinc-500 font-mono">Neutral</span>
        <span className="text-emerald-400 font-mono">Accumulation</span>
      </div>
      
      {/* Status */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
        <span 
          className="text-xs uppercase tracking-wider"
          style={{ color: getMomentumColor(interpretation) }}
        >
          {getMomentumLabel(interpretation)}
        </span>
        <span className={cn(
          "text-[9px] px-1.5 py-0.5 uppercase tracking-wider border",
          confidence === 'high' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          confidence === 'medium' && "bg-amber-500/10 text-amber-400 border-amber-500/30",
          confidence === 'low' && "bg-zinc-800 text-zinc-500 border-zinc-700",
        )}>
          {confidence}
        </span>
      </div>
    </div>
  );
}
