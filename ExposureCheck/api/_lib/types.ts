export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface CategoryScore {
  name: string;
  score: number;
  level: RiskLevel;
  weight: number;
  signals: string[];
  description: string;
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
  isNew: boolean;
}

export interface ExposureResult {
  address: string;
  overallScore: number;
  overallLevel: RiskLevel;
  categories: CategoryScore[];
  analyzedAt: string;
  txCount: number;
  tokenCount: number;
  solBalance: number;
  walletAge: WalletAge;
  socialLinks: SocialLinks;
  solscanLabel?: SolscanLabel;
  counterparties?: CounterpartyData[];
  fundingAnalysis?: FundingAnalysis;
  timeOfDayAnalysis?: TimeOfDayAnalysis;
  tokenRiskAnalysis?: TokenRiskAnalysis;
  incomeAnalysis?: IncomeAnalysis;
  netWorth?: NetWorthAnalysis;
  pnlAnalysis?: PnLAnalysis;
  cached?: boolean;
}

export interface TransactionData {
  signature: string;
  blockTime: number | null | undefined;
  slot: number;
  err: unknown;
}

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
}

export interface WalletData {
  address: string;
  solBalance: number;
  transactions: TransactionData[];
  tokenBalances: TokenBalance[];
  socialLinks: SocialLinks;
  solscanLabel?: SolscanLabel;
  walletAge: WalletAge;
  privacyHygiene?: PrivacyHygieneData;
  fundingAnalysis?: FundingAnalysis;
  timeOfDayAnalysis?: TimeOfDayAnalysis;
  tokenRiskAnalysis?: TokenRiskAnalysis;
  transactionVelocity?: TransactionVelocity;
  incomeAnalysis?: IncomeAnalysis;
  netWorth?: NetWorthAnalysis;
  pnlAnalysis?: PnLAnalysis;
}

export interface CacheEntry {
  result: ExposureResult;
  timestamp: number;
}

export type CounterpartyType = 'dex' | 'nft' | 'cex' | 'contract' | 'wallet' | 'unknown';

export interface CounterpartyData {
  address: string;
  txCount: number;
  lastInteraction: number;
  type: CounterpartyType;
}

export interface PrivacyHygieneData {
  privacyProgramInteractions: number;
  hasPrivacyAttempts: boolean;
  immediateReuseAfterPrivacy: boolean;
  avgTimeDelayAfterReceive: number | null;
  hasConsistentAmounts: boolean;
  riskSignals: string[];
}

export interface FundingSource {
  address: string;
  type: CounterpartyType;
  amount: number;
  timestamp: number;
  isInitialFunding: boolean;
}

export interface FundingAnalysis {
  sources: FundingSource[];
  primaryFundingType: CounterpartyType | null;
  hasCexFunding: boolean;
  hasMultipleFundingSources: boolean;
  totalFundingReceived: number;
}

export interface TimeOfDayAnalysis {
  hourDistribution: number[]; // Array of 24 values (count per hour UTC)
  peakHours: number[]; // Top 3-5 most active hours
  activeHourRange: string; // e.g., "18:00-02:00 UTC"
  inferredTimezoneOffset: number | null; // e.g., -8 for PST
  inferredTimezone: string | null; // e.g., "US West Coast (PST/PDT)"
  activityConcentration: 'high' | 'medium' | 'low'; // How concentrated activity is
}

export type TokenRiskCategory = 'stablecoin' | 'bluechip' | 'volatile' | 'memecoin' | 'unknown';

export interface TokenClassification {
  mint: string;
  category: TokenRiskCategory;
  name?: string;
}

export interface TokenRiskAnalysis {
  classifications: TokenClassification[];
  stablecoinCount: number;
  bluechipCount: number;
  volatileCount: number;
  memecoinCount: number;
  riskProfile: 'conservative' | 'balanced' | 'aggressive' | 'speculative';
  stablecoinRatio: number; // 0-1, ratio of stablecoins to total tokens
}

export interface TransactionVelocity {
  avgTxPerDay: number;
  avgTxPerWeek: number;
  peakActivityPeriod: string | null; // e.g., "Last 7 days"
  activityTrend: 'increasing' | 'decreasing' | 'stable' | 'sporadic';
  burstyBehavior: boolean; // Many txs in short periods followed by gaps
  longestGapDays: number | null;
  recentActivityLevel: 'high' | 'medium' | 'low' | 'dormant';
}

// Income source categorization
export type IncomeSourceType = 'cex_deposit' | 'dex_swap' | 'airdrop' | 'staking_reward' | 'nft_sale' | 'transfer' | 'contract' | 'unknown';

export interface IncomeSource {
  type: IncomeSourceType;
  amount: number; // in SOL equivalent
  count: number; // number of transactions
  percentage: number; // percentage of total income
  label: string; // human-readable label
}

export interface IncomeAnalysis {
  sources: IncomeSource[];
  totalIncome: number; // total SOL received
  primarySource: IncomeSourceType | null;
  diversityScore: number; // 0-1, how diversified income sources are
}

// Net worth estimation
export interface TokenValue {
  mint: string;
  symbol: string;
  amount: number;
  priceUsd: number | null;
  valueUsd: number | null;
  category: TokenRiskCategory;
}

export interface NetWorthAnalysis {
  totalValueUsd: number | null;
  valueRange: string; // e.g., "$10K-$50K"
  solValueUsd: number | null;
  tokenValueUsd: number | null;
  tokenValues: TokenValue[];
  lastUpdated: string;
}

// Memecoin P&L tracking
export interface TokenTrade {
  mint: string;
  symbol: string;
  type: 'buy' | 'sell';
  amount: number;
  pricePerToken: number | null;
  totalValue: number | null;
  timestamp: number;
  signature: string;
}

export interface TokenPnL {
  mint: string;
  symbol: string;
  category: TokenRiskCategory;
  totalBought: number;
  totalSold: number;
  avgBuyPrice: number | null;
  avgSellPrice: number | null;
  currentPrice: number | null;
  currentHolding: number;
  realizedPnL: number | null; // from sells
  unrealizedPnL: number | null; // from current holdings
  totalPnL: number | null;
  pnlPercentage: number | null;
}

export interface PnLAnalysis {
  tokens: TokenPnL[];
  totalRealizedPnL: number | null;
  totalUnrealizedPnL: number | null;
  totalPnL: number | null;
  winCount: number; // tokens with positive P&L
  lossCount: number; // tokens with negative P&L
  biggestWin: TokenPnL | null;
  biggestLoss: TokenPnL | null;
}

// Educational content for signals
export interface SignalEducation {
  signal: string;
  whyItMatters: string;
  riskLevel: 'info' | 'warning' | 'danger';
  recommendation?: string;
}

// Solscan label/entity data
export interface SolscanLabel {
  accountLabel: string | null; // e.g., "Binance", "Raydium", etc.
  accountTags: string[]; // e.g., ["exchange", "defi"]
  accountType: string | null; // e.g., "wallet", "program", "token"
  accountIcon: string | null; // URL to icon
  fundedBy: {
    address: string;
    txHash: string;
    blockTime: number;
  } | null;
  activeAgeDays: number | null;
  isKnownEntity: boolean; // true if has a label
  entityRiskLevel: 'safe' | 'neutral' | 'caution' | 'unknown';
}
