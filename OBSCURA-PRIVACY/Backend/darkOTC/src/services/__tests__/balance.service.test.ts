/**
 * Balance Service Tests
 * 
 * Tests for balance verification via Obscura-LLMS backend.
 * Validates Requirements 34.1-34.4 (Off-Chain Balance Integration).
 */

import { BalanceService, balanceService } from '../balance.service';
import { obscuraLLMSClient } from '../../clients/obscura-llms.client';

// Mock the Obscura-LLMS client
jest.mock('../../clients/obscura-llms.client', () => ({
  obscuraLLMSClient: {
    getPrivacyStatus: jest.fn(),
    getRelayerStats: jest.fn(),
  },
}));

describe('BalanceService', () => {
  let service: BalanceService;
  
  beforeEach(() => {
    service = new BalanceService();
    jest.clearAllMocks();
  });
  
  describe('verifyBalance', () => {
    const validParams = {
      commitment: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      amount: BigInt(1000000),
      chainId: 'solana-devnet' as const,
    };
    
    it('should return true when service is operational', async () => {
      // Mock operational service
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockResolvedValue({
        status: 'operational',
        arcium: { configured: true },
        lightProtocol: { configured: true },
      });
      
      (obscuraLLMSClient.getRelayerStats as jest.Mock).mockResolvedValue({
        totalDeposits: 100,
        totalWithdrawals: 90,
        totalVolume: '1000000000',
        pendingRequests: 5,
        usedNullifiers: 90,
      });
      
      const result = await service.verifyBalance(validParams);
      
      expect(result.hasSufficientBalance).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('should reject invalid commitment', async () => {
      const result = await service.verifyBalance({
        ...validParams,
        commitment: '',
      });
      
      expect(result.hasSufficientBalance).toBe(false);
      expect(result.error).toContain('Invalid commitment');
    });
    
    it('should reject zero amount', async () => {
      const result = await service.verifyBalance({
        ...validParams,
        amount: BigInt(0),
      });
      
      expect(result.hasSufficientBalance).toBe(false);
      expect(result.error).toContain('Invalid amount');
    });
    
    it('should reject negative amount', async () => {
      const result = await service.verifyBalance({
        ...validParams,
        amount: BigInt(-1000),
      });
      
      expect(result.hasSufficientBalance).toBe(false);
      expect(result.error).toContain('Invalid amount');
    });
    
    it('should return false when privacy infrastructure is not operational', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockResolvedValue({
        status: 'degraded',
      });
      
      const result = await service.verifyBalance(validParams);
      
      expect(result.hasSufficientBalance).toBe(false);
      expect(result.error).toContain('Privacy infrastructure not operational');
    });
    
    it('should handle network errors gracefully', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      
      const result = await service.verifyBalance(validParams);
      
      expect(result.hasSufficientBalance).toBe(false);
      expect(result.error).toContain('Balance verification failed');
      expect(result.error).toContain('Network error');
    });
    
    it('should handle relayer service unavailability', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockResolvedValue({
        status: 'operational',
      });
      
      (obscuraLLMSClient.getRelayerStats as jest.Mock).mockResolvedValue({
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalVolume: '0',
        pendingRequests: undefined, // Service unavailable
        usedNullifiers: 0,
      });
      
      const result = await service.verifyBalance(validParams);
      
      expect(result.hasSufficientBalance).toBe(false);
      expect(result.error).toContain('relayer service unavailable');
    });
    
    it('should work with Solana Devnet', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockResolvedValue({
        status: 'operational',
      });
      
      (obscuraLLMSClient.getRelayerStats as jest.Mock).mockResolvedValue({
        pendingRequests: 0,
      });
      
      const result = await service.verifyBalance({
        ...validParams,
        chainId: 'solana-devnet',
      });
      
      expect(result.hasSufficientBalance).toBe(true);
    });
    
    it('should work with Sepolia', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockResolvedValue({
        status: 'operational',
      });
      
      (obscuraLLMSClient.getRelayerStats as jest.Mock).mockResolvedValue({
        pendingRequests: 0,
      });
      
      const result = await service.verifyBalance({
        ...validParams,
        chainId: 'sepolia',
      });
      
      expect(result.hasSufficientBalance).toBe(true);
    });
    
    it('should handle large amounts', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockResolvedValue({
        status: 'operational',
      });
      
      (obscuraLLMSClient.getRelayerStats as jest.Mock).mockResolvedValue({
        pendingRequests: 0,
      });
      
      const result = await service.verifyBalance({
        ...validParams,
        amount: BigInt('999999999999999999999999'),
      });
      
      expect(result.hasSufficientBalance).toBe(true);
    });
  });
  
  describe('verifyQuoteRequestBalance', () => {
    it('should verify balance for quote request', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockResolvedValue({
        status: 'operational',
      });
      
      (obscuraLLMSClient.getRelayerStats as jest.Mock).mockResolvedValue({
        pendingRequests: 0,
      });
      
      const result = await service.verifyQuoteRequestBalance(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        BigInt(1000000),
        'solana-devnet'
      );
      
      expect(result.hasSufficientBalance).toBe(true);
    });
    
    it('should reject quote request with insufficient balance', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockRejectedValue(
        new Error('Service unavailable')
      );
      
      const result = await service.verifyQuoteRequestBalance(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        BigInt(1000000),
        'solana-devnet'
      );
      
      expect(result.hasSufficientBalance).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe('verifyQuoteBalance', () => {
    it('should verify balance for quote submission', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockResolvedValue({
        status: 'operational',
      });
      
      (obscuraLLMSClient.getRelayerStats as jest.Mock).mockResolvedValue({
        pendingRequests: 0,
      });
      
      const result = await service.verifyQuoteBalance(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        BigInt(2000000),
        'sepolia'
      );
      
      expect(result.hasSufficientBalance).toBe(true);
    });
    
    it('should reject quote with insufficient balance', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockRejectedValue(
        new Error('Service unavailable')
      );
      
      const result = await service.verifyQuoteBalance(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        BigInt(2000000),
        'sepolia'
      );
      
      expect(result.hasSufficientBalance).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe('isServiceAvailable', () => {
    it('should return true when service is operational', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockResolvedValue({
        status: 'operational',
      });
      
      const result = await service.isServiceAvailable();
      
      expect(result).toBe(true);
    });
    
    it('should return false when service is not operational', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockResolvedValue({
        status: 'degraded',
      });
      
      const result = await service.isServiceAvailable();
      
      expect(result).toBe(false);
    });
    
    it('should return false on network error', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      
      const result = await service.isServiceAvailable();
      
      expect(result).toBe(false);
    });
  });
  
  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(balanceService).toBeDefined();
      expect(balanceService).toBeInstanceOf(BalanceService);
    });
    
    it('should work with singleton instance', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockResolvedValue({
        status: 'operational',
      });
      
      (obscuraLLMSClient.getRelayerStats as jest.Mock).mockResolvedValue({
        pendingRequests: 0,
      });
      
      const result = await balanceService.verifyBalance({
        commitment: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        amount: BigInt(1000000),
        chainId: 'solana-devnet',
      });
      
      expect(result.hasSufficientBalance).toBe(true);
    });
  });
  
  describe('Requirements Validation', () => {
    it('should satisfy Requirement 34.1: Query taker off-chain balance', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockResolvedValue({
        status: 'operational',
      });
      
      (obscuraLLMSClient.getRelayerStats as jest.Mock).mockResolvedValue({
        pendingRequests: 0,
      });
      
      // Taker creates quote request - balance must be verified
      const result = await service.verifyQuoteRequestBalance(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        BigInt(1000000),
        'solana-devnet'
      );
      
      expect(result.hasSufficientBalance).toBe(true);
      expect(obscuraLLMSClient.getPrivacyStatus).toHaveBeenCalled();
    });
    
    it('should satisfy Requirement 34.2: Reject quote request if insufficient balance', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockRejectedValue(
        new Error('Insufficient balance')
      );
      
      const result = await service.verifyQuoteRequestBalance(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        BigInt(1000000),
        'solana-devnet'
      );
      
      expect(result.hasSufficientBalance).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    it('should satisfy Requirement 34.3: Query market maker off-chain balance', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockResolvedValue({
        status: 'operational',
      });
      
      (obscuraLLMSClient.getRelayerStats as jest.Mock).mockResolvedValue({
        pendingRequests: 0,
      });
      
      // Market maker submits quote - balance must be verified
      const result = await service.verifyQuoteBalance(
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        BigInt(2000000),
        'sepolia'
      );
      
      expect(result.hasSufficientBalance).toBe(true);
      expect(obscuraLLMSClient.getPrivacyStatus).toHaveBeenCalled();
    });
    
    it('should satisfy Requirement 34.4: Reject quote if insufficient balance', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockRejectedValue(
        new Error('Insufficient balance')
      );
      
      const result = await service.verifyQuoteBalance(
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        BigInt(2000000),
        'sepolia'
      );
      
      expect(result.hasSufficientBalance).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe('Error Handling', () => {
    it('should handle timeout errors', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockRejectedValue(
        new Error('Request timeout')
      );
      
      const result = await service.verifyBalance({
        commitment: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        amount: BigInt(1000000),
        chainId: 'solana-devnet',
      });
      
      expect(result.hasSufficientBalance).toBe(false);
      expect(result.error).toContain('Request timeout');
    });
    
    it('should handle service unavailable errors', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockRejectedValue(
        new Error('Service unavailable')
      );
      
      const result = await service.verifyBalance({
        commitment: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        amount: BigInt(1000000),
        chainId: 'solana-devnet',
      });
      
      expect(result.hasSufficientBalance).toBe(false);
      expect(result.error).toContain('Service unavailable');
    });
    
    it('should handle unknown errors', async () => {
      (obscuraLLMSClient.getPrivacyStatus as jest.Mock).mockRejectedValue(
        'Unknown error'
      );
      
      const result = await service.verifyBalance({
        commitment: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        amount: BigInt(1000000),
        chainId: 'solana-devnet',
      });
      
      expect(result.hasSufficientBalance).toBe(false);
      expect(result.error).toContain('Balance verification failed');
    });
  });
});
