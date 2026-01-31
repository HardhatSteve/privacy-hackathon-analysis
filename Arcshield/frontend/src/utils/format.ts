import { PublicKey } from '@solana/web3.js';

export const formatAddress = (address: string | PublicKey, length: number = 8): string => {
  const addr = typeof address === 'string' ? address : address.toBase58();
  if (addr.length <= length * 2) {
    return addr;
  }
  return `${addr.slice(0, length)}...${addr.slice(-length)}`;
};

export const formatAmount = (amount: bigint | number | string, decimals: number = 9): string => {
  const num = typeof amount === 'bigint' ? Number(amount) : Number(amount);
  const divisor = Math.pow(10, decimals);
  return (num / divisor).toFixed(decimals).replace(/\.?0+$/, '');
};

export const formatBasisPoints = (bps: number): string => {
  return `${(bps / 100).toFixed(2)}%`;
};

export const formatTimestamp = (date: Date): string => {
  return date.toLocaleString();
};
