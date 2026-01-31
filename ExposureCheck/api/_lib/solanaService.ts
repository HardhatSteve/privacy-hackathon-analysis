import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import type { TransactionData, TokenBalance, CounterpartyData, CounterpartyType, FundingSource, FundingAnalysis, TimeOfDayAnalysis, TokenRiskAnalysis, TokenClassification, TokenRiskCategory, TransactionVelocity, SolscanLabel } from './types.js';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const QUICKNODE_RPC = process.env.QUICKNODE_RPC_URL;

// RPC endpoints in order of preference
const RPC_ENDPOINTS = HELIUS_API_KEY
  ? [`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`]
  : QUICKNODE_RPC
  ? [QUICKNODE_RPC]
  : [
      'https://api.mainnet-beta.solana.com', // Official Solana RPC (most reliable from serverless)
      'https://rpc.ankr.com/solana', // Ankr free tier
      'https://solana-mainnet.rpc.extrnode.com', // Extrnode public
      'https://mainnet.rpcpool.com', // RPCPool public
    ];

let connection: Connection | null = null;
let currentRpcIndex = 0;

function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(RPC_ENDPOINTS[currentRpcIndex], {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      fetch: async (url, options) => {
        // Custom fetch with timeout for serverless environments
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          return response;
        } finally {
          clearTimeout(timeoutId);
        }
      },
    });
  }
  return connection;
}

// Rotate to next RPC if current one fails
function rotateRpc(): void {
  currentRpcIndex = (currentRpcIndex + 1) % RPC_ENDPOINTS.length;
  connection = null; // Reset connection to use new RPC
  console.log(`Switching to RPC: ${RPC_ENDPOINTS[currentRpcIndex].split('?')[0]}`);
}

// Retry helper with RPC rotation
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 4,
  delayMs: number = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`RPC attempt ${attempt + 1}/${maxRetries} failed:`, (error as Error).message);

      if (attempt < maxRetries - 1) {
        rotateRpc();
        // Exponential backoff
        const backoffDelay = delayMs * Math.pow(1.5, attempt);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw lastError || new Error('All RPC attempts failed');
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return address.length >= 32 && address.length <= 44;
  } catch {
    return false;
  }
}

export async function getSolBalance(address: string): Promise<number> {
  return withRetry(async () => {
    const conn = getConnection();
    const pubkey = new PublicKey(address);
    const balance = await conn.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  });
}

export async function getTransactionHistory(
  address: string,
  limit: number = 100
): Promise<TransactionData[]> {
  return withRetry(async () => {
    const conn = getConnection();
    const pubkey = new PublicKey(address);
    const signatures = await conn.getSignaturesForAddress(pubkey, { limit });

    return signatures.map((sig) => ({
      signature: sig.signature,
      blockTime: sig.blockTime,
      slot: sig.slot,
      err: sig.err,
    }));
  });
}

export async function getTokenBalances(address: string): Promise<TokenBalance[]> {
  return withRetry(async () => {
    const conn = getConnection();
    const pubkey = new PublicKey(address);

    const tokenAccounts = await conn.getParsedTokenAccountsByOwner(pubkey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });

    return tokenAccounts.value
      .map((account) => {
        const info = account.account.data.parsed.info;
        return {
          mint: info.mint,
          amount: parseInt(info.tokenAmount.amount),
          decimals: info.tokenAmount.decimals,
          uiAmount: info.tokenAmount.uiAmount || 0,
        };
      })
      .filter((token) => token.uiAmount > 0);
  });
}

export async function getSnsNames(address: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://sns-sdk-proxy.bonfida.workers.dev/favorite-domain/${address}`
    );
    if (response.ok) {
      const data = (await response.json()) as { result?: string; error?: string };
      // Only return valid domain names (no spaces, not an error message)
      if (data.result && !data.error && !data.result.includes(' ')) {
        return [data.result + '.sol'];
      }
    }
  } catch {
    // SNS lookup failed
  }
  return [];
}

export interface SocialLinks {
  twitter?: string;
  discord?: string;
  telegram?: string;
  github?: string;
  backpack?: string;
  farcaster?: string;
  lens?: string;
  ens?: string;
  basename?: string;
  snsNames: string[];
  allDomains: string[];
  web3BioProfiles: string[];
}

export interface WalletAge {
  firstTxTime: number | null;
  ageInDays: number | null;
  isNew: boolean; // Less than 30 days old
}

export async function getWalletAge(transactions: TransactionData[]): Promise<WalletAge> {
  // Find the oldest transaction
  const txWithTime = transactions.filter((tx) => tx.blockTime);

  if (txWithTime.length === 0) {
    return { firstTxTime: null, ageInDays: null, isNew: true };
  }

  // Get oldest tx (last in the sorted array from RPC)
  const oldestTx = txWithTime[txWithTime.length - 1];
  const firstTxTime = oldestTx.blockTime!;
  const ageInDays = Math.floor((Date.now() / 1000 - firstTxTime) / (24 * 60 * 60));

  return {
    firstTxTime,
    ageInDays,
    isNew: ageInDays < 30,
  };
}

export async function getSocialLinks(address: string): Promise<SocialLinks> {
  const results: SocialLinks = { snsNames: [], allDomains: [], web3BioProfiles: [] };

  // Fetch all social data in parallel
  const [snsNames, solanaidData, backpackData, allDomainsData, web3BioData, farcasterData] = await Promise.all([
    getSnsNames(address),
    fetchSolanaidProfile(address),
    fetchBackpackUsername(address),
    fetchAllDomains(address),
    fetchWeb3Bio(address),
    fetchFarcasterProfile(address),
  ]);

  results.snsNames = snsNames;
  results.allDomains = allDomainsData;

  if (solanaidData) {
    if (solanaidData.twitter) results.twitter = solanaidData.twitter;
    if (solanaidData.discord) results.discord = solanaidData.discord;
    if (solanaidData.telegram) results.telegram = solanaidData.telegram;
    if (solanaidData.github) results.github = solanaidData.github;
  }

  if (backpackData) {
    results.backpack = backpackData;
  }

  // Web3.bio aggregates many profiles
  if (web3BioData) {
    results.web3BioProfiles = web3BioData.profiles;
    if (web3BioData.twitter && !results.twitter) results.twitter = web3BioData.twitter;
    if (web3BioData.farcaster) results.farcaster = web3BioData.farcaster;
    if (web3BioData.lens) results.lens = web3BioData.lens;
    if (web3BioData.ens) results.ens = web3BioData.ens;
    if (web3BioData.basename) results.basename = web3BioData.basename;
  }

  // Farcaster direct lookup as fallback
  if (farcasterData && !results.farcaster) {
    results.farcaster = farcasterData;
  }

  return results;
}

async function fetchSolanaidProfile(address: string): Promise<{
  twitter?: string;
  discord?: string;
  telegram?: string;
  github?: string;
} | null> {
  try {
    // Solana.id API for social profile lookups
    const response = await fetch(`https://api.solana.id/v1/profile/${address}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        twitter?: string;
        discord?: string;
        telegram?: string;
        github?: string;
      };
      return data;
    }
  } catch {
    // Solana.id lookup failed
  }

  // Fallback: Try Bonfida Twitter verification
  try {
    const response = await fetch(
      `https://sns-sdk-proxy.bonfida.workers.dev/twitter/reverse-lookup/${address}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (response.ok) {
      const data = (await response.json()) as { result?: string };
      if (data.result && !data.result.includes(' ')) {
        return { twitter: data.result };
      }
    }
  } catch {
    // Bonfida Twitter lookup failed
  }

  return null;
}

async function fetchBackpackUsername(address: string): Promise<string | null> {
  try {
    // Backpack xNFT API
    const response = await fetch(`https://backpack-api.xnfts.dev/users?publicKey=${address}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = (await response.json()) as { username?: string };
      if (data.username) {
        return data.username;
      }
    }
  } catch {
    // Backpack lookup failed
  }
  return null;
}

// AllDomains API - aggregates multiple Solana naming services (.sol, .abc, .bonk, .poor, etc.)
async function fetchAllDomains(address: string): Promise<string[]> {
  const domains: string[] = [];
  try {
    const response = await fetch(
      `https://api.alldomains.id/all-user-domains/${address}`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.ok) {
      const data = (await response.json()) as Array<{ domain: string; tld: string }>;
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.domain && item.tld) {
            domains.push(`${item.domain}.${item.tld}`);
          }
        }
      }
    }
  } catch {
    // AllDomains lookup failed
  }
  return domains;
}

// Web3.bio API - comprehensive social identity aggregator
interface Web3BioResult {
  profiles: string[];
  twitter?: string;
  farcaster?: string;
  lens?: string;
  ens?: string;
  basename?: string;
}

async function fetchWeb3Bio(address: string): Promise<Web3BioResult | null> {
  try {
    const response = await fetch(
      `https://api.web3.bio/profile/${address}`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (response.ok) {
      const data = (await response.json()) as Array<{
        platform: string;
        identity: string;
        displayName?: string;
        address?: string;
        social?: {
          twitter?: string;
        };
      }>;

      if (Array.isArray(data) && data.length > 0) {
        const result: Web3BioResult = { profiles: [] };

        for (const profile of data) {
          // Track all found profiles
          if (profile.platform && profile.identity) {
            result.profiles.push(`${profile.platform}:${profile.identity}`);
          }

          // Extract specific platforms
          const platform = profile.platform?.toLowerCase();
          const identity = profile.identity;

          if (platform === 'twitter' || platform === 'x') {
            result.twitter = identity;
          } else if (platform === 'farcaster') {
            result.farcaster = identity;
          } else if (platform === 'lens') {
            result.lens = identity;
          } else if (platform === 'ens') {
            result.ens = identity;
          } else if (platform === 'basenames' || platform === 'basename') {
            result.basename = identity;
          }

          // Check nested social object
          if (profile.social?.twitter && !result.twitter) {
            result.twitter = profile.social.twitter;
          }
        }

        return result;
      }
    }
  } catch {
    // Web3.bio lookup failed
  }
  return null;
}

// Farcaster direct lookup via Neynar or Warpcast API
async function fetchFarcasterProfile(address: string): Promise<string | null> {
  // Try Neynar API first (more reliable)
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
      {
        headers: {
          'Accept': 'application/json',
          'api_key': 'NEYNAR_API_DOCS', // Public demo key
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.ok) {
      const data = (await response.json()) as Record<string, Array<{ username?: string; fid?: number }>>;
      const addressLower = address.toLowerCase();
      if (data[addressLower]?.[0]?.username) {
        return data[addressLower][0].username;
      }
    }
  } catch {
    // Neynar lookup failed
  }

  // Fallback: Try searchcaster
  try {
    const response = await fetch(
      `https://searchcaster.xyz/api/profiles?connected_address=${address}`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.ok) {
      const data = (await response.json()) as Array<{ body?: { username?: string } }>;
      if (Array.isArray(data) && data[0]?.body?.username) {
        return data[0].body.username;
      }
    }
  } catch {
    // Searchcaster lookup failed
  }

  return null;
}

// Known program/contract addresses to classify counterparties
const KNOWN_PROGRAMS: Record<string, CounterpartyType> = {
  // DEXes
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'dex',   // Jupiter
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'dex',   // Orca Whirlpool
  '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP': 'dex',  // Orca V1
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK': 'dex',  // Raydium CPMM
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'dex',  // Raydium AMM
  'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX': 'dex',   // Serum DEX
  'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1': 'dex',  // Orca Token Swap

  // NFT Marketplaces
  'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K': 'nft',   // Magic Eden v2
  'TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN': 'nft',   // Tensor
  'CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz': 'nft',  // Solanart
  'hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk': 'nft',   // Coral Cube

  // Token Program
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'contract',
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb': 'contract',

  // System/Infrastructure
  '11111111111111111111111111111111': 'contract',
  'ComputeBudget111111111111111111111111111111': 'contract',
};

// CEX known hot wallets (partial list)
const CEX_WALLETS = new Set([
  'H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS', // Binance
  'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE', // Coinbase
  '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9', // FTX
]);

// Known privacy-related programs on Solana
const PRIVACY_PROGRAMS = new Set([
  'LiteSVMProgram11111111111111111111111111111', // Light Protocol (example)
  'eXECUTE111111111111111111111111111111111111', // Elusiv (deprecated but detectable)
  '2VvQ11q8xrn5tkPNyeraRKLzMjz6tYP4M4UdXY3t8xCN', // Light Protocol v2
]);

export async function getTransactionCounterparties(
  address: string,
  limit: number = 50
): Promise<CounterpartyData[]> {
  const conn = getConnection();
  const pubkey = new PublicKey(address);

  try {
    // Get recent transaction signatures
    const signatures = await conn.getSignaturesForAddress(pubkey, { limit });

    if (signatures.length === 0) {
      return [];
    }

    // Fetch transaction details (batch for efficiency)
    const signatureStrings = signatures.map(s => s.signature);
    const transactions = await conn.getParsedTransactions(signatureStrings, {
      maxSupportedTransactionVersion: 0,
    });

    // Track counterparty interactions
    const counterpartyMap = new Map<string, {
      txCount: number;
      lastInteraction: number;
      type: CounterpartyType;
    }>();

    const addressLower = address.toLowerCase();

    for (const tx of transactions) {
      if (!tx || !tx.transaction) continue;

      const message = tx.transaction.message;
      const blockTime = tx.blockTime || 0;

      // Get all account keys involved in the transaction
      const accountKeys = message.accountKeys.map(k => k.pubkey.toBase58());

      for (const accountKey of accountKeys) {
        // Skip the analyzed wallet itself
        if (accountKey.toLowerCase() === addressLower) continue;

        // Classify the counterparty
        let type: CounterpartyType = 'unknown';

        if (KNOWN_PROGRAMS[accountKey]) {
          type = KNOWN_PROGRAMS[accountKey];
        } else if (CEX_WALLETS.has(accountKey)) {
          type = 'cex';
        } else {
          // Default to wallet for regular addresses
          type = 'wallet';
        }

        // Update or add counterparty
        const existing = counterpartyMap.get(accountKey);
        if (existing) {
          existing.txCount++;
          if (blockTime > existing.lastInteraction) {
            existing.lastInteraction = blockTime;
          }
        } else {
          counterpartyMap.set(accountKey, {
            txCount: 1,
            lastInteraction: blockTime,
            type,
          });
        }
      }
    }

    // Convert to array and sort by transaction count (most interactions first)
    const counterparties: CounterpartyData[] = [];
    for (const [addr, data] of counterpartyMap) {
      counterparties.push({
        address: addr,
        txCount: data.txCount,
        lastInteraction: data.lastInteraction,
        type: data.type,
      });
    }

    // Sort by txCount descending, limit to top 20 for visualization
    counterparties.sort((a, b) => b.txCount - a.txCount);
    return counterparties.slice(0, 20);
  } catch (error) {
    console.error('Error fetching transaction counterparties:', error);
    return [];
  }
}

// Privacy hygiene analysis data
export interface PrivacyHygieneData {
  privacyProgramInteractions: number;
  hasPrivacyAttempts: boolean;
  immediateReuseAfterPrivacy: boolean;
  avgTimeDelayAfterReceive: number | null; // in seconds
  hasConsistentAmounts: boolean; // same amounts in/out suggest poor privacy
  riskSignals: string[];
}

export async function analyzePrivacyHygiene(
  address: string,
  transactions: TransactionData[]
): Promise<PrivacyHygieneData> {
  const conn = getConnection();
  const result: PrivacyHygieneData = {
    privacyProgramInteractions: 0,
    hasPrivacyAttempts: false,
    immediateReuseAfterPrivacy: false,
    avgTimeDelayAfterReceive: null,
    hasConsistentAmounts: false,
    riskSignals: [],
  };

  if (transactions.length < 2) {
    return result;
  }

  try {
    // Get parsed transactions to analyze programs and amounts
    const signatureStrings = transactions.slice(0, 50).map(t => t.signature);
    const parsedTxs = await conn.getParsedTransactions(signatureStrings, {
      maxSupportedTransactionVersion: 0,
    });

    let privacyTxIndices: number[] = [];
    const transferAmounts: number[] = [];
    const receiveTimestamps: number[] = [];
    const sendTimestamps: number[] = [];

    for (let i = 0; i < parsedTxs.length; i++) {
      const tx = parsedTxs[i];
      if (!tx || !tx.transaction) continue;

      const message = tx.transaction.message;
      const blockTime = tx.blockTime || 0;
      const accountKeys = message.accountKeys.map(k => k.pubkey.toBase58());

      // Check for privacy program interactions
      for (const key of accountKeys) {
        if (PRIVACY_PROGRAMS.has(key)) {
          result.privacyProgramInteractions++;
          result.hasPrivacyAttempts = true;
          privacyTxIndices.push(i);
          result.riskSignals.push('Privacy protocol interaction detected');
          break;
        }
      }

      // Analyze SOL transfers for amount patterns
      const instructions = message.instructions;
      for (const inst of instructions) {
        if ('parsed' in inst && inst.parsed) {
          const parsed = inst.parsed as {
            type?: string;
            info?: { lamports?: number; destination?: string; source?: string };
          };
          if (parsed.type === 'transfer' && parsed.info?.lamports) {
            const amount = parsed.info.lamports / LAMPORTS_PER_SOL;
            transferAmounts.push(amount);

            // Track if this wallet is receiving or sending
            if (parsed.info.destination?.toLowerCase() === address.toLowerCase()) {
              receiveTimestamps.push(blockTime);
            } else if (parsed.info.source?.toLowerCase() === address.toLowerCase()) {
              sendTimestamps.push(blockTime);
            }
          }
        }
      }
    }

    // Analyze time delays between receiving and sending
    if (receiveTimestamps.length > 0 && sendTimestamps.length > 0) {
      const delays: number[] = [];
      for (const receiveTime of receiveTimestamps) {
        // Find the next send after this receive
        const nextSend = sendTimestamps.find(s => s > receiveTime);
        if (nextSend) {
          delays.push(nextSend - receiveTime);
        }
      }
      if (delays.length > 0) {
        result.avgTimeDelayAfterReceive = delays.reduce((a, b) => a + b, 0) / delays.length;

        // Check for immediate reuse (less than 5 minutes average)
        if (result.avgTimeDelayAfterReceive < 300) {
          result.riskSignals.push('Very quick fund movement after receiving');
        }
      }
    }

    // Check for immediate reuse after privacy attempts
    if (privacyTxIndices.length > 0) {
      for (const privIdx of privacyTxIndices) {
        // Check if there's a transaction very soon after privacy tx
        if (privIdx + 1 < parsedTxs.length) {
          const privTx = parsedTxs[privIdx];
          const nextTx = parsedTxs[privIdx + 1];
          if (privTx?.blockTime && nextTx?.blockTime) {
            const timeDiff = Math.abs(privTx.blockTime - nextTx.blockTime);
            if (timeDiff < 600) { // Less than 10 minutes
              result.immediateReuseAfterPrivacy = true;
              result.riskSignals.push('Wallet reused immediately after privacy attempt');
              break;
            }
          }
        }
      }
    }

    // Check for consistent amounts (poor privacy hygiene)
    if (transferAmounts.length >= 3) {
      const roundedAmounts = transferAmounts.map(a => Math.round(a * 100) / 100);
      const amountCounts = new Map<number, number>();
      for (const amt of roundedAmounts) {
        amountCounts.set(amt, (amountCounts.get(amt) || 0) + 1);
      }
      // If any amount appears more than 30% of the time, flag it
      for (const [, count] of amountCounts) {
        if (count / roundedAmounts.length > 0.3) {
          result.hasConsistentAmounts = true;
          result.riskSignals.push('Repeated transaction amounts detected');
          break;
        }
      }
    }

  } catch (error) {
    console.error('Error analyzing privacy hygiene:', error);
  }

  return result;
}

// Analyze funding sources for the wallet
export async function analyzeFundingSources(
  address: string,
  transactions: TransactionData[]
): Promise<FundingAnalysis> {
  const conn = getConnection();
  const result: FundingAnalysis = {
    sources: [],
    primaryFundingType: null,
    hasCexFunding: false,
    hasMultipleFundingSources: false,
    totalFundingReceived: 0,
  };

  if (transactions.length === 0) {
    return result;
  }

  try {
    // Get the oldest transactions first (they're likely the initial funding)
    // Transactions are returned newest first, so reverse to get oldest first
    const oldestTxs = [...transactions].reverse().slice(0, 20);
    const signatureStrings = oldestTxs.map(t => t.signature);

    const parsedTxs = await conn.getParsedTransactions(signatureStrings, {
      maxSupportedTransactionVersion: 0,
    });

    const addressLower = address.toLowerCase();
    const fundingSourceMap = new Map<string, FundingSource>();
    let isFirstFunding = true;

    for (let i = 0; i < parsedTxs.length; i++) {
      const tx = parsedTxs[i];
      if (!tx || !tx.transaction) continue;

      const message = tx.transaction.message;
      const blockTime = tx.blockTime || 0;
      const instructions = message.instructions;

      // Look for SOL transfers TO this wallet
      for (const inst of instructions) {
        if ('parsed' in inst && inst.parsed) {
          const parsed = inst.parsed as {
            type?: string;
            info?: { lamports?: number; destination?: string; source?: string };
          };

          if (parsed.type === 'transfer' && parsed.info?.lamports && parsed.info?.source) {
            const destination = parsed.info.destination?.toLowerCase();
            const source = parsed.info.source;

            // Check if this wallet is receiving funds
            if (destination === addressLower) {
              const amount = parsed.info.lamports / LAMPORTS_PER_SOL;
              result.totalFundingReceived += amount;

              // Classify the funding source
              let sourceType: CounterpartyType = 'wallet';
              if (KNOWN_PROGRAMS[source]) {
                sourceType = KNOWN_PROGRAMS[source];
              } else if (CEX_WALLETS.has(source)) {
                sourceType = 'cex';
                result.hasCexFunding = true;
              }

              // Track unique funding sources
              const existing = fundingSourceMap.get(source);
              if (existing) {
                existing.amount += amount;
                if (blockTime < existing.timestamp) {
                  existing.timestamp = blockTime;
                  existing.isInitialFunding = isFirstFunding;
                }
              } else {
                fundingSourceMap.set(source, {
                  address: source,
                  type: sourceType,
                  amount,
                  timestamp: blockTime,
                  isInitialFunding: isFirstFunding,
                });
              }

              isFirstFunding = false;
            }
          }
        }
      }
    }

    // Convert map to array and sort by timestamp (oldest first)
    result.sources = Array.from(fundingSourceMap.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, 10); // Limit to top 10 funding sources

    result.hasMultipleFundingSources = result.sources.length > 1;

    // Determine primary funding type
    if (result.sources.length > 0) {
      const typeCounts = new Map<CounterpartyType, number>();
      for (const source of result.sources) {
        typeCounts.set(source.type, (typeCounts.get(source.type) || 0) + source.amount);
      }

      let maxAmount = 0;
      for (const [type, amount] of typeCounts) {
        if (amount > maxAmount) {
          maxAmount = amount;
          result.primaryFundingType = type;
        }
      }
    }

  } catch (error) {
    console.error('Error analyzing funding sources:', error);
  }

  return result;
}

// Analyze time-of-day patterns for behavioral profiling
export function analyzeTimeOfDay(transactions: TransactionData[]): TimeOfDayAnalysis {
  const result: TimeOfDayAnalysis = {
    hourDistribution: new Array(24).fill(0),
    peakHours: [],
    activeHourRange: '',
    inferredTimezoneOffset: null,
    inferredTimezone: null,
    activityConcentration: 'low',
  };

  const txWithTime = transactions.filter((tx) => tx.blockTime !== null && tx.blockTime !== undefined);

  if (txWithTime.length < 5) {
    result.activeHourRange = 'Insufficient data';
    return result;
  }

  // Build hour distribution
  for (const tx of txWithTime) {
    const hour = new Date(tx.blockTime! * 1000).getUTCHours();
    result.hourDistribution[hour]++;
  }

  // Find peak hours (hours with activity above average)
  const totalTxs = txWithTime.length;
  const avgPerHour = totalTxs / 24;
  const peakThreshold = avgPerHour * 1.5;

  const hourCounts = result.hourDistribution.map((count, hour) => ({ hour, count }));
  hourCounts.sort((a, b) => b.count - a.count);

  // Get top 5 most active hours
  result.peakHours = hourCounts
    .filter(h => h.count > 0)
    .slice(0, 5)
    .map(h => h.hour);

  // Calculate activity concentration
  const top5Count = hourCounts.slice(0, 5).reduce((sum, h) => sum + h.count, 0);
  const concentrationRatio = top5Count / totalTxs;

  if (concentrationRatio > 0.7) {
    result.activityConcentration = 'high';
  } else if (concentrationRatio > 0.5) {
    result.activityConcentration = 'medium';
  } else {
    result.activityConcentration = 'low';
  }

  // Find contiguous active hour range
  const activeHours = hourCounts.filter(h => h.count >= peakThreshold).map(h => h.hour);
  if (activeHours.length > 0) {
    activeHours.sort((a, b) => a - b);

    // Find the longest contiguous range (wrapping around midnight)
    let bestStart = activeHours[0];
    let bestLength = 1;

    for (let i = 0; i < activeHours.length; i++) {
      let length = 1;
      for (let j = 1; j < activeHours.length; j++) {
        const expectedHour = (activeHours[i] + j) % 24;
        if (activeHours.includes(expectedHour)) {
          length++;
        } else {
          break;
        }
      }
      if (length > bestLength) {
        bestLength = length;
        bestStart = activeHours[i];
      }
    }

    const endHour = (bestStart + bestLength) % 24;
    result.activeHourRange = `${bestStart.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:00 UTC`;
  } else {
    // Fall back to just showing top hours
    if (result.peakHours.length > 0) {
      const minHour = Math.min(...result.peakHours);
      const maxHour = Math.max(...result.peakHours);
      result.activeHourRange = `${minHour.toString().padStart(2, '0')}:00-${maxHour.toString().padStart(2, '0')}:00 UTC`;
    }
  }

  // Infer timezone based on activity patterns
  // Assumption: Most users are active during waking hours (8 AM - 11 PM local time)
  // Find the hour range that best fits a "9-5" or evening pattern
  if (result.peakHours.length > 0) {
    // Find the median of peak hours
    const sortedPeaks = [...result.peakHours].sort((a, b) => a - b);
    const medianPeak = sortedPeaks[Math.floor(sortedPeaks.length / 2)];

    // If median peak is in UTC evening (18-23), likely US timezone
    // If median peak is in UTC morning (6-12), likely Asia/Australia
    // If median peak is in UTC afternoon (12-18), likely Europe

    if (medianPeak >= 1 && medianPeak <= 7) {
      // Activity at 1-7 UTC suggests Asia/Pacific evening
      result.inferredTimezoneOffset = 8;
      result.inferredTimezone = 'Asia/Pacific (UTC+8)';
    } else if (medianPeak >= 8 && medianPeak <= 14) {
      // Activity at 8-14 UTC suggests European daytime
      result.inferredTimezoneOffset = 0;
      result.inferredTimezone = 'Europe (UTC/GMT)';
    } else if (medianPeak >= 15 && medianPeak <= 20) {
      // Activity at 15-20 UTC suggests US East Coast
      result.inferredTimezoneOffset = -5;
      result.inferredTimezone = 'US East Coast (EST/EDT)';
    } else {
      // Activity at 21-0 UTC suggests US West Coast
      result.inferredTimezoneOffset = -8;
      result.inferredTimezone = 'US West Coast (PST/PDT)';
    }
  }

  return result;
}

// Known token classifications on Solana
const KNOWN_STABLECOINS = new Set([
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA',  // USDS
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // Bonk USD
  'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX', // USDH
  '7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT', // UXD
  'Ea5SjE2Y6yvCeW5dYTn7PYMuW5ikXkvbGdcmSnXeaLjS', // PAI
]);

const KNOWN_BLUECHIPS = new Set([
  'So11111111111111111111111111111111111111112',    // Wrapped SOL
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',   // mSOL
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', // JitoSOL
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // stSOL
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',  // bSOL
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // Pyth
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',  // Jupiter
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // Raydium
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',  // Orca
  'DFL1zNkaGPWm1BqAVqRjCZvHmwTFrEaJtbzJWgseoNJh', // DeFi Land
]);

// Classify tokens based on mint address and patterns
export function classifyTokens(tokenBalances: TokenBalance[]): TokenRiskAnalysis {
  const classifications: TokenClassification[] = [];
  let stablecoinCount = 0;
  let bluechipCount = 0;
  let volatileCount = 0;
  let memecoinCount = 0;

  for (const token of tokenBalances) {
    let category: TokenRiskCategory = 'unknown';

    if (KNOWN_STABLECOINS.has(token.mint)) {
      category = 'stablecoin';
      stablecoinCount++;
    } else if (KNOWN_BLUECHIPS.has(token.mint)) {
      category = 'bluechip';
      bluechipCount++;
    } else {
      // For unknown tokens, use heuristics
      // High decimal count (9+) with very large amounts often indicates memecoins
      if (token.decimals >= 9 && token.uiAmount > 1000000) {
        category = 'memecoin';
        memecoinCount++;
      } else if (token.decimals <= 6 && token.uiAmount < 1000) {
        // Low decimals and reasonable amounts suggest established tokens
        category = 'volatile';
        volatileCount++;
      } else {
        category = 'volatile';
        volatileCount++;
      }
    }

    classifications.push({
      mint: token.mint,
      category,
    });
  }

  // Calculate risk profile
  const total = tokenBalances.length || 1;
  const stablecoinRatio = stablecoinCount / total;

  let riskProfile: 'conservative' | 'balanced' | 'aggressive' | 'speculative';

  if (stablecoinRatio > 0.5) {
    riskProfile = 'conservative';
  } else if (stablecoinRatio > 0.2 || bluechipCount > memecoinCount) {
    riskProfile = 'balanced';
  } else if (memecoinCount > 0 && memecoinCount >= volatileCount) {
    riskProfile = 'speculative';
  } else {
    riskProfile = 'aggressive';
  }

  return {
    classifications,
    stablecoinCount,
    bluechipCount,
    volatileCount,
    memecoinCount,
    riskProfile,
    stablecoinRatio,
  };
}

// Analyze transaction velocity and patterns
export function analyzeTransactionVelocity(transactions: TransactionData[], walletAgeDays: number | null): TransactionVelocity {
  const result: TransactionVelocity = {
    avgTxPerDay: 0,
    avgTxPerWeek: 0,
    peakActivityPeriod: null,
    activityTrend: 'stable',
    burstyBehavior: false,
    longestGapDays: null,
    recentActivityLevel: 'dormant',
  };

  if (transactions.length === 0) {
    return result;
  }

  const txWithTime = transactions.filter(tx => tx.blockTime !== null && tx.blockTime !== undefined);
  if (txWithTime.length < 2) {
    result.avgTxPerDay = transactions.length;
    result.avgTxPerWeek = transactions.length;
    result.recentActivityLevel = transactions.length > 0 ? 'low' : 'dormant';
    return result;
  }

  // Calculate averages based on wallet age
  const effectiveDays = walletAgeDays || 1;
  result.avgTxPerDay = transactions.length / effectiveDays;
  result.avgTxPerWeek = result.avgTxPerDay * 7;

  // Analyze recent activity (last 7 days)
  const now = Date.now() / 1000;
  const oneWeekAgo = now - (7 * 24 * 60 * 60);
  const oneMonthAgo = now - (30 * 24 * 60 * 60);

  const recentTxCount = txWithTime.filter(tx => tx.blockTime! > oneWeekAgo).length;
  const monthTxCount = txWithTime.filter(tx => tx.blockTime! > oneMonthAgo).length;

  // Determine recent activity level
  if (recentTxCount > 20) {
    result.recentActivityLevel = 'high';
  } else if (recentTxCount > 5) {
    result.recentActivityLevel = 'medium';
  } else if (recentTxCount > 0) {
    result.recentActivityLevel = 'low';
  } else {
    result.recentActivityLevel = 'dormant';
  }

  // Find peak activity period
  if (recentTxCount >= monthTxCount * 0.5 && recentTxCount > 5) {
    result.peakActivityPeriod = 'Last 7 days';
  } else if (monthTxCount > transactions.length * 0.5) {
    result.peakActivityPeriod = 'Last 30 days';
  }

  // Analyze activity trend
  const sortedTxs = [...txWithTime].sort((a, b) => (a.blockTime || 0) - (b.blockTime || 0));
  if (sortedTxs.length >= 10) {
    const firstHalfCount = Math.floor(sortedTxs.length / 2);
    const firstHalf = sortedTxs.slice(0, firstHalfCount);
    const secondHalf = sortedTxs.slice(firstHalfCount);

    const firstHalfSpan = (firstHalf[firstHalfCount - 1]?.blockTime || 0) - (firstHalf[0]?.blockTime || 0);
    const secondHalfSpan = (secondHalf[secondHalf.length - 1]?.blockTime || 0) - (secondHalf[0]?.blockTime || 0);

    const firstRate = firstHalfCount / (firstHalfSpan || 1);
    const secondRate = secondHalf.length / (secondHalfSpan || 1);

    if (secondRate > firstRate * 1.5) {
      result.activityTrend = 'increasing';
    } else if (firstRate > secondRate * 1.5) {
      result.activityTrend = 'decreasing';
    } else {
      result.activityTrend = 'stable';
    }
  }

  // Detect bursty behavior and find longest gap
  const gaps: number[] = [];
  for (let i = 1; i < sortedTxs.length; i++) {
    const gap = (sortedTxs[i].blockTime || 0) - (sortedTxs[i - 1].blockTime || 0);
    gaps.push(gap);
  }

  if (gaps.length > 0) {
    const maxGap = Math.max(...gaps);
    result.longestGapDays = Math.floor(maxGap / (24 * 60 * 60));

    // Check for bursty behavior: high variance in gaps
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
    const stdDev = Math.sqrt(variance);

    // If std deviation is more than the average, it's bursty
    if (stdDev > avgGap) {
      result.burstyBehavior = true;
    }

    // Also check if there are very short bursts
    const shortGaps = gaps.filter(g => g < 60 * 60); // Less than 1 hour
    if (shortGaps.length > gaps.length * 0.3 && result.longestGapDays && result.longestGapDays > 7) {
      result.burstyBehavior = true;
    }
  }

  return result;
}

// ============================================
// INCOME SOURCE ANALYSIS
// ============================================

import type { IncomeAnalysis, IncomeSourceType, NetWorthAnalysis, PnLAnalysis, TokenPnL, TokenTrade } from './types.js';

// Known airdrop/claim programs
const AIRDROP_PROGRAMS = new Set([
  'MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky',  // Merkle distributor
  'E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe', // Jupiter airdrop
  'CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR', // Claim program
]);

// Known staking programs
const STAKING_PROGRAMS = new Set([
  'Stake11111111111111111111111111111111111111',    // Native staking
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',   // mSOL staking
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', // JitoSOL
]);

export async function analyzeIncomeSources(
  address: string,
  transactions: TransactionData[]
): Promise<IncomeAnalysis> {
  const conn = getConnection();
  const result: IncomeAnalysis = {
    sources: [],
    totalIncome: 0,
    primarySource: null,
    diversityScore: 0,
  };

  if (transactions.length === 0) {
    return result;
  }

  const addressLower = address.toLowerCase();
  const incomeByType = new Map<IncomeSourceType, { amount: number; count: number }>();

  try {
    // Analyze recent transactions for income categorization
    const signatureStrings = transactions.slice(0, 100).map(t => t.signature);
    const parsedTxs = await conn.getParsedTransactions(signatureStrings, {
      maxSupportedTransactionVersion: 0,
    });

    for (const tx of parsedTxs) {
      if (!tx || !tx.transaction) continue;

      const message = tx.transaction.message;
      const accountKeys = message.accountKeys.map(k => k.pubkey.toBase58());

      // Determine transaction type
      let txType: IncomeSourceType = 'unknown';
      let incomeAmount = 0;

      // Check program interactions
      for (const key of accountKeys) {
        if (CEX_WALLETS.has(key)) {
          txType = 'cex_deposit';
          break;
        }
        if (AIRDROP_PROGRAMS.has(key)) {
          txType = 'airdrop';
          break;
        }
        if (STAKING_PROGRAMS.has(key)) {
          txType = 'staking_reward';
          break;
        }
        if (KNOWN_PROGRAMS[key] === 'dex') {
          txType = 'dex_swap';
          break;
        }
        if (KNOWN_PROGRAMS[key] === 'nft') {
          txType = 'nft_sale';
          break;
        }
        if (KNOWN_PROGRAMS[key] === 'contract') {
          txType = 'contract';
          break;
        }
      }

      // Parse SOL transfers to this wallet
      for (const inst of message.instructions) {
        if ('parsed' in inst && inst.parsed) {
          const parsed = inst.parsed as {
            type?: string;
            info?: { lamports?: number; destination?: string; source?: string };
          };
          if (parsed.type === 'transfer' && parsed.info?.lamports) {
            const destination = parsed.info.destination?.toLowerCase();
            if (destination === addressLower) {
              incomeAmount += parsed.info.lamports / LAMPORTS_PER_SOL;
              if (txType === 'unknown') {
                txType = 'transfer';
              }
            }
          }
        }
      }

      // Record income
      if (incomeAmount > 0) {
        const existing = incomeByType.get(txType) || { amount: 0, count: 0 };
        existing.amount += incomeAmount;
        existing.count += 1;
        incomeByType.set(txType, existing);
        result.totalIncome += incomeAmount;
      }
    }

    // Convert to sources array
    const typeLabels: Record<IncomeSourceType, string> = {
      'cex_deposit': 'CEX Deposits',
      'dex_swap': 'DEX Swaps',
      'airdrop': 'Airdrops',
      'staking_reward': 'Staking Rewards',
      'nft_sale': 'NFT Sales',
      'transfer': 'Transfers',
      'contract': 'Contract Interactions',
      'unknown': 'Other',
    };

    for (const [type, data] of incomeByType) {
      result.sources.push({
        type,
        amount: data.amount,
        count: data.count,
        percentage: result.totalIncome > 0 ? (data.amount / result.totalIncome) * 100 : 0,
        label: typeLabels[type],
      });
    }

    // Sort by amount
    result.sources.sort((a, b) => b.amount - a.amount);

    // Determine primary source
    if (result.sources.length > 0) {
      result.primarySource = result.sources[0].type;
    }

    // Calculate diversity score (Shannon entropy normalized)
    if (result.sources.length > 1 && result.totalIncome > 0) {
      let entropy = 0;
      for (const source of result.sources) {
        const p = source.amount / result.totalIncome;
        if (p > 0) {
          entropy -= p * Math.log2(p);
        }
      }
      // Normalize to 0-1 range (max entropy = log2(n))
      result.diversityScore = entropy / Math.log2(result.sources.length);
    }

  } catch (error) {
    console.error('Error analyzing income sources:', error);
  }

  return result;
}

// ============================================
// NET WORTH ANALYSIS
// ============================================

// Jupiter Price API for token prices
async function fetchTokenPrices(mints: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();

  if (mints.length === 0) return prices;

  try {
    // Use Jupiter Price API (batch in groups of 100)
    const batchSize = 100;
    for (let i = 0; i < mints.length; i += batchSize) {
      const batch = mints.slice(i, i + batchSize);
      const mintsParam = batch.join(',');
      const response = await fetch(
        `https://price.jup.ag/v6/price?ids=${mintsParam}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (response.ok) {
        const data = await response.json() as {
          data: Record<string, { price: number }>;
        };

        for (const [mint, priceData] of Object.entries(data.data || {})) {
          if (priceData?.price) {
            prices.set(mint, priceData.price);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching token prices:', error);
  }

  return prices;
}

// Get SOL price in USD
async function fetchSolPrice(): Promise<number | null> {
  try {
    const response = await fetch(
      'https://price.jup.ag/v6/price?ids=So11111111111111111111111111111111111111112',
      { signal: AbortSignal.timeout(5000) }
    );

    if (response.ok) {
      const data = await response.json() as {
        data: Record<string, { price: number }>;
      };
      return data.data?.['So11111111111111111111111111111111111111112']?.price || null;
    }
  } catch (error) {
    console.error('Error fetching SOL price:', error);
  }
  return null;
}

function toNetWorthRange(usdValue: number): string {
  if (usdValue < 10) return '<$10';
  if (usdValue < 100) return '$10-$100';
  if (usdValue < 500) return '$100-$500';
  if (usdValue < 1000) return '$500-$1K';
  if (usdValue < 5000) return '$1K-$5K';
  if (usdValue < 10000) return '$5K-$10K';
  if (usdValue < 50000) return '$10K-$50K';
  if (usdValue < 100000) return '$50K-$100K';
  if (usdValue < 500000) return '$100K-$500K';
  if (usdValue < 1000000) return '$500K-$1M';
  return '$1M+';
}

export async function analyzeNetWorth(
  solBalance: number,
  tokenBalances: TokenBalance[],
  tokenRiskAnalysis: { classifications: Array<{ mint: string; category: TokenRiskCategory }> } | undefined
): Promise<NetWorthAnalysis> {
  const result: NetWorthAnalysis = {
    totalValueUsd: null,
    valueRange: 'Unknown',
    solValueUsd: null,
    tokenValueUsd: null,
    tokenValues: [],
    lastUpdated: new Date().toISOString(),
  };

  try {
    // Fetch SOL price
    const solPrice = await fetchSolPrice();
    if (solPrice) {
      result.solValueUsd = solBalance * solPrice;
    }

    // Fetch token prices
    const tokenMints = tokenBalances.map(t => t.mint);
    const tokenPrices = await fetchTokenPrices(tokenMints);

    // Calculate token values
    let totalTokenValue = 0;
    const classificationMap = new Map<string, TokenRiskCategory>();
    if (tokenRiskAnalysis) {
      for (const c of tokenRiskAnalysis.classifications) {
        classificationMap.set(c.mint, c.category);
      }
    }

    for (const token of tokenBalances) {
      const price = tokenPrices.get(token.mint);
      const valueUsd = price ? token.uiAmount * price : null;

      if (valueUsd !== null) {
        totalTokenValue += valueUsd;
      }

      result.tokenValues.push({
        mint: token.mint,
        symbol: token.mint.slice(0, 4) + '...',
        amount: token.uiAmount,
        priceUsd: price || null,
        valueUsd,
        category: classificationMap.get(token.mint) || 'unknown',
      });
    }

    result.tokenValueUsd = totalTokenValue;

    // Calculate total
    if (result.solValueUsd !== null) {
      result.totalValueUsd = result.solValueUsd + totalTokenValue;
      result.valueRange = toNetWorthRange(result.totalValueUsd);
    }

    // Sort token values by value (highest first)
    result.tokenValues.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));

  } catch (error) {
    console.error('Error analyzing net worth:', error);
  }

  return result;
}

// ============================================
// P&L ANALYSIS (Memecoin Trading)
// ============================================

export async function analyzePnL(
  address: string,
  transactions: TransactionData[],
  tokenBalances: TokenBalance[],
  tokenRiskAnalysis: { classifications: Array<{ mint: string; category: TokenRiskCategory }> } | undefined
): Promise<PnLAnalysis> {
  const conn = getConnection();
  const result: PnLAnalysis = {
    tokens: [],
    totalRealizedPnL: null,
    totalUnrealizedPnL: null,
    totalPnL: null,
    winCount: 0,
    lossCount: 0,
    biggestWin: null,
    biggestLoss: null,
  };

  if (transactions.length === 0) {
    return result;
  }

  const addressLower = address.toLowerCase();

  // Track trades by token
  const tradesByToken = new Map<string, TokenTrade[]>();

  // Get classification map
  const classificationMap = new Map<string, TokenRiskCategory>();
  if (tokenRiskAnalysis) {
    for (const c of tokenRiskAnalysis.classifications) {
      classificationMap.set(c.mint, c.category);
    }
  }

  // Focus on memecoins and volatile tokens for P&L
  const targetMints = new Set<string>();
  for (const token of tokenBalances) {
    const category = classificationMap.get(token.mint);
    if (category === 'memecoin' || category === 'volatile') {
      targetMints.add(token.mint);
    }
  }

  // If no target tokens, return empty result
  if (targetMints.size === 0) {
    return result;
  }

  try {
    // Analyze transactions for swaps
    const signatureStrings = transactions.slice(0, 100).map(t => t.signature);
    const parsedTxs = await conn.getParsedTransactions(signatureStrings, {
      maxSupportedTransactionVersion: 0,
    });

    for (let i = 0; i < parsedTxs.length; i++) {
      const tx = parsedTxs[i];
      if (!tx || !tx.transaction) continue;

      const message = tx.transaction.message;
      const blockTime = tx.blockTime || 0;
      const signature = transactions[i].signature;

      // Look for token transfers (simplified - real DEX parsing is complex)
      for (const inst of message.instructions) {
        if ('parsed' in inst && inst.parsed) {
          const parsed = inst.parsed as {
            type?: string;
            info?: {
              mint?: string;
              source?: string;
              destination?: string;
              amount?: string;
              tokenAmount?: { amount: string; decimals: number; uiAmount: number };
              authority?: string;
            };
          };

          if ((parsed.type === 'transfer' || parsed.type === 'transferChecked') && parsed.info?.mint) {
            const mint = parsed.info.mint;
            if (!targetMints.has(mint)) continue;

            const amount = parsed.info.tokenAmount?.uiAmount || 0;
            const source = parsed.info.source?.toLowerCase();
            const destination = parsed.info.destination?.toLowerCase();

            // Determine if buy or sell based on direction
            let tradeType: 'buy' | 'sell' | null = null;
            if (destination === addressLower) {
              tradeType = 'buy';
            } else if (source === addressLower || parsed.info.authority?.toLowerCase() === addressLower) {
              tradeType = 'sell';
            }

            if (tradeType && amount > 0) {
              const trades = tradesByToken.get(mint) || [];
              trades.push({
                mint,
                symbol: mint.slice(0, 4) + '...',
                type: tradeType,
                amount,
                pricePerToken: null,
                totalValue: null,
                timestamp: blockTime,
                signature,
              });
              tradesByToken.set(mint, trades);
            }
          }
        }
      }
    }

    // Fetch current prices for target tokens
    const tokenPrices = await fetchTokenPrices(Array.from(targetMints));

    // Calculate P&L per token
    const currentHoldings = new Map<string, number>();
    for (const token of tokenBalances) {
      currentHoldings.set(token.mint, token.uiAmount);
    }

    let totalRealized = 0;
    let totalUnrealized = 0;
    let hasAnyPnL = false;

    for (const [mint, trades] of tradesByToken) {
      const totalBought = trades.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.amount, 0);
      const totalSold = trades.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.amount, 0);
      const currentHolding = currentHoldings.get(mint) || 0;
      const currentPrice = tokenPrices.get(mint) || null;
      const category = classificationMap.get(mint) || 'unknown';

      // Simplified P&L calculation
      let realizedPnL: number | null = null;
      let unrealizedPnL: number | null = null;

      if (currentPrice !== null) {
        unrealizedPnL = currentHolding * currentPrice;
        totalUnrealized += unrealizedPnL;
        hasAnyPnL = true;
      }

      const tokenPnL: TokenPnL = {
        mint,
        symbol: mint.slice(0, 4) + '...',
        category,
        totalBought,
        totalSold,
        avgBuyPrice: null,
        avgSellPrice: null,
        currentPrice,
        currentHolding,
        realizedPnL,
        unrealizedPnL,
        totalPnL: unrealizedPnL,
        pnlPercentage: null,
      };

      result.tokens.push(tokenPnL);

      // Track wins/losses
      if (tokenPnL.totalPnL !== null) {
        if (tokenPnL.totalPnL > 0) {
          result.winCount++;
          if (!result.biggestWin || tokenPnL.totalPnL > (result.biggestWin.totalPnL || 0)) {
            result.biggestWin = tokenPnL;
          }
        } else if (tokenPnL.totalPnL < 0) {
          result.lossCount++;
          if (!result.biggestLoss || tokenPnL.totalPnL < (result.biggestLoss.totalPnL || 0)) {
            result.biggestLoss = tokenPnL;
          }
        }
      }
    }

    if (hasAnyPnL) {
      result.totalUnrealizedPnL = totalUnrealized;
      result.totalPnL = totalRealized + totalUnrealized;
    }

    // Sort by current holding value
    result.tokens.sort((a, b) => (b.unrealizedPnL || 0) - (a.unrealizedPnL || 0));

  } catch (error) {
    console.error('Error analyzing P&L:', error);
  }

  return result;
}

// ============================================
// SOLSCAN API INTEGRATION
// ============================================

const SOLSCAN_API_KEY = process.env.SOLSCAN_API_KEY;
const SOLSCAN_API_BASE = 'https://pro-api.solscan.io/v2.0';

// Known entity labels that indicate safety levels
const SAFE_LABELS = new Set([
  'binance', 'coinbase', 'kraken', 'okx', 'bybit', 'kucoin', 'gate.io',
  'jupiter', 'raydium', 'orca', 'marinade', 'jito', 'phantom', 'solflare',
  'magic eden', 'tensor', 'metaplex', 'solana foundation',
]);

const CAUTION_LABELS = new Set([
  'mixer', 'tumbler', 'tornado', 'privacy', 'anonymous',
  'sanctioned', 'blacklisted', 'suspicious', 'scam', 'hack',
]);

function determineEntityRiskLevel(label: string | null, tags: string[]): SolscanLabel['entityRiskLevel'] {
  if (!label && tags.length === 0) return 'unknown';

  const allIdentifiers = [label?.toLowerCase() || '', ...tags.map(t => t.toLowerCase())];

  for (const id of allIdentifiers) {
    for (const caution of CAUTION_LABELS) {
      if (id.includes(caution)) return 'caution';
    }
  }

  for (const id of allIdentifiers) {
    for (const safe of SAFE_LABELS) {
      if (id.includes(safe)) return 'safe';
    }
  }

  // Has a label but not in our known lists
  if (label) return 'neutral';

  return 'unknown';
}

export async function getSolscanLabel(address: string): Promise<SolscanLabel> {
  const defaultResult: SolscanLabel = {
    accountLabel: null,
    accountTags: [],
    accountType: null,
    accountIcon: null,
    fundedBy: null,
    activeAgeDays: null,
    isKnownEntity: false,
    entityRiskLevel: 'unknown',
  };

  // If no API key, try public endpoint or return default
  if (!SOLSCAN_API_KEY) {
    // Try to scrape basic label from public Solscan page (fallback)
    try {
      const publicResponse = await fetch(
        `https://api.solscan.io/v2/account?address=${address}`,
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (publicResponse.ok) {
        const data = await publicResponse.json() as {
          data?: {
            account_label?: string;
            account_tags?: string[];
          };
        };

        if (data?.data?.account_label) {
          defaultResult.accountLabel = data.data.account_label;
          defaultResult.isKnownEntity = true;
        }
        if (data?.data?.account_tags && Array.isArray(data.data.account_tags)) {
          defaultResult.accountTags = data.data.account_tags;
        }

        defaultResult.entityRiskLevel = determineEntityRiskLevel(
          defaultResult.accountLabel,
          defaultResult.accountTags
        );
      }
    } catch {
      // Public API failed, continue with default
    }

    return defaultResult;
  }

  // Pro API with key
  try {
    const response = await fetch(
      `${SOLSCAN_API_BASE}/account/metadata?address=${address}`,
      {
        headers: {
          'Accept': 'application/json',
          'token': SOLSCAN_API_KEY,
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (response.ok) {
      const data = await response.json() as {
        success: boolean;
        data?: {
          account_address?: string;
          account_label?: string;
          account_icon?: string;
          account_tags?: string;
          account_type?: string;
          account_domain?: string;
          funded_by?: {
            funded_by?: string;
            tx_hash?: string;
            block_time?: number;
          };
          active_age?: number;
        };
      };

      if (data.success && data.data) {
        const accountData = data.data;

        // Parse tags (might be comma-separated string)
        let tags: string[] = [];
        if (accountData.account_tags) {
          if (typeof accountData.account_tags === 'string') {
            tags = accountData.account_tags.split(',').map(t => t.trim()).filter(t => t);
          } else if (Array.isArray(accountData.account_tags)) {
            tags = accountData.account_tags;
          }
        }

        const result: SolscanLabel = {
          accountLabel: accountData.account_label || null,
          accountTags: tags,
          accountType: accountData.account_type || null,
          accountIcon: accountData.account_icon || null,
          fundedBy: accountData.funded_by?.funded_by ? {
            address: accountData.funded_by.funded_by,
            txHash: accountData.funded_by.tx_hash || '',
            blockTime: accountData.funded_by.block_time || 0,
          } : null,
          activeAgeDays: accountData.active_age || null,
          isKnownEntity: !!accountData.account_label,
          entityRiskLevel: 'unknown',
        };

        result.entityRiskLevel = determineEntityRiskLevel(result.accountLabel, result.accountTags);

        return result;
      }
    } else if (response.status === 401) {
      console.warn('Solscan API key invalid or expired');
    } else if (response.status === 429) {
      console.warn('Solscan API rate limit reached');
    }
  } catch (error) {
    console.error('Solscan API error:', error);
  }

  return defaultResult;
}
