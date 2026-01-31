/**
 * Error Handling Tests
 * 
 * Tests for error categorization, retry logic, circuit breaker, and timeout handling.
 * 
 * Requirements: 36.3
 */

import {
  ObscuraError,
  ErrorCategory,
  categorizeError,
  retryWithBackoff,
  withTimeout,
  CircuitBreaker,
  calculateBackoffDelay,
  sleep,
  DEFAULT_RETRY_CONFIG,
} from './errors';

describe('Error Categorization', () => {
  describe('categorizeError', () => {
    it('should categorize network errors', () => {
      const error = new Error('fetch failed: ECONNREFUSED');
      const categorized = categorizeError(error);
      
      expect(categorized).toBeInstanceOf(ObscuraError);
      expect(categorized.category).toBe(ErrorCategory.NETWORK);
      expect(categorized.isRetryable).toBe(true);
    });
    
    it('should categorize timeout errors', () => {
      const error = new Error('Request timed out');
      const categorized = categorizeError(error);
      
      expect(categorized.category).toBe(ErrorCategory.TIMEOUT);
      expect(categorized.isRetryable).toBe(true);
    });
    
    it('should categorize insufficient balance errors', () => {
      const error = new Error('insufficient balance for operation');
      const categorized = categorizeError(error);
      
      expect(categorized.category).toBe(ErrorCategory.INSUFFICIENT_BALANCE);
      expect(categorized.isRetryable).toBe(false);
    });
    
    it('should categorize relayer unavailable errors with 503 status', () => {
      const error = new Error('Service unavailable');
      const categorized = categorizeError(error, 503);
      
      expect(categorized.category).toBe(ErrorCategory.RELAYER_UNAVAILABLE);
      expect(categorized.isRetryable).toBe(true);
    });
    
    it('should categorize invalid input errors with 400 status', () => {
      const error = new Error('Invalid request parameters');
      const categorized = categorizeError(error, 400);
      
      expect(categorized.category).toBe(ErrorCategory.INVALID_INPUT);
      expect(categorized.isRetryable).toBe(false);
    });
    
    it('should categorize unknown errors', () => {
      const error = new Error('Something went wrong');
      const categorized = categorizeError(error);
      
      expect(categorized.category).toBe(ErrorCategory.UNKNOWN);
      expect(categorized.isRetryable).toBe(false);
    });
    
    it('should handle string errors', () => {
      const categorized = categorizeError('network error occurred');
      
      expect(categorized).toBeInstanceOf(ObscuraError);
      expect(categorized.category).toBe(ErrorCategory.NETWORK);
    });
  });
});

describe('Retry Logic', () => {
  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      const config = DEFAULT_RETRY_CONFIG;
      
      expect(calculateBackoffDelay(0, config)).toBe(1000);
      expect(calculateBackoffDelay(1, config)).toBe(2000);
      expect(calculateBackoffDelay(2, config)).toBe(4000);
      expect(calculateBackoffDelay(3, config)).toBe(8000);
    });
    
    it('should cap delay at maxDelayMs', () => {
      const config = DEFAULT_RETRY_CONFIG;
      
      expect(calculateBackoffDelay(10, config)).toBe(config.maxDelayMs);
    });
  });
  
  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThan(200);
    });
  });
  
  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
      });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });
    
    it('should retry on retryable errors', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new ObscuraError('Network error', ErrorCategory.NETWORK, true))
        .mockRejectedValueOnce(new ObscuraError('Network error', ErrorCategory.NETWORK, true))
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
      });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });
    
    it('should not retry on non-retryable errors', async () => {
      const fn = jest.fn()
        .mockRejectedValue(
          new ObscuraError('Insufficient balance', ErrorCategory.INSUFFICIENT_BALANCE, false)
        );
      
      await expect(
        retryWithBackoff(fn, {
          maxRetries: 3,
          initialDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 2,
        })
      ).rejects.toThrow('Insufficient balance');
      
      expect(fn).toHaveBeenCalledTimes(1);
    });
    
    it('should throw after max retries', async () => {
      const fn = jest.fn()
        .mockRejectedValue(new ObscuraError('Network error', ErrorCategory.NETWORK, true));
      
      await expect(
        retryWithBackoff(fn, {
          maxRetries: 2,
          initialDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 2,
        })
      ).rejects.toThrow('Network error');
      
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
    
    it('should categorize uncategorized errors', async () => {
      const fn = jest.fn()
        .mockRejectedValue(new Error('ECONNREFUSED'));
      
      await expect(
        retryWithBackoff(fn, {
          maxRetries: 1,
          initialDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 2,
        })
      ).rejects.toThrow(ObscuraError);
      
      expect(fn).toHaveBeenCalledTimes(2); // Initial + 1 retry (network error is retryable)
    });
  });
});

describe('Timeout Handling', () => {
  describe('withTimeout', () => {
    it('should resolve if promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      
      const result = await withTimeout(promise, 1000);
      
      expect(result).toBe('success');
    });
    
    it('should reject if promise exceeds timeout', async () => {
      const promise = new Promise((resolve) => setTimeout(() => resolve('late'), 200));
      
      await expect(withTimeout(promise, 100)).rejects.toThrow('Operation timed out');
    });
    
    it('should throw ObscuraError with TIMEOUT category', async () => {
      const promise = new Promise((resolve) => setTimeout(() => resolve('late'), 200));
      
      try {
        await withTimeout(promise, 100);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ObscuraError);
        expect((error as ObscuraError).category).toBe(ErrorCategory.TIMEOUT);
        expect((error as ObscuraError).isRetryable).toBe(true);
      }
    });
  });
});

describe('Circuit Breaker', () => {
  let circuitBreaker: CircuitBreaker;
  
  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 100,
    });
  });
  
  describe('CLOSED state', () => {
    it('should execute function in CLOSED state', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(fn);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
    
    it('should remain CLOSED after successful execution', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      
      await circuitBreaker.execute(fn);
      await circuitBreaker.execute(fn);
      
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });
  
  describe('OPEN state', () => {
    it('should open after failure threshold', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Fail 3 times to reach threshold
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      
      expect(circuitBreaker.getState()).toBe('OPEN');
    });
    
    it('should reject immediately when OPEN', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Open the circuit
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      
      // Should reject immediately without calling fn
      fn.mockClear();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow('Circuit breaker');
      expect(fn).not.toHaveBeenCalled();
    });
  });
  
  describe('HALF_OPEN state', () => {
    it('should enter HALF_OPEN after timeout', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Open the circuit
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      
      expect(circuitBreaker.getState()).toBe('OPEN');
      
      // Wait for timeout
      await sleep(150);
      
      // Next call should enter HALF_OPEN
      fn.mockResolvedValue('success');
      await circuitBreaker.execute(fn);
      
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
    });
    
    it('should close after success threshold in HALF_OPEN', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Open the circuit
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      
      // Wait for timeout
      await sleep(150);
      
      // Succeed twice to close
      fn.mockResolvedValue('success');
      await circuitBreaker.execute(fn);
      await circuitBreaker.execute(fn);
      
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
    
    it('should reopen on failure in HALF_OPEN', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Open the circuit
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      
      // Wait for timeout
      await sleep(150);
      
      // Fail in HALF_OPEN
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      
      expect(circuitBreaker.getState()).toBe('OPEN');
    });
  });
  
  describe('reset', () => {
    it('should reset circuit breaker to CLOSED', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Open the circuit
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      
      expect(circuitBreaker.getState()).toBe('OPEN');
      
      // Reset
      circuitBreaker.reset();
      
      expect(circuitBreaker.getState()).toBe('CLOSED');
      
      // Should execute normally
      fn.mockResolvedValue('success');
      const result = await circuitBreaker.execute(fn);
      expect(result).toBe('success');
    });
  });
});

describe('ObscuraError', () => {
  it('should create error with all properties', () => {
    const originalError = new Error('Original');
    const error = new ObscuraError(
      'Test error',
      ErrorCategory.NETWORK,
      true,
      originalError
    );
    
    expect(error.message).toBe('Test error');
    expect(error.category).toBe(ErrorCategory.NETWORK);
    expect(error.isRetryable).toBe(true);
    expect(error.originalError).toBe(originalError);
    expect(error.name).toBe('ObscuraError');
  });
  
  it('should default isRetryable to false', () => {
    const error = new ObscuraError('Test error', ErrorCategory.UNKNOWN);
    
    expect(error.isRetryable).toBe(false);
  });
});
