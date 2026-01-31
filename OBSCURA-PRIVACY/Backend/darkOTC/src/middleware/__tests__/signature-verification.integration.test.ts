/**
 * Signature Verification Integration Tests
 * 
 * Integration tests for signature verification with database.
 * Tests the complete signature verification flow with signature tracking.
 * 
 * Note: Real WOTS+ signature tests are in signature.service.test.ts
 * This file focuses on middleware integration with database.
 * 
 * Requirements:
 * - 35.1: Require WOTS+ signature for all RFQ operations
 * - 35.2: Validate signatures against claimed sender's public key
 * - 35.3: Reject operations with invalid signatures
 * - 35.4: Reject operations with reused signatures
 * - 35.5: Maintain record of used signature hashes
 */

import {
  verifySignatureStandalone,
  buildSignatureMessage,
} from '../signature-verification.middleware';
import { signatureService } from '../../services/signature.service';
import { ErrorCode } from '../../types/api.types';

// Mock the signature service for integration tests
jest.mock('../../services/signature.service');

describe('Signature Verification Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildSignatureMessage', () => {
    it('should build consistent messages for quote requests', () => {
      const data = {
        assetPair: 'SOL/USDC',
        direction: 'buy',
        amount: '100',
        timeout: 1234567890,
      };

      const message1 = buildSignatureMessage('quote_request', data);
      const message2 = buildSignatureMessage('quote_request', data);

      expect(message1).toBe(message2);
      expect(message1).toContain('SOL/USDC');
      expect(message1).toContain('buy');
      expect(message1).toContain('100');
    });

    it('should build different messages for different data', () => {
      const data1 = {
        assetPair: 'SOL/USDC',
        direction: 'buy',
        amount: '100',
        timeout: 1234567890,
      };

      const data2 = {
        assetPair: 'SOL/USDC',
        direction: 'buy',
        amount: '200', // Different amount
        timeout: 1234567890,
      };

      const message1 = buildSignatureMessage('quote_request', data1);
      const message2 = buildSignatureMessage('quote_request', data2);

      expect(message1).not.toBe(message2);
    });

    it('should build messages for all operation types', () => {
      const operations = [
        {
          type: 'quote_request',
          data: { assetPair: 'SOL/USDC', direction: 'buy', amount: '100', timeout: 123 },
        },
        {
          type: 'quote',
          data: { quoteRequestId: 'id1', price: '100', expirationTime: 123 },
        },
        {
          type: 'accept',
          data: { quoteId: 'id1', quoteRequestId: 'id2' },
        },
        {
          type: 'cancel',
          data: { quoteRequestId: 'id1' },
        },
        {
          type: 'message',
          data: { quoteRequestId: 'id1', recipientStealthAddress: 'addr', encryptedContent: 'enc' },
        },
        {
          type: 'whitelist_add',
          data: { address: 'addr1' },
        },
        {
          type: 'whitelist_remove',
          data: { address: 'addr1' },
        },
      ];

      for (const op of operations) {
        const message = buildSignatureMessage(op.type, op.data);
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
      }
    });
  });

  describe('verifySignatureStandalone with mocked service', () => {
    it('should verify valid signature and mark as used', async () => {
      (signatureService.verifySignature as jest.Mock).mockReturnValue({
        isValid: true,
        signatureHash: 'test-hash',
      });

      (signatureService.checkSignatureReuse as jest.Mock).mockResolvedValue({
        isReused: false,
        signatureHash: 'test-hash',
      });

      (signatureService.markSignatureUsed as jest.Mock).mockResolvedValue('test-hash');

      const result = await verifySignatureStandalone({
        message: 'test message',
        signature: 'valid-signature' as any,
        publicKey: 'test-public-key' as any,
        operationType: 'test',
      });

      expect(result.success).toBe(true);
      expect(result.signatureHash).toBe('test-hash');
      expect(signatureService.verifySignature).toHaveBeenCalled();
      expect(signatureService.checkSignatureReuse).toHaveBeenCalled();
      expect(signatureService.markSignatureUsed).toHaveBeenCalledWith(
        'valid-signature',
        'test',
        'test-public-key'
      );
    });

    it('should reject invalid signature', async () => {
      (signatureService.verifySignature as jest.Mock).mockReturnValue({
        isValid: false,
        error: 'Invalid signature',
      });

      const result = await verifySignatureStandalone({
        message: 'test message',
        signature: 'invalid-signature' as any,
        publicKey: 'test-public-key' as any,
        operationType: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.SIGNATURE_VERIFICATION_FAILED);
      expect(signatureService.checkSignatureReuse).not.toHaveBeenCalled();
      expect(signatureService.markSignatureUsed).not.toHaveBeenCalled();
    });

    it('should reject reused signature', async () => {
      (signatureService.verifySignature as jest.Mock).mockReturnValue({
        isValid: true,
        signatureHash: 'test-hash',
      });

      (signatureService.checkSignatureReuse as jest.Mock).mockResolvedValue({
        isReused: true,
        signatureHash: 'test-hash',
      });

      const result = await verifySignatureStandalone({
        message: 'test message',
        signature: 'reused-signature' as any,
        publicKey: 'test-public-key' as any,
        operationType: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.SIGNATURE_REUSED);
      expect(signatureService.markSignatureUsed).not.toHaveBeenCalled();
    });

    it('should skip reuse check when disabled', async () => {
      (signatureService.verifySignature as jest.Mock).mockReturnValue({
        isValid: true,
        signatureHash: 'test-hash',
      });

      (signatureService.markSignatureUsed as jest.Mock).mockResolvedValue('test-hash');

      const result = await verifySignatureStandalone({
        message: 'test message',
        signature: 'valid-signature' as any,
        publicKey: 'test-public-key' as any,
        operationType: 'test',
        checkReuse: false,
      });

      expect(result.success).toBe(true);
      expect(signatureService.checkSignatureReuse).not.toHaveBeenCalled();
      expect(signatureService.markSignatureUsed).toHaveBeenCalled();
    });

    it('should skip marking as used when disabled', async () => {
      (signatureService.verifySignature as jest.Mock).mockReturnValue({
        isValid: true,
        signatureHash: 'test-hash',
      });

      (signatureService.checkSignatureReuse as jest.Mock).mockResolvedValue({
        isReused: false,
        signatureHash: 'test-hash',
      });

      const result = await verifySignatureStandalone({
        message: 'test message',
        signature: 'valid-signature' as any,
        publicKey: 'test-public-key' as any,
        operationType: 'test',
        markAsUsed: false,
      });

      expect(result.success).toBe(true);
      expect(signatureService.markSignatureUsed).not.toHaveBeenCalled();
    });
  });

  describe('Message building for different operations', () => {
    it('should build quote request message correctly', () => {
      const data = {
        assetPair: 'SOL/USDC',
        direction: 'buy',
        amount: '100.5',
        timeout: Date.now() + 3600000,
      };

      const message = buildSignatureMessage('quote_request', data);
      const parsed = JSON.parse(message);

      expect(parsed.assetPair).toBe('SOL/USDC');
      expect(parsed.direction).toBe('buy');
      expect(parsed.amount).toBe('100.5');
      expect(parsed.timeout).toBe(data.timeout);
    });

    it('should build quote message correctly', () => {
      const data = {
        quoteRequestId: '123e4567-e89b-12d3-a456-426614174000',
        price: '100.5',
        expirationTime: Date.now() + 3600000,
      };

      const message = buildSignatureMessage('quote', data);
      const parsed = JSON.parse(message);

      expect(parsed.quoteRequestId).toBe(data.quoteRequestId);
      expect(parsed.price).toBe('100.5');
      expect(parsed.expirationTime).toBe(data.expirationTime);
    });

    it('should build accept message correctly', () => {
      const data = {
        quoteId: '123e4567-e89b-12d3-a456-426614174000',
        quoteRequestId: '223e4567-e89b-12d3-a456-426614174000',
      };

      const message = buildSignatureMessage('accept', data);
      const parsed = JSON.parse(message);

      expect(parsed.quoteId).toBe(data.quoteId);
      expect(parsed.quoteRequestId).toBe(data.quoteRequestId);
    });

    it('should build cancel message correctly', () => {
      const data = {
        quoteRequestId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const message = buildSignatureMessage('cancel', data);
      const parsed = JSON.parse(message);

      expect(parsed.quoteRequestId).toBe(data.quoteRequestId);
    });

    it('should build message message correctly', () => {
      const data = {
        quoteRequestId: '123e4567-e89b-12d3-a456-426614174000',
        recipientStealthAddress: '0x1234567890abcdef',
        encryptedContent: 'encrypted-content-base64',
      };

      const message = buildSignatureMessage('message', data);
      const parsed = JSON.parse(message);

      expect(parsed.quoteRequestId).toBe(data.quoteRequestId);
      expect(parsed.recipientStealthAddress).toBe(data.recipientStealthAddress);
      expect(parsed.encryptedContent).toBe(data.encryptedContent);
    });

    it('should build whitelist messages correctly', () => {
      const data = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
      };

      const addMessage = buildSignatureMessage('whitelist_add', data);
      const addParsed = JSON.parse(addMessage);
      expect(addParsed.address).toBe(data.address);
      expect(addParsed.operation).toBe('add');

      const removeMessage = buildSignatureMessage('whitelist_remove', data);
      const removeParsed = JSON.parse(removeMessage);
      expect(removeParsed.address).toBe(data.address);
      expect(removeParsed.operation).toBe('remove');
    });
  });
});

