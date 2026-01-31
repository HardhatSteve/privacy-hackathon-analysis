import { Connection, ConnectionConfig } from '@solana/web3.js';
import { DEFAULT_RPC_URL } from '../constants.js';

/**
 * Configuration for the RPC client
 */
export interface RPCClientConfig {
  /**
   * RPC endpoint URL (optional - uses default if not provided)
   */
  rpcUrl?: string;

  /**
   * Maximum number of retries for failed requests
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial delay for exponential backoff (ms)
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Maximum number of concurrent requests
   * @default 10
   */
  maxConcurrency?: number;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Rate limiter to control concurrent requests
 */
class RateLimiter {
  private activeRequests = 0;
  private queue: Array<() => void> = [];

  constructor(private maxConcurrency: number) {}

  async acquire(): Promise<void> {
    if (this.activeRequests < this.maxConcurrency) {
      this.activeRequests++;
      return;
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.activeRequests++;
        resolve();
      });
    });
  }

  release(): void {
    this.activeRequests--;
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  getActiveCount(): number {
    return this.activeRequests;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * RPC client wrapper with rate limiting and retry logic
 * 
 * This class wraps the Solana Connection and provides:
 * - Automatic retries with exponential backoff
 * - Rate limiting for concurrent requests
 * - Centralized error handling
 * - Default RPC endpoint (no configuration required)
 */
export class RPCClient {
  private connection: Connection;
  private config: Required<Omit<RPCClientConfig, 'rpcUrl'>> & { rpcUrl: string };
  private rateLimiter: RateLimiter;

  constructor(configOrUrl?: RPCClientConfig | string) {
    // Handle string URL, config object, or no arguments (use default)
    const config: RPCClientConfig = !configOrUrl
      ? {}
      : typeof configOrUrl === 'string' 
        ? { rpcUrl: configOrUrl }
        : configOrUrl;
    
    // Use default RPC if none provided, trim to handle whitespace
    const rpcUrl = (config.rpcUrl || DEFAULT_RPC_URL).trim();
    
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      timeout: config.timeout ?? 30000,
      maxConcurrency: config.maxConcurrency ?? 10,
      debug: config.debug ?? false,
      rpcUrl,
    };

    const connectionConfig: ConnectionConfig = {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: this.config.timeout,
      httpHeaders: {
        'Referer': 'https://solana-privacy-scanner.app',
      },
    };

    this.connection = new Connection(this.config.rpcUrl, connectionConfig);
    this.rateLimiter = new RateLimiter(this.config.maxConcurrency);

    if (this.config.debug) {
      console.log(`[RPCClient] Initialized with URL: ${this.config.rpcUrl}`);
      console.log(`[RPCClient] Max concurrency: ${this.config.maxConcurrency}`);
      console.log(`[RPCClient] Max retries: ${this.config.maxRetries}`);
    }
  }

  /**
   * Execute an RPC call with retry logic and rate limiting
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    await this.rateLimiter.acquire();

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (this.config.debug && attempt > 0) {
          console.log(`[RPCClient] Retry attempt ${attempt} for ${operationName}`);
        }

        const result = await operation();
        this.rateLimiter.release();
        return result;
      } catch (error) {
        lastError = error as Error;

        if (this.config.debug) {
          console.error(
            `[RPCClient] Error in ${operationName} (attempt ${attempt + 1}/${this.config.maxRetries + 1}):`,
            error
          );
        }

        // Don't retry on last attempt
        if (attempt < this.config.maxRetries) {
          // Exponential backoff: delay * 2^attempt
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await sleep(delay);
        }
      }
    }

    this.rateLimiter.release();
    throw new Error(
      `RPC operation ${operationName} failed after ${this.config.maxRetries + 1} attempts: ${lastError?.message}`
    );
  }

  /**
   * Get the underlying Solana Connection
   * Use this sparingly - prefer the wrapped methods for automatic retry/rate limiting
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Get current rate limiter stats
   */
  getStats(): { activeRequests: number; queueLength: number } {
    return {
      activeRequests: this.rateLimiter.getActiveCount(),
      queueLength: this.rateLimiter.getQueueLength(),
    };
  }

  /**
   * Get signatures for an address with retry and rate limiting
   */
  async getSignaturesForAddress(
    address: string,
    options?: {
      limit?: number;
      before?: string;
      until?: string;
    }
  ) {
    return this.executeWithRetry(
      async () => {
        const { PublicKey } = await import('@solana/web3.js');
        return this.connection.getSignaturesForAddress(
          new PublicKey(address),
          options
        );
      },
      `getSignaturesForAddress(${address})`
    );
  }

  /**
   * Get transaction details with retry and rate limiting
   */
  async getTransaction(signature: string, options?: { maxSupportedTransactionVersion?: number }) {
    return this.executeWithRetry(
      async () => {
        return this.connection.getTransaction(signature, {
          maxSupportedTransactionVersion: options?.maxSupportedTransactionVersion ?? 0,
        });
      },
      `getTransaction(${signature})`
    );
  }

  /**
   * Get multiple transactions in parallel (respects rate limiting)
   */
  async getTransactions(signatures: string[], options?: { maxSupportedTransactionVersion?: number }): Promise<Array<any>> {
    const promises = signatures.map((sig) => this.getTransaction(sig, options));
    return Promise.all(promises);
  }

  /**
   * Get token accounts by owner with retry and rate limiting
   */
  async getTokenAccountsByOwner(ownerAddress: string, mintAddress?: string) {
    return this.executeWithRetry(
      async () => {
        const { PublicKey } = await import('@solana/web3.js');
        const owner = new PublicKey(ownerAddress);
        
        // SPL Token Program ID
        const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        
        if (mintAddress) {
          const mint = new PublicKey(mintAddress);
          return this.connection.getTokenAccountsByOwner(owner, { mint });
        } else {
          return this.connection.getTokenAccountsByOwner(owner, {
            programId: TOKEN_PROGRAM_ID,
          });
        }
      },
      `getTokenAccountsByOwner(${ownerAddress})`
    );
  }

  /**
   * Get program accounts with retry and rate limiting
   */
  async getProgramAccounts(programId: string, config?: any) {
    return this.executeWithRetry(
      async () => {
        const { PublicKey } = await import('@solana/web3.js');
        return this.connection.getProgramAccounts(new PublicKey(programId), config);
      },
      `getProgramAccounts(${programId})`
    );
  }

  /**
   * Get account info with retry and rate limiting
   */
  async getAccountInfo(address: string) {
    return this.executeWithRetry(
      async () => {
        const { PublicKey } = await import('@solana/web3.js');
        return this.connection.getAccountInfo(new PublicKey(address));
      },
      `getAccountInfo(${address})`
    );
  }

  /**
   * Get multiple account infos in parallel (respects rate limiting)
   */
  async getMultipleAccountsInfo(addresses: string[]) {
    return this.executeWithRetry(
      async () => {
        const { PublicKey } = await import('@solana/web3.js');
        const pubkeys = addresses.map((addr) => new PublicKey(addr));
        return this.connection.getMultipleAccountsInfo(pubkeys);
      },
      `getMultipleAccountsInfo(${addresses.length} addresses)`
    );
  }

  /**
   * Check if the RPC connection is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const version = await this.executeWithRetry(
        () => this.connection.getVersion(),
        'healthCheck'
      );
      return !!version;
    } catch {
      return false;
    }
  }
}
