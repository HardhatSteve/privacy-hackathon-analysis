/**
 * WOTS Wallet Test Helper
 * 
 * Helper to load WOTSWallet from mochimo-wots-v2 library for testing.
 * The library uses ES modules which Jest cannot handle properly, so we use
 * the UMD build instead.
 */

// Load the UMD build which works with CommonJS/Jest
const wotsLib = require('../../node_modules/mochimo-wots-v2/dist/index.umd.js');

export const WOTSWallet = wotsLib.WOTSWallet;

/**
 * Create a test WOTS wallet
 * 
 * @param name - Wallet name
 * @param secret - 32-byte secret
 * @param tag - 20-byte tag
 * @returns Wallet object with wots property containing 2208-byte address
 */
export function createTestWallet(name: string, secret: Uint8Array, tag: Uint8Array): any {
  const wallet = WOTSWallet.create(name, secret, tag);
  
  // Verify wallet has the wots property with correct length
  if (!wallet.wots || wallet.wots.length !== 2208) {
    throw new Error(`Invalid WOTS wallet: expected wots property with 2208 bytes, got ${wallet.wots?.length || 0}`);
  }
  
  return wallet;
}

/**
 * Get the full WOTS address (2208 bytes) from a wallet
 * 
 * @param wallet - WOTS wallet object
 * @returns 2208-byte WOTS address as hex string
 */
export function getWalletAddress(wallet: any): string {
  if (!wallet.wots || wallet.wots.length !== 2208) {
    throw new Error(`Invalid WOTS wallet: expected wots property with 2208 bytes, got ${wallet.wots?.length || 0}`);
  }
  
  return Buffer.from(wallet.wots).toString('hex');
}
