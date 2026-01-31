"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  loadCircuits,
  areCircuitsLoaded,
  createPrefetchHint,
  type CircuitLoadProgress,
  type CircuitLoadingStatus,
} from "../circuit-loader";

export interface UseCircuitLoaderResult {
  /**
   * Current loading status
   */
  status: CircuitLoadingStatus;

  /**
   * Loading progress (0-100)
   */
  progress: number;

  /**
   * Whether circuits are loaded and ready
   */
  isReady: boolean;

  /**
   * Whether currently loading circuits
   */
  isLoading: boolean;

  /**
   * Error message if loading failed
   */
  error: string | null;

  /**
   * Whether circuits were loaded from cache
   */
  fromCache: boolean;

  /**
   * Trigger circuit loading
   * Returns a promise that resolves when loading is complete
   */
  loadCircuits: () => Promise<void>;

  /**
   * Full progress details
   */
  progressDetails: CircuitLoadProgress | null;
}

/**
 * Hook for managing circuit file loading with progress tracking
 *
 * Usage:
 * ```tsx
 * const { loadCircuits, isReady, isLoading, progress, error } = useCircuitLoader();
 *
 * const handleDeposit = async () => {
 *   if (!isReady) {
 *     await loadCircuits(); // Load circuits first
 *   }
 *   // Proceed with deposit...
 * };
 * ```
 */
export function useCircuitLoader({
  enablePrefetch = false,
}: {
  enablePrefetch?: boolean;
} = {}): UseCircuitLoaderResult {
  const [status, setStatus] = useState<CircuitLoadingStatus>(() =>
    areCircuitsLoaded() ? "ready" : "idle"
  );
  const [progress, setProgress] = useState(() =>
    areCircuitsLoaded() ? 100 : 0
  );
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [progressDetails, setProgressDetails] =
    useState<CircuitLoadProgress | null>(null);

  const loadingRef = useRef(false);

  // Progress callback
  const handleProgress = useCallback((p: CircuitLoadProgress) => {
    setStatus(p.status);
    setProgress(p.progress);
    setError(p.error);
    setFromCache(p.fromCache);
    setProgressDetails(p);
  }, []);

  // Load circuits function
  const load = useCallback(async () => {
    // Skip if already loading or loaded
    if (loadingRef.current || areCircuitsLoaded()) {
      if (areCircuitsLoaded()) {
        setStatus("ready");
        setProgress(100);
      }
      return;
    }

    loadingRef.current = true;
    setError(null);

    try {
      await loadCircuits(handleProgress);
      setStatus("ready");
      setProgress(100);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load circuit files";
      setError(errorMessage);
      setStatus("error");
    } finally {
      loadingRef.current = false;
    }
  }, [handleProgress]);

  // Enable prefetch after idle time
  useEffect(() => {
    if (!enablePrefetch) return;

    // Only prefetch if circuits aren't already loaded
    if (areCircuitsLoaded()) return;

    const cleanup = createPrefetchHint();
    return cleanup;
  }, [enablePrefetch]);

  // Check if circuits are already loaded on mount
  useEffect(() => {
    if (areCircuitsLoaded()) {
      setStatus("ready");
      setProgress(100);
      setFromCache(true);
    }
  }, []);

  const isReady = status === "ready" && areCircuitsLoaded();
  const isLoading =
    status === "checking-cache" ||
    status === "updating" ||
    status === "downloading" ||
    status === "cached";

  return {
    status,
    progress,
    isReady,
    isLoading,
    error,
    fromCache,
    loadCircuits: load,
    progressDetails,
  };
}
