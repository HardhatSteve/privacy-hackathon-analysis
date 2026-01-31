/**
 * SDK configuration for Solana privacy devkit.
 * This project is devnet-only; mainnet is not supported.
 */
export interface Config {
  /** RPC endpoint URL (devnet) */
  rpcUrl: string;
  /** Network: always "devnet" */
  network: "devnet";
  /** ShadowWire API key (optional; when set, client can use setBackend('shadowwire')) */
  shadowwireApiKey?: string;
  /** ShadowWire wallet address for deposit/withdraw/transfer (required when using shadowwire backend) */
  shadowwireWallet?: string;
}

export const DEFAULT_RPC_URL = "https://api.devnet.solana.com";
export const DEFAULT_NETWORK = "devnet" as const;

/**
 * Load configuration from environment variables.
 * Uses process.env.RPC_URL for RPC URL; network is always devnet.
 * SHADOWWIRE_API_KEY and SHADOWWIRE_WALLET for ShadowWire backend.
 */
export function loadFromEnv(): Config {
  const rpcUrl = process.env.RPC_URL ?? DEFAULT_RPC_URL;
  const shadowwireApiKey = process.env.SHADOWWIRE_API_KEY;
  const shadowwireWallet = process.env.SHADOWWIRE_WALLET;
  return {
    rpcUrl,
    network: "devnet",
    ...(shadowwireApiKey ? { shadowwireApiKey } : {}),
    ...(shadowwireWallet ? { shadowwireWallet } : {}),
  };
}
