import { describe, it, expect, beforeEach } from 'vitest';
import {
  truncateAddress,
  displayAddress,
  displayAddresses,
  getAddressDisplayInfo,
  createAddressFormatter,
} from './display-address.js';
import { MemoryNicknameProvider } from '../nicknames/provider.js';
import type { LabelProvider, Label } from '../types/index.js';

// Test addresses (valid Solana addresses)
const ADDR1 = 'CG2j5yV6XokVsDBgGdgxUSi6jSAq6oq8J83LPivwJwwb';
const ADDR2 = '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9';
const ADDR3 = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';

// Mock label provider
function createMockLabelProvider(labels: Record<string, Label>): LabelProvider {
  return {
    lookup(address: string) {
      return labels[address] || null;
    },
    lookupMany(addresses: string[]) {
      const results = new Map<string, Label>();
      for (const addr of addresses) {
        const label = labels[addr];
        if (label) {
          results.set(addr, label);
        }
      }
      return results;
    },
  };
}

describe('truncateAddress', () => {
  it('should truncate long addresses', () => {
    expect(truncateAddress(ADDR1)).toBe('CG2j...Jwwb');
  });

  it('should use custom character count', () => {
    expect(truncateAddress(ADDR1, 6)).toBe('CG2j5y...vwJwwb');
  });

  it('should return short strings unchanged', () => {
    expect(truncateAddress('short')).toBe('short');
  });

  it('should handle empty string', () => {
    expect(truncateAddress('')).toBe('');
  });
});

describe('displayAddress', () => {
  let nicknames: MemoryNicknameProvider;
  let labels: LabelProvider;

  beforeEach(() => {
    nicknames = new MemoryNicknameProvider();
    labels = createMockLabelProvider({
      [ADDR2]: {
        address: ADDR2,
        name: 'Binance Hot Wallet',
        type: 'exchange',
        description: 'Binance exchange hot wallet',
      },
    });
  });

  it('should use nickname with address suffix by default', () => {
    nicknames.set(ADDR1, 'My Main Wallet');

    const result = displayAddress(ADDR1, { nicknames });

    expect(result).toBe('My Main Wallet (CG2j...Jwwb)');
  });

  it('should use nickname without suffix when disabled', () => {
    nicknames.set(ADDR1, 'My Main Wallet');

    const result = displayAddress(ADDR1, { nicknames, showAddressSuffix: false });

    expect(result).toBe('My Main Wallet');
  });

  it('should use label when no nickname', () => {
    const result = displayAddress(ADDR2, { labels });

    expect(result).toBe('Binance Hot Wallet');
  });

  it('should prefer nickname over label', () => {
    nicknames.set(ADDR2, 'CEX Deposit');

    const result = displayAddress(ADDR2, { nicknames, labels });

    expect(result).toBe('CEX Deposit (5tzF...uAi9)');
  });

  it('should truncate when no nickname or label', () => {
    const result = displayAddress(ADDR3, { nicknames, labels });

    expect(result).toBe('9WzD...AWWM');
  });

  it('should use full format', () => {
    nicknames.set(ADDR1, 'My Wallet');

    const result = displayAddress(ADDR1, { nicknames, format: 'full' });

    expect(result).toBe(ADDR1);
  });

  it('should use truncated format ignoring nicknames', () => {
    nicknames.set(ADDR1, 'My Wallet');

    const result = displayAddress(ADDR1, { nicknames, format: 'truncated' });

    expect(result).toBe('CG2j...Jwwb');
  });

  it('should work with no options', () => {
    const result = displayAddress(ADDR1);

    expect(result).toBe('CG2j...Jwwb');
  });

  it('should use custom truncate length', () => {
    const result = displayAddress(ADDR1, { truncateChars: 8 });

    expect(result).toBe('CG2j5yV6...PivwJwwb');
  });
});

describe('displayAddresses', () => {
  let nicknames: MemoryNicknameProvider;

  beforeEach(() => {
    nicknames = new MemoryNicknameProvider();
    nicknames.set(ADDR1, 'Wallet A');
  });

  it('should display multiple addresses', () => {
    const result = displayAddresses([ADDR1, ADDR2, ADDR3], { nicknames });

    expect(result).toEqual([
      'Wallet A (CG2j...Jwwb)',
      '5tzF...uAi9',
      '9WzD...AWWM',
    ]);
  });

  it('should handle empty array', () => {
    const result = displayAddresses([], { nicknames });

    expect(result).toEqual([]);
  });
});

describe('getAddressDisplayInfo', () => {
  let nicknames: MemoryNicknameProvider;
  let labels: LabelProvider;

  beforeEach(() => {
    nicknames = new MemoryNicknameProvider();
    labels = createMockLabelProvider({
      [ADDR2]: {
        address: ADDR2,
        name: 'Binance',
        type: 'exchange',
        description: 'Exchange wallet',
      },
    });
  });

  it('should return nickname info', () => {
    nicknames.set(ADDR1, 'My Wallet');

    const info = getAddressDisplayInfo(ADDR1, nicknames, labels);

    expect(info.type).toBe('nickname');
    expect(info.displayText).toBe('My Wallet');
    expect(info.nickname).toBe('My Wallet');
    expect(info.address).toBe(ADDR1);
    expect(info.truncated).toBe('CG2j...Jwwb');
  });

  it('should return label info', () => {
    const info = getAddressDisplayInfo(ADDR2, nicknames, labels);

    expect(info.type).toBe('label');
    expect(info.displayText).toBe('Binance');
    expect(info.label?.name).toBe('Binance');
    expect(info.label?.type).toBe('exchange');
  });

  it('should return address info when no nickname or label', () => {
    const info = getAddressDisplayInfo(ADDR3, nicknames, labels);

    expect(info.type).toBe('address');
    expect(info.displayText).toBe('9WzD...AWWM');
    expect(info.nickname).toBeUndefined();
    expect(info.label).toBeUndefined();
  });

  it('should prefer nickname over label', () => {
    nicknames.set(ADDR2, 'My CEX Account');

    const info = getAddressDisplayInfo(ADDR2, nicknames, labels);

    expect(info.type).toBe('nickname');
    expect(info.displayText).toBe('My CEX Account');
    expect(info.label?.name).toBe('Binance'); // Label still available
  });
});

describe('createAddressFormatter', () => {
  it('should create a reusable formatter function', () => {
    const nicknames = new MemoryNicknameProvider();
    nicknames.set(ADDR1, 'Main');

    const formatter = createAddressFormatter({ nicknames, truncateChars: 6 });

    expect(formatter(ADDR1)).toBe('Main (CG2j5y...vwJwwb)');
    expect(formatter(ADDR2)).toBe('5tzFki...UvuAi9');
  });
});
