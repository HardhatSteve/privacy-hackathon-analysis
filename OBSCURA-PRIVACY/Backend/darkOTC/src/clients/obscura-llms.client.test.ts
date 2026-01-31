/**
 * Obscura-LLMS Client Error Handling Tests
 * 
 * Tests for comprehensive error handling in Obscura-LLMS client:
 * - Network errors and timeouts
 * - Insufficient balance errors
 * - Relayer unavailability (503 errors)
 * - Retry logic for transient failures
 * - Circuit breaker pattern
 * 
 * Requirements: 36.3
 */

import { ObscuraLLMSClient } from './obscura-llms.client';
import { ObscuraError, ErrorCategory } from '../utils/errors';

// Mock fetch globally
global.fetch = jest.fn();

describe('ObscuraLLMSClient Error Handling', () => {
  let client: ObscuraLLMSClient;
  
  beforeEach(() => {
    // Create client with fast retry config for testing
    client = new ObscuraLLMSClient({
      maxRetries: 2,
      initialDelayMs: 10,
      maxDelayMs: 50,
      backoffMultiplier: 2,
      timeoutMs: 1000,
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('Network Errors', () => {
    it('should retry on network errors', async () => {
      const mockFetch = global.fetch as jest.Mock;
      
      // Fail twice, then succeed
      mockFetch
        .mockRejectedValueOnce(new Error('fetch failed: ECONNREFUSED'))
        .mockRejectedValueOnce(new Error('fetch failed: ECONNREFUSED'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'operational',
            arcium: { configured: true, clusterOffset: '0', version: '0.6.3', programId: 'test' },
            lightProtocol: { configured: true, zkCompression: true },
          }),
        });
      
      const result = await client.getPrivacyStatus();
      
      expect(result.status).toBe('operational');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
    
    it('should throw after max retries on network errors', async () => {
      const mockFetch = global.fetch as jest.Mock;
      
      // Always fail
      mockFetch.mockRejectedValue(new Error('fetch failed: ECONNREFUSED'));
      
      await expect(client.getPrivacyStatus()).rejects.toThrow(ObscuraError);
      
      // Initial + 2 retries = 3 calls
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('Timeout Errors', () => {
    it('should categorize timeout errors correctly', async () => {
      const mockFetch = global.fetch as jest.Mock;
      
      mockFetch.mockRejectedValue(new Error('Request timed out'));
      
      try {
        await client.getPrivacyStatus();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ObscuraError);
        expect((error as ObscuraError).category).toBe(ErrorCategory.TIMEOUT);
        expect((error as ObscuraError).isRetryable).toBe(true);
      }
    });
  });
  
  describe('Insufficient Balance Errors', () => {
    it('should not retry on insufficient balance errors', async () => {
      const mockFetch = global.fetch as jest.Mock;
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'insufficient balance for operation',
      });
      
      try {
        await client.withdraw({
          commitment: 'test-commitment',
          nullifierHash: 'test-nullifier',
          recipient: 'test-recipient',
          amount: '1000',
          chainId: 'solana-devnet',
        });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ObscuraError);
        expect((error as ObscuraError).category).toBe(ErrorCategory.INSUFFICIENT_BALANCE);
        expect((error as ObscuraError).isRetryable).toBe(false);
      }
      
      // Should only try once (no retries for non-retryable errors)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Relayer Unavailable (503) Errors', () => {
    it('should retry on 503 errors', async () => {
      const mockFetch = global.fetch as jest.Mock;
      
      // Fail with 503 twice, then succeed
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          text: async () => 'Service unavailable',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          text: async () => 'Service unavailable',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            totalDeposits: 10,
            totalWithdrawals: 5,
            totalVolume: '1000000',
            pendingRequests: 2,
            usedNullifiers: 5,
          }),
        });
      
      const result = await client.getRelayerStats();
      
      expect(result.totalDeposits).toBe(10);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
    
    it('should categorize 503 errors as RELAYER_UNAVAILABLE', async () => {
      const mockFetch = global.fetch as jest.Mock;
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'Service unavailable',
      });
      
      try {
        await client.getRelayerStats();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ObscuraError);
        expect((error as ObscuraError).category).toBe(ErrorCategory.RELAYER_UNAVAILABLE);
        expect((error as ObscuraError).isRetryable).toBe(true);
      }
    });
  });
  
  describe('Invalid Input Errors', () => {
    it('should not retry on 400 errors', async () => {
      const mockFetch = global.fetch as jest.Mock;
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Invalid request parameters',
      });
      
      try {
        await client.deposit({
          network: 'solana-devnet',
          token: 'native',
          amount: 'invalid',
        });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ObscuraError);
        expect((error as ObscuraError).category).toBe(ErrorCategory.INVALID_INPUT);
        expect((error as ObscuraError).isRetryable).toBe(false);
      }
      
      // Should only try once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Circuit Breaker', () => {
    it('should open circuit after repeated failures', async () => {
      const mockFetch = global.fetch as jest.Mock;
      
      // Always fail
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      // Fail 5 times to open circuit (each attempt retries 2 times)
      for (let i = 0; i < 5; i++) {
        try {
          await client.getPrivacyStatus();
        } catch (error) {
          // Expected
        }
      }
      
      // Circuit should be open now
      expect(client.getCircuitBreakerState()).toBe('OPEN');
      
      // Next call should fail immediately without calling fetch
      const callsBefore = mockFetch.mock.calls.length;
      
      try {
        await client.getPrivacyStatus();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ObscuraError);
        expect((error as ObscuraError).message).toContain('Circuit breaker');
      }
      
      // Should not have made additional fetch calls
      expect(mockFetch.mock.calls.length).toBe(callsBefore);
    });
    
    it('should allow reset of circuit breaker', async () => {
      const mockFetch = global.fetch as jest.Mock;
      
      // Fail to open circuit
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      for (let i = 0; i < 5; i++) {
        try {
          await client.getPrivacyStatus();
        } catch (error) {
          // Expected
        }
      }
      
      expect(client.getCircuitBreakerState()).toBe('OPEN');
      
      // Reset circuit
      client.resetCircuitBreaker();
      
      expect(client.getCircuitBreakerState()).toBe('CLOSED');
      
      // Should work now
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'operational',
          arcium: { configured: true, clusterOffset: '0', version: '0.6.3', programId: 'test' },
          lightProtocol: { configured: true, zkCompression: true },
        }),
      });
      
      const result = await client.getPrivacyStatus();
      expect(result.status).toBe('operational');
    });
  });
  
  describe('Successful Operations', () => {
    it('should handle successful deposit', async () => {
      const mockFetch = global.fetch as jest.Mock;
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          depositNote: {
            commitment: 'test-commitment',
            nullifier: 'test-nullifier',
            nullifierHash: 'test-nullifier-hash',
            secret: 'test-secret',
            amount: '1000',
            token: 'native',
            chainId: 'solana-devnet',
            timestamp: Date.now(),
          },
          txHash: 'test-tx-hash',
          vaultAddress: 'test-vault',
        }),
      });
      
      const result = await client.deposit({
        network: 'solana-devnet',
        token: 'native',
        amount: '1000',
      });
      
      expect(result.success).toBe(true);
      expect(result.txHash).toBe('test-tx-hash');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    
    it('should handle successful withdrawal', async () => {
      const mockFetch = global.fetch as jest.Mock;
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          requestId: 'test-request-id',
          txHash: 'test-tx-hash',
          status: 'completed',
          zkCompressed: true,
          compressionSignature: 'test-signature',
        }),
      });
      
      const result = await client.withdraw({
        commitment: 'test-commitment',
        nullifierHash: 'test-nullifier',
        recipient: 'test-recipient',
        amount: '1000',
        chainId: 'solana-devnet',
      });
      
      expect(result.success).toBe(true);
      expect(result.txHash).toBe('test-tx-hash');
      expect(result.zkCompressed).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('verifyConnection', () => {
    it('should return true when connection is successful', async () => {
      const mockFetch = global.fetch as jest.Mock;
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'operational',
          arcium: { configured: true, clusterOffset: '0', version: '0.6.3', programId: 'test' },
          lightProtocol: { configured: true, zkCompression: true },
        }),
      });
      
      const result = await client.verifyConnection();
      
      expect(result).toBe(true);
    });
    
    it('should return false when connection fails', async () => {
      const mockFetch = global.fetch as jest.Mock;
      
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const result = await client.verifyConnection();
      
      expect(result).toBe(false);
    });
  });
});
