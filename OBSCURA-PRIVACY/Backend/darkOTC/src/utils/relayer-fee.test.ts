/**
 * Unit tests for relayer fee calculation
 * 
 * Tests cover:
 * - Tiered fee structure
 * - Minimum fee enforcement
 * - Edge cases (zero, negative, boundary values)
 * - Both Solana and Sepolia chains
 * - BigInt calculations
 * 
 * Requirements: 36.1
 */

import {
  calculateRelayerFee,
  calculateRelayerFeeBigInt,
  getFeeTierInfo,
  getMinimumFee,
  Chain,
} from './relayer-fee';

describe('calculateRelayerFee', () => {
  describe('Tiered fee structure', () => {
    it('should apply 0.10% fee for amounts 0-10 (Tier 1)', () => {
      // Test various amounts in the 0-10 range
      expect(calculateRelayerFee(5, 'solana')).toBe(0.005); // 5 * 0.001 = 0.005
      expect(calculateRelayerFee(9.99, 'solana')).toBe(0.00999); // 9.99 * 0.001 = 0.00999
      expect(calculateRelayerFee(1, 'sepolia')).toBe(0.001); // 1 * 0.001 = 0.001
    });

    it('should apply 0.08% fee for amounts 10-100 (Tier 2)', () => {
      // Test various amounts in the 10-100 range
      expect(calculateRelayerFee(10, 'solana')).toBe(0.008); // 10 * 0.0008 = 0.008
      expect(calculateRelayerFee(50, 'solana')).toBe(0.04); // 50 * 0.0008 = 0.04
      expect(calculateRelayerFee(99.99, 'sepolia')).toBe(0.079992); // 99.99 * 0.0008
    });

    it('should apply 0.06% fee for amounts 100-1000 (Tier 3)', () => {
      // Test various amounts in the 100-1000 range
      expect(calculateRelayerFee(100, 'solana')).toBe(0.06); // 100 * 0.0006 = 0.06
      expect(calculateRelayerFee(500, 'solana')).toBe(0.3); // 500 * 0.0006 = 0.3
      expect(calculateRelayerFee(999.99, 'sepolia')).toBeCloseTo(0.599994, 5); // 999.99 * 0.0006
    });

    it('should apply 0.05% fee for amounts 1000+ (Tier 4)', () => {
      // Test various amounts >= 1000
      expect(calculateRelayerFee(1000, 'solana')).toBe(0.5); // 1000 * 0.0005 = 0.5
      expect(calculateRelayerFee(5000, 'solana')).toBe(2.5); // 5000 * 0.0005 = 2.5
      expect(calculateRelayerFee(10000, 'sepolia')).toBe(5); // 10000 * 0.0005 = 5
    });
  });

  describe('Minimum fee enforcement', () => {
    it('should enforce minimum fee of 0.0001 SOL for Solana', () => {
      // Very small amounts should return minimum fee
      expect(calculateRelayerFee(0.001, 'solana')).toBe(0.0001); // 0.001 * 0.001 = 0.000001 < 0.0001
      expect(calculateRelayerFee(0.01, 'solana')).toBe(0.0001); // 0.01 * 0.001 = 0.00001 < 0.0001
      expect(calculateRelayerFee(0.05, 'solana')).toBe(0.0001); // 0.05 * 0.001 = 0.00005 < 0.0001
    });

    it('should enforce minimum fee of 0.00001 ETH for Sepolia', () => {
      // Very small amounts should return minimum fee
      expect(calculateRelayerFee(0.0001, 'sepolia')).toBe(0.00001); // 0.0001 * 0.001 = 0.0000001 < 0.00001
      expect(calculateRelayerFee(0.001, 'sepolia')).toBe(0.00001); // 0.001 * 0.001 = 0.000001 < 0.00001
      expect(calculateRelayerFee(0.005, 'sepolia')).toBe(0.00001); // 0.005 * 0.001 = 0.000005 < 0.00001
    });

    it('should not apply minimum fee when calculated fee is higher', () => {
      // When calculated fee > minimum, use calculated fee
      expect(calculateRelayerFee(1, 'solana')).toBe(0.001); // 1 * 0.001 = 0.001 > 0.0001
      expect(calculateRelayerFee(0.1, 'sepolia')).toBe(0.0001); // 0.1 * 0.001 = 0.0001 > 0.00001
    });
  });

  describe('Tier boundary values', () => {
    it('should correctly handle tier boundaries', () => {
      // Test exact boundary values
      expect(calculateRelayerFee(10, 'solana')).toBe(0.008); // Tier 2: 10 * 0.0008
      expect(calculateRelayerFee(9.999999, 'solana')).toBeCloseTo(0.009999999, 8); // Tier 1: 9.999999 * 0.001
      
      expect(calculateRelayerFee(100, 'solana')).toBe(0.06); // Tier 3: 100 * 0.0006
      expect(calculateRelayerFee(99.999999, 'solana')).toBeCloseTo(0.079999992, 7); // Tier 2: 99.999999 * 0.0008
      
      expect(calculateRelayerFee(1000, 'solana')).toBe(0.5); // Tier 4: 1000 * 0.0005
      expect(calculateRelayerFee(999.999999, 'solana')).toBeCloseTo(0.5999999994, 7); // Tier 3: 999.999999 * 0.0006
    });
  });

  describe('Edge cases', () => {
    it('should return 0 for zero amount', () => {
      expect(calculateRelayerFee(0, 'solana')).toBe(0);
      expect(calculateRelayerFee(0, 'sepolia')).toBe(0);
    });

    it('should throw error for negative amounts', () => {
      expect(() => calculateRelayerFee(-1, 'solana')).toThrow('Amount cannot be negative');
      expect(() => calculateRelayerFee(-0.001, 'sepolia')).toThrow('Amount cannot be negative');
    });

    it('should throw error for unsupported chains', () => {
      expect(() => calculateRelayerFee(1, 'bitcoin' as Chain)).toThrow('Unsupported chain: bitcoin');
      expect(() => calculateRelayerFee(1, 'ethereum' as Chain)).toThrow('Unsupported chain: ethereum');
    });

    it('should handle very large amounts', () => {
      expect(calculateRelayerFee(1000000, 'solana')).toBe(500); // 1000000 * 0.0005 = 500
      expect(calculateRelayerFee(999999999, 'sepolia')).toBeCloseTo(499999.9995, 4); // 999999999 * 0.0005
    });

    it('should handle floating point precision', () => {
      // Test amounts that might cause floating point issues
      const fee1 = calculateRelayerFee(0.1 + 0.2, 'solana'); // 0.3
      expect(fee1).toBeCloseTo(0.0003, 10); // 0.3 * 0.001 = 0.0003
      
      const fee2 = calculateRelayerFee(10.1, 'solana');
      expect(fee2).toBeCloseTo(0.00808, 10); // 10.1 * 0.0008 = 0.00808
    });
  });

  describe('Both chains', () => {
    it('should calculate fees correctly for both Solana and Sepolia', () => {
      const amount = 50;
      const solanaFee = calculateRelayerFee(amount, 'solana');
      const sepoliaFee = calculateRelayerFee(amount, 'sepolia');
      
      // Both should use same tier (Tier 2: 0.08%)
      expect(solanaFee).toBe(0.04); // 50 * 0.0008
      expect(sepoliaFee).toBe(0.04); // 50 * 0.0008
    });

    it('should apply different minimum fees for different chains', () => {
      const smallAmount = 0.001;
      const solanaFee = calculateRelayerFee(smallAmount, 'solana');
      const sepoliaFee = calculateRelayerFee(smallAmount, 'sepolia');
      
      // Different minimum fees
      expect(solanaFee).toBe(0.0001); // Solana minimum
      expect(sepoliaFee).toBe(0.00001); // Sepolia minimum
    });
  });
});

describe('calculateRelayerFeeBigInt', () => {
  describe('Solana (9 decimals)', () => {
    it('should calculate fees correctly for lamports', () => {
      // 5 SOL = 5,000,000,000 lamports
      const amount = 5_000_000_000n;
      const fee = calculateRelayerFeeBigInt(amount, 'solana', 9);
      
      // Expected: 0.005 SOL = 5,000,000 lamports
      expect(fee).toBe(5_000_000n);
    });

    it('should enforce minimum fee in lamports', () => {
      // 0.001 SOL = 1,000,000 lamports
      const amount = 1_000_000n;
      const fee = calculateRelayerFeeBigInt(amount, 'solana', 9);
      
      // Expected: 0.0001 SOL = 100,000 lamports (minimum)
      expect(fee).toBe(100_000n);
    });

    it('should handle large amounts in lamports', () => {
      // 1000 SOL = 1,000,000,000,000 lamports
      const amount = 1_000_000_000_000n;
      const fee = calculateRelayerFeeBigInt(amount, 'solana', 9);
      
      // Expected: 0.5 SOL = 500,000,000 lamports (0.05% of 1000 SOL)
      expect(fee).toBe(500_000_000n);
    });
  });

  describe('Sepolia (18 decimals)', () => {
    it('should calculate fees correctly for wei', () => {
      // 5 ETH = 5 * 10^18 wei
      const amount = 5_000_000_000_000_000_000n;
      const fee = calculateRelayerFeeBigInt(amount, 'sepolia', 18);
      
      // Expected: 0.005 ETH = 5 * 10^15 wei
      expect(fee).toBe(5_000_000_000_000_000n);
    });

    it('should enforce minimum fee in wei', () => {
      // 0.0001 ETH = 10^14 wei
      const amount = 100_000_000_000_000n;
      const fee = calculateRelayerFeeBigInt(amount, 'sepolia', 18);
      
      // Expected: 0.00001 ETH = 10^13 wei (minimum)
      expect(fee).toBe(10_000_000_000_000n);
    });

    it('should handle large amounts in wei', () => {
      // 1000 ETH = 1000 * 10^18 wei
      const amount = 1_000_000_000_000_000_000_000n;
      const fee = calculateRelayerFeeBigInt(amount, 'sepolia', 18);
      
      // Expected: 0.5 ETH = 5 * 10^17 wei (0.05% of 1000 ETH)
      expect(fee).toBe(500_000_000_000_000_000n);
    });
  });

  describe('Edge cases', () => {
    it('should return 0 for zero amount', () => {
      expect(calculateRelayerFeeBigInt(0n, 'solana', 9)).toBe(0n);
      expect(calculateRelayerFeeBigInt(0n, 'sepolia', 18)).toBe(0n);
    });

    it('should throw error for negative amounts', () => {
      expect(() => calculateRelayerFeeBigInt(-1n, 'solana', 9)).toThrow('Amount cannot be negative');
      expect(() => calculateRelayerFeeBigInt(-1000n, 'sepolia', 18)).toThrow('Amount cannot be negative');
    });

    it('should throw error for negative decimals', () => {
      expect(() => calculateRelayerFeeBigInt(1000n, 'solana', -1)).toThrow('Decimals cannot be negative');
    });

    it('should throw error for unsupported chains', () => {
      expect(() => calculateRelayerFeeBigInt(1000n, 'bitcoin' as Chain, 8)).toThrow('Unsupported chain: bitcoin');
    });
  });
});

describe('getFeeTierInfo', () => {
  it('should return correct tier info for Tier 1 (0-10)', () => {
    const info = getFeeTierInfo(5);
    expect(info).toEqual({
      minAmount: 0,
      maxAmount: 10,
      feePercentage: 0.001,
      feePercentageDisplay: '0.10%',
    });
  });

  it('should return correct tier info for Tier 2 (10-100)', () => {
    const info = getFeeTierInfo(50);
    expect(info).toEqual({
      minAmount: 10,
      maxAmount: 100,
      feePercentage: 0.0008,
      feePercentageDisplay: '0.08%',
    });
  });

  it('should return correct tier info for Tier 3 (100-1000)', () => {
    const info = getFeeTierInfo(500);
    expect(info).toEqual({
      minAmount: 100,
      maxAmount: 1000,
      feePercentage: 0.0006,
      feePercentageDisplay: '0.06%',
    });
  });

  it('should return correct tier info for Tier 4 (1000+)', () => {
    const info = getFeeTierInfo(5000);
    expect(info).toEqual({
      minAmount: 1000,
      maxAmount: null,
      feePercentage: 0.0005,
      feePercentageDisplay: '0.05%',
    });
  });

  it('should handle boundary values correctly', () => {
    expect(getFeeTierInfo(10)?.feePercentage).toBe(0.0008); // Tier 2
    expect(getFeeTierInfo(9.99)?.feePercentage).toBe(0.001); // Tier 1
    expect(getFeeTierInfo(100)?.feePercentage).toBe(0.0006); // Tier 3
    expect(getFeeTierInfo(99.99)?.feePercentage).toBe(0.0008); // Tier 2
  });
});

describe('getMinimumFee', () => {
  it('should return correct minimum fee for Solana', () => {
    expect(getMinimumFee('solana')).toBe(0.0001);
  });

  it('should return correct minimum fee for Sepolia', () => {
    expect(getMinimumFee('sepolia')).toBe(0.00001);
  });

  it('should throw error for unsupported chains', () => {
    expect(() => getMinimumFee('bitcoin' as Chain)).toThrow('Unsupported chain: bitcoin');
  });
});

describe('Real-world scenarios', () => {
  it('should calculate fees for typical withdrawal amounts', () => {
    // Small withdrawal: 0.5 SOL
    expect(calculateRelayerFee(0.5, 'solana')).toBe(0.0005); // 0.10% tier
    
    // Medium withdrawal: 25 SOL
    expect(calculateRelayerFee(25, 'solana')).toBe(0.02); // 0.08% tier
    
    // Large withdrawal: 500 SOL
    expect(calculateRelayerFee(500, 'solana')).toBe(0.3); // 0.06% tier
    
    // Very large withdrawal: 5000 SOL
    expect(calculateRelayerFee(5000, 'solana')).toBe(2.5); // 0.05% tier
  });

  it('should calculate fees for typical ETH withdrawals', () => {
    // Small withdrawal: 0.1 ETH
    expect(calculateRelayerFee(0.1, 'sepolia')).toBe(0.0001); // 0.10% tier
    
    // Medium withdrawal: 5 ETH
    expect(calculateRelayerFee(5, 'sepolia')).toBe(0.005); // 0.10% tier
    
    // Large withdrawal: 50 ETH
    expect(calculateRelayerFee(50, 'sepolia')).toBe(0.04); // 0.08% tier
    
    // Very large withdrawal: 2000 ETH
    expect(calculateRelayerFee(2000, 'sepolia')).toBe(1); // 0.05% tier
  });

  it('should handle dust amounts with minimum fees', () => {
    // Dust amount on Solana
    expect(calculateRelayerFee(0.0001, 'solana')).toBe(0.0001); // Minimum enforced
    
    // Dust amount on Sepolia
    expect(calculateRelayerFee(0.00001, 'sepolia')).toBe(0.00001); // Minimum enforced
  });
});
