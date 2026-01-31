export interface GhostScore {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  ghostLevel: 'Invisible' | 'Translucent' | 'Visible' | 'Exposed' | 'Glass House';
  breakdown: {
    anonymityScore: number;
    linkageScore: number;
    patternScore: number;
    volumeScore: number;
    timingScore: number;
  };
  threats: ThreatDetail[];
  recommendations: string[];
}

export interface ThreatDetail {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'CEX_LINK' | 'PATTERN_LEAK' | 'VOLUME_LEAK' | 'TIMING_LEAK' | 'DIRECT_LINK';
  description: string;
  hopCount?: number;
  recommendation: string;
  fixCommand?: string;
}

export interface PrivacyBadge {
  badgeType: 'GHOST' | 'SHIELD' | 'PHANTOM' | 'INVISIBLE';
  score: number;
  proofData: string;
  imageUrl: string;
  markdownEmbed: string;
  htmlEmbed: string;
  twitterText: string;
  discordText: string;
}

// Atomic Rescue Types
export interface RescueParams {
  sourceKeypair: any; // Keypair
  destination: any; // PublicKey
  assets: AssetSummary;
  emergencyMode: boolean;
  useJitoBundle: boolean;
  reason: string;
}

export interface RescueResult {
  signature: string;
  slot: number;
  rescued: {
    sol: string;
    tokens: number;
    nfts: number;
  };
  executionTime: number;
}

export interface AssetSummary {
  sol: {
    balance: string;
    lamports: number;
    valueUSD: string;
  };
  tokens: TokenAsset[];
  nfts: NFTAsset[];
  total: {
    count: number;
    value: number;
    valueUSD: string;
  };
}

export interface TokenAsset {
  mint: string;
  symbol: string;
  name: string;
  amount: string;
  decimals: number;
  valueUSD: string;
  address: string;
}

export interface NFTAsset {
  mint: string;
  name: string;
  collection: string;
  address: string;
  amount: string; // Always 1 for NFTs
}

export interface Threat {
  type: 'DRAINER' | 'MEV_BOT' | 'SANDWICH_ATTACK' | 'KEY_LEAK' | 'TRACKING' | 'UNKNOWN';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  confidence: number; // 0-100
  evidence: any[];
  timestamp: number;
}
