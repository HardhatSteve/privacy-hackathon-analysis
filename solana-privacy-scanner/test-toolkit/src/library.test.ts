/**
 * Core Library Tests
 * Test the core library functions without requiring funded accounts
 */

import { describe, it, expect } from 'vitest';
import {
  RPCClient,
  collectWalletData,
  normalizeWalletData,
  generateReport,
  createDefaultLabelProvider,
  type PrivacyReport
} from 'solana-privacy-scanner-core';

describe('Core Library Integration', () => {
  describe('RPCClient', () => {
    it('should create RPC client with default endpoint', () => {
      const client = new RPCClient();
      expect(client).toBeDefined();
      expect(client.getConnection()).toBeDefined();
    });

    it('should create RPC client with custom endpoint', () => {
      const client = new RPCClient('https://api.devnet.solana.com');
      expect(client).toBeDefined();
    });

    it('should have rate limiter stats', () => {
      const client = new RPCClient();
      const stats = client.getStats();
      expect(stats).toHaveProperty('activeRequests');
      expect(stats).toHaveProperty('queueLength');
    });
  });

  describe('Label Provider', () => {
    it('should create default label provider', () => {
      const labels = createDefaultLabelProvider();
      expect(labels).toBeDefined();
      expect(labels.getCount()).toBeGreaterThan(0);
    });

    it('should have known exchange addresses', () => {
      const labels = createDefaultLabelProvider();
      const allLabels = labels.getAllLabels();
      const exchanges = allLabels.filter(l => l.type === 'exchange');
      expect(exchanges.length).toBeGreaterThan(0);
    });

    it('should lookup addresses', () => {
      const labels = createDefaultLabelProvider();
      // Known Binance address
      const label = labels.lookup('2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S');
      expect(label).toBeDefined();
      if (label) {
        expect(label.type).toBe('exchange');
      }
    });
  });

  describe('Wallet Scanning', () => {
    it('should scan a wallet and generate report', async () => {
      // Use a known wallet with activity
      const client = new RPCClient();
      const labels = createDefaultLabelProvider();

      // Test wallet (public, well-known address)
      const rawData = await collectWalletData(
        client,
        'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
        { maxSignatures: 10 }
      );

      expect(rawData).toBeDefined();

      // If RPC failed, rawData will have no target (graceful degradation)
      // This is expected behavior when RPC is unreachable
      if (!rawData.target) {
        console.warn('RPC call failed - testing with empty data (this is expected without network)');
      }

      const context = normalizeWalletData(rawData, labels);
      expect(context).toBeDefined();
      expect(context.targetType).toBe('wallet');

      const report = generateReport(context);
      expect(report).toBeDefined();
      expect(report.overallRisk).toMatch(/^(LOW|MEDIUM|HIGH)$/);
      expect(report.signals).toBeInstanceOf(Array);
      expect(report.summary.totalSignals).toBeGreaterThanOrEqual(0);
    }, 30000); // 30s timeout for RPC calls

    it('should handle wallet with no transactions', async () => {
      // Fresh wallet with no activity
      const client = new RPCClient();
      const labels = createDefaultLabelProvider();

      const freshWallet = 'J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxvCHLdz6W5';

      const rawData = await collectWalletData(client, freshWallet);
      const context = normalizeWalletData(rawData, labels);
      const report = generateReport(context);

      expect(report.overallRisk).toBe('LOW');
      expect(report.summary.transactionsAnalyzed).toBe(0);
    }, 15000);
  });

  describe('Report Structure', () => {
    it('should have all required fields in report', async () => {
      const client = new RPCClient();
      const labels = createDefaultLabelProvider();

      const rawData = await collectWalletData(
        client,
        'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
        { maxSignatures: 5 }
      );

      const context = normalizeWalletData(rawData, labels);
      const report = generateReport(context);

      // Check all required report fields
      expect(report).toHaveProperty('version');
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('targetType');
      expect(report).toHaveProperty('target');
      expect(report).toHaveProperty('overallRisk');
      expect(report).toHaveProperty('signals');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('mitigations');
      expect(report).toHaveProperty('knownEntities');

      // Check summary structure
      expect(report.summary).toHaveProperty('totalSignals');
      expect(report.summary).toHaveProperty('highRiskSignals');
      expect(report.summary).toHaveProperty('mediumRiskSignals');
      expect(report.summary).toHaveProperty('lowRiskSignals');
      expect(report.summary).toHaveProperty('transactionsAnalyzed');
    }, 30000);

    it('should have valid signal structure', async () => {
      const client = new RPCClient();
      const labels = createDefaultLabelProvider();

      const rawData = await collectWalletData(
        client,
        'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
        { maxSignatures: 5 }
      );

      const context = normalizeWalletData(rawData, labels);
      const report = generateReport(context);

      if (report.signals.length > 0) {
        const signal = report.signals[0];
        expect(signal).toHaveProperty('id');
        expect(signal).toHaveProperty('name');
        expect(signal).toHaveProperty('severity');
        expect(signal).toHaveProperty('confidence');
        expect(signal).toHaveProperty('reason');
        expect(signal).toHaveProperty('evidence');
        expect(signal.severity).toMatch(/^(LOW|MEDIUM|HIGH)$/);
        expect(signal.confidence).toBeGreaterThanOrEqual(0);
        expect(signal.confidence).toBeLessThanOrEqual(1);
      }
    }, 30000);
  });
});
