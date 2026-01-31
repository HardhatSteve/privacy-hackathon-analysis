/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  formatAmount,
  toSatoshis,
  fromSatoshis,
  toWei,
  fromWei,
  toLovelace,
  fromLovelace,
  toLamports,
  fromLamports,
  hexToBytes,
  bytesToHex,
  formatTimestamp,
} from '../../nodes/Trezor/utils/formatUtils';

describe('formatUtils', () => {
  describe('formatAmount', () => {
    it('should format amounts with specified decimals', () => {
      expect(formatAmount(1.23456789, 8)).toBe('1.23456789');
      expect(formatAmount(1.5, 2)).toBe('1.5');
      // Note: formatAmount removes trailing zeros including decimal point
    });

    it('should remove trailing zeros', () => {
      expect(formatAmount(1.5, 8)).toBe('1.5');
      expect(formatAmount(1.0, 8)).toBe('1');
    });
  });

  describe('Bitcoin conversions', () => {
    it('should convert BTC to satoshis', () => {
      expect(toSatoshis(1)).toBe(BigInt(100000000));
      expect(toSatoshis(0.5)).toBe(BigInt(50000000));
      expect(toSatoshis('0.00000001')).toBe(BigInt(1));
    });

    it('should convert satoshis to BTC', () => {
      expect(fromSatoshis(BigInt(100000000))).toBe('1');
      expect(fromSatoshis(50000000)).toBe('0.5');
      expect(fromSatoshis('1')).toBe('0.00000001');
    });
  });

  describe('Ethereum conversions', () => {
    it('should convert ETH to wei', () => {
      expect(toWei(1)).toBe(BigInt(1000000000000000000));
      expect(toWei(0.5)).toBe(BigInt(500000000000000000));
    });

    it('should convert wei to ETH', () => {
      expect(fromWei(BigInt(1000000000000000000))).toBe('1');
      expect(fromWei('500000000000000000')).toBe('0.5');
    });
  });

  describe('Cardano conversions', () => {
    it('should convert ADA to lovelace', () => {
      expect(toLovelace(1)).toBe(BigInt(1000000));
      expect(toLovelace(2.5)).toBe(BigInt(2500000));
    });

    it('should convert lovelace to ADA', () => {
      expect(fromLovelace(BigInt(1000000))).toBe('1');
      expect(fromLovelace(2500000)).toBe('2.5');
    });
  });

  describe('Solana conversions', () => {
    it('should convert SOL to lamports', () => {
      expect(toLamports(1)).toBe(BigInt(1000000000));
    });

    it('should convert lamports to SOL', () => {
      expect(fromLamports(BigInt(1000000000))).toBe('1');
    });
  });

  describe('Hex conversions', () => {
    it('should convert hex to bytes', () => {
      const bytes = hexToBytes('0x0102');
      expect(bytes).toEqual(new Uint8Array([1, 2]));
    });

    it('should convert bytes to hex', () => {
      const hex = bytesToHex(new Uint8Array([1, 2]));
      expect(hex).toBe('0x0102');
    });

    it('should handle hex without prefix', () => {
      const bytes = hexToBytes('0102');
      expect(bytes).toEqual(new Uint8Array([1, 2]));
    });

    it('should allow no prefix in output', () => {
      const hex = bytesToHex(new Uint8Array([1, 2]), false);
      expect(hex).toBe('0102');
    });
  });

  describe('formatTimestamp', () => {
    it('should format unix timestamp to ISO string', () => {
      const result = formatTimestamp(1609459200);
      expect(result).toBe('2021-01-01T00:00:00.000Z');
    });

    it('should handle string timestamps', () => {
      const result = formatTimestamp('1609459200');
      expect(result).toBe('2021-01-01T00:00:00.000Z');
    });
  });
});
