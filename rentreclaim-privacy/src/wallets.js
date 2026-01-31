/**
 * Multi-Wallet Adapter for RentReclaim
 * Supports: Phantom, Solflare, Backpack
 * 
 * Usage:
 *   import { detectWallets, connectWallet, disconnectWallet } from './wallets';
 *   
 *   const available = detectWallets();
 *   const wallet = await connectWallet('phantom');
 *   await wallet.signTransaction(tx);
 *   disconnectWallet();
 */

// Wallet configurations
const WALLET_CONFIGS = {
  phantom: {
    name: 'Phantom',
    icon: '👻',
    url: 'https://phantom.app',
    detect: () => window?.solana?.isPhantom,
    getProvider: () => window.solana,
  },
  solflare: {
    name: 'Solflare',
    icon: '🔆',
    url: 'https://solflare.com',
    detect: () => window?.solflare?.isSolflare,
    getProvider: () => window.solflare,
  },
  backpack: {
    name: 'Backpack',
    icon: '🎒',
    url: 'https://backpack.app',
    detect: () => window?.backpack?.isBackpack,
    getProvider: () => window.backpack,
  },
};

/**
 * Detect which wallets are installed
 * @returns {Array<{id: string, name: string, icon: string, installed: boolean}>}
 */
export function detectWallets() {
  return Object.entries(WALLET_CONFIGS).map(([id, config]) => ({
    id,
    name: config.name,
    icon: config.icon,
    url: config.url,
    installed: typeof window !== 'undefined' && config.detect(),
  }));
}

/**
 * Get list of installed wallets only
 * @returns {Array<{id: string, name: string, icon: string}>}
 */
export function getInstalledWallets() {
  return detectWallets().filter(w => w.installed);
}

/**
 * Connect to a specific wallet
 * @param {string} walletId - 'phantom' | 'solflare' | 'backpack'
 * @returns {Promise<{publicKey: PublicKey, signTransaction: Function, signAllTransactions: Function}>}
 */
export async function connectWallet(walletId) {
  const config = WALLET_CONFIGS[walletId];
  
  if (!config) {
    throw new Error(`Unknown wallet: ${walletId}`);
  }
  
  if (!config.detect()) {
    throw new Error(`${config.name} is not installed. Get it at ${config.url}`);
  }
  
  const provider = config.getProvider();
  
  try {
    // Connect to wallet
    const response = await provider.connect();
    
    return {
      publicKey: response.publicKey,
      walletId,
      walletName: config.name,
      
      // Sign a single transaction
      signTransaction: async (transaction) => {
        return await provider.signTransaction(transaction);
      },
      
      // Sign multiple transactions
      signAllTransactions: async (transactions) => {
        if (provider.signAllTransactions) {
          return await provider.signAllTransactions(transactions);
        }
        // Fallback: sign one by one
        return await Promise.all(
          transactions.map(tx => provider.signTransaction(tx))
        );
      },
      
      // Disconnect
      disconnect: async () => {
        if (provider.disconnect) {
          await provider.disconnect();
        }
      },
    };
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('Connection rejected by user');
    }
    throw error;
  }
}

/**
 * Disconnect current wallet
 * @param {string} walletId
 */
export async function disconnectWallet(walletId) {
  const config = WALLET_CONFIGS[walletId];
  if (config && config.detect()) {
    const provider = config.getProvider();
    if (provider.disconnect) {
      await provider.disconnect();
    }
  }
}

/**
 * Check if a wallet is connected
 * @param {string} walletId
 * @returns {boolean}
 */
export function isConnected(walletId) {
  const config = WALLET_CONFIGS[walletId];
  if (!config || !config.detect()) return false;
  
  const provider = config.getProvider();
  return provider.isConnected || false;
}

/**
 * Get the currently connected wallet's public key
 * @param {string} walletId
 * @returns {PublicKey|null}
 */
export function getPublicKey(walletId) {
  const config = WALLET_CONFIGS[walletId];
  if (!config || !config.detect()) return null;
  
  const provider = config.getProvider();
  return provider.publicKey || null;
}

/**
 * Listen for wallet events
 * @param {string} walletId
 * @param {string} event - 'connect' | 'disconnect' | 'accountChanged'
 * @param {Function} callback
 * @returns {Function} - Cleanup function
 */
export function onWalletEvent(walletId, event, callback) {
  const config = WALLET_CONFIGS[walletId];
  if (!config || !config.detect()) return () => {};
  
  const provider = config.getProvider();
  provider.on(event, callback);
  
  return () => {
    provider.off?.(event, callback);
  };
}

// Export wallet configs for UI
export { WALLET_CONFIGS };
