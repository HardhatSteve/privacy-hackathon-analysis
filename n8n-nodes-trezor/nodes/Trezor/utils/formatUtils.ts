/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export function formatAmount(amount: string | number, decimals: number = 8): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return value.toFixed(decimals).replace(/\.?0+$/, '');
}

export function toSatoshis(btc: string | number): bigint {
  const value = typeof btc === 'string' ? parseFloat(btc) : btc;
  return BigInt(Math.round(value * 100000000));
}

export function fromSatoshis(satoshis: bigint | string | number): string {
  const value = typeof satoshis === 'bigint' ? satoshis : BigInt(satoshis);
  const btc = Number(value) / 100000000;
  return formatAmount(btc, 8);
}

export function toWei(eth: string | number): bigint {
  const value = typeof eth === 'string' ? parseFloat(eth) : eth;
  return BigInt(Math.round(value * 1e18));
}

export function fromWei(wei: bigint | string | number): string {
  const value = typeof wei === 'bigint' ? wei : BigInt(wei);
  const eth = Number(value) / 1e18;
  return formatAmount(eth, 18);
}

export function toLovelace(ada: string | number): bigint {
  const value = typeof ada === 'string' ? parseFloat(ada) : ada;
  return BigInt(Math.round(value * 1000000));
}

export function fromLovelace(lovelace: bigint | string | number): string {
  const value = typeof lovelace === 'bigint' ? lovelace : BigInt(lovelace);
  const ada = Number(value) / 1000000;
  return formatAmount(ada, 6);
}

export function toLamports(sol: string | number): bigint {
  const value = typeof sol === 'string' ? parseFloat(sol) : sol;
  return BigInt(Math.round(value * 1e9));
}

export function fromLamports(lamports: bigint | string | number): string {
  const value = typeof lamports === 'bigint' ? lamports : BigInt(lamports);
  const sol = Number(value) / 1e9;
  return formatAmount(sol, 9);
}

export function toDrops(xrp: string | number): bigint {
  const value = typeof xrp === 'string' ? parseFloat(xrp) : xrp;
  return BigInt(Math.round(value * 1000000));
}

export function fromDrops(drops: bigint | string | number): string {
  const value = typeof drops === 'bigint' ? drops : BigInt(drops);
  const xrp = Number(value) / 1000000;
  return formatAmount(xrp, 6);
}

export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array, prefix: boolean = true): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return prefix ? `0x${hex}` : hex;
}

export function formatTimestamp(timestamp: number | string): string {
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
  return date.toISOString();
}

export function formatFee(fee: string | number, coin: string): string {
  const decimals: Record<string, number> = {
    btc: 8,
    eth: 18,
    ada: 6,
    sol: 9,
    xrp: 6,
  };
  const dec = decimals[coin.toLowerCase()] ?? 8;
  return formatAmount(fee, dec);
}
