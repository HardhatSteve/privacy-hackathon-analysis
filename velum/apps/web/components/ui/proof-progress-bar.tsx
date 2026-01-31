"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { ProofProgressState } from "@/lib/hooks/use-proof-progress";

interface ProofProgressBarProps {
  state: ProofProgressState;
  onRetry?: () => void;
  className?: string;
}

function ProofProgressBar({ state, onRetry, className }: ProofProgressBarProps) {
  const { isGenerating, progress, phaseLabel, error } = state;

  // Don't render if not generating and no error
  if (!isGenerating && !error && progress === 0) {
    return null;
  }

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Progress Bar Container */}
      <div className="relative w-full h-2 bg-[#262626]/50 border border-border overflow-hidden">
        {/* Progress Fill */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-[width] duration-700 ease-in-out",
            error
              ? "bg-error"
              : progress >= 100
                ? "bg-success"
                : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />

        {/* Animated Shimmer Effect (only when generating) */}
        {isGenerating && !error && (
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              style={{
                left: `${progress - 33}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Status Text */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span
          className={cn(
            "transition-colors",
            error
              ? "text-error"
              : progress >= 100
                ? "text-success"
                : "text-foreground/60"
          )}
        >
          {error ? error : phaseLabel}
        </span>
        <span
          className={cn(
            "tabular-nums",
            error
              ? "text-error"
              : progress >= 100
                ? "text-success"
                : "text-primary"
          )}
        >
          {Math.round(progress)}%
        </span>
      </div>

      {/* Error State with Retry Button */}
      {error && onRetry && (
        <button
          onClick={onRetry}
          className="w-full p-3 bg-error/10 border border-error/20 text-error text-sm font-mono hover:bg-error/20 transition-colors"
        >
          [Retry]
        </button>
      )}
    </div>
  );
}

export { ProofProgressBar };
export type { ProofProgressBarProps };
