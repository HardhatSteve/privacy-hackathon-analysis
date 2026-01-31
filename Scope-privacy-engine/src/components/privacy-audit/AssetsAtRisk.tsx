'use client';

import { Target } from 'lucide-react';

interface AssetsAtRiskProps {
  exposedSol: number;
  exposedUsd: number;
  darkMode: boolean;
}

export function AssetsAtRisk({ exposedSol, exposedUsd, darkMode }: AssetsAtRiskProps) {
  // Determine severity color based on amount
  const isHighRisk = exposedSol >= 10;
  const isMediumRisk = exposedSol >= 1;
  
  const colorClass = isHighRisk 
    ? 'text-red-500' 
    : isMediumRisk 
      ? 'text-amber-500' 
      : 'text-emerald-500';
  
  const glowColor = isHighRisk 
    ? 'rgba(239, 68, 68, 0.3)' 
    : isMediumRisk 
      ? 'rgba(245, 158, 11, 0.3)' 
      : 'rgba(16, 185, 129, 0.2)';
  
  const bgClass = darkMode 
    ? 'bg-white/[0.02] border-white/[0.06]' 
    : 'bg-white border-black/[0.08]';

  // Format numbers
  const formatSol = (n: number) => {
    if (n === 0) return '0';
    if (n < 0.01) return '<0.01';
    return n.toFixed(2);
  };
  
  const formatUsd = (n: number) => {
    if (n === 0) return '$0';
    if (n < 1) return '<$1';
    return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div 
      className={`rounded-2xl border p-5 ${bgClass}`}
      style={{ boxShadow: exposedSol > 0 ? `0 0 30px ${glowColor}` : undefined }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
          <Target className={`w-4 h-4 ${colorClass}`} />
        </div>
        <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-white/50' : 'text-black/50'}`}>
          Assets at Risk
        </span>
      </div>
      
      {/* Main Amount */}
      <div className="text-center mb-3">
        <div 
          className={`text-4xl font-bold font-mono tracking-tight ${colorClass}`}
          style={{ 
            textShadow: exposedSol > 0 ? `0 0 20px ${glowColor}` : undefined,
          }}
        >
          {formatSol(exposedSol)} SOL
        </div>
        <div className={`text-lg font-mono mt-1 ${darkMode ? 'text-white/40' : 'text-black/40'}`}>
          ≈ {formatUsd(exposedUsd)} Exposed
        </div>
      </div>
      
      {/* Status indicator */}
      <div className={`text-center text-xs py-2 px-3 rounded-lg ${
        isHighRisk 
          ? (darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')
          : isMediumRisk 
            ? (darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')
            : (darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
      }`}>
        {isHighRisk 
          ? '⚠ High financial exposure via KYC exchanges' 
          : isMediumRisk 
            ? '● Moderate exposure detected'
            : '✓ Minimal exposure'}
      </div>
    </div>
  );
}
