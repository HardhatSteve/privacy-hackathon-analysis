/**
 * Signature Reuse Detection Integration Test
 * 
 * Tests signature reuse detection with real Supabase database operations.
 * 
 * Requirements tested:
 * - 35.4: Reject operations with reused signatures
 * - 35.5: Maintain record of used signature hashes
 */

import { SignatureService } from '../signature.service';
import { supabaseConfig } from '../../config/supabase.config';

describe('Signature Reuse Detection - Supabase Integration', () => {
  let signatureService: SignatureService;

  beforeAll(async () => {
    signatureService = new SignatureService();
    
    // Verify Supabase connection
    const connected = await supabaseConfig.verifyConnection();
    if (!connected) {
      throw new Error('Supabase connection failed - cannot run integration tests');
    }
  });

  beforeEach(async () => {
    // Clear all signatures before each test
    await signatureService.clearUsedSignatures();
  });

  afterAll(async () => {
    // Clean up after all tests
    await signatureService.clearUsedSignatures();
  });

  describe('Database Operations', () => {
    it('should store signature in Supabase and detect reuse', async () => {
      const signature = 'test_signature_' + Date.now();
      const operationType = 'quote_request';
      const publicKey = 'test_public_key_123';

      // Initially not used
      const check1 = await signatureService.checkSignatureReuse({ signature });
      expect(check1.isReused).toBe(false);

      // Mark as used in database
      const signatureHash = await signatureService.markSignatureUsed(
        signature,
        operationType,
        publicKey
      );

      expect(signatureHash).toBeDefined();
      expect(typeof signatureHash).toBe('string');

      // Should now be detected as reused
      const check2 = await signatureService.checkSignatureReuse({ signature });
      expect(check2.isReused).toBe(true);
      expect(check2.signatureHash).toBe(signatureHash);
    });

    it('should handle concurrent signature checks correctly', async () => {
      const signature = 'concurrent_test_' + Date.now();
      const operationType = 'quote';
      const publicKey = 'concurrent_key';

      // Mark signature as used
      await signatureService.markSignatureUsed(signature, operationType, publicKey);

      // Perform multiple concurrent checks
      const checks = await Promise.all([
        signatureService.checkSignatureReuse({ signature }),
        signatureService.checkSignatureReuse({ signature }),
        signatureService.checkSignatureReuse({ signature }),
      ]);

      // All checks should return the same result
      checks.forEach(check => {
        expect(check.isReused).toBe(true);
        expect(check.signatureHash).toBeDefined();
      });
    });

    it('should persist signatures across service instances', async () => {
      const signature = 'persistent_test_' + Date.now();
      const operationType = 'accept';
      const publicKey = 'persistent_key';

      // Mark signature with first instance
      const service1 = new SignatureService();
      await service1.markSignatureUsed(signature, operationType, publicKey);

      // Check with second instance
      const service2 = new SignatureService();
      const check = await service2.checkSignatureReuse({ signature });

      expect(check.isReused).toBe(true);
    });

    it('should handle duplicate signature marking gracefully', async () => {
      const signature = 'duplicate_test_' + Date.now();
      const operationType = 'cancel';
      const publicKey = 'duplicate_key';

      // Mark signature first time
      const hash1 = await signatureService.markSignatureUsed(
        signature,
        operationType,
        publicKey
      );

      // Mark same signature again (should not throw error)
      const hash2 = await signatureService.markSignatureUsed(
        signature,
        operationType,
        publicKey
      );

      // Both should return the same hash
      expect(hash1).toBe(hash2);

      // Should still be marked as used
      const check = await signatureService.checkSignatureReuse({ signature });
      expect(check.isReused).toBe(true);
    });

    it('should correctly count used signatures in database', async () => {
      // Start with clean state
      const initialCount = await signatureService.getUsedSignaturesCount();

      // Add multiple signatures
      const timestamp = Date.now();
      await signatureService.markSignatureUsed(`sig1_${timestamp}`, 'op1', 'key1');
      await signatureService.markSignatureUsed(`sig2_${timestamp}`, 'op2', 'key2');
      await signatureService.markSignatureUsed(`sig3_${timestamp}`, 'op3', 'key3');

      const finalCount = await signatureService.getUsedSignaturesCount();
      expect(finalCount).toBe(initialCount + 3);
    });

    it('should verify signature hash is stored correctly', async () => {
      const signature = 'hash_test_' + Date.now();
      const operationType = 'message';
      const publicKey = 'hash_key';

      // Mark signature and get hash
      const signatureHash = await signatureService.markSignatureUsed(
        signature,
        operationType,
        publicKey
      );

      // Verify the hash is stored in database
      const isUsed = await signatureService.isSignatureUsed(signatureHash);
      expect(isUsed).toBe(true);

      // Query database directly to verify
      const { data, error } = await supabaseConfig.adminClient
        .from('used_signatures')
        .select('*')
        .eq('signature_hash', signatureHash)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.signature_hash).toBe(signatureHash);
      expect(data?.operation_type).toBe(operationType);
      expect(data?.public_key).toBe(publicKey);
      expect(data?.used_at).toBeDefined();
    });

    it('should handle non-existent signature hash queries', async () => {
      const nonExistentHash = 'nonexistent_hash_' + Date.now();

      const isUsed = await signatureService.isSignatureUsed(nonExistentHash);
      expect(isUsed).toBe(false);
    });

    it('should clear all signatures from database', async () => {
      // Add some signatures
      const timestamp = Date.now();
      await signatureService.markSignatureUsed(`clear1_${timestamp}`, 'op1', 'key1');
      await signatureService.markSignatureUsed(`clear2_${timestamp}`, 'op2', 'key2');

      const countBefore = await signatureService.getUsedSignaturesCount();
      expect(countBefore).toBeGreaterThan(0);

      // Clear all
      await signatureService.clearUsedSignatures();

      const countAfter = await signatureService.getUsedSignaturesCount();
      expect(countAfter).toBe(0);
    });
  });

  describe('Atomicity and Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const signature = 'error_test_' + Date.now();

      // This should not throw even if there are transient database issues
      const check = await signatureService.checkSignatureReuse({ signature });
      expect(check).toBeDefined();
      expect(check.signatureHash).toBeDefined();
    });

    it('should maintain data integrity with rapid operations', async () => {
      const signature = 'rapid_test_' + Date.now();
      const operationType = 'rapid_op';
      const publicKey = 'rapid_key';

      // Perform rapid mark and check operations
      await signatureService.markSignatureUsed(signature, operationType, publicKey);
      const check1 = await signatureService.checkSignatureReuse({ signature });
      const check2 = await signatureService.checkSignatureReuse({ signature });

      expect(check1.isReused).toBe(true);
      expect(check2.isReused).toBe(true);
      expect(check1.signatureHash).toBe(check2.signatureHash);
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 35.4: Reject operations with reused signatures', async () => {
      const signature = 'req_35_4_test_' + Date.now();
      const operationType = 'quote_request';
      const publicKey = 'req_test_key';

      // First use - should be allowed
      const check1 = await signatureService.checkSignatureReuse({ signature });
      expect(check1.isReused).toBe(false);

      // Mark as used
      await signatureService.markSignatureUsed(signature, operationType, publicKey);

      // Second use - should be rejected
      const check2 = await signatureService.checkSignatureReuse({ signature });
      expect(check2.isReused).toBe(true);

      // This demonstrates that the application can reject reused signatures
    });

    it('should satisfy Requirement 35.5: Maintain record of used signature hashes', async () => {
      const signatures = [
        { sig: 'req_35_5_sig1_' + Date.now(), op: 'quote_request', key: 'key1' },
        { sig: 'req_35_5_sig2_' + Date.now(), op: 'quote', key: 'key2' },
        { sig: 'req_35_5_sig3_' + Date.now(), op: 'accept', key: 'key3' },
      ];

      // Mark all signatures as used
      for (const { sig, op, key } of signatures) {
        await signatureService.markSignatureUsed(sig, op, key);
      }

      // Verify all are recorded
      for (const { sig } of signatures) {
        const check = await signatureService.checkSignatureReuse({ signature: sig });
        expect(check.isReused).toBe(true);
      }

      // Verify count increased
      const count = await signatureService.getUsedSignaturesCount();
      expect(count).toBeGreaterThanOrEqual(signatures.length);
    });
  });
});
