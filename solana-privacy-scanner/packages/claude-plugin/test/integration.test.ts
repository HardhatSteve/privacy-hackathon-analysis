/**
 * Integration tests for Claude Code plugin skills
 *
 * Tests all 4 skills independently and in chained workflows
 */

import { describe, it, expect } from 'vitest';
import { analyzeCode } from '../dist/src/analyzer.js';
import { scanWalletPrivacy } from '../dist/src/scanner.js';
import { explainPrivacyRisk, listAvailableRisks } from '../dist/src/explainer.js';
import { suggestPrivacyFix, listAvailableFixes } from '../dist/src/fixer.js';

describe('Integration Tests - All Skills', () => {
  describe('Skill 1: scan-code', () => {
    it('should detect fee payer reuse in bad code', async () => {
      const result = await analyzeCode({
        paths: ['../../test-toolkit/src/fee-payer-bad.ts'],
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.totalIssues).toBeGreaterThan(0);
      expect(result.data.criticalCount).toBeGreaterThan(0);
    });

    it('should detect PII in memos', async () => {
      const result = await analyzeCode({
        paths: ['../../test-toolkit/src/memo-pii-bad.ts'],
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.totalIssues).toBeGreaterThan(0);
      // Should find emails, phones, etc.
    });

    it('should return 0 issues for clean code', async () => {
      const result = await analyzeCode({
        paths: ['../../test-toolkit/src/good-example.ts'],
      });

      expect(result.success).toBe(true);
      expect(result.data.totalIssues).toBe(0);
    });
  });

  describe('Skill 2: scan-wallet', () => {
    it('should scan a real wallet and generate report', async () => {
      const result = await scanWalletPrivacy({
        address: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
        maxSignatures: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.summary).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.message).toContain('Privacy Scan Results');
    });

    it('should handle invalid wallet address', async () => {
      const result = await scanWalletPrivacy({
        address: 'invalid-address',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid Solana address');
    });
  });

  describe('Skill 3: explain-risk', () => {
    it('should explain fee-payer-reuse risk', async () => {
      const result = await explainPrivacyRisk({
        riskId: 'fee-payer-reuse',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe('fee-payer-reuse');
      expect(result.data.severity).toBe('CRITICAL');
      expect(result.message).toContain('Fee Payer Reuse');
      expect(result.message).toContain('What This Is');
      expect(result.message).toContain('Prevention Strategies');
    });

    it('should list all available risks', async () => {
      const result = await listAvailableRisks();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Available Privacy Risk Explanations');
      expect(result.message).toContain('fee-payer-reuse');
      expect(result.message).toContain('memo-pii');
      expect(result.message).toContain('Total risks documented: 16');
    });

    it('should handle invalid risk ID', async () => {
      const result = await explainPrivacyRisk({
        riskId: 'invalid-risk-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown risk ID');
    });
  });

  describe('Skill 4: suggest-fix', () => {
    it('should suggest fix for fee-payer-reuse', async () => {
      const result = await suggestPrivacyFix({
        riskId: 'fee-payer-reuse',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe('fee-payer-reuse');
      expect(result.message).toContain('Current Code');
      expect(result.message).toContain('Fixed Code');
      expect(result.message).toContain('Alternative Approaches');
      expect(result.message).toContain('Testing Recommendations');
    });

    it('should suggest fix for memo-pii', async () => {
      const result = await suggestPrivacyFix({
        riskId: 'memo-pii',
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('memo-pii');
      expect(result.message).toContain('UUID');
      expect(result.message).toContain('off-chain database');
    });

    it('should list all available fixes', async () => {
      const result = await listAvailableFixes();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Available Fix Templates');
      expect(result.message).toContain('CRITICAL Fixes');
      expect(result.message).toContain('Total fix templates available: 10');
    });

    it('should handle invalid risk ID', async () => {
      const result = await suggestPrivacyFix({
        riskId: 'invalid-risk-id',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown risk ID');
    });
  });

  describe('Workflow Tests - Skill Chaining', () => {
    it('should complete full workflow: scan → explain → fix', async () => {
      // Step 1: Scan code and detect issue
      const scanResult = await analyzeCode({
        paths: ['../../test-toolkit/src/fee-payer-bad.ts'],
      });

      expect(scanResult.success).toBe(true);
      expect(scanResult.data.criticalCount).toBeGreaterThan(0);

      // Step 2: Explain the detected risk
      const explainResult = await explainPrivacyRisk({
        riskId: 'fee-payer-reuse',
      });

      expect(explainResult.success).toBe(true);
      expect(explainResult.data.severity).toBe('CRITICAL');

      // Step 3: Get fix suggestion
      const fixResult = await suggestPrivacyFix({
        riskId: 'fee-payer-reuse',
      });

      expect(fixResult.success).toBe(true);
      expect(fixResult.message).toContain('feePayer = Keypair.generate()');
    });

    it('should complete wallet workflow: scan → explain → fix', async () => {
      // Step 1: Scan wallet
      const scanResult = await scanWalletPrivacy({
        address: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
        maxSignatures: 10,
      });

      expect(scanResult.success).toBe(true);

      // Step 2: Explain a common risk
      const explainResult = await explainPrivacyRisk({
        riskId: 'timing-burst',
      });

      expect(explainResult.success).toBe(true);

      // Step 3: Get fix for timing patterns
      const fixResult = await suggestPrivacyFix({
        riskId: 'timing-burst',
      });

      expect(fixResult.success).toBe(true);
      expect(fixResult.message).toContain('random');
      expect(fixResult.message).toContain('jitter');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing file paths gracefully', async () => {
      const result = await analyzeCode({
        paths: ['nonexistent-file.ts'],
      });

      // Should either succeed with 0 issues or fail gracefully
      expect(result).toBeDefined();
    });

    it('should handle network errors in wallet scanning', async () => {
      // This might timeout or fail - we just want to ensure no crash
      const result = await scanWalletPrivacy({
        address: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
        rpcUrl: 'https://invalid-rpc-endpoint.com',
        maxSignatures: 1,
      });

      // Should fail gracefully
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });

  describe('Output Formatting', () => {
    it('should format scan-code output as markdown', async () => {
      const result = await analyzeCode({
        paths: ['../../test-toolkit/src/fee-payer-bad.ts'],
      });

      expect(result.message).toContain('#');
      expect(result.message).toContain('Static Analysis Results');
      expect(result.message).toContain('##');
    });

    it('should format explain-risk output as markdown', async () => {
      const result = await explainPrivacyRisk({
        riskId: 'fee-payer-reuse',
      });

      expect(result.message).toContain('#');
      expect(result.message).toContain('##');
      expect(result.message).toContain('🔴');
    });

    it('should format suggest-fix output as markdown', async () => {
      const result = await suggestPrivacyFix({
        riskId: 'fee-payer-reuse',
      });

      expect(result.message).toContain('```typescript');
      expect(result.message).toContain('❌');
      expect(result.message).toContain('✅');
    });
  });
});
