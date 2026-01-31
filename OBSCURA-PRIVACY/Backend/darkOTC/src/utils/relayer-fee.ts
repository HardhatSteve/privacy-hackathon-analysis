/**
 * Relayer Fee Calculation Utility
 * 
 * Implements tiered fee structure for relayer operations:
 * - 0.10% for amounts 0-10
 * - 0.08% for amounts 10-100
 * - 0.06% for amounts 100-1000
 * - 0.05% for amounts 1000+
 * 
 * Minimum fees:
 * - Solana (SOL): 0.0001 SOL
 * - Sepolia (ETH): 0.00001 ETH
 * 
 * Requirements: 36.1
 */

export type Chain = 'solana' | 'sepolia';

/**
 * Fee tier configuration
 */
interface FeeTier {
  minAmount: number;
  maxAmount: number | null; // null means no upper limit
  feePercentage: number; // as decimal (e.g., 0.001 = 0.10%)
}

/**
 * Minimum fee configuration by chain
 */
const MINIMUM_FEES: Record<Chain, number> = {
  solana: 0.0001, // 0.0001 SOL
  sepolia: 0.00001, // 0.00001 ETH
};

/**
 * Tiered fee structure
 * Tiers are checked in order, first matching tier is used
 */
const FEE_TIERS: FeeTier[] = [
  { minAmount: 0, maxAmount: 10, feePercentage: 0.001 }, // 0.10%
  { minAmount: 10, maxAmount: 100, feePercentage: 0.0008 }, // 0.08%
  { minAmount: 100, maxAmount: 1000, feePercentage: 0.0006 }, // 0.06%
  { minAmount: 1000, maxAmount: null, feePercentage: 0.0005 }, // 0.05%
];

/**
 * Calculate relayer fee based on withdrawal amount and chain
 * 
 * @param amount - Withdrawal amount (in base units: SOL or ETH)
 * @param chain - Target chain ('solana' or 'sepolia')
 * @returns Calculated fee (in same units as amount)
 * 
 * @throws Error if amount is negative
 * @throws Error if chain is not supported
 * 
 * @example
 * // Calculate fee for 5 SOL withdrawal
 * const fee = calculateRelayerFee(5, 'solana');
 * // Returns: 0.005 (0.10% of 5, but minimum is 0.0001)
 * 
 * @example
 * // Calculate fee for 0.001 SOL withdrawal
 * const fee = calculateRelayerFee(0.001, 'solana');
 * // Returns: 0.0001 (minimum fee enforced)
 */
export function calculateRelayerFee(amount: number, chain: Chain): number {
  // Validate inputs
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }

  if (!MINIMUM_FEES[chain]) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  // Handle zero amount
  if (amount === 0) {
    return 0;
  }

  // Find applicable fee tier
  const tier = FEE_TIERS.find((t) => {
    const aboveMin = amount >= t.minAmount;
    const belowMax = t.maxAmount === null || amount < t.maxAmount;
    return aboveMin && belowMax;
  });

  if (!tier) {
    // This should never happen with properly configured tiers
    throw new Error('No applicable fee tier found');
  }

  // Calculate percentage-based fee
  const calculatedFee = amount * tier.feePercentage;

  // Enforce minimum fee
  const minimumFee = MINIMUM_FEES[chain];
  const finalFee = Math.max(calculatedFee, minimumFee);

  return finalFee;
}

/**
 * Calculate relayer fee for bigint amounts (useful for on-chain calculations)
 * 
 * @param amount - Withdrawal amount in smallest units (lamports for Solana, wei for ETH)
 * @param chain - Target chain ('solana' or 'sepolia')
 * @param decimals - Number of decimals for the token (9 for SOL, 18 for ETH)
 * @returns Calculated fee in smallest units
 * 
 * @example
 * // Calculate fee for 5 SOL (5 * 10^9 lamports)
 * const fee = calculateRelayerFeeBigInt(5000000000n, 'solana', 9);
 * // Returns: 5000000n (0.005 SOL in lamports)
 */
export function calculateRelayerFeeBigInt(
  amount: bigint,
  chain: Chain,
  decimals: number
): bigint {
  // Validate inputs
  if (amount < 0n) {
    throw new Error('Amount cannot be negative');
  }

  if (!MINIMUM_FEES[chain]) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  if (decimals < 0) {
    throw new Error('Decimals cannot be negative');
  }

  // Handle zero amount
  if (amount === 0n) {
    return 0n;
  }

  // Convert to decimal for calculation
  const divisor = 10 ** decimals;
  const amountDecimal = Number(amount) / divisor;

  // Calculate fee using the main function
  const feeDecimal = calculateRelayerFee(amountDecimal, chain);

  // Convert back to smallest units
  const feeBigInt = BigInt(Math.floor(feeDecimal * divisor));

  return feeBigInt;
}

/**
 * Get the fee tier information for a given amount
 * Useful for displaying fee structure to users
 * 
 * @param amount - Amount to check
 * @returns Fee tier information including percentage and range
 */
export function getFeeTierInfo(amount: number): {
  minAmount: number;
  maxAmount: number | null;
  feePercentage: number;
  feePercentageDisplay: string;
} | null {
  const tier = FEE_TIERS.find((t) => {
    const aboveMin = amount >= t.minAmount;
    const belowMax = t.maxAmount === null || amount < t.maxAmount;
    return aboveMin && belowMax;
  });

  if (!tier) {
    return null;
  }

  return {
    ...tier,
    feePercentageDisplay: `${(tier.feePercentage * 100).toFixed(2)}%`,
  };
}

/**
 * Get minimum fee for a chain
 * 
 * @param chain - Target chain
 * @returns Minimum fee for the chain
 */
export function getMinimumFee(chain: Chain): number {
  const minFee = MINIMUM_FEES[chain];
  if (!minFee) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  return minFee;
}
