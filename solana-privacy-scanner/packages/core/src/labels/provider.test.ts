import { describe, it, expect } from 'vitest';
import { StaticLabelProvider, createDefaultLabelProvider } from './provider.js';

describe('Label Provider - Extended Database (v0.4.0)', () => {
  describe('Database Loading', () => {
    it('should load all addresses from the database', () => {
      const provider = createDefaultLabelProvider();

      expect(provider.getCount()).toBe(104);
      console.log(`✓ Loaded ${provider.getCount()} addresses`);
    });

    it('should load all label types correctly', () => {
      const provider = createDefaultLabelProvider();
      const labels = provider.getAllLabels();

      const typeStats = labels.reduce((acc, label) => {
        acc[label.type] = (acc[label.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('\nLabel type distribution:');
      Object.entries(typeStats).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      // Verify expected types exist
      expect(typeStats.exchange).toBeGreaterThan(0);
      expect(typeStats.bridge).toBeGreaterThan(0);
      expect(typeStats.protocol).toBeGreaterThan(0);
      expect(typeStats.token).toBeGreaterThan(0);
      expect(typeStats.mev).toBeGreaterThan(0);
      expect(typeStats.program).toBeGreaterThan(0);
    });
  });

  describe('CEX Addresses (v0.4.0)', () => {
    it('should detect Binance Hot Wallet 2', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('Binance Hot Wallet 2');
      expect(label?.type).toBe('exchange');
    });

    it('should detect Binance', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('Binance');
      expect(label?.type).toBe('exchange');
    });

    it('should detect Coinbase Hot Wallet 2', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('Coinbase Hot Wallet 2');
      expect(label?.type).toBe('exchange');
    });

    it('should detect OKX Hot Wallet', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('C68a6RCGLiPskbPYtAcsCjhG8tfTWYcoB4JjCrXFdqyo');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('OKX Hot Wallet');
      expect(label?.type).toBe('exchange');
    });

    it('should detect Bybit Hot Wallet', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('Bybit Hot Wallet');
      expect(label?.type).toBe('exchange');
    });
  });

  describe('Bridge Addresses (v0.4.0)', () => {
    it('should detect Wormhole Token Bridge', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('Wormhole Token Bridge');
      expect(label?.type).toBe('bridge');
    });

    it('should detect Mayan Finance', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('MAYNwD9HmfvnnVMEVGdgSVKdmnPkXH56WfwNyoUdNDG');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('Mayan Finance');
      expect(label?.type).toBe('bridge');
    });

    it('should detect deBridge Router', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('DEbrdGj3HsRgkjJNp8G5Xcsxfk48kUFXCgyazG5zLMqv');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('deBridge Router');
      expect(label?.type).toBe('bridge');
    });
  });

  describe('DEX Protocol Addresses (v0.4.0)', () => {
    it('should detect Jupiter v6', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('Jupiter v6');
      expect(label?.type).toBe('protocol');
    });

    it('should detect Raydium AMM v4', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('Raydium AMM v4');
      expect(label?.type).toBe('protocol');
    });

    it('should detect Orca Whirlpools', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('Orca Whirlpools');
      expect(label?.type).toBe('protocol');
    });

    it('should detect Phoenix DEX', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('Phoenix DEX');
      expect(label?.type).toBe('protocol');
    });
  });

  describe('MEV Infrastructure (v0.4.0)', () => {
    it('should detect Jito Tip Payment', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('T1pyyaTNZsKv2WcRAB8oVnk93mLJw2XzjtVYqCsaHqt');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('Jito Tip Payment');
      expect(label?.type).toBe('mev');
    });

    it('should detect multiple Jito Tip Accounts', () => {
      const provider = createDefaultLabelProvider();

      const tipAccounts = [
        '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
        'HFqU5x63VTqvQss8hp11i4bVmkSQG8j2Dn9HwwP65esD',
        'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
      ];

      tipAccounts.forEach(addr => {
        const label = provider.lookup(addr);
        expect(label).not.toBeNull();
        expect(label?.type).toBe('mev');
        expect(label?.name).toContain('Jito Tip Account');
      });
    });

    it('should detect BloXroute', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('BLXRWEHvT2VqNkHMVi9A8QD9jGPfE5vA9nxnYK5sVmfb');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('BloXroute Memo');
      expect(label?.type).toBe('mev');
    });
  });

  describe('Token Mints (v0.4.0)', () => {
    it('should detect USDC', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('USDC');
      expect(label?.type).toBe('token');
    });

    it('should detect JitoSOL', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('JitoSOL Token Mint');
      expect(label?.type).toBe('token');
    });

    it('should detect mSOL', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('mSOL Token Mint');
      expect(label?.type).toBe('token');
    });
  });

  describe('Core Solana Programs (v0.4.0)', () => {
    it('should detect System Program', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('11111111111111111111111111111111');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('System Program');
      expect(label?.type).toBe('program');
    });

    it('should detect SPL Token Program', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('SPL Token Program');
      expect(label?.type).toBe('program');
    });

    it('should detect SPL Token 2022', () => {
      const provider = createDefaultLabelProvider();
      const label = provider.lookup('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

      expect(label).not.toBeNull();
      expect(label?.name).toBe('SPL Token 2022');
      expect(label?.type).toBe('program');
    });
  });

  describe('Batch Lookups', () => {
    it('should lookup multiple addresses efficiently', () => {
      const provider = createDefaultLabelProvider();

      const addresses = [
        '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9', // Binance
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', // Jupiter
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'T1pyyaTNZsKv2WcRAB8oVnk93mLJw2XzjtVYqCsaHqt', // Jito Tip
      ];

      const results = provider.lookupMany(addresses);

      expect(results.size).toBe(4);
      expect(results.get(addresses[0])?.type).toBe('exchange');
      expect(results.get(addresses[1])?.type).toBe('protocol');
      expect(results.get(addresses[2])?.type).toBe('token');
      expect(results.get(addresses[3])?.type).toBe('mev');
    });

    it('should handle unknown addresses gracefully', () => {
      const provider = createDefaultLabelProvider();

      const unknownAddress = 'UnknownAddressxxxxxxxxxxxxxxxxxxxxxxx';
      const label = provider.lookup(unknownAddress);

      expect(label).toBeNull();
    });

    it('should handle mixed known and unknown addresses', () => {
      const provider = createDefaultLabelProvider();

      const addresses = [
        '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9', // Known (Binance)
        'UnknownAddress1xxxxxxxxxxxxxxxxxxxxx', // Unknown
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', // Known (Jupiter)
        'UnknownAddress2xxxxxxxxxxxxxxxxxxxxx', // Unknown
      ];

      const results = provider.lookupMany(addresses);

      expect(results.size).toBe(2); // Only known addresses
      expect(results.has(addresses[0])).toBe(true);
      expect(results.has(addresses[1])).toBe(false);
      expect(results.has(addresses[2])).toBe(true);
      expect(results.has(addresses[3])).toBe(false);
    });
  });

  describe('Type Coverage', () => {
    it('should have comprehensive coverage of different entity types', () => {
      const provider = createDefaultLabelProvider();
      const labels = provider.getAllLabels();

      const hasExchange = labels.some(l => l.type === 'exchange');
      const hasBridge = labels.some(l => l.type === 'bridge');
      const hasProtocol = labels.some(l => l.type === 'protocol');
      const hasToken = labels.some(l => l.type === 'token');
      const hasMev = labels.some(l => l.type === 'mev');
      const hasProgram = labels.some(l => l.type === 'program');

      expect(hasExchange).toBe(true);
      expect(hasBridge).toBe(true);
      expect(hasProtocol).toBe(true);
      expect(hasToken).toBe(true);
      expect(hasMev).toBe(true);
      expect(hasProgram).toBe(true);

      console.log('\n✓ Database has comprehensive type coverage');
    });
  });
});
