'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Lock, 
  Search, 
  Handshake, 
  ArrowRightLeft, 
  CheckCircle,
  Clock,
  Loader2,
  Zap
} from 'lucide-react';

interface OrderProgressProps {
  status: 'placed' | 'matching' | 'revealing' | 'settling' | 'filled' | 'cancelled';
  isAnimating?: boolean;
  estimatedTime?: string;
}

const stages = [
  { 
    id: 'placed', 
    label: 'Committed', 
    icon: Lock, 
    description: 'Order committed on-chain',
    time: 'Instant'
  },
  { 
    id: 'matching', 
    label: 'Finding Match', 
    icon: Search, 
    description: 'Searching for counterparty',
    time: '~5-60 sec'
  },
  { 
    id: 'revealing', 
    label: 'Revealing', 
    icon: Handshake, 
    description: 'Verifying commitments',
    time: '~2-5 sec'
  },
  { 
    id: 'settling', 
    label: 'Settling', 
    icon: ArrowRightLeft, 
    description: 'Executing trade',
    time: '~3-10 sec'
  },
  { 
    id: 'filled', 
    label: 'Complete', 
    icon: CheckCircle, 
    description: 'Trade settled privately',
    time: 'Done!'
  },
];

const statusToStageIndex: Record<string, number> = {
  'placed': 0,
  'matching': 1,
  'revealing': 2,
  'settling': 3,
  'filled': 4,
  'cancelled': -1,
};

export function OrderProgress({ status, isAnimating = false, estimatedTime }: OrderProgressProps) {
  const currentStageIndex = statusToStageIndex[status] ?? 0;
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [pulseIndex, setPulseIndex] = useState(0);

  // Animate progress bar smoothly
  useEffect(() => {
    if (isAnimating && currentStageIndex < 4) {
      const interval = setInterval(() => {
        setAnimatedProgress(prev => {
          const nextStage = ((currentStageIndex + 1) / 4) * 100;
          const currentStage = (currentStageIndex / 4) * 100;
          const target = currentStage + (nextStage - currentStage) * 0.85;
          
          if (prev >= target) return prev;
          return prev + 0.3;
        });
      }, 30);
      return () => clearInterval(interval);
    } else {
      setAnimatedProgress((currentStageIndex / 4) * 100);
    }
  }, [currentStageIndex, isAnimating]);

  // Pulse animation for active scanning effect
  useEffect(() => {
    if (isAnimating && status === 'matching') {
      const interval = setInterval(() => {
        setPulseIndex(prev => (prev + 1) % 3);
      }, 400);
      return () => clearInterval(interval);
    }
  }, [isAnimating, status]);

  if (status === 'cancelled') {
    return (
      <div className="p-4 bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-400">
          <Clock className="w-4 h-4" />
          <span className="text-sm uppercase tracking-wider">Order Cancelled</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-zinc-900 border border-zinc-800 space-y-6">
      {/* Progress Bar - Aurora Blue with glow */}
      <div className="relative h-3 bg-zinc-800 overflow-hidden">
        {/* Base progress fill */}
        <div 
          className={cn(
            "absolute inset-y-0 left-0 transition-all duration-300 ease-out",
            status === 'filled' 
              ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" 
              : "bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400"
          )}
          style={{ width: `${animatedProgress}%` }}
        />
        
        {/* Scanning beam effect when matching */}
        {isAnimating && currentStageIndex < 4 && (
          <div 
            className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{ 
              left: `${animatedProgress - 15}%`,
              animation: 'shimmer 2s ease-in-out infinite'
            }}
          />
        )}
        
        {/* Glow effect */}
        {isAnimating && (
          <div 
            className={cn(
              "absolute inset-y-0 blur-sm",
              status === 'filled' 
                ? "bg-gradient-to-r from-emerald-500/50 to-teal-400/50" 
                : "bg-gradient-to-r from-sky-500/50 to-sky-400/50"
            )}
            style={{ width: `${animatedProgress}%` }}
          />
        )}
        
        {/* Data particles effect when matching */}
        {isAnimating && status === 'matching' && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-sky-300"
                style={{
                  left: `${(animatedProgress * 0.8) + (i * 5)}%`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  animation: `dataFlow 1.5s ease-in-out ${i * 0.2}s infinite`,
                  opacity: 0.7
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stages - Well spaced */}
      <div className="grid grid-cols-5 gap-4">
        {stages.map((stage, index) => {
          const isActive = index === currentStageIndex;
          const isComplete = index < currentStageIndex;
          const Icon = stage.icon;

          return (
            <div 
              key={stage.id}
              className="flex flex-col items-center gap-2 min-w-0"
            >
              <div className={cn(
                "w-10 h-10 flex-shrink-0 flex items-center justify-center transition-all duration-300",
                isComplete 
                  ? "bg-emerald-500/20 text-emerald-400" 
                  : isActive 
                    ? "bg-sky-500/20 text-sky-400" 
                    : "bg-zinc-800 text-zinc-600"
              )}>
                {isActive && isAnimating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span className={cn(
                "text-[9px] font-medium uppercase tracking-wide transition-colors text-center leading-tight",
                isComplete 
                  ? "text-emerald-400" 
                  : isActive 
                    ? "text-sky-400" 
                    : "text-zinc-600"
              )}>
                {stage.label.split(' ').map((word, i) => (
                  <span key={i} className="block">{word}</span>
                ))}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Stage Info */}
      <div className="text-center space-y-1 pt-2 border-t border-zinc-800">
        <p className="text-sm text-zinc-200 font-medium">
          {stages[currentStageIndex]?.description}
        </p>
        {isAnimating && currentStageIndex < 4 && (
          <p className="text-xs text-zinc-500 font-mono">
            Est. time: {estimatedTime || stages[currentStageIndex]?.time}
          </p>
        )}
      </div>
    </div>
  );
}

// Compact version for order cards
export function OrderProgressCompact({ status, isAnimating = false }: OrderProgressProps) {
  const currentStageIndex = statusToStageIndex[status] ?? 0;
  const progress = status === 'filled' ? 100 : (currentStageIndex / 4) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          "font-medium uppercase tracking-wider",
          status === 'filled' ? "text-emerald-400" : "text-sky-400"
        )}>
          {stages[currentStageIndex]?.label || 'Unknown'}
        </span>
        <span className="text-zinc-500 font-mono">{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 bg-zinc-800 overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-500",
            status === 'filled' 
              ? "bg-emerald-500" 
              : "bg-sky-500",
            isAnimating && status !== 'filled' && "relative overflow-hidden"
          )}
          style={{ width: `${progress}%` }}
        >
          {isAnimating && status !== 'filled' && (
            <div 
              className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
