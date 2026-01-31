import { Connection, clusterApiUrl, Commitment } from "@solana/web3.js";
import type { NetworkType } from "@/types";

const COMMITMENT: Commitment = "confirmed";

// RPC endpoints with fallbacks
const RPC_ENDPOINTS: Record<NetworkType, string[]> = {
  "mainnet-beta": [
    process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "",
    "https://api.mainnet-beta.solana.com",
    "https://solana-mainnet.g.alchemy.com/v2/demo",
  ].filter(Boolean),
  devnet: [
    process.env.NEXT_PUBLIC_HELIUS_RPC_URL?.replace("mainnet", "devnet") || "",
    "https://api.devnet.solana.com",
  ].filter(Boolean),
  testnet: ["https://api.testnet.solana.com"],
};

let connectionCache: Map<string, Connection> = new Map();

export function getConnection(network: NetworkType = "mainnet-beta"): Connection {
  const cacheKey = network;

  if (connectionCache.has(cacheKey)) {
    return connectionCache.get(cacheKey)!;
  }

  const endpoints = RPC_ENDPOINTS[network];
  const endpoint = endpoints[0] || clusterApiUrl(network);

  const connection = new Connection(endpoint, {
    commitment: COMMITMENT,
    confirmTransactionInitialTimeout: 60000,
  });

  connectionCache.set(cacheKey, connection);
  return connection;
}

export async function getHealthyConnection(
  network: NetworkType = "mainnet-beta"
): Promise<Connection> {
  const endpoints = RPC_ENDPOINTS[network];

  for (const endpoint of endpoints) {
    try {
      const connection = new Connection(endpoint, {
        commitment: COMMITMENT,
        confirmTransactionInitialTimeout: 60000,
      });

      // Test the connection
      await connection.getLatestBlockhash();
      return connection;
    } catch (error) {
      console.warn(`RPC endpoint ${endpoint} failed, trying next...`);
      continue;
    }
  }

  // If all endpoints fail, throw error
  throw new Error("All RPC endpoints are unavailable");
}

export function clearConnectionCache(): void {
  connectionCache.clear();
}
