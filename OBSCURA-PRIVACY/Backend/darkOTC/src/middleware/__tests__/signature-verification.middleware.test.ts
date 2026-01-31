/**
 * Signature Verification Middleware Tests
 * 
 * Tests for signature verification middleware and helper functions.
 * 
 * Requirements:
 * - 35.1: Require WOTS+ signature for all RFQ operations
 * - 35.2: Validate signatures against claimed sender's public key
 * - 35.3: Reject operations with invalid signatures
 * - 35.4: Reject operations with reused signatures
 * - 35.5: Maintain record of used signature hashes
 */

import { Request, Response, NextFunction } from 'express';
import {
  verifySignature,
  verifyQuoteRequestSignature,
  verifyQuoteSignature,
  verifyQuoteAcceptanceSignature,
  verifyCancellationSignature,
  verifyMessageSignature,
  verifyWhitelistSignature,
  verifySignatureStandalone,
  buildSignatureMessage,
  SignatureVerifiedRequest,
} from '../signature-verification.middleware';
import { signatureService } from '../../services/signature.service';
import { ErrorCode } from '../../types/api.types';

// Mock the signature service
jest.mock('../../services/signature.service');

describe('Signature Verification Middleware', () => {
  let mockRequest: Partial<SignatureVerifiedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock response
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    // Setup mock next
    mockNext = jest.fn();

    // Setup mock request
    mockRequest = {
      body: {},
      params: {},
    };
  });

  describe('verifySignature middleware factory', () => {
    it('should reject request with missing signature', async () => {
      // Requirement 35.1: Require WOTS+ signature for all operations
      mockRequest.body = {
        publicKey: 'test-public-key',
        // signature is missing
      };

      const middleware = verifySignature({ operationType: 'test' });
      await middleware(mockRequest as SignatureVerifiedRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: ErrorCode.MISSING_FIELD,
          error: expect.stringContaining('Signature and public key are required'),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with missing public key', async () => {
      // Requirement 35.1: Require WOTS+ signature for all operations
      mockRequest.body = {
        signature: 'test-signature',
        // publicKey is missing
      };

      const middleware = verifySignature({ operationType: 'test' });
      await middleware(mockRequest as SignatureVerifiedRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: ErrorCode.MISSING_FIELD,
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid signature', async () => {
      // Requirement 35.3: Reject operations with invalid signatures
      mockRequest.body = {
        signature: 'invalid-signature',
        publicKey: 'test-public-key',
        data: 'test-data',
      };

      // Mock signature verification to fail
      (signatureService.verifySignature as jest.Mock).mockReturnValue({
        isValid: false,
        error: 'Invalid signature format',
      });

      const middleware = verifySignature({ operationType: 'test' });
      await middleware(mockRequest as SignatureVerifiedRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: ErrorCode.SIGNATURE_VERIFICATION_FAILED,
          error: expect.stringContaining('Signature verification failed'),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with reused signature', async () => {
      // Requirement 35.4: Reject operations with reused signatures
      mockRequest.body = {
        signature: 'valid-signature',
        publicKey: 'test-public-key',
        data: 'test-data',
      };

      // Mock signature verification to succeed
      (signatureService.verifySignature as jest.Mock).mockReturnValue({
        isValid: true,
        signatureHash: 'test-hash',
      });

      // Mock reuse check to indicate signature was already used
      (signatureService.checkSignatureReuse as jest.Mock).mockResolvedValue({
        isReused: true,
        signatureHash: 'test-hash',
      });

      const middleware = verifySignature({ operationType: 'test' });
      await middleware(mockRequest as SignatureVerifiedRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: ErrorCode.SIGNATURE_REUSED,
          error: expect.stringContaining('Signature has already been used'),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept request with valid signature and mark as used', async () => {
      // Requirements 35.2, 35.5: Validate signature and maintain record
      mockRequest.body = {
        signature: 'valid-signature',
        publicKey: 'test-public-key',
        data: 'test-data',
      };

      // Mock signature verification to succeed
      (signatureService.verifySignature as jest.Mock).mockReturnValue({
        isValid: true,
        signatureHash: 'test-hash',
      });

      // Mock reuse check to indicate signature is new
      (signatureService.checkSignatureReuse as jest.Mock).mockResolvedValue({
        isReused: false,
        signatureHash: 'test-hash',
      });

      // Mock marking signature as used
      (signatureService.markSignatureUsed as jest.Mock).mockResolvedValue('test-hash');

      const middleware = verifySignature({ operationType: 'test' });
      await middleware(mockRequest as SignatureVerifiedRequest, mockResponse as Response, mockNext);

      expect(signatureService.verifySignature).toHaveBeenCalled();
      expect(signatureService.checkSignatureReuse).toHaveBeenCalled();
      expect(signatureService.markSignatureUsed).toHaveBeenCalledWith(
        'valid-signature',
        'test',
        'test-public-key'
      );
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.signatureHash).toBe('test-hash');
      expect(mockRequest.verifiedPublicKey).toBe('test-public-key');
      expect(mockRequest.operationType).toBe('test');
    });

    it('should skip reuse check when checkReuse is false', async () => {
      mockRequest.body = {
        signature: 'valid-signature',
        publicKey: 'test-public-key',
        data: 'test-data',
      };

      (signatureService.verifySignature as jest.Mock).mockReturnValue({
        isValid: true,
        signatureHash: 'test-hash',
      });

      const middleware = verifySignature({
        operationType: 'test',
        checkReuse: false,
      });
      await middleware(mockRequest as SignatureVerifiedRequest, mockResponse as Response, mockNext);

      expect(signatureService.checkSignatureReuse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip marking as used when markAsUsed is false', async () => {
      mockRequest.body = {
        signature: 'valid-signature',
        publicKey: 'test-public-key',
        data: 'test-data',
      };

      (signatureService.verifySignature as jest.Mock).mockReturnValue({
        isValid: true,
        signatureHash: 'test-hash',
      });

      (signatureService.checkSignatureReuse as jest.Mock).mockResolvedValue({
        isReused: false,
        signatureHash: 'test-hash',
      });

      const middleware = verifySignature({
        operationType: 'test',
        markAsUsed: false,
      });
      await middleware(mockRequest as SignatureVerifiedRequest, mockResponse as Response, mockNext);

      expect(signatureService.markSignatureUsed).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use custom message builder when provided', async () => {
      mockRequest.body = {
        signature: 'valid-signature',
        publicKey: 'test-public-key',
        customField: 'custom-value',
      };

      (signatureService.verifySignature as jest.Mock).mockReturnValue({
        isValid: true,
        signatureHash: 'test-hash',
      });

      (signatureService.checkSignatureReuse as jest.Mock).mockResolvedValue({
        isReused: false,
        signatureHash: 'test-hash',
      });

      const customMessageBuilder = jest.fn().mockReturnValue('custom-message');

      const middleware = verifySignature({
        operationType: 'test',
        messageBuilder: customMessageBuilder,
      });
      await middleware(mockRequest as SignatureVerifiedRequest, mockResponse as Response, mockNext);

      expect(customMessageBuilder).toHaveBeenCalledWith(mockRequest);
      expect(signatureService.verifySignature).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'custom-message',
        })
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Specialized middleware functions', () => {
    beforeEach(() => {
      (signatureService.verifySignature as jest.Mock).mockReturnValue({
        isValid: true,
        signatureHash: 'test-hash',
      });

      (signatureService.checkSignatureReuse as jest.Mock).mockResolvedValue({
        isReused: false,
        signatureHash: 'test-hash',
      });

      (signatureService.markSignatureUsed as jest.Mock).mockResolvedValue('test-hash');
    });

    it('verifyQuoteRequestSignature should verify quote request signatures', async () => {
      mockRequest.body = {
        assetPair: 'SOL/USDC',
        direction: 'buy',
        amount: '100',
        timeout: Date.now() + 3600000,
        signature: 'valid-signature',
        publicKey: 'test-public-key',
      };

      await verifyQuoteRequestSignature(
        mockRequest as SignatureVerifiedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(signatureService.verifySignature).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('SOL/USDC'),
        })
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('verifyQuoteSignature should verify quote submission signatures', async () => {
      mockRequest.body = {
        quoteRequestId: 'test-request-id',
        price: '100.5',
        expirationTime: Date.now() + 3600000,
        signature: 'valid-signature',
        publicKey: 'test-public-key',
      };

      await verifyQuoteSignature(
        mockRequest as SignatureVerifiedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(signatureService.verifySignature).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('test-request-id'),
        })
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('verifyQuoteAcceptanceSignature should verify acceptance signatures', async () => {
      mockRequest.params = { id: 'test-quote-id' };
      mockRequest.body = {
        quoteRequestId: 'test-request-id',
        signature: 'valid-signature',
        publicKey: 'test-public-key',
      };

      await verifyQuoteAcceptanceSignature(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(signatureService.verifySignature).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('test-quote-id'),
        })
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('verifyCancellationSignature should verify cancellation signatures', async () => {
      mockRequest.params = { id: 'test-request-id' };
      mockRequest.body = {
        signature: 'valid-signature',
        publicKey: 'test-public-key',
      };

      await verifyCancellationSignature(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(signatureService.verifySignature).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('test-request-id'),
        })
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('verifyMessageSignature should verify message signatures', async () => {
      mockRequest.body = {
        quoteRequestId: 'test-request-id',
        recipientStealthAddress: 'test-stealth-address',
        encryptedContent: 'encrypted-content',
        signature: 'valid-signature',
        publicKey: 'test-public-key',
      };

      await verifyMessageSignature(
        mockRequest as SignatureVerifiedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(signatureService.verifySignature).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('test-request-id'),
        })
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('verifyWhitelistSignature should verify whitelist add signatures', async () => {
      mockRequest.body = {
        address: 'test-address',
        signature: 'valid-signature',
        publicKey: 'test-public-key',
      };

      const middleware = verifyWhitelistSignature('add');
      await middleware(
        mockRequest as SignatureVerifiedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(signatureService.verifySignature).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('test-address'),
        })
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('verifyWhitelistSignature should verify whitelist remove signatures', async () => {
      mockRequest.body = {
        address: 'test-address',
        signature: 'valid-signature',
        publicKey: 'test-public-key',
      };

      const middleware = verifyWhitelistSignature('remove');
      await middleware(
        mockRequest as SignatureVerifiedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(signatureService.verifySignature).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('test-address'),
        })
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('verifySignatureStandalone', () => {
    it('should verify valid signature', async () => {
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
        message: 'test-message',
        signature: 'valid-signature' as any,
        publicKey: 'test-public-key' as any,
        operationType: 'test',
      });

      expect(result.success).toBe(true);
      expect(result.signatureHash).toBe('test-hash');
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid signature', async () => {
      (signatureService.verifySignature as jest.Mock).mockReturnValue({
        isValid: false,
        error: 'Invalid signature',
      });

      const result = await verifySignatureStandalone({
        message: 'test-message',
        signature: 'invalid-signature' as any,
        publicKey: 'test-public-key' as any,
        operationType: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid signature');
      expect(result.errorCode).toBe(ErrorCode.SIGNATURE_VERIFICATION_FAILED);
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
        message: 'test-message',
        signature: 'reused-signature' as any,
        publicKey: 'test-public-key' as any,
        operationType: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Signature has already been used');
      expect(result.errorCode).toBe(ErrorCode.SIGNATURE_REUSED);
    });
  });

  describe('buildSignatureMessage', () => {
    it('should build quote request message', () => {
      const message = buildSignatureMessage('quote_request', {
        assetPair: 'SOL/USDC',
        direction: 'buy',
        amount: '100',
        timeout: 1234567890,
      });

      expect(message).toContain('SOL/USDC');
      expect(message).toContain('buy');
      expect(message).toContain('100');
      expect(message).toContain('1234567890');
    });

    it('should build quote message', () => {
      const message = buildSignatureMessage('quote', {
        quoteRequestId: 'test-id',
        price: '100.5',
        expirationTime: 1234567890,
      });

      expect(message).toContain('test-id');
      expect(message).toContain('100.5');
      expect(message).toContain('1234567890');
    });

    it('should build accept message', () => {
      const message = buildSignatureMessage('accept', {
        quoteId: 'quote-id',
        quoteRequestId: 'request-id',
      });

      expect(message).toContain('quote-id');
      expect(message).toContain('request-id');
    });

    it('should build cancel message', () => {
      const message = buildSignatureMessage('cancel', {
        quoteRequestId: 'request-id',
      });

      expect(message).toContain('request-id');
    });

    it('should build message message', () => {
      const message = buildSignatureMessage('message', {
        quoteRequestId: 'request-id',
        recipientStealthAddress: 'stealth-address',
        encryptedContent: 'encrypted',
      });

      expect(message).toContain('request-id');
      expect(message).toContain('stealth-address');
      expect(message).toContain('encrypted');
    });

    it('should build whitelist add message', () => {
      const message = buildSignatureMessage('whitelist_add', {
        address: 'test-address',
      });

      expect(message).toContain('test-address');
      expect(message).toContain('add');
    });

    it('should build whitelist remove message', () => {
      const message = buildSignatureMessage('whitelist_remove', {
        address: 'test-address',
      });

      expect(message).toContain('test-address');
      expect(message).toContain('remove');
    });

    it('should throw error for unknown operation type', () => {
      expect(() => {
        buildSignatureMessage('unknown', {});
      }).toThrow('Unknown operation type: unknown');
    });
  });

  describe('Error handling', () => {
    it('should handle internal errors gracefully', async () => {
      mockRequest.body = {
        signature: 'valid-signature',
        publicKey: 'test-public-key',
      };

      // Mock signature verification to throw error
      (signatureService.verifySignature as jest.Mock).mockImplementation(() => {
        throw new Error('Internal error');
      });

      const middleware = verifySignature({ operationType: 'test' });
      await middleware(mockRequest as SignatureVerifiedRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: ErrorCode.INTERNAL_ERROR,
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should continue if marking signature as used fails', async () => {
      mockRequest.body = {
        signature: 'valid-signature',
        publicKey: 'test-public-key',
        data: 'test-data',
      };

      (signatureService.verifySignature as jest.Mock).mockReturnValue({
        isValid: true,
        signatureHash: 'test-hash',
      });

      (signatureService.checkSignatureReuse as jest.Mock).mockResolvedValue({
        isReused: false,
        signatureHash: 'test-hash',
      });

      // Mock marking as used to fail
      (signatureService.markSignatureUsed as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const middleware = verifySignature({ operationType: 'test' });
      await middleware(mockRequest as SignatureVerifiedRequest, mockResponse as Response, mockNext);

      // Should still call next despite error
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
