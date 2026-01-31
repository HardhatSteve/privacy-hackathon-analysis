/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  validateDerivationPath,
  validateHexString,
  validateAmount,
  validateChainId,
  validateTransactionHash,
  validatePin,
  validateLabel,
  validateMnemonic,
} from '../../nodes/Trezor/utils/validationUtils';

describe('validationUtils', () => {
  describe('validateDerivationPath', () => {
    it('should validate correct BIP44 paths', () => {
      expect(validateDerivationPath("m/44'/0'/0'/0/0").valid).toBe(true);
      expect(validateDerivationPath("m/44'/60'/0'/0/0").valid).toBe(true);
      expect(validateDerivationPath("m/49'/0'/0'/0/0").valid).toBe(true);
      expect(validateDerivationPath("m/84'/0'/0'/0/0").valid).toBe(true);
    });

    it('should reject invalid paths', () => {
      expect(validateDerivationPath('').valid).toBe(false);
      expect(validateDerivationPath('invalid').valid).toBe(false);
      expect(validateDerivationPath('44/0/0/0/0').valid).toBe(false);
    });
  });

  describe('validateHexString', () => {
    it('should validate hex strings', () => {
      expect(validateHexString('0x1234abcd').valid).toBe(true);
      expect(validateHexString('0xABCDEF').valid).toBe(true);
      expect(validateHexString('1234abcd').valid).toBe(true);
    });

    it('should reject invalid hex strings', () => {
      expect(validateHexString('0xGHIJ').valid).toBe(false);
      expect(validateHexString('hello').valid).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('should validate positive amounts', () => {
      expect(validateAmount('100').valid).toBe(true);
      expect(validateAmount('0.001').valid).toBe(true);
      expect(validateAmount('1000000').valid).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount('abc').valid).toBe(false);
    });

    it('should reject amounts below minimum', () => {
      expect(validateAmount('5', 10).valid).toBe(false);
      expect(validateAmount('15', 10).valid).toBe(true);
    });
  });

  describe('validateChainId', () => {
    it('should validate positive chain IDs', () => {
      expect(validateChainId(1).valid).toBe(true);
      expect(validateChainId(137).valid).toBe(true);
    });

    it('should reject invalid chain IDs', () => {
      expect(validateChainId(0).valid).toBe(false);
      expect(validateChainId(-1).valid).toBe(false);
      expect(validateChainId(1.5).valid).toBe(false);
    });
  });

  describe('validateTransactionHash', () => {
    it('should validate valid hashes', () => {
      const validHash = '0x' + 'a'.repeat(64);
      expect(validateTransactionHash(validHash).valid).toBe(true);
    });

    it('should reject invalid hashes', () => {
      expect(validateTransactionHash('invalid').valid).toBe(false);
      expect(validateTransactionHash('0x123').valid).toBe(false);
    });
  });

  describe('validatePin', () => {
    it('should validate valid PINs', () => {
      expect(validatePin('1234').valid).toBe(true);
      expect(validatePin('123456789').valid).toBe(true);
    });

    it('should reject invalid PINs', () => {
      expect(validatePin('').valid).toBe(false);
      expect(validatePin('abc').valid).toBe(false);
    });

    it('should respect max length', () => {
      expect(validatePin('12345678901', 10).valid).toBe(false);
    });
  });

  describe('validateLabel', () => {
    it('should validate valid labels', () => {
      expect(validateLabel('My Trezor').valid).toBe(true);
      expect(validateLabel('Device 1').valid).toBe(true);
    });

    it('should reject labels that are too long', () => {
      expect(validateLabel('This label is way too long').valid).toBe(false);
    });
  });

  describe('validateMnemonic', () => {
    it('should validate valid mnemonics', () => {
      const words12 = Array(12).fill('word').join(' ');
      const words18 = Array(18).fill('word').join(' ');
      const words24 = Array(24).fill('word').join(' ');
      expect(validateMnemonic(words12).valid).toBe(true);
      expect(validateMnemonic(words18).valid).toBe(true);
      expect(validateMnemonic(words24).valid).toBe(true);
    });

    it('should reject invalid mnemonics', () => {
      const words10 = Array(10).fill('word').join(' ');
      expect(validateMnemonic(words10).valid).toBe(false);
    });
  });
});
