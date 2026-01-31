import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import {
  MemoryNicknameProvider,
  FileNicknameProvider,
  createMemoryNicknameProvider,
  createFileNicknameProvider,
  parseNicknameStore,
  serializeNicknameStore,
} from './provider.js';
import type { NicknameStore } from '../types/index.js';

// Test addresses (valid Solana addresses)
const ADDR1 = 'CG2j5yV6XokVsDBgGdgxUSi6jSAq6oq8J83LPivwJwwb';
const ADDR2 = '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9';
const ADDR3 = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';

describe('MemoryNicknameProvider', () => {
  let provider: MemoryNicknameProvider;

  beforeEach(() => {
    provider = createMemoryNicknameProvider();
  });

  describe('basic operations', () => {
    it('should start empty', () => {
      expect(provider.count()).toBe(0);
      expect(provider.get(ADDR1)).toBeNull();
      expect(provider.has(ADDR1)).toBe(false);
    });

    it('should set and get nicknames', () => {
      provider.set(ADDR1, 'My Wallet');

      expect(provider.get(ADDR1)).toBe('My Wallet');
      expect(provider.has(ADDR1)).toBe(true);
      expect(provider.count()).toBe(1);
    });

    it('should update existing nicknames', () => {
      provider.set(ADDR1, 'Old Name');
      provider.set(ADDR1, 'New Name');

      expect(provider.get(ADDR1)).toBe('New Name');
      expect(provider.count()).toBe(1);
    });

    it('should remove nicknames', () => {
      provider.set(ADDR1, 'My Wallet');
      provider.remove(ADDR1);

      expect(provider.get(ADDR1)).toBeNull();
      expect(provider.has(ADDR1)).toBe(false);
      expect(provider.count()).toBe(0);
    });

    it('should handle removing non-existent nickname', () => {
      provider.remove(ADDR1); // Should not throw
      expect(provider.count()).toBe(0);
    });

    it('should clear all nicknames', () => {
      provider.set(ADDR1, 'Wallet 1');
      provider.set(ADDR2, 'Wallet 2');
      provider.clear();

      expect(provider.count()).toBe(0);
      expect(provider.get(ADDR1)).toBeNull();
      expect(provider.get(ADDR2)).toBeNull();
    });
  });

  describe('validation', () => {
    it('should trim nicknames', () => {
      provider.set(ADDR1, '  My Wallet  ');
      expect(provider.get(ADDR1)).toBe('My Wallet');
    });

    it('should limit nickname length to 50 characters', () => {
      const longName = 'A'.repeat(100);
      provider.set(ADDR1, longName);
      expect(provider.get(ADDR1)?.length).toBe(50);
    });

    it('should throw for empty nickname', () => {
      // Empty string fails the initial falsy check
      expect(() => provider.set(ADDR1, '')).toThrow('Address and nickname are required');
      // Whitespace-only fails after trimming
      expect(() => provider.set(ADDR1, '   ')).toThrow('Nickname cannot be empty');
    });

    it('should throw for invalid address length', () => {
      expect(() => provider.set('short', 'Name')).toThrow('Invalid Solana address length');
      expect(() => provider.set('A'.repeat(50), 'Name')).toThrow('Invalid Solana address length');
    });
  });

  describe('getAll', () => {
    it('should return all nicknames as a Map', () => {
      provider.set(ADDR1, 'Wallet 1');
      provider.set(ADDR2, 'Wallet 2');

      const all = provider.getAll();

      expect(all.size).toBe(2);
      expect(all.get(ADDR1)).toBe('Wallet 1');
      expect(all.get(ADDR2)).toBe('Wallet 2');
    });

    it('should return a copy, not the internal map', () => {
      provider.set(ADDR1, 'Wallet 1');
      const all = provider.getAll();

      all.set(ADDR2, 'Wallet 2'); // Modify the returned map

      expect(provider.has(ADDR2)).toBe(false); // Original should be unchanged
    });
  });

  describe('export/import', () => {
    it('should export to NicknameStore format', () => {
      provider.set(ADDR1, 'Wallet 1');
      provider.set(ADDR2, 'Wallet 2');

      const store = provider.export();

      expect(store.version).toBe('1.0.0');
      expect(store.nicknames[ADDR1]).toBe('Wallet 1');
      expect(store.nicknames[ADDR2]).toBe('Wallet 2');
      expect(typeof store.createdAt).toBe('number');
      expect(typeof store.updatedAt).toBe('number');
    });

    it('should import nicknames without overwriting existing', () => {
      provider.set(ADDR1, 'Original');

      const store: NicknameStore = {
        version: '1.0.0',
        nicknames: {
          [ADDR1]: 'Imported',
          [ADDR2]: 'New Wallet',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      provider.import(store, false);

      expect(provider.get(ADDR1)).toBe('Original'); // Not overwritten
      expect(provider.get(ADDR2)).toBe('New Wallet'); // Added
    });

    it('should import nicknames with overwriting when specified', () => {
      provider.set(ADDR1, 'Original');

      const store: NicknameStore = {
        version: '1.0.0',
        nicknames: {
          [ADDR1]: 'Imported',
          [ADDR2]: 'New Wallet',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      provider.import(store, true);

      expect(provider.get(ADDR1)).toBe('Imported'); // Overwritten
      expect(provider.get(ADDR2)).toBe('New Wallet');
    });

    it('should throw for invalid store format', () => {
      const invalidStore = { invalid: true } as unknown as NicknameStore;
      expect(() => provider.import(invalidStore)).toThrow('Invalid nickname store format');
    });
  });

  describe('constructor with initial store', () => {
    it('should initialize with provided store', () => {
      const store: NicknameStore = {
        version: '1.0.0',
        nicknames: {
          [ADDR1]: 'Initial Wallet',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const providerWithStore = new MemoryNicknameProvider(store);

      expect(providerWithStore.get(ADDR1)).toBe('Initial Wallet');
    });
  });
});

describe('FileNicknameProvider', () => {
  const testFilePath = join(process.cwd(), 'test-nicknames.json');

  afterEach(() => {
    if (existsSync(testFilePath)) {
      unlinkSync(testFilePath);
    }
  });

  it('should create file on first save', () => {
    const provider = createFileNicknameProvider(testFilePath);
    provider.set(ADDR1, 'Test Wallet');

    expect(existsSync(testFilePath)).toBe(true);
  });

  it('should persist nicknames to file', () => {
    const provider1 = createFileNicknameProvider(testFilePath);
    provider1.set(ADDR1, 'Persisted Wallet');

    // Create new provider from same file
    const provider2 = createFileNicknameProvider(testFilePath);

    expect(provider2.get(ADDR1)).toBe('Persisted Wallet');
  });

  it('should load existing file', () => {
    // Create file manually
    const store: NicknameStore = {
      version: '1.0.0',
      nicknames: {
        [ADDR1]: 'Existing Wallet',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    writeFileSync(testFilePath, JSON.stringify(store, null, 2));

    const provider = createFileNicknameProvider(testFilePath);

    expect(provider.get(ADDR1)).toBe('Existing Wallet');
  });

  it('should auto-save on changes', () => {
    const provider = createFileNicknameProvider(testFilePath);
    provider.set(ADDR1, 'Wallet 1');
    provider.set(ADDR2, 'Wallet 2');
    provider.remove(ADDR1);

    // Read file directly
    const content = JSON.parse(require('fs').readFileSync(testFilePath, 'utf-8'));

    expect(content.nicknames[ADDR1]).toBeUndefined();
    expect(content.nicknames[ADDR2]).toBe('Wallet 2');
  });
});

describe('parseNicknameStore / serializeNicknameStore', () => {
  it('should roundtrip correctly', () => {
    const store: NicknameStore = {
      version: '1.0.0',
      nicknames: {
        [ADDR1]: 'Test Wallet',
      },
      createdAt: 1234567890,
      updatedAt: 1234567890,
    };

    const serialized = serializeNicknameStore(store);
    const parsed = parseNicknameStore(serialized);

    expect(parsed).toEqual(store);
  });

  it('should throw for invalid JSON', () => {
    expect(() => parseNicknameStore('not json')).toThrow();
  });

  it('should throw for invalid store format', () => {
    expect(() => parseNicknameStore('{"invalid": true}')).toThrow('Invalid nickname store format');
  });
});
