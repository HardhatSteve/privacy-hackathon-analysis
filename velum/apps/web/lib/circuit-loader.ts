/**
 * Circuit Loader Module
 *
 * Handles lazy loading of ZK circuit files with:
 * - Progress tracking for download status
 * - IndexedDB caching for instant subsequent loads
 * - Retry logic with exponential backoff
 * - Prefetch hint capability for idle-time loading
 */

import {
  CIRCUIT_CONFIG,
  CIRCUIT_LOADER_CONFIG,
  type CircuitFileType,
} from "./config/circuits";
import {
  getCachedCircuit,
  cacheCircuit,
  areCircuitsCached,
  updateCacheMetadata,
  isCacheStale,
} from "./circuit-cache";

export type CircuitLoadingStatus =
  | "idle"
  | "checking-cache"
  | "updating"
  | "downloading"
  | "cached"
  | "ready"
  | "error";

export interface CircuitLoadProgress {
  status: CircuitLoadingStatus;
  progress: number; // 0-100
  currentFile: CircuitFileType | null;
  bytesLoaded: number;
  totalBytes: number;
  error: string | null;
  fromCache: boolean;
}

export type CircuitProgressCallback = (progress: CircuitLoadProgress) => void;

/**
 * Singleton state for loaded circuits
 * Once loaded, circuits remain in memory for the session
 */
let loadedCircuits: {
  wasm: ArrayBuffer | null;
  zkey: ArrayBuffer | null;
} = {
  wasm: null,
  zkey: null,
};

let isLoading = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Create initial progress state
 */
function createInitialProgress(): CircuitLoadProgress {
  return {
    status: "idle",
    progress: 0,
    currentFile: null,
    bytesLoaded: 0,
    totalBytes: CIRCUIT_CONFIG.totalSize,
    error: null,
    fromCache: false,
  };
}

/**
 * Fetch a circuit file with progress tracking
 */
async function fetchWithProgress(
  url: string,
  expectedSize: number,
  onProgress: (loaded: number) => void
): Promise<ArrayBuffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    // Fallback: no streaming support
    const buffer = await response.arrayBuffer();
    onProgress(buffer.byteLength);
    return buffer;
  }

  const chunks: Uint8Array[] = [];
  let receivedLength = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    receivedLength += value.length;
    onProgress(receivedLength);
  }

  // Combine chunks into single ArrayBuffer
  const result = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    result.set(chunk, position);
    position += chunk.length;
  }

  return result.buffer;
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = CIRCUIT_LOADER_CONFIG.maxRetries,
  baseDelay: number = CIRCUIT_LOADER_CONFIG.retryBaseDelay
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Load a single circuit file from cache or network
 */
async function loadCircuitFile(
  fileType: CircuitFileType,
  onProgress: CircuitProgressCallback,
  currentProgress: CircuitLoadProgress,
  baseProgress: number
): Promise<ArrayBuffer> {
  const fileUrl =
    fileType === "wasm" ? CIRCUIT_CONFIG.files.wasm : CIRCUIT_CONFIG.files.zkey;
  const expectedSize =
    fileType === "wasm"
      ? CIRCUIT_CONFIG.fileSizes.wasm
      : CIRCUIT_CONFIG.fileSizes.zkey;

  // Try cache first
  const cached = await getCachedCircuit(fileType);
  if (cached) {
    const progress = baseProgress + (expectedSize / CIRCUIT_CONFIG.totalSize) * 100;
    onProgress({
      ...currentProgress,
      status: "cached",
      progress: Math.min(progress, 100),
      currentFile: fileType,
      bytesLoaded: currentProgress.bytesLoaded + cached.byteLength,
      fromCache: true,
    });
    return cached;
  }

  // Download with retry
  currentProgress = {
    ...currentProgress,
    status: "downloading",
    currentFile: fileType,
    fromCache: false,
  };
  onProgress(currentProgress);

  const data = await withRetry(async () => {
    return fetchWithProgress(fileUrl, expectedSize, (loaded) => {
      const fileProgress = (loaded / expectedSize) * 100;
      const totalProgress =
        baseProgress + (fileProgress * expectedSize) / CIRCUIT_CONFIG.totalSize;

      onProgress({
        ...currentProgress,
        status: "downloading",
        progress: Math.min(totalProgress, 99),
        bytesLoaded: currentProgress.bytesLoaded + loaded,
      });
    });
  });

  // Cache the downloaded file
  try {
    await cacheCircuit(fileType, data);
  } catch (cacheError) {
    // Log but don't fail if caching fails
    console.warn(`Failed to cache ${fileType}:`, cacheError);
  }

  return data;
}

/**
 * Load all circuit files
 *
 * Returns a promise that resolves when all circuits are loaded.
 * Calls the progress callback with loading status updates.
 */
export async function loadCircuits(
  onProgress?: CircuitProgressCallback
): Promise<void> {
  // If already loaded, return immediately
  if (loadedCircuits.wasm && loadedCircuits.zkey) {
    onProgress?.({
      status: "ready",
      progress: 100,
      currentFile: null,
      bytesLoaded: CIRCUIT_CONFIG.totalSize,
      totalBytes: CIRCUIT_CONFIG.totalSize,
      error: null,
      fromCache: true,
    });
    return;
  }

  // If already loading, wait for the existing promise
  if (isLoading && loadingPromise) {
    await loadingPromise;
    return;
  }

  isLoading = true;
  let progress = createInitialProgress();

  const progressCallback = onProgress || (() => {});

  loadingPromise = (async () => {
    try {
      // Check cache status
      progress = { ...progress, status: "checking-cache" };
      progressCallback(progress);

      // Check if cache is stale (version mismatch)
      const isStale = await isCacheStale();
      if (isStale) {
        progress = { ...progress, status: "updating" };
        progressCallback(progress);
      }

      const isCached = await areCircuitsCached();
      progress = { ...progress, fromCache: isCached };

      // Load WASM file (smaller, load first)
      progress = { ...progress, currentFile: "wasm" };
      loadedCircuits.wasm = await loadCircuitFile(
        "wasm",
        progressCallback,
        progress,
        0
      );

      // Calculate base progress after WASM load
      const wasmProgress =
        (CIRCUIT_CONFIG.fileSizes.wasm / CIRCUIT_CONFIG.totalSize) * 100;
      progress = {
        ...progress,
        bytesLoaded: loadedCircuits.wasm.byteLength,
        progress: wasmProgress,
      };

      // Load ZKEY file (larger)
      progress = { ...progress, currentFile: "zkey" };
      loadedCircuits.zkey = await loadCircuitFile(
        "zkey",
        progressCallback,
        progress,
        wasmProgress
      );

      // Update metadata after successful load
      await updateCacheMetadata();

      // Complete
      progressCallback({
        status: "ready",
        progress: 100,
        currentFile: null,
        bytesLoaded:
          loadedCircuits.wasm.byteLength + loadedCircuits.zkey.byteLength,
        totalBytes: CIRCUIT_CONFIG.totalSize,
        error: null,
        fromCache: isCached,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      progressCallback({
        ...progress,
        status: "error",
        error: errorMessage,
      });

      // Reset loaded state on error
      loadedCircuits = { wasm: null, zkey: null };

      throw error;
    } finally {
      isLoading = false;
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * Check if circuits are already loaded in memory
 */
export function areCircuitsLoaded(): boolean {
  return loadedCircuits.wasm !== null && loadedCircuits.zkey !== null;
}

/**
 * Get loaded circuit files
 *
 * Returns null if circuits are not loaded.
 * Call loadCircuits() first to ensure circuits are available.
 */
export function getLoadedCircuits(): {
  wasm: ArrayBuffer;
  zkey: ArrayBuffer;
} | null {
  if (!loadedCircuits.wasm || !loadedCircuits.zkey) {
    return null;
  }

  return {
    wasm: loadedCircuits.wasm,
    zkey: loadedCircuits.zkey,
  };
}

/**
 * Prefetch circuits in the background
 *
 * Intended to be called after a delay when user is idle on the page.
 * Does not throw errors - silently fails if prefetch is not possible.
 */
export async function prefetchCircuits(): Promise<void> {
  // Skip if already loaded or loading
  if (areCircuitsLoaded() || isLoading) {
    return;
  }

  try {
    await loadCircuits();
  } catch {
    // Silently ignore prefetch errors
    // User will see errors when they actually try to use the feature
  }
}

/**
 * Create a prefetch hint that triggers after idle time
 *
 * Returns a cleanup function to cancel the prefetch timer.
 */
export function createPrefetchHint(
  delay: number = CIRCUIT_LOADER_CONFIG.prefetchDelay
): () => void {
  // Only in browser environment
  if (typeof window === "undefined") {
    return () => {};
  }

  const timeoutId = setTimeout(() => {
    prefetchCircuits();
  }, delay);

  return () => {
    clearTimeout(timeoutId);
  };
}

/**
 * Reset loaded circuits (useful for testing)
 */
export function resetLoadedCircuits(): void {
  loadedCircuits = { wasm: null, zkey: null };
  isLoading = false;
  loadingPromise = null;
}
