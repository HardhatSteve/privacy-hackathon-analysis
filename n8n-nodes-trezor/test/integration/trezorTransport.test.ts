/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { TrezorTransport } from '../../nodes/Trezor/transport/TrezorTransport';

describe('TrezorTransport Integration', () => {
  let transport: TrezorTransport;

  beforeEach(() => {
    transport = new TrezorTransport({
      manifestEmail: 'test@example.com',
      manifestAppUrl: 'https://example.com',
      debug: false,
    });
  });

  afterEach(async () => {
    await transport.dispose();
  });

  describe('Device Operations', () => {
    it('should get device features (mock)', async () => {
      const result = await transport.getFeatures();
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.payload).toHaveProperty('model');
        expect(result.payload).toHaveProperty('major_version');
        expect(result.payload).toHaveProperty('minor_version');
        expect(result.payload).toHaveProperty('device_id');
      }
    });
  });

  describe('Bitcoin Operations', () => {
    it('should get Bitcoin address (mock)', async () => {
      const result = await transport.getAddress("m/44'/0'/0'/0/0", 'btc', false);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.payload).toHaveProperty('address');
        expect(result.payload).toHaveProperty('serializedPath');
      }
    });

    it('should get public key (mock)', async () => {
      const result = await transport.getPublicKey("m/44'/0'/0'", 'btc', false);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.payload).toHaveProperty('publicKey');
        expect(result.payload).toHaveProperty('serializedPath');
        expect(result.payload).toHaveProperty('node');
      }
    });

    it('should sign message (mock)', async () => {
      const result = await transport.signMessage("m/44'/0'/0'/0/0", 'Hello, World!', 'btc');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.payload).toHaveProperty('address');
        expect(result.payload).toHaveProperty('signature');
      }
    });

    it('should verify message (mock)', async () => {
      const result = await transport.verifyMessage(
        'bc1qmock',
        'Hello, World!',
        '0x' + '0'.repeat(130),
        'btc'
      );
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.payload.valid).toBe(true);
      }
    });
  });

  describe('Ethereum Operations', () => {
    it('should sign Ethereum transaction (mock)', async () => {
      const result = await transport.ethereumSignTransaction("m/44'/60'/0'/0/0", {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bEaC',
        value: '1000000000000000000',
        gasLimit: '21000',
        maxFeePerGas: '50000000000',
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.payload).toHaveProperty('v');
        expect(result.payload).toHaveProperty('r');
        expect(result.payload).toHaveProperty('s');
      }
    });
  });

  describe('Multi-coin Support', () => {
    it('should handle Litecoin address (mock)', async () => {
      const result = await transport.getAddress("m/84'/2'/0'/0/0", 'ltc', false);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle Dogecoin address (mock)', async () => {
      const result = await transport.getAddress("m/44'/3'/0'/0/0", 'doge', false);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('Lifecycle', () => {
    it('should initialize and dispose correctly', async () => {
      await transport.init();
      await transport.dispose();
      // Should be able to init again after dispose
      await transport.init();
      const result = await transport.getFeatures();
      expect(result.success).toBe(true);
    });
  });
});
