/**
 * Validation Tests
 * 
 * Tests for type validation utilities and Zod schemas.
 */

import {
  validate,
  validateRequiredFields,
  isValidAssetPair,
  isValidSolanaPublicKey,
  isValidEthereumAddress,
  isValidBlockchainAddress,
  isValidAmount,
  isValidTimestamp,
  isValidHex,
  CreateQuoteRequestSchema,
  SubmitQuoteSchema,
  SendMessageSchema,
  AddToWhitelistSchema,
  ErrorCode,
} from '../index';

describe('Validation Utilities', () => {
  describe('validate()', () => {
    it('should validate valid quote request data', () => {
      const data = {
        assetPair: 'SOL/USDC',
        direction: 'buy',
        amount: '1.5',
        timeout: Date.now() + 3600000,
        signature: 'a'.repeat(100),
        publicKey: 'b'.repeat(50),
      };

      const result = validate(CreateQuoteRequestSchema, data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assetPair).toBe('SOL/USDC');
        expect(result.data.direction).toBe('buy');
      }
    });

    it('should reject invalid quote request data', () => {
      const data = {
        assetPair: 'INVALID',
        direction: 'buy',
        amount: '0.0001', // Too small
        timeout: Date.now() - 1000, // In the past
        signature: 'short',
        publicKey: 'short',
      };

      const result = validate(CreateQuoteRequestSchema, data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.error.fieldErrors).toBeDefined();
      }
    });

    it('should validate valid quote submission data', () => {
      const data = {
        quoteRequestId: '123e4567-e89b-12d3-a456-426614174000',
        price: '100.5',
        expirationTime: Date.now() + 3600000,
        signature: 'a'.repeat(100),
        publicKey: 'b'.repeat(50),
      };

      const result = validate(SubmitQuoteSchema, data);
      expect(result.success).toBe(true);
    });

    it('should validate valid message data', () => {
      const data = {
        quoteRequestId: '123e4567-e89b-12d3-a456-426614174000',
        recipientStealthAddress: 'a'.repeat(32), // At least 32 characters
        encryptedContent: 'encrypted_content_base64',
        signature: 'a'.repeat(100),
        publicKey: 'b'.repeat(50),
      };

      const result = validate(SendMessageSchema, data);
      expect(result.success).toBe(true);
    });

    it('should validate valid whitelist data', () => {
      const data = {
        address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        signature: 'a'.repeat(100),
      };

      const result = validate(AddToWhitelistSchema, data);
      expect(result.success).toBe(true);
    });
  });

  describe('validateRequiredFields()', () => {
    it('should pass when all required fields are present', () => {
      const data = {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3',
      };

      const result = validateRequiredFields(data, ['field1', 'field2']);
      expect(result.success).toBe(true);
    });

    it('should fail when required fields are missing', () => {
      const data = {
        field1: 'value1',
      };

      const result = validateRequiredFields(data, ['field1', 'field2', 'field3']);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCode.MISSING_FIELD);
        expect(result.error.fieldErrors).toHaveProperty('field2');
        expect(result.error.fieldErrors).toHaveProperty('field3');
      }
    });

    it('should fail when required fields are null or undefined', () => {
      const data = {
        field1: 'value1',
        field2: null,
        field3: undefined,
      };

      const result = validateRequiredFields(data, ['field1', 'field2', 'field3']);
      expect(result.success).toBe(false);
    });
  });

  describe('isValidAssetPair()', () => {
    it('should validate correct asset pair formats', () => {
      expect(isValidAssetPair('SOL/USDC')).toBe(true);
      expect(isValidAssetPair('ETH/USDT')).toBe(true);
      expect(isValidAssetPair('BTC/USD')).toBe(true);
    });

    it('should reject invalid asset pair formats', () => {
      expect(isValidAssetPair('sol/usdc')).toBe(false); // Lowercase
      expect(isValidAssetPair('SOL-USDC')).toBe(false); // Wrong separator
      expect(isValidAssetPair('SOL')).toBe(false); // Missing second token
      expect(isValidAssetPair('S/U')).toBe(false); // Too short
      // Note: SOLANA/USDC is actually valid (6 chars is within 2-10 range)
    });
  });

  describe('isValidSolanaPublicKey()', () => {
    it('should validate correct Solana public keys', () => {
      expect(isValidSolanaPublicKey('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(true);
      expect(isValidSolanaPublicKey('11111111111111111111111111111111')).toBe(true);
    });

    it('should reject invalid Solana public keys', () => {
      expect(isValidSolanaPublicKey('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(false); // Ethereum address
      expect(isValidSolanaPublicKey('short')).toBe(false); // Too short
      expect(isValidSolanaPublicKey('invalid_characters_!@#$%')).toBe(false); // Invalid chars
    });
  });

  describe('isValidEthereumAddress()', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(isValidEthereumAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(true); // 40 hex chars
      expect(isValidEthereumAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    it('should reject invalid Ethereum addresses', () => {
      expect(isValidEthereumAddress('742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(false); // Missing 0x
      expect(isValidEthereumAddress('0x742d35Cc')).toBe(false); // Too short
      expect(isValidEthereumAddress('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(false); // Solana key
    });
  });

  describe('isValidBlockchainAddress()', () => {
    it('should validate both Solana and Ethereum addresses', () => {
      expect(isValidBlockchainAddress('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(true);
      expect(isValidBlockchainAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(true); // 40 hex chars
    });

    it('should reject invalid addresses', () => {
      expect(isValidBlockchainAddress('invalid')).toBe(false);
      expect(isValidBlockchainAddress('123456')).toBe(false);
    });
  });

  describe('isValidAmount()', () => {
    it('should validate correct amounts', () => {
      expect(isValidAmount('1.5')).toBe(true);
      expect(isValidAmount('0.0003')).toBe(true);
      expect(isValidAmount('1000000')).toBe(true);
      expect(isValidAmount('0.001', 0.0003)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(isValidAmount('0')).toBe(false); // Zero
      expect(isValidAmount('-1')).toBe(false); // Negative
      expect(isValidAmount('0.0001')).toBe(false); // Below minimum
      expect(isValidAmount('abc')).toBe(false); // Not a number
      expect(isValidAmount('0.001', 0.01)).toBe(false); // Below custom minimum
    });
  });

  describe('isValidTimestamp()', () => {
    it('should validate correct timestamps', () => {
      expect(isValidTimestamp(Date.now())).toBe(true);
      expect(isValidTimestamp(Date.now() + 3600000)).toBe(true);
      expect(isValidTimestamp(1234567890000)).toBe(true);
    });

    it('should validate future timestamps when required', () => {
      expect(isValidTimestamp(Date.now() + 3600000, true)).toBe(true);
      expect(isValidTimestamp(Date.now() - 1000, true)).toBe(false);
    });

    it('should reject invalid timestamps', () => {
      expect(isValidTimestamp(0)).toBe(false); // Zero
      expect(isValidTimestamp(-1)).toBe(false); // Negative
      expect(isValidTimestamp(1.5)).toBe(false); // Not an integer
    });
  });

  describe('isValidHex()', () => {
    it('should validate correct hex strings', () => {
      expect(isValidHex('0x1234abcd')).toBe(true);
      expect(isValidHex('1234abcd')).toBe(true);
      expect(isValidHex('0xABCDEF')).toBe(true);
    });

    it('should validate hex strings with expected length', () => {
      expect(isValidHex('0x1234abcd', 4)).toBe(true); // 4 bytes = 8 hex chars
      expect(isValidHex('0x1234abcd', 5)).toBe(false); // Wrong length
    });

    it('should reject invalid hex strings', () => {
      expect(isValidHex('0xGHIJ')).toBe(false); // Invalid characters
      expect(isValidHex('not_hex')).toBe(false); // Not hex
    });
  });
});
