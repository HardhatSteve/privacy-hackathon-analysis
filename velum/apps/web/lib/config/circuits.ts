/**
 * Circuit Configuration
 *
 * This file contains the configuration for ZK circuit files used in proof generation.
 * The version string MUST be incremented when circuit files are updated.
 *
 * IMPORTANT: When updating circuit.wasm or circuit.zkey files in the public directory,
 * you MUST increment the CIRCUIT_VERSION to invalidate cached files in user browsers.
 */

/**
 * Circuit version for cache invalidation.
 * Increment this when circuit files change.
 *
 * Format: "v{major}.{minor}.{patch}" or any unique string
 * Examples: "v1.0.0", "v1.0.1", "2024-01-19"
 */
export const CIRCUIT_VERSION = "v1.0.0";

/**
 * Circuit file configuration
 */
export const CIRCUIT_CONFIG = {
  version: CIRCUIT_VERSION,

  /**
   * Base path for circuit files (without extension)
   * Files are served from /public directory
   */
  basePath: "/circuit",

  /**
   * Individual file paths
   */
  files: {
    wasm: "/circuit.wasm",
    zkey: "/circuit.zkey",
  },

  /**
   * Approximate file sizes for progress estimation
   * Update these when circuit files change significantly
   */
  fileSizes: {
    wasm: 3.1 * 1024 * 1024, // ~3.1 MB
    zkey: 16 * 1024 * 1024, // ~16 MB
  },

  /**
   * Total expected download size
   */
  get totalSize(): number {
    return this.fileSizes.wasm + this.fileSizes.zkey;
  },
} as const;

/**
 * IndexedDB configuration for circuit cache
 */
export const CIRCUIT_CACHE_CONFIG = {
  /**
   * Database name for IndexedDB
   */
  dbName: "privacy-paylink-circuits",

  /**
   * Object store name
   */
  storeName: "circuits",

  /**
   * Database version (increment when schema changes)
   */
  dbVersion: 1,

  /**
   * Keys for stored circuit files
   */
  keys: {
    wasm: "circuit-wasm",
    zkey: "circuit-zkey",
    metadata: "circuit-metadata",
  },
} as const;

/**
 * Circuit loader configuration
 */
export const CIRCUIT_LOADER_CONFIG = {
  /**
   * Delay before prefetch hint triggers (ms)
   */
  prefetchDelay: 5000,

  /**
   * Maximum retry attempts for failed downloads
   */
  maxRetries: 3,

  /**
   * Base delay between retries (ms) - uses exponential backoff
   */
  retryBaseDelay: 1000,
} as const;

export type CircuitFileType = "wasm" | "zkey";
