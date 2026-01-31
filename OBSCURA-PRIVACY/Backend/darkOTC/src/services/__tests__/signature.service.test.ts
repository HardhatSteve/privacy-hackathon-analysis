/**
 * Signature Service Tests
 * 
 * Tests for WOTS+ signature verification and reuse detection.
 * 
 * Requirements tested:
 * - 35.1: Require WOTS+ signature for all RFQ operations
 * - 35.2: Validate signatures against claimed sender's public key
 * - 35.3: Reject operations with invalid signatures
 * - 35.4: Reject operations with reused signatures
 * - 35.5: Maintain record of used signature hashes
 */

import { SignatureService } from '../signature.service';
import { createTestWallet, getWalletAddress } from '../../test-helpers/wots-wallet-helper';

describe('SignatureService', () => {
  let signatureService: SignatureService;

  beforeEach(() => {
    signatureService = new SignatureService();
  });

  afterEach(async () => {
    await signatureService.clearUsedSignatures();
  });

  describe('verifySignature', () => {
    it('should verify a valid WOTS+ signature', () => {
      // Create a WOTS wallet with a deterministic secret
      const secret = new Uint8Array(32).fill(0x42);
      const tag = new Uint8Array(20).fill(0x12);
      const wallet = createTestWallet('Test Wallet', secret, tag);

      // Message to sign
      const message = 'Hello, Obscura RFQ!';
      const messageBytes = new TextEncoder().encode(message);

      // Sign the message
      const signatureBytes = wallet.sign(messageBytes);

      // Get the public key (full WOTS address - 2208 bytes)
      const publicKeyHex = getWalletAddress(wallet);

      // Convert signature to hex string
      const signatureHex = Buffer.from(signatureBytes).toString('hex');

      // Verify the signature
      const result = signatureService.verifySignature({
        message,
        signature: signatureHex,
        publicKey: publicKeyHex,
      });

      expect(result.isValid).toBe(true);
      expect(result.signatureHash).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should reject an invalid signature', () => {
      // Create a WOTS wallet
      const secret = new Uint8Array(32).fill(0x42);
      const tag = new Uint8Array(20).fill(0x12);
      const wallet = createTestWallet('Test Wallet', secret, tag);

      // Message to sign
      const message = 'Hello, Obscura RFQ!';
      const messageBytes = new TextEncoder().encode(message);

      // Sign the message
      const signatureBytes = wallet.sign(messageBytes);

      // Get the public key
      const publicKeyHex = getWalletAddress(wallet);

      // Corrupt the signature by modifying a byte
      signatureBytes[100] = signatureBytes[100] ^ 0xFF;

      // Convert corrupted signature to hex string
      const signatureHex = Buffer.from(signatureBytes).toString('hex');

      // Verify the corrupted signature
      const result = signatureService.verifySignature({
        message,
        signature: signatureHex,
        publicKey: publicKeyHex,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject a signature for a different message', () => {
      // Create a WOTS wallet
      const secret = new Uint8Array(32).fill(0x42);
      const tag = new Uint8Array(20).fill(0x12);
      const wallet = createTestWallet('Test Wallet', secret, tag);

      // Original message
      const originalMessage = 'Hello, Obscura RFQ!';
      const originalMessageBytes = new TextEncoder().encode(originalMessage);

      // Sign the original message
      const signatureBytes = wallet.sign(originalMessageBytes);

      // Get the public key
      const publicKeyHex = getWalletAddress(wallet);

      // Convert signature to hex string
      const signatureHex = Buffer.from(signatureBytes).toString('hex');

      // Try to verify with a different message
      const differentMessage = 'Different message!';
      const result = signatureService.verifySignature({
        message: differentMessage,
        signature: signatureHex,
        publicKey: publicKeyHex,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject a signature with wrong public key', () => {
      // Create two WOTS wallets
      const secret1 = new Uint8Array(32).fill(0x42);
      const tag1 = new Uint8Array(20).fill(0x12);
      const wallet1 = createTestWallet('Wallet 1', secret1, tag1);

      const secret2 = new Uint8Array(32).fill(0x99);
      const tag2 = new Uint8Array(20).fill(0x34);
      const wallet2 = createTestWallet('Wallet 2', secret2, tag2);

      // Message to sign
      const message = 'Hello, Obscura RFQ!';
      const messageBytes = new TextEncoder().encode(message);

      // Sign with wallet1
      const signatureBytes = wallet1.sign(messageBytes);

      // Get wallet2's public key (wrong key)
      const publicKeyHex = getWalletAddress(wallet2);

      // Convert signature to hex string
      const signatureHex = Buffer.from(signatureBytes).toString('hex');

      // Verify with wrong public key
      const result = signatureService.verifySignature({
        message,
        signature: signatureHex,
        publicKey: publicKeyHex,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle Uint8Array message input', () => {
      // Create a WOTS wallet
      const secret = new Uint8Array(32).fill(0x42);
      const tag = new Uint8Array(20).fill(0x12);
      const wallet = createTestWallet('Test Wallet', secret, tag);

      // Message as Uint8Array
      const messageBytes = new Uint8Array([1, 2, 3, 4, 5]);

      // Sign the message
      const signatureBytes = wallet.sign(messageBytes);

      // Get the public key
      const publicKeyHex = getWalletAddress(wallet);

      // Convert signature to hex string
      const signatureHex = Buffer.from(signatureBytes).toString('hex');

      // Verify the signature
      const result = signatureService.verifySignature({
        message: messageBytes,
        signature: signatureHex,
        publicKey: publicKeyHex,
      });

      expect(result.isValid).toBe(true);
      expect(result.signatureHash).toBeDefined();
    });

    it('should handle 0x-prefixed hex strings', () => {
      // Create a WOTS wallet
      const secret = new Uint8Array(32).fill(0x42);
      const tag = new Uint8Array(20).fill(0x12);
      const wallet = createTestWallet('Test Wallet', secret, tag);

      // Message to sign
      const message = 'Hello, Obscura RFQ!';
      const messageBytes = new TextEncoder().encode(message);

      // Sign the message
      const signatureBytes = wallet.sign(messageBytes);

      // Get the public key
      const publicKeyHex = getWalletAddress(wallet);

      // Convert signature to hex string with 0x prefix
      const signatureHex = '0x' + Buffer.from(signatureBytes).toString('hex');
      const publicKeyHexPrefixed = '0x' + publicKeyHex;

      // Verify the signature
      const result = signatureService.verifySignature({
        message,
        signature: signatureHex,
        publicKey: publicKeyHexPrefixed,
      });

      expect(result.isValid).toBe(true);
      expect(result.signatureHash).toBeDefined();
    });
  });

  describe('checkSignatureReuse', () => {
    it('should detect that a new signature has not been used', async () => {
      const signature = 'abcdef1234567890';

      const result = await signatureService.checkSignatureReuse({ signature });

      expect(result.isReused).toBe(false);
      expect(result.signatureHash).toBeDefined();
    });

    it('should detect that a signature has been reused', async () => {
      const signature = 'abcdef1234567890';

      // Mark signature as used
      await signatureService.markSignatureUsed(signature, 'test_operation', 'test_public_key');

      // Check if signature is reused
      const result = await signatureService.checkSignatureReuse({ signature });

      expect(result.isReused).toBe(true);
      expect(result.signatureHash).toBeDefined();
    });
  });

  describe('markSignatureUsed', () => {
    it('should mark a signature as used', async () => {
      const signature = 'abcdef1234567890';

      // Initially not used
      expect((await signatureService.checkSignatureReuse({ signature })).isReused).toBe(false);

      // Mark as used
      const signatureHash = await signatureService.markSignatureUsed(
        signature,
        'test_operation',
        'test_public_key'
      );

      // Now should be used
      expect((await signatureService.checkSignatureReuse({ signature })).isReused).toBe(true);
      expect(await signatureService.isSignatureUsed(signatureHash)).toBe(true);
    });

    it('should return the same hash for the same signature', async () => {
      const signature = 'abcdef1234567890';

      const hash1 = await signatureService.markSignatureUsed(
        signature,
        'test_operation',
        'test_public_key'
      );
      const hash2 = await signatureService.markSignatureUsed(
        signature,
        'test_operation',
        'test_public_key'
      );

      expect(hash1).toBe(hash2);
    });
  });

  describe('isSignatureUsed', () => {
    it('should return false for unused signature hash', async () => {
      const signatureHash = 'nonexistent-hash';

      expect(await signatureService.isSignatureUsed(signatureHash)).toBe(false);
    });

    it('should return true for used signature hash', async () => {
      const signature = 'abcdef1234567890';
      const signatureHash = await signatureService.markSignatureUsed(
        signature,
        'test_operation',
        'test_public_key'
      );

      expect(await signatureService.isSignatureUsed(signatureHash)).toBe(true);
    });
  });

  describe('clearUsedSignatures', () => {
    it('should clear all used signatures', async () => {
      // Mark multiple signatures as used
      await signatureService.markSignatureUsed('sig1', 'test_op', 'key1');
      await signatureService.markSignatureUsed('sig2', 'test_op', 'key2');
      await signatureService.markSignatureUsed('sig3', 'test_op', 'key3');

      expect(await signatureService.getUsedSignaturesCount()).toBe(3);

      // Clear all
      await signatureService.clearUsedSignatures();

      expect(await signatureService.getUsedSignaturesCount()).toBe(0);
      expect((await signatureService.checkSignatureReuse({ signature: 'sig1' })).isReused).toBe(false);
    });
  });

  describe('getUsedSignaturesCount', () => {
    it('should return the correct count of used signatures', async () => {
      expect(await signatureService.getUsedSignaturesCount()).toBe(0);

      await signatureService.markSignatureUsed('sig1', 'test_op', 'key1');
      expect(await signatureService.getUsedSignaturesCount()).toBe(1);

      await signatureService.markSignatureUsed('sig2', 'test_op', 'key2');
      expect(await signatureService.getUsedSignaturesCount()).toBe(2);

      await signatureService.markSignatureUsed('sig3', 'test_op', 'key3');
      expect(await signatureService.getUsedSignaturesCount()).toBe(3);

      // Marking the same signature again should not increase count
      await signatureService.markSignatureUsed('sig1', 'test_op', 'key1');
      expect(await signatureService.getUsedSignaturesCount()).toBe(3);
    });
  });

  describe('Integration: Full signature workflow', () => {
    it('should verify signature and prevent reuse', async () => {
      // Create a WOTS wallet
      const secret = new Uint8Array(32).fill(0x42);
      const tag = new Uint8Array(20).fill(0x12);
      const wallet = createTestWallet('Test Wallet', secret, tag);

      // Message to sign
      const message = 'Quote request for SOL/USDC';
      const messageBytes = new TextEncoder().encode(message);

      // Sign the message
      const signatureBytes = wallet.sign(messageBytes);

      // Get the public key
      const publicKeyHex = getWalletAddress(wallet);

      // Convert signature to hex string
      const signatureHex = Buffer.from(signatureBytes).toString('hex');

      // First verification should succeed
      const result1 = signatureService.verifySignature({
        message,
        signature: signatureHex,
        publicKey: publicKeyHex,
      });

      expect(result1.isValid).toBe(true);
      expect(result1.signatureHash).toBeDefined();

      // Mark signature as used
      await signatureService.markSignatureUsed(signatureHex, 'quote_request', publicKeyHex);

      // Check that signature is now marked as reused
      const reuseCheck = await signatureService.checkSignatureReuse({
        signature: signatureHex,
      });

      expect(reuseCheck.isReused).toBe(true);

      // Second verification should still succeed (signature is valid)
      // but the application should reject it due to reuse
      const result2 = signatureService.verifySignature({
        message,
        signature: signatureHex,
        publicKey: publicKeyHex,
      });

      expect(result2.isValid).toBe(true);
      expect(reuseCheck.isReused).toBe(true); // But it's reused!
    });
  });
});
