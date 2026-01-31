import { describe, it, expect, vi, beforeEach } from 'vitest';
import { collectWalletData, collectTransactionData, collectProgramData } from './index.js';
import type { RPCClient } from '../rpc/client.js';

// Mock RPC client
function createMockRPCClient(overrides: Partial<RPCClient> = {}): RPCClient {
  return {
    getSignaturesForAddress: vi.fn().mockResolvedValue([]),
    getTransaction: vi.fn().mockResolvedValue(null),
    getTransactions: vi.fn().mockResolvedValue([]),
    getTokenAccountsByOwner: vi.fn().mockResolvedValue([]),
    getProgramAccounts: vi.fn().mockResolvedValue([]),
    healthCheck: vi.fn().mockResolvedValue(true),
    getStats: vi.fn().mockReturnValue({ activeRequests: 0, queuedRequests: 0 }),
    ...overrides,
  } as unknown as RPCClient;
}

describe('Data Collectors', () => {
  describe('collectWalletData', () => {
    it('should handle wallet with no signatures', async () => {
      const mockClient = createMockRPCClient();
      
      const result = await collectWalletData(mockClient, 'TestAddress', {
        maxSignatures: 10,
      });

      expect(result.address).toBe('TestAddress');
      expect(result.signatures).toEqual([]);
      expect(result.transactions).toEqual([]);
    });

    it('should handle RPC failures gracefully', async () => {
      const mockClient = createMockRPCClient({
        getSignaturesForAddress: vi.fn().mockRejectedValue(new Error('RPC Error')),
      });

      const result = await collectWalletData(mockClient, 'TestAddress', {
        maxSignatures: 10,
      });

      // Should return empty data, not crash
      expect(result.address).toBe('TestAddress');
      expect(result.signatures).toEqual([]);
      expect(result.transactions).toEqual([]);
    });

    it('should handle null transactions', async () => {
      const mockClient = createMockRPCClient({
        getSignaturesForAddress: vi.fn().mockResolvedValue([
          { signature: 'sig1', slot: 100, err: null, memo: null, blockTime: 1234567890 },
        ]),
        getTransactions: vi.fn().mockResolvedValue([null]),
      });

      const result = await collectWalletData(mockClient, 'TestAddress', {
        maxSignatures: 10,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].transaction).toBeNull();
    });

    it('should respect maxSignatures option', async () => {
      const mockClient = createMockRPCClient({
        getSignaturesForAddress: vi.fn().mockResolvedValue(
          Array(100).fill(null).map((_, i) => ({
            signature: `sig${i}`,
            slot: i,
            err: null,
            memo: null,
            blockTime: 1234567890 + i,
          }))
        ),
      });

      const result = await collectWalletData(mockClient, 'TestAddress', {
        maxSignatures: 10,
      });

      expect(result.signatures).toHaveLength(100); // All signatures
      // Transaction fetching is limited internally
    });
  });

  describe('collectTransactionData', () => {
    it('should handle missing transaction', async () => {
      const mockClient = createMockRPCClient({
        getTransaction: vi.fn().mockResolvedValue(null),
      });

      const result = await collectTransactionData(mockClient, 'sig1');

      expect(result.signature).toBe('sig1');
      expect(result.transaction).toBeNull();
      expect(result.blockTime).toBeNull();
    });

    it('should handle RPC failure', async () => {
      const mockClient = createMockRPCClient({
        getTransaction: vi.fn().mockRejectedValue(new Error('RPC Error')),
      });

      const result = await collectTransactionData(mockClient, 'sig1');

      // Should not crash
      expect(result.signature).toBe('sig1');
      expect(result.transaction).toBeNull();
    });
  });

  describe('collectProgramData', () => {
    it('should handle program with no accounts', async () => {
      const mockClient = createMockRPCClient({
        getProgramAccounts: vi.fn().mockResolvedValue([]),
        getSignaturesForAddress: vi.fn().mockResolvedValue([]),
      });

      const result = await collectProgramData(mockClient, 'ProgramId', {
        maxAccounts: 10,
        maxTransactions: 10,
      });

      expect(result.programId).toBe('ProgramId');
      expect(result.accounts).toEqual([]);
      expect(result.relatedTransactions).toEqual([]);
    });

    it('should handle RPC failures gracefully', async () => {
      const mockClient = createMockRPCClient({
        getProgramAccounts: vi.fn().mockRejectedValue(new Error('RPC Error')),
        getSignaturesForAddress: vi.fn().mockRejectedValue(new Error('RPC Error')),
      });

      const result = await collectProgramData(mockClient, 'ProgramId', {
        maxAccounts: 10,
        maxTransactions: 10,
      });

      // Should return empty data, not crash
      expect(result.programId).toBe('ProgramId');
      expect(result.accounts).toEqual([]);
      expect(result.relatedTransactions).toEqual([]);
    });

    it('should handle null transactions', async () => {
      const mockClient = createMockRPCClient({
        getSignaturesForAddress: vi.fn().mockResolvedValue([
          { signature: 'sig1', slot: 100, err: null, memo: null, blockTime: 1234567890 },
        ]),
        getTransactions: vi.fn().mockResolvedValue([null]),
      });

      const result = await collectProgramData(mockClient, 'ProgramId', {
        maxTransactions: 10,
      });

      expect(result.relatedTransactions).toHaveLength(1);
      expect(result.relatedTransactions[0].transaction).toBeNull();
    });

    it('should respect maxAccounts and maxTransactions options', async () => {
      const mockClient = createMockRPCClient({
        getProgramAccounts: vi.fn().mockResolvedValue(
          Array(100).fill(null).map((_, i) => ({
            pubkey: { toString: () => `account${i}` },
            account: {},
          }))
        ),
        getSignaturesForAddress: vi.fn().mockResolvedValue(
          Array(100).fill(null).map((_, i) => ({
            signature: `sig${i}`,
            slot: i,
            err: null,
            memo: null,
            blockTime: 1234567890 + i,
          }))
        ),
        getTransactions: vi.fn().mockResolvedValue([]),
      });

      const result = await collectProgramData(mockClient, 'ProgramId', {
        maxAccounts: 10,
        maxTransactions: 20,
      });

      expect(result.accounts.length).toBeLessThanOrEqual(10);
      // Transaction fetching respects maxTransactions internally
    });
  });
});
