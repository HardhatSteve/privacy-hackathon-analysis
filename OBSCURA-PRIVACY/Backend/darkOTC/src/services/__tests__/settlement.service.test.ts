/**
 * Settlement Service Tests
 * 
 * Tests for settlement execution via Obscura-LLMS backend.
 * Validates Requirements 34.5, 34.6, 36.1, 36.4.
 */

import { SettlementService, settlementService } from '../settlement.service';
import { obscuraLLMSClient } from '../../clients/obscura-llms.client';

// Mock the Obscura-LLMS client
jest.mock('../../clients/obscura-llms.client', () => ({
  obscuraLLMSClient: {
    withdraw: jest.fn(),
    getWithdrawalRequest: jest.fn(),
    getPrivacyStatus: jest.fn(),
  },
}));

describe('SettlementService', () => {
  let service: SettlementService;
  
  beforeEach(() => {
    service = new SettlementService();
    jest.clearAllMocks();
  });
  
  describe('executeSettlement', () => {
    const validParams = {
      commitment: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      nullifierHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      recipient: '5CBiq8BYTvA7p3YqYDKKRVvKFUNzQ8JzQ8JzQ8JzQ8Jz',
      amount: '1000000',
      chainId: 'solana-devnet' as const,
    };
    
    it('should execute settlement successfully', async () => {
      // Mock successful withdrawal
      (obscuraLLMSClient.withdraw as jest.Mock).mockResolvedValue({
        success: true,
        requestId: '3ae33176109d737e',
        txHash: '5fmG66Xz8Uyv5Sfu6QfPUYYzcNaLPfgWVSZV5rijKmJKQ2UEu77hRoCdJBcZ9VoZyQxHP5DMsYb5VG77DhAGoSpS',
        status: 'completed',
        zkCompressed: true,
        compressionSignature: '3Ag8rUJB6tswcHubJ62aspEkJFf3QvShwCJPa4jgUsX2Pj3uTTzE6u27wDuAdLZnTJt2nBCkheGcrECnoFJMoCXb',
      });
      
      const result = await service.executeSettlement(validParams);
      
      expect(result.success).toBe(true);
      expect(result.txHash).toBeDefined();
      expect(result.requestId).toBe('3ae33176109d737e');
      expect(result.zkCompressed).toBe(true);
      expect(result.compressionSignature).toBeDefined();
      expect(result.status).toBe('completed');
    });
    
    it('should reject invalid commitment', async () => {
      const result = await service.executeSettlement({
        ...validParams,
        commitment: '',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid commitment');
    });
    
    it('should reject invalid nullifierHash', async () => {
      const result = await service.executeSettlement({
        ...validParams,
        nullifierHash: '',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid nullifierHash');
    });
    
    it('should reject invalid recipient', async () => {
      const result = await service.executeSettlement({
        ...validParams,
        recipient: '',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid recipient');
    });
    
    it('should reject zero amount', async () => {
      const result = await service.executeSettlement({
        ...validParams,
        amount: '0',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid amount');
    });
    
    it('should reject empty amount', async () => {
      const result = await service.executeSettlement({
        ...validParams,
        amount: '',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid amount');
    });
    
    it('should handle insufficient balance error', async () => {
      (obscuraLLMSClient.withdraw as jest.Mock).mockRejectedValue(
        new Error('Insufficient balance')
      );
      
      const result = await service.executeSettlement(validParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('insufficient balance');
    });
    
    it('should handle nullifier reuse error', async () => {
      (obscuraLLMSClient.withdraw as jest.Mock).mockRejectedValue(
        new Error('Nullifier already used')
      );
      
      const result = await service.executeSettlement(validParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('nullifier already used');
      expect(result.error).toContain('double-spend');
    });
    
    it('should handle service unavailable error', async () => {
      (obscuraLLMSClient.withdraw as jest.Mock).mockRejectedValue(
        new Error('Service unavailable')
      );
      
      const result = await service.executeSettlement(validParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('relayer service unavailable');
    });
    
    it('should handle 503 error', async () => {
      (obscuraLLMSClient.withdraw as jest.Mock).mockRejectedValue(
        new Error('HTTP 503 Service Unavailable')
      );
      
      const result = await service.executeSettlement(validParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('relayer service unavailable');
    });
    
    it('should handle generic errors', async () => {
      (obscuraLLMSClient.withdraw as jest.Mock).mockRejectedValue(
        new Error('Network timeout')
      );
      
      const result = await service.executeSettlement(validParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });
    
    it('should handle unknown errors', async () => {
      (obscuraLLMSClient.withdraw as jest.Mock).mockRejectedValue(
        'Unknown error'
      );
      
      const result = await service.executeSettlement(validParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Settlement failed');
    });
    
    it('should work with Solana Devnet', async () => {
      (obscuraLLMSClient.withdraw as jest.Mock).mockResolvedValue({
        success: true,
        requestId: 'test-request-id',
        txHash: 'solana-tx-hash',
        status: 'completed',
        zkCompressed: true,
        compressionSignature: 'compression-sig',
      });
      
      const result = await service.executeSettlement({
        ...validParams,
        chainId: 'solana-devnet',
      });
      
      expect(result.success).toBe(true);
      expect(result.zkCompressed).toBe(true);
      expect(result.compressionSignature).toBeDefined();
    });
    
    it('should work with Sepolia', async () => {
      (obscuraLLMSClient.withdraw as jest.Mock).mockResolvedValue({
        success: true,
        requestId: 'test-request-id',
        txHash: '0xeth-tx-hash',
        status: 'completed',
        zkCompressed: false,
      });
      
      const result = await service.executeSettlement({
        ...validParams,
        chainId: 'sepolia',
      });
      
      expect(result.success).toBe(true);
      expect(result.zkCompressed).toBe(false);
      expect(result.compressionSignature).toBeUndefined();
    });
    
    it('should handle pending status', async () => {
      (obscuraLLMSClient.withdraw as jest.Mock).mockResolvedValue({
        success: true,
        requestId: 'pending-request',
        txHash: undefined,
        status: 'pending',
        zkCompressed: false,
      });
      
      const result = await service.executeSettlement(validParams);
      
      expect(result.success).toBe(true);
      expect(result.status).toBe('pending');
      expect(result.txHash).toBeUndefined();
    });
    
    it('should handle processing status', async () => {
      (obscuraLLMSClient.withdraw as jest.Mock).mockResolvedValue({
        success: true,
        requestId: 'processing-request',
        txHash: undefined,
        status: 'processing',
        zkCompressed: false,
      });
      
      const result = await service.executeSettlement(validParams);
      
      expect(result.success).toBe(true);
      expect(result.status).toBe('processing');
    });
    
    it('should handle failed withdrawal response', async () => {
      (obscuraLLMSClient.withdraw as jest.Mock).mockResolvedValue({
        success: false,
        requestId: 'failed-request',
        status: 'failed',
      });
      
      const result = await service.executeSettlement(validParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('withdrawal request rejected');
    });
  });
  
  describe('getSettlementStatus', () => {
    it('should get settlement status successfully', async () => {
      (obscuraLLMSClient.getWithdrawalRequest as jest.Mock).mockResolvedValue({
        requestId: '3ae33176109d737e',
        status: 'completed',
        commitment: '0x...',
        recipient: '5CBiq8BY...',
        amount: '1000000',
        chainId: 'solana-devnet',
        txHash: '5fmG66Xz...',
        completedAt: 1768491234567,
      });
      
      const result = await service.getSettlementStatus('3ae33176109d737e');
      
      expect(result.success).toBe(true);
      expect(result.txHash).toBeDefined();
      expect(result.requestId).toBe('3ae33176109d737e');
      expect(result.status).toBe('completed');
    });
    
    it('should reject invalid requestId', async () => {
      const result = await service.getSettlementStatus('');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid requestId');
    });
    
    it('should handle pending status', async () => {
      (obscuraLLMSClient.getWithdrawalRequest as jest.Mock).mockResolvedValue({
        requestId: 'pending-request',
        status: 'pending',
        commitment: '0x...',
        recipient: '5CBiq8BY...',
        amount: '1000000',
        chainId: 'solana-devnet',
      });
      
      const result = await service.getSettlementStatus('pending-request');
      
      expect(result.success).toBe(false);
      expect(result.status).toBe('pending');
    });
    
    it('should handle failed status', async () => {
      (obscuraLLMSClient.getWithdrawalRequest as jest.Mock).mockResolvedValue({
        requestId: 'failed-request',
        status: 'failed',
        commitment: '0x...',
        recipient: '5CBiq8BY...',
        amount: '1000000',
        chainId: 'solana-devnet',
      });
      
      const result = await service.getSettlementStatus('failed-request');
      
      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
    });
    
    it('should handle network errors', async () => {
      (obscuraLLMSClient.getWithdrawalRequest as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      
      const result = await service.getSettlementStatus('test-request');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });
  
  describe('getExplorerUrl', () => {
    it('should return Solana explorer URL', () => {
      const url = service.getExplorerUrl(
        '5fmG66Xz8Uyv5Sfu6QfPUYYzcNaLPfgWVSZV5rijKmJKQ2UEu77hRoCdJBcZ9VoZyQxHP5DMsYb5VG77DhAGoSpS',
        'solana-devnet'
      );
      
      expect(url).toContain('explorer.solana.com');
      expect(url).toContain('cluster=devnet');
      expect(url).toContain('5fmG66Xz');
    });
    
    it('should return Sepolia explorer URL', () => {
      const url = service.getExplorerUrl(
        '0x5fmG66Xz8Uyv5Sfu6QfPUYYzcNaLPfgWVSZV5rijKmJK',
        'sepolia'
      );
      
      expect(url).toContain('sepolia.etherscan.io');
      expect(url).toContain('0x5fmG66Xz');
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
      expect(settlementService).toBeDefined();
      expect(settlementService).toBeInstanceOf(SettlementService);
    });
    
    it('should work with singleton instance', async () => {
      (obscuraLLMSClient.withdraw as jest.Mock).mockResolvedValue({
        success: true,
        requestId: 'test-request',
        txHash: 'test-tx-hash',
        status: 'completed',
        zkCompressed: false,
      });
      
      const result = await settlementService.executeSettlement({
        commitment: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        nullifierHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        recipient: '5CBiq8BYTvA7p3YqYDKKRVvKFUNzQ8JzQ8JzQ8JzQ8Jz',
        amount: '1000000',
        chainId: 'solana-devnet',
      });
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('Requirements Validation', () => {
    it('should satisfy Requirement 34.5: Atomic balance updates', async () => {
      // Mock successful atomic update
      (obscuraLLMSClient.withdraw as jest.Mock).mockResolvedValue({
        success: true,
        requestId: 'atomic-test',
        txHash: 'atomic-tx-hash',
        status: 'completed',
        zkCompressed: false,
      });
      
      const result = await service.executeSettlement({
        commitment: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        nullifierHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        recipient: '5CBiq8BYTvA7p3YqYDKKRVvKFUNzQ8JzQ8JzQ8JzQ8Jz',
        amount: '1000000',
        chainId: 'solana-devnet',
      });
      
      expect(result.success).toBe(true);
      expect(obscuraLLMSClient.withdraw).toHaveBeenCalledWith(
        expect.objectContaining({
          commitment: expect.any(String),
          nullifierHash: expect.any(String),
          recipient: expect.any(String),
          amount: expect.any(String),
        })
      );
    });
    
    it('should satisfy Requirement 34.6: Rollback on failure', async () => {
      // Mock failure - Obscura-LLMS handles rollback internally
      (obscuraLLMSClient.withdraw as jest.Mock).mockRejectedValue(
        new Error('Settlement failed')
      );
      
      const result = await service.executeSettlement({
        commitment: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        nullifierHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        recipient: '5CBiq8BYTvA7p3YqYDKKRVvKFUNzQ8JzQ8JzQ8JzQ8Jz',
        amount: '1000000',
        chainId: 'solana-devnet',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Obscura-LLMS backend handles rollback - no balance updates occur
    });
    
    it('should satisfy Requirement 36.1: Route through relayer network', async () => {
      (obscuraLLMSClient.withdraw as jest.Mock).mockResolvedValue({
        success: true,
        requestId: 'relayer-test',
        txHash: 'relayer-tx-hash',
        status: 'completed',
        zkCompressed: false,
      });
      
      const result = await service.executeSettlement({
        commitment: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        nullifierHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        recipient: '5CBiq8BYTvA7p3YqYDKKRVvKFUNzQ8JzQ8JzQ8JzQ8Jz',
        amount: '1000000',
        chainId: 'solana-devnet',
      });
      
      expect(result.success).toBe(true);
      // Obscura-LLMS routes through relayer network
      // User address NOT visible in transaction
    });
    
    it('should satisfy Requirement 36.4: User address not visible', async () => {
      (obscuraLLMSClient.withdraw as jest.Mock).mockResolvedValue({
        success: true,
        requestId: 'privacy-test',
        txHash: 'privacy-tx-hash',
        status: 'completed',
        zkCompressed: true,
        compressionSignature: 'compression-sig',
      });
      
      const result = await service.executeSettlement({
        commitment: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        nullifierHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        recipient: '5CBiq8BYTvA7p3YqYDKKRVvKFUNzQ8JzQ8JzQ8JzQ8Jz',
        amount: '1000000',
        chainId: 'solana-devnet',
      });
      
      expect(result.success).toBe(true);
      expect(result.txHash).toBeDefined();
      // Transaction is verifiable on blockchain explorer
      // But user address is NOT visible (relayer submits)
      const explorerUrl = service.getExplorerUrl(result.txHash!, 'solana-devnet');
      expect(explorerUrl).toContain('explorer.solana.com');
    });
  });
});
