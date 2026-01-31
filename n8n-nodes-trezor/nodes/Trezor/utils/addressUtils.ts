/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

const HARDENED_OFFSET = 0x80000000;

export function parsePath(path: string): number[] {
  return path
    .replace(/^m\//, '')
    .split('/')
    .filter((p) => p)
    .map((p) => {
      const hardened = p.endsWith("'") || p.endsWith('h');
      const num = parseInt(p.replace(/['h]$/, ''), 10);
      return hardened ? num + HARDENED_OFFSET : num;
    });
}

export function formatPath(components: number[]): string {
  return (
    'm/' +
    components
      .map((c) => {
        if (c >= HARDENED_OFFSET) {
          return `${c - HARDENED_OFFSET}'`;
        }
        return c.toString();
      })
      .join('/')
  );
}

export function isHardenedPath(path: string): boolean {
  return path.includes("'") || path.includes('h');
}

export function getAccountIndex(path: string | number[]): number {
  const components = typeof path === 'string' ? parsePath(path) : path;
  if (components.length < 3) return 0;
  const accountComponent = components[2];
  return accountComponent >= HARDENED_OFFSET
    ? accountComponent - HARDENED_OFFSET
    : accountComponent;
}

export function getAddressIndex(path: string | number[]): number {
  const components = typeof path === 'string' ? parsePath(path) : path;
  if (components.length === 0) return 0;
  const lastComponent = components[components.length - 1];
  return lastComponent >= HARDENED_OFFSET
    ? lastComponent - HARDENED_OFFSET
    : lastComponent;
}

export function incrementAddressIndex(path: string | number[]): string {
  const components = typeof path === 'string' ? parsePath(path) : [...path];
  if (components.length === 0) return formatPath([0]);
  const lastIndex = components.length - 1;
  const isHardened = components[lastIndex] >= HARDENED_OFFSET;
  if (isHardened) {
    components[lastIndex] = components[lastIndex] - HARDENED_OFFSET + 1 + HARDENED_OFFSET;
  } else {
    components[lastIndex] += 1;
  }
  return formatPath(components);
}

export function getChangePath(path: string | number[]): string {
  const components = typeof path === 'string' ? parsePath(path) : [...path];
  if (components.length < 4) {
    throw new Error('Path too short to have a change component');
  }
  components[components.length - 2] = 1;
  return formatPath(components);
}

export function validateAddress(address: string, coin: string): boolean {
  const patterns: Record<string, RegExp> = {
    btc: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    bitcoin: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    eth: /^0x[a-fA-F0-9]{40}$/,
    ethereum: /^0x[a-fA-F0-9]{40}$/,
    ltc: /^(ltc1|[LM3])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    litecoin: /^(ltc1|[LM3])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    ada: /^addr1[a-z0-9]{58}$/,
    cardano: /^addr1[a-z0-9]{58}$/,
    sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    xrp: /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/,
    ripple: /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/,
  };
  const pattern = patterns[coin.toLowerCase()];
  if (!pattern) return true;
  return pattern.test(address);
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
