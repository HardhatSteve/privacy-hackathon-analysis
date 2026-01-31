import { describe, it, expect } from 'vitest';
import {
  normalizeWalletData,
  normalizeTransactionData,
  normalizeProgramData,
} from './index.js';
import type { RawWalletData, RawTransactionData, RawProgramData } from '../types/index.js';

describe('Data Normalization', () => {
  describe('normalizeWalletData', () => {
    it('should handle empty wallet data', () => {
      const rawData: RawWalletData = {
        address: 'TestAddress123',
        signatures: [],
        transactions: [],
        tokenAccounts: [],
      };

      const context = normalizeWalletData(rawData);

      expect(context.target).toBe('TestAddress123');
      expect(context.targetType).toBe('wallet');
      expect(context.transfers).toEqual([]);
      expect(context.instructions).toEqual([]);
      expect(context.counterparties.size).toBe(0);
      expect(context.transactionCount).toBe(0);
      expect(context.timeRange.earliest).toBeNull();
      expect(context.timeRange.latest).toBeNull();
    });

    it('should handle undefined transactions array', () => {
      const rawData = {
        address: 'TestAddress123',
        signatures: [],
        transactions: undefined as any,
        tokenAccounts: [],
      };

      const context = normalizeWalletData(rawData);

      expect(context.target).toBe('TestAddress123');
      expect(context.transfers).toEqual([]);
      expect(context.transactionCount).toBe(0);
    });

    it('should handle null transaction objects', () => {
      const rawData: RawWalletData = {
        address: 'TestAddress123',
        signatures: [],
        transactions: [
          {
            signature: 'sig1',
            transaction: null,
            blockTime: null,
          },
        ],
        tokenAccounts: [],
      };

      const context = normalizeWalletData(rawData);

      expect(context.target).toBe('TestAddress123');
      expect(context.transfers).toEqual([]);
      expect(context.transactionCount).toBe(1);
    });

    it('should handle malformed transaction data', () => {
      const rawData: RawWalletData = {
        address: 'TestAddress123',
        signatures: [],
        transactions: [
          {
            signature: 'sig1',
            transaction: {
              // Missing required fields
            } as any,
            blockTime: null,
          },
        ],
        tokenAccounts: [],
      };

      // Should not throw - graceful error handling
      expect(() => normalizeWalletData(rawData)).not.toThrow();
    });
  });

  describe('normalizeTransactionData', () => {
    it('should handle empty transaction data', () => {
      const rawData: RawTransactionData = {
        signature: 'sig1',
        transaction: null,
        blockTime: null,
      };

      const context = normalizeTransactionData(rawData);

      expect(context.target).toBe('sig1');
      expect(context.targetType).toBe('transaction');
      expect(context.transfers).toEqual([]);
      expect(context.instructions).toEqual([]);
      expect(context.transactionCount).toBe(0);
    });

    it('should handle null transaction', () => {
      const rawData: RawTransactionData = {
        signature: 'sig1',
        transaction: null,
        blockTime: 1234567890,
      };

      const context = normalizeTransactionData(rawData);

      expect(context.target).toBe('sig1');
      expect(context.transfers).toEqual([]);
      expect(context.timeRange.earliest).toBeNull();
    });

    it('should handle undefined transaction', () => {
      const rawData = {
        signature: 'sig1',
        transaction: undefined as any,
        blockTime: null,
      };

      const context = normalizeTransactionData(rawData);

      expect(context.target).toBe('sig1');
      expect(context.transfers).toEqual([]);
    });
  });

  describe('normalizeProgramData', () => {
    it('should handle empty program data', () => {
      const rawData: RawProgramData = {
        programId: 'ProgramId123',
        accounts: [],
        relatedTransactions: [],
      };

      const context = normalizeProgramData(rawData);

      expect(context.target).toBe('ProgramId123');
      expect(context.targetType).toBe('program');
      expect(context.transfers).toEqual([]);
      expect(context.instructions).toEqual([]);
      expect(context.counterparties.size).toBe(0);
      expect(context.transactionCount).toBe(0);
      expect(context.timeRange.earliest).toBeNull();
      expect(context.timeRange.latest).toBeNull();
    });

    it('should handle undefined relatedTransactions', () => {
      const rawData = {
        programId: 'ProgramId123',
        accounts: [],
        relatedTransactions: undefined as any,
      };

      const context = normalizeProgramData(rawData);

      expect(context.target).toBe('ProgramId123');
      expect(context.transfers).toEqual([]);
      expect(context.transactionCount).toBe(0);
    });

    it('should handle null transactions in array', () => {
      const rawData: RawProgramData = {
        programId: 'ProgramId123',
        accounts: [],
        relatedTransactions: [
          {
            signature: 'sig1',
            transaction: null,
            blockTime: null,
          },
          {
            signature: 'sig2',
            transaction: null,
            blockTime: 1234567890,
          },
        ],
      };

      const context = normalizeProgramData(rawData);

      expect(context.target).toBe('ProgramId123');
      expect(context.transfers).toEqual([]);
      expect(context.transactionCount).toBe(2);
    });

    it('should not crash with malformed transaction data', () => {
      const rawData: RawProgramData = {
        programId: 'ProgramId123',
        accounts: [],
        relatedTransactions: [
          {
            signature: 'sig1',
            transaction: {
              // Malformed - missing required fields
            } as any,
            blockTime: null,
          },
        ],
      };

      // Should not throw
      expect(() => normalizeProgramData(rawData)).not.toThrow();
    });
  });
});
