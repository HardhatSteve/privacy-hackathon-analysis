/**
 * Configuration options for a privacy scan
 */
export interface ScanOptions {
  /**
   * RPC endpoint URL (QuickNode-compatible)
   */
  rpcUrl: string;

  /**
   * Maximum number of signatures to fetch for wallet scans
   * @default 100
   */
  maxSignatures?: number;

  /**
   * Maximum number of concurrent RPC requests
   * @default 10
   */
  maxConcurrency?: number;

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;

  /**
   * Custom timeout for RPC requests (ms)
   * @default 30000
   */
  timeout?: number;
}
