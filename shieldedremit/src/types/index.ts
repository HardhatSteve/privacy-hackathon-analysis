import { PublicKey } from "@solana/web3.js";

// Privacy Levels
export enum PrivacyLevel {
  NONE = "none",
  MEDIUM = "medium",
  HIGH = "high",
}

// Supported currencies - expanded for ShadowWire support
export type Currency =
  | "SOL"
  | "USDC"
  | "USDT"
  | "USD1"
  | "BONK"
  | "AOL"
  | "RADR"
  | "ORE";

// Token addresses (mainnet) - ShadowWire supported tokens
export const TOKEN_ADDRESSES: Record<Currency, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  USD1: "FkXTmFJLskGBgSviFtxLUUMqhWfM9RGkh4cABqawypnx", // USD1 stablecoin
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  AOL: "AMzj8FKF8bqzFYGEPq5vZW6YxGsJsjjfhgNPtZ5Xpump",
  RADR: "4SnF1ooLP1gmvT9HFNZ4Pu7RMEqFX9d8eBTVjKRqpump",
  ORE: "oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhyCK9nnSCPP",
};

// Token decimals for ShadowWire
export const TOKEN_DECIMALS: Record<Currency, number> = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
  USD1: 6,
  BONK: 5,
  AOL: 6,
  RADR: 9,
  ORE: 11,
};

// ShadowWire fee rates
export const SHADOWWIRE_FEE_RATES: Record<Currency, number> = {
  SOL: 0.005, // 0.5%
  USDC: 0.01, // 1%
  USDT: 0.01, // 1%
  USD1: 0.01, // 1%
  BONK: 0.01, // 1%
  AOL: 0.01, // 1%
  RADR: 0.003, // 0.3%
  ORE: 0.003, // 0.3%
};

// Transaction types
export interface Transaction {
  id: string;
  signature: string;
  timestamp: number;
  type: "send" | "receive" | "deposit" | "withdraw";
  amount: number;
  currency: Currency;
  sender: string;
  recipient: string;
  status: TransactionStatus;
  privacyLevel: PrivacyLevel;
  fees: FeeBreakdown;
  memo?: string;
  transferType?: "internal" | "external"; // ShadowWire transfer type
}

export type TransactionStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "failed";

// Fee structure
export interface FeeBreakdown {
  networkFee: number;
  privacyFee: number;
  serviceFee: number;
  total: number;
  currency: Currency;
}

// Privacy route
export interface PrivacyRoute {
  hops: number;
  mixingEnabled: boolean;
  estimatedTime: number; // seconds
  privacyScore: number; // 0-100
}

// Transfer parameters
export interface TransferParams {
  recipient: string;
  amount: number;
  currency: Currency;
  privacyLevel: PrivacyLevel;
  memo?: string;
  transferType?: "internal" | "external";
}

// Transfer result
export interface TransferResult {
  signature: string;
  status: TransactionStatus;
  privacyScore: number;
  fees: FeeBreakdown;
  route?: PrivacyRoute;
  proof?: ZKProofData;
}

// ZK Proof data from ShadowWire
export interface ZKProofData {
  proofData: string;
  commitment: string;
  nullifier: string;
  verified: boolean;
}

// ShadowWire balance
export interface ShieldedBalance {
  token: Currency;
  balance: number;
  lastUpdated: number;
}

// Price data
export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  timestamp: number;
  source: "jupiter" | "pyth" | "coingecko";
}

// Address book entry
export interface AddressBookEntry {
  id: string;
  name: string;
  address: string;
  country?: string;
  notes?: string;
  createdAt: number;
  lastUsed?: number;
}

// KYC levels
export interface KYCLevel {
  level: 0 | 1 | 2 | 3;
  name: string;
  limits: {
    dailyLimit: number;
    monthlyLimit: number;
    singleTransactionLimit: number;
  };
  requirements: string[];
}

export const KYC_LEVELS: KYCLevel[] = [
  {
    level: 0,
    name: "Anonymous",
    limits: { dailyLimit: 100, monthlyLimit: 500, singleTransactionLimit: 50 },
    requirements: [],
  },
  {
    level: 1,
    name: "Basic",
    limits: {
      dailyLimit: 1000,
      monthlyLimit: 5000,
      singleTransactionLimit: 500,
    },
    requirements: ["Email verification", "Phone verification"],
  },
  {
    level: 2,
    name: "Verified",
    limits: {
      dailyLimit: 10000,
      monthlyLimit: 50000,
      singleTransactionLimit: 5000,
    },
    requirements: ["ID document", "Proof of address"],
  },
  {
    level: 3,
    name: "Premium",
    limits: {
      dailyLimit: 100000,
      monthlyLimit: 500000,
      singleTransactionLimit: 50000,
    },
    requirements: ["Enhanced due diligence", "Source of funds"],
  },
];

// Compliance types
export interface ScreeningResult {
  address: string;
  riskLevel: "low" | "medium" | "high";
  flags: string[];
  sanctioned: boolean;
  allowed: boolean;
  reason?: string;
}

export interface RiskAssessment {
  score: number;
  level: "low" | "medium" | "high";
  factors: string[];
  recommendation: "approve" | "review" | "reject";
}

// User preferences
export interface UserPreferences {
  defaultPrivacyLevel: PrivacyLevel;
  defaultCurrency: Currency;
  darkMode: boolean;
  notifications: {
    browser: boolean;
    email: boolean;
  };
  locale: string;
}

// Wallet state
export interface WalletBalance {
  sol: number;
  usdc: number;
  usdt: number;
  usd1: number;
  bonk: number;
  aol: number;
  radr: number;
  ore: number;
}

// Network type
export type NetworkType = "mainnet-beta" | "devnet" | "testnet";

// ShadowID Types
export interface ShadowIDProfile {
  id: string;
  wallet: string;
  kycLevel: number;
  verified: boolean;
  createdAt: number;
  updatedAt: number;
  complianceProof?: string;
}

export interface ShadowIDVerification {
  status: "pending" | "approved" | "rejected";
  level: number;
  reason?: string;
  expiresAt?: number;
}

// Virtual Card Types (ShadowPay/Starpay)
export interface VirtualCard {
  id: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  balance: number;
  currency: string;
  status: "active" | "frozen" | "expired";
  createdAt: number;
  lastUsed?: number;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  amount: number;
  currency: string;
  merchant: string;
  status: "pending" | "completed" | "declined";
  timestamp: number;
}

// ShadowPay Types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: Currency;
  recipient: string;
  status: "created" | "processing" | "completed" | "failed";
  expiresAt: number;
  paymentUrl?: string;
}

export interface Subscription {
  id: string;
  merchantId: string;
  amount: number;
  currency: Currency;
  interval: "daily" | "weekly" | "monthly" | "yearly";
  status: "active" | "paused" | "cancelled";
  nextPayment: number;
}

export interface EscrowContract {
  id: string;
  buyer: string;
  seller: string;
  amount: number;
  currency: Currency;
  status: "funded" | "released" | "disputed" | "refunded";
  conditions: string[];
  createdAt: number;
}

// Privy User Types
export interface PrivyUser {
  id: string;
  wallet?: {
    address: string;
    chainType: "solana" | "ethereum";
  };
  email?: string;
  phone?: string;
  createdAt: number;
  linkedAccounts: LinkedAccount[];
}

export interface LinkedAccount {
  type: "wallet" | "email" | "phone" | "google" | "twitter" | "discord";
  address?: string;
  verified: boolean;
}
