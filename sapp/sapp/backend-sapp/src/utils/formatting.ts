/**
 * Formatting Utilities
 * Common formatting functions
 */

/**
 * Format APY as percentage string
 */
export function formatAPY(apy: number): string {
  return `${apy.toFixed(2)}%`;
}

/**
 * Format TVL with appropriate suffix (K, M, B)
 */
export function formatTVL(tvl: string | number): string {
  const value = typeof tvl === 'string' ? parseFloat(tvl) : tvl;

  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Format a token amount with decimals
 */
export function formatTokenAmount(
  amount: string | number,
  decimals: number,
  displayDecimals: number = 4
): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  const adjusted = value / Math.pow(10, decimals);
  return adjusted.toFixed(displayDecimals);
}

/**
 * Truncate an address for display (e.g., 0x1234...5678)
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 3) {
    return address;
  }
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a timestamp as ISO string
 */
export function formatTimestamp(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString();
}
