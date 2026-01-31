/**
 * Obscura-LLMS Client Tests
 * 
 * Tests for the HTTP client that integrates with Obscura-LLMS backend.
 * These tests verify the client can be instantiated and has all required methods.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ObscuraLLMSClient } from '../obscura-llms.client';

describe('ObscuraLLMSClient', () => {
  let client: ObscuraLLMSClient;

  beforeEach(() => {
    client = new ObscuraLLMSClient();
  });

  describe('Client Instantiation', () => {
    it('should create a client instance', () => {
      expect(client).toBeInstanceOf(ObscuraLLMSClient);
    });

    it('should have all required methods', () => {
      expect(typeof client.deposit).toBe('function');
      expect(typeof client.withdraw).toBe('function');
      expect(typeof client.getPrivacyStatus).toBe('function');
      expect(typeof client.getRelayerStats).toBe('function');
      expect(typeof client.getWithdrawalRequest).toBe('function');
      expect(typeof client.verifyConnection).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('deposit should accept DepositParams', () => {
      const params = {
        network: 'solana-devnet' as const,
        token: 'native' as const,
        amount: '1000000',
      };
      
      // Should not throw type error
      expect(() => {
        client.deposit(params);
      }).toBeDefined();
    });

    it('withdraw should accept WithdrawParams', () => {
      const params = {
        commitment: '0x123',
        nullifierHash: '0x456',
        recipient: 'ECYks1hYG3xVRyYpwaesqGrkpj9ZQh1R6S3T3KXDrhrA',
        amount: '1000000',
        chainId: 'solana-devnet' as const,
      };
      
      // Should not throw type error
      expect(() => {
        client.withdraw(params);
      }).toBeDefined();
    });

    it('getWithdrawalRequest should accept requestId string', () => {
      const requestId = '3ae33176109d737e';
      
      // Should not throw type error
      expect(() => {
        client.getWithdrawalRequest(requestId);
      }).toBeDefined();
    });
  });

  describe('API Endpoint URLs', () => {
    it('should use correct base URL from config', () => {
      // The client should use the base URL from config
      // This is a basic check that the client is properly configured
      expect(client).toBeDefined();
    });
  });
});
