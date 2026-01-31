
export interface ScoreBreakdown {
  identity: number;
  kycLinks: number;
  financial: number;
  clustering: number;
  activity: number;
}

export interface NetworkNode {
  address: string;
  type: 'CEX' | 'DEX' | 'MEMECOIN' | 'PROTOCOL' | 'UNKNOWN';
  interactions: number;
  label?: string;
}

export interface ClusteringData {
  interactedCount: number;
  topAddresses: string[];
  networkNodes?: NetworkNode[]; // For graph visualization
}

export interface TransactionSummary {
  date: string;
  type: string;
  amountUsd: number;
  description: string;
}

export interface ExternalLinks {
  xSearch: string;
  snsSearch: string | null;
  twitterProfile: string | null;
  arkham: string;
  solscan: string;
}

export interface DeFiPosition {
  protocol: string;
  type: string;
  interactions: number;
  lastActivity: string;
}

export interface LossItem {
  protocol: string;
  type: string;
  estimatedLoss: number;
}

export interface RelatedAddress {
  address: string;
  gasTransfers: number;
  totalAmount: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface ExposureData {
  exposureScore: number;
  scoreBreakdown: ScoreBreakdown;
  netWorthUsd: number;
  realizedLossesUsd: number;
  tradeCount: number;
  memecoinTrades: number;
  clustering: ClusteringData;
  risks: string[];
  snsDomains: string[];
  twitterHandles: string[];
  links: ExternalLinks;
  recentTxSummary: TransactionSummary[];
  // New enhanced features
  defiPositions?: DeFiPosition[];
  topLosses?: LossItem[];
  relatedAddresses?: RelatedAddress[];
}
