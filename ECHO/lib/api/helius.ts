/**
 * Helius API Client
 * Fetches transaction history, token balances, and program interactions
 * Using direct API calls for compatibility
 */

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
const HELIUS_BASE_URL = `https://api-devnet.helius.xyz/v0`;

export interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  slot: number;
  nativeTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
  tokenTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    mint: string;
    tokenAmount: number;
  }>;
}

export interface HeliusBalance {
  mint: string;
  amount: number;
  decimals: number;
  tokenAccount: string;
}

/**
 * Fetch transaction history for a wallet using enhanced transactions API
 */
export async function getTransactionHistory(
  address: string,
  limit: number = 100
): Promise<HeliusTransaction[]> {
  try {
    console.log(`📡 Fetching transactions for ${address.slice(0, 8)}... from Helius`);
    
    const response = await fetch(
      `${HELIUS_BASE_URL}/addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`
    );

    if (!response.ok) {
      console.error(`❌ Helius API error: ${response.status}`);
      throw new Error(`Helius API error: ${response.status}`);
    }

    const transactions = await response.json();
    console.log(`✅ Helius returned ${transactions.length} transactions`);

    return transactions.map((tx: any) => ({
      signature: tx.signature || "",
      timestamp: tx.timestamp || 0,
      type: tx.type || "unknown",
      source: tx.source || "unknown",
      fee: tx.fee || 0,
      feePayer: tx.feePayer || address,
      slot: tx.slot || 0,
      nativeTransfers: tx.nativeTransfers,
      tokenTransfers: tx.tokenTransfers,
    }));
  } catch (error) {
    console.error("Helius API error:", error);
    // Return empty array instead of throwing to allow graceful degradation
    return [];
  }
}

/**
 * Get token balances for a wallet using DAS API
 */
export async function getTokenBalances(
  address: string
): Promise<HeliusBalance[]> {
  try {
    const response = await fetch(
      `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "helius-token-balances",
          method: "getAssetsByOwner",
          params: {
            ownerAddress: address,
            page: 1,
            limit: 100,
            displayOptions: {
              showFungible: true,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Helius DAS API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.result || !data.result.items) {
      return [];
    }

    return data.result.items
      .filter((item: any) => item.token_info)
      .map((item: any) => ({
        mint: item.id || "",
        amount: item.token_info?.balance || 0,
        decimals: item.token_info?.decimals || 0,
        tokenAccount: item.token_info?.associated_token_address || "",
      }));
  } catch (error) {
    console.error("Helius balance error:", error);
    return [];
  }
}

/**
 * Get all unique addresses a wallet has interacted with
 */
export async function getConnectedAddresses(
  address: string,
  limit: number = 100
): Promise<Set<string>> {
  const transactions = await getTransactionHistory(address, limit);
  const addresses = new Set<string>();

  console.log(`🔗 Processing ${transactions.length} transactions for connected addresses`);

  transactions.forEach((tx) => {
    tx.nativeTransfers?.forEach((transfer) => {
      if (transfer.fromUserAccount !== address) {
        addresses.add(transfer.fromUserAccount);
      }
      if (transfer.toUserAccount !== address) {
        addresses.add(transfer.toUserAccount);
      }
    });

    tx.tokenTransfers?.forEach((transfer) => {
      if (transfer.fromUserAccount !== address) {
        addresses.add(transfer.fromUserAccount);
      }
      if (transfer.toUserAccount !== address) {
        addresses.add(transfer.toUserAccount);
      }
    });
  });

  console.log(`✅ Found ${addresses.size} connected addresses`);

  return addresses;
}

/**
 * Detect temporal patterns in transactions
 */
export function analyzeTemporalPatterns(
  transactions: HeliusTransaction[]
): {
  hasPatterns: boolean;
  confidence: number;
  commonHours: number[];
} {
  const hours = transactions.map((tx) => new Date(tx.timestamp * 1000).getHours());
  const hourCounts = new Map<number, number>();

  hours.forEach((hour) => {
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });

  // Find hours with >20% of transactions
  const totalTxs = transactions.length;
  const commonHours = Array.from(hourCounts.entries())
    .filter(([_, count]) => count / totalTxs > 0.2)
    .map(([hour]) => hour);

  const hasPatterns = commonHours.length > 0;
  const confidence = hasPatterns
    ? Math.min(
        95,
        (Math.max(...Array.from(hourCounts.values())) / totalTxs) * 100
      )
    : 0;

  return { hasPatterns, confidence, commonHours };
}
