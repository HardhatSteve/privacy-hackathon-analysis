"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CircuitLoadProgress } from "@/lib/circuit-loader";

interface CircuitSyncOverlayProps {
  progress: CircuitLoadProgress | null;
  isVisible: boolean;
}

function CircuitSyncOverlay({ progress, isVisible }: CircuitSyncOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const percentage = Math.round(progress?.progress ?? 0);
  const isUpdating = progress?.status === "updating";
  const currentFileLabel =
    progress?.currentFile === "zkey"
      ? "Downloading verification keys..."
      : progress?.currentFile === "wasm"
        ? "Downloading prover..."
        : "Checking cache...";

  // Focus trap: keep focus within the overlay while visible
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        // Since this is a loading overlay with no interactive elements,
        // prevent tabbing out entirely
        e.preventDefault();
      }
    };

    // Focus the overlay when it becomes visible
    overlayRef.current?.focus();

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={overlayRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Loading ZK circuits"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm focus:outline-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full max-w-sm mx-4 bg-[#262626]/30 border border-border backdrop-blur-sm shadow-2xl shadow-black/50 p-8"
          >
            {/* Spinner */}
            <div className="flex justify-center mb-6">
              <div className="relative w-12 h-12">
                <svg
                  className="w-12 h-12 animate-spin"
                  viewBox="0 0 48 48"
                  fill="none"
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-border"
                  />
                  <path
                    d="M44 24c0-11.046-8.954-20-20-20"
                    stroke="#FFC700"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-lg font-sentient font-extralight tracking-tight text-center text-foreground mb-1">
              {isUpdating ? "Updating ZK circuits..." : "Syncing ZK circuits..."}
            </h2>

            {/* Subtext */}
            <p className="text-xs font-mono text-foreground/50 text-center mb-6">
              {currentFileLabel}
            </p>

            {/* Progress Bar */}
            <div className="relative w-full h-2 bg-[#262626]/50 border border-border overflow-hidden mb-3">
              <div
                className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-in-out bg-[#FFC700]"
                style={{ width: `${percentage}%` }}
              />
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                  style={{ left: `${percentage - 33}%` }}
                />
              </div>
            </div>

            {/* Percentage */}
            <p className="text-sm font-mono text-[#FFC700] text-center tabular-nums">
              {percentage}%
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { CircuitSyncOverlay };
export type { CircuitSyncOverlayProps };
