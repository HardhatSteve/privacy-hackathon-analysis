// Mock data for demonstration before API integration

export interface WalletNode {
  id: string;
  type: "wallet";
  label: string;
  address: string;
  balance?: number;
  privacyScore?: number;
  badge?: string;
}

export interface ProgramNode {
  id: string;
  type: "program";
  label: string;
  programId: string;
  interactions: number;
}

export interface TokenNode {
  id: string;
  type: "token";
  label: string;
  mint: string;
  symbol: string;
  amount?: number;
}

export type GossipNode = WalletNode | ProgramNode | TokenNode;

export interface TransactionEdge {
  id: string;
  source: string;
  target: string;
  type: "transaction" | "interaction" | "token_transfer";
  amount?: number;
  timestamp?: number;
  riskLevel?: "low" | "medium" | "high";
}

export interface PrivacyMetrics {
  privacyScore: number; // 0-100
  deanonymizationRisks: DeanonymizationRisk[];
  mevExposure: number; // 0-100
  transactionCount: number;
  uniqueInteractions: number;
  anonymitySetSize: number;
  temporalCorrelation: number; // 0-100
}

export interface DeanonymizationRisk {
  id: string;
  type: "common_counterparty" | "temporal_pattern" | "amount_pattern" | "program_exposure";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  affectedAddresses: string[];
  confidence: number; // 0-100
}

// Generate mock gossip graph data
export function generateMockGossipData(walletAddress: string): {
  nodes: GossipNode[];
  edges: TransactionEdge[];
  metrics: PrivacyMetrics;
} {
  const mainWallet: WalletNode = {
    id: walletAddress,
    type: "wallet",
    label: "Your Wallet",
    address: walletAddress,
    balance: 42.5,
    privacyScore: 72,
    badge: "🕵️ Shadow Operator",
  };

  // Generate related wallets
  const relatedWallets: WalletNode[] = [
    {
      id: "wallet-1",
      type: "wallet",
      label: "Frequent Trader",
      address: "DqE...xyz",
      balance: 15.3,
      privacyScore: 45,
      badge: "📢 Gossip Queen",
    },
    {
      id: "wallet-2",
      type: "wallet",
      label: "MEV Bot",
      address: "7nQ...abc",
      balance: 128.7,
      privacyScore: 25,
      badge: "⚡ MEV Hunter",
    },
    {
      id: "wallet-3",
      type: "wallet",
      label: "Ghost Wallet",
      address: "3pM...def",
      balance: 3.2,
      privacyScore: 92,
      badge: "🎭 Privacy Pro",
    },
    {
      id: "wallet-4",
      type: "wallet",
      label: "Exchange Deposit",
      address: "8kL...ghi",
      balance: 5234.1,
      privacyScore: 10,
      badge: "🏦 Exchange",
    },
  ];

  // Generate programs
  const programs: ProgramNode[] = [
    {
      id: "program-1",
      type: "program",
      label: "Raydium AMM",
      programId: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
      interactions: 45,
    },
    {
      id: "program-2",
      type: "program",
      label: "Jupiter Aggregator",
      programId: "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB",
      interactions: 28,
    },
    {
      id: "program-3",
      type: "program",
      label: "Marinade Finance",
      programId: "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD",
      interactions: 12,
    },
  ];

  // Generate tokens
  const tokens: TokenNode[] = [
    {
      id: "token-1",
      type: "token",
      label: "USDC",
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      symbol: "USDC",
      amount: 1250.0,
    },
    {
      id: "token-2",
      type: "token",
      label: "mSOL",
      mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
      symbol: "mSOL",
      amount: 8.5,
    },
  ];

  const nodes: GossipNode[] = [mainWallet, ...relatedWallets, ...programs, ...tokens];

  // Generate edges (transactions)
  const edges: TransactionEdge[] = [
    // Main wallet to other wallets
    {
      id: "edge-1",
      source: walletAddress,
      target: "wallet-1",
      type: "transaction",
      amount: 5.2,
      timestamp: Date.now() - 3600000,
      riskLevel: "low",
    },
    {
      id: "edge-2",
      source: walletAddress,
      target: "wallet-2",
      type: "transaction",
      amount: 0.5,
      timestamp: Date.now() - 7200000,
      riskLevel: "high",
    },
    {
      id: "edge-3",
      source: "wallet-3",
      target: walletAddress,
      type: "transaction",
      amount: 2.1,
      timestamp: Date.now() - 1800000,
      riskLevel: "low",
    },
    // Main wallet to programs
    {
      id: "edge-4",
      source: walletAddress,
      target: "program-1",
      type: "interaction",
      riskLevel: "medium",
    },
    {
      id: "edge-5",
      source: walletAddress,
      target: "program-2",
      type: "interaction",
      riskLevel: "low",
    },
    {
      id: "edge-6",
      source: walletAddress,
      target: "program-3",
      type: "interaction",
      riskLevel: "low",
    },
    // Token transfers
    {
      id: "edge-7",
      source: walletAddress,
      target: "token-1",
      type: "token_transfer",
      amount: 1250,
      riskLevel: "low",
    },
    {
      id: "edge-8",
      source: walletAddress,
      target: "token-2",
      type: "token_transfer",
      amount: 8.5,
      riskLevel: "low",
    },
    // Indirect connections
    {
      id: "edge-9",
      source: "wallet-1",
      target: "program-1",
      type: "interaction",
      riskLevel: "medium",
    },
    {
      id: "edge-10",
      source: "wallet-2",
      target: "program-1",
      type: "interaction",
      riskLevel: "high",
    },
    {
      id: "edge-11",
      source: "wallet-1",
      target: "wallet-4",
      type: "transaction",
      amount: 15.0,
      riskLevel: "high",
    },
  ];

  // Generate privacy metrics
  const metrics: PrivacyMetrics = {
    privacyScore: 72,
    transactionCount: 142,
    uniqueInteractions: 18,
    anonymitySetSize: 234,
    temporalCorrelation: 45,
    mevExposure: 35,
    deanonymizationRisks: [
      {
        id: "risk-1",
        type: "common_counterparty",
        severity: "high",
        description: "Frequent transactions with known exchange deposit address",
        affectedAddresses: [walletAddress, "wallet-4"],
        confidence: 87,
      },
      {
        id: "risk-2",
        type: "temporal_pattern",
        severity: "medium",
        description: "Regular transaction timing pattern detected (every 24h)",
        affectedAddresses: [walletAddress],
        confidence: 72,
      },
      {
        id: "risk-3",
        type: "amount_pattern",
        severity: "medium",
        description: "Consistent transaction amounts may link identities",
        affectedAddresses: [walletAddress, "wallet-1"],
        confidence: 65,
      },
      {
        id: "risk-4",
        type: "program_exposure",
        severity: "low",
        description: "Multiple interactions with same DEX increases correlation risk",
        affectedAddresses: [walletAddress],
        confidence: 54,
      },
    ],
  };

  return { nodes, edges, metrics };
}
