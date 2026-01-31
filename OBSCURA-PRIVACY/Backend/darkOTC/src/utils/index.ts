/**
 * Utility Functions
 * 
 * Exports all utility functions for the Obscura Dark OTC RFQ system
 */

// Error handling utilities
export {
  ErrorCategory,
  ObscuraError,
  categorizeError,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  calculateBackoffDelay,
  sleep,
  retryWithBackoff,
  withTimeout,
  CircuitBreakerConfig,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  CircuitBreaker,
} from './errors';

// Error helper utilities
export {
  throwSignatureError,
  throwSignatureReuseError,
  throwInsufficientBalanceError,
  throwNotFoundError,
  throwAuthorizationError,
  throwTimeoutError,
  throwValidationError,
  throwCryptographicError,
  throwDatabaseError,
} from './error-helpers';

// Relayer fee calculation utilities
export {
  Chain,
  calculateRelayerFee,
  calculateRelayerFeeBigInt,
  getFeeTierInfo,
  getMinimumFee,
} from './relayer-fee';
