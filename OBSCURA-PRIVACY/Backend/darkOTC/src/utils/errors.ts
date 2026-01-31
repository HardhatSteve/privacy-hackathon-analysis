/**
 * Error Handling Utilities
 * 
 * Provides error categorization, retry logic, and circuit breaker pattern
 * for Obscura-LLMS integration.
 * 
 * Requirements: 36.3
 */

/**
 * Error categories for Obscura-LLMS operations
 */
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  RELAYER_UNAVAILABLE = 'RELAYER_UNAVAILABLE',
  INVALID_INPUT = 'INVALID_INPUT',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error class for Obscura-LLMS operations
 */
export class ObscuraError extends Error {
  constructor(
    message: string,
    public category: ErrorCategory,
    public isRetryable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ObscuraError';
  }
}

/**
 * Categorize error based on error message and HTTP status
 */
export function categorizeError(error: unknown, statusCode?: number): ObscuraError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Network errors
  if (
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('network') ||
    errorMessage.includes('fetch failed')
  ) {
    return new ObscuraError(
      `Network error: ${errorMessage}`,
      ErrorCategory.NETWORK,
      true,
      error instanceof Error ? error : undefined
    );
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return new ObscuraError(
      `Request timeout: ${errorMessage}`,
      ErrorCategory.TIMEOUT,
      true,
      error instanceof Error ? error : undefined
    );
  }
  
  // Insufficient balance errors
  if (
    errorMessage.includes('insufficient balance') ||
    errorMessage.includes('insufficient funds') ||
    errorMessage.includes('not enough balance')
  ) {
    return new ObscuraError(
      `Insufficient balance: ${errorMessage}`,
      ErrorCategory.INSUFFICIENT_BALANCE,
      false,
      error instanceof Error ? error : undefined
    );
  }
  
  // Relayer unavailable (503 errors)
  if (
    statusCode === 503 ||
    errorMessage.includes('503') ||
    errorMessage.includes('service unavailable') ||
    errorMessage.includes('relayer unavailable')
  ) {
    return new ObscuraError(
      `Relayer service unavailable: ${errorMessage}`,
      ErrorCategory.RELAYER_UNAVAILABLE,
      true,
      error instanceof Error ? error : undefined
    );
  }
  
  // Invalid input errors (400, 422)
  if (
    statusCode === 400 ||
    statusCode === 422 ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('validation failed') ||
    errorMessage.includes('bad request')
  ) {
    return new ObscuraError(
      `Invalid input: ${errorMessage}`,
      ErrorCategory.INVALID_INPUT,
      false,
      error instanceof Error ? error : undefined
    );
  }
  
  // Unknown errors
  return new ObscuraError(
    `Unknown error: ${errorMessage}`,
    ErrorCategory.UNKNOWN,
    false,
    error instanceof Error ? error : undefined
  );
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  timeoutMs?: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  timeoutMs: 30000, // 30 seconds
};

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  shouldRetry: (error: ObscuraError) => boolean = (error) => error.isRetryable
): Promise<T> {
  let lastError: ObscuraError | undefined;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Add timeout if configured
      if (config.timeoutMs) {
        return await withTimeout(fn(), config.timeoutMs);
      }
      return await fn();
    } catch (error) {
      // Categorize error
      const categorizedError = error instanceof ObscuraError 
        ? error 
        : categorizeError(error);
      
      lastError = categorizedError;
      
      // Don't retry if error is not retryable
      if (!shouldRetry(categorizedError)) {
        throw categorizedError;
      }
      
      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        throw categorizedError;
      }
      
      // Calculate backoff delay
      const delay = calculateBackoffDelay(attempt, config);
      
      // Log retry attempt (without sensitive data)
      console.warn(
        `Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms. ` +
        `Error: ${categorizedError.category} - ${categorizedError.message}`
      );
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw lastError || new ObscuraError('Retry failed', ErrorCategory.UNKNOWN);
}

/**
 * Add timeout to a promise
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new ObscuraError(
          `Operation timed out after ${timeoutMs}ms`,
          ErrorCategory.TIMEOUT,
          true
        )),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Circuit breaker state
 */
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,    // Open after 5 failures
  successThreshold: 2,    // Close after 2 successes in half-open
  timeout: 60000,         // Try again after 60 seconds
};

/**
 * Circuit breaker for preventing cascading failures
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = Date.now();
  
  constructor(
    private name: string,
    private config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG
  ) {}
  
  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new ObscuraError(
          `Circuit breaker '${this.name}' is OPEN. Service unavailable.`,
          ErrorCategory.RELAYER_UNAVAILABLE,
          false
        );
      }
      // Try half-open
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
      console.log(`Circuit breaker '${this.name}' entering HALF_OPEN state`);
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        console.log(`Circuit breaker '${this.name}' closed after recovery`);
      }
    }
  }
  
  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.timeout;
      console.error(
        `Circuit breaker '${this.name}' opened after ${this.failureCount} failures. ` +
        `Will retry at ${new Date(this.nextAttempt).toISOString()}`
      );
    }
  }
  
  /**
   * Get current circuit state
   */
  getState(): string {
    return this.state;
  }
  
  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    console.log(`Circuit breaker '${this.name}' reset`);
  }
}
