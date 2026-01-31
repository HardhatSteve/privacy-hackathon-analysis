/**
 * Constants for the Privacy Engine
 * Contains known CEX addresses, risk levels, and recommendations
 */

// Known CEX (Centralized Exchange) hot wallet addresses
// These are real addresses associated with major exchanges
export const KNOWN_CEX: { address: string; name: string }[] = [
  // Binance Hot Wallets
  { address: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9", name: "Binance" },
  { address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", name: "Binance" },
  { address: "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S", name: "Binance" },
  
  // Coinbase Hot Wallets
  { address: "H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS", name: "Coinbase" },
  { address: "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE", name: "Coinbase" },
  { address: "2AQdpHJ2JpcEgPiATUXjQxA8QmafFegfQwSLWSprPicm", name: "Coinbase" },
  
  // Kraken Hot Wallets
  { address: "FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5", name: "Kraken" },
  { address: "7hUdUTkJLwdcmt3jSEeqx4ep91sm1XwBxMDaJae6bD5D", name: "Kraken" },
  
  // FTX (now defunct, but still good to track for history)
  { address: "CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq", name: "FTX (defunct)" },
  
  // OKX Hot Wallets
  { address: "5VCwKtCXgCJ6kit5FybXjvriW3xELsFDhYrPSqtJNmcD", name: "OKX" },
  
  // KuCoin Hot Wallets
  { address: "BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6", name: "KuCoin" },
];

// Risk level classifications
export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// Privacy score thresholds
export const SCORE_THRESHOLDS = {
  CRITICAL: 25,  // 0-25: Critical privacy risk
  HIGH: 50,      // 26-50: High privacy risk
  MEDIUM: 75,    // 51-75: Medium privacy risk
  LOW: 100,      // 76-100: Low privacy risk (good)
};

// Point deductions for various privacy issues
export const POINT_DEDUCTIONS = {
  CEX_DEPOSIT: 15,           // Direct deposit from CEX
  CEX_WITHDRAWAL: 10,        // Withdrawal to CEX
  CLUSTER_DETECTED: 20,      // Wallet clustering detected
  NFT_POAP_EXPOSED: 5,       // Identity-revealing NFTs
  SOL_DOMAIN_EXPOSED: 10,    // .sol domain linked (identity exposure)
  SANCTIONED_INTERACTION: 50, // Interaction with sanctioned address
  HIGH_FREQUENCY_SAME_ADDR: 8, // Frequent transactions with same address
};

// Recommended privacy tools and services
export interface RecommendedTool {
  name: string;
  description: string;
  url: string;
  useCase: string;
}

export const RECOMMENDED_TOOLS: RecommendedTool[] = [
  {
    name: "Privacy Cash",
    description: "Break the on-chain link between your wallets using Privacy Cash mixer",
    url: "https://privacycash.io",
    useCase: "CEX_DEPOSIT",
  },
  {
    name: "Radr Labs",
    description: "Advanced wallet obfuscation and privacy-preserving transactions",
    url: "https://radrlabs.io",
    useCase: "CLUSTER_DETECTED",
  },
  {
    name: "Range Protocol",
    description: "Compliance-friendly privacy layer with regulatory clarity",
    url: "https://range.org",
    useCase: "SANCTIONED_INTERACTION",
  },
  {
    name: "Elusiv",
    description: "Zero-knowledge private transactions on Solana",
    url: "https://elusiv.io",
    useCase: "GENERAL_PRIVACY",
  },
  {
    name: "Light Protocol",
    description: "ZK compression for private state on Solana",
    url: "https://lightprotocol.com",
    useCase: "GENERAL_PRIVACY",
  },
];

// Warning message templates
export const WARNING_MESSAGES = {
  CEX_DEPOSIT: (exchangeName: string) => 
    `Direct deposit detected from ${exchangeName}. This links your CEX identity to this wallet.`,
  CEX_WITHDRAWAL: (exchangeName: string) => 
    `Withdrawal to ${exchangeName} detected. Your wallet is now linked to your exchange KYC.`,
  CLUSTER_DETECTED: (percentage: number) => 
    `Wallet clustering detected: ${percentage.toFixed(1)}% of transactions are with the same address.`,
  NFT_POAP_EXPOSED: 
    `Identity-revealing NFTs (POAPs, event badges) detected. These can deanonymize you.`,
  SOL_DOMAIN_EXPOSED: (domain: string) => 
    `.sol domain "${domain}" linked to wallet. Consider using a separate wallet for domains.`,
  SANCTIONED_INTERACTION: 
    `⚠️ CRITICAL: Interaction with a potentially sanctioned address detected!`,
  HIGH_FREQUENCY_PATTERN: 
    `High-frequency transaction pattern detected with recurring addresses.`,
};

// Action recommendation templates
export const ACTION_RECOMMENDATIONS = {
  CEX_DEPOSIT: "Use Privacy Cash to create a clean wallet for DeFi activities.",
  CEX_WITHDRAWAL: "Consider using intermediate wallets before depositing to CEX.",
  CLUSTER_DETECTED: "Use Radr Labs to break wallet clustering patterns.",
  NFT_POAP_EXPOSED: "Transfer identity-linked NFTs to a separate public wallet.",
  SOL_DOMAIN_EXPOSED: "Use a dedicated public-facing wallet for .sol domains.",
  SANCTIONED_INTERACTION: "Consult Range Protocol for compliance review immediately.",
  GENERAL_PRIVACY: "Consider using Elusiv or Light Protocol for future transactions.",
};

// Analysis configuration
export const ANALYSIS_CONFIG = {
  MAX_TRANSACTIONS_TO_ANALYZE: 100,
  CLUSTER_THRESHOLD_PERCENTAGE: 50, // 50% of transactions with same address = clustering
  MIN_TRANSACTIONS_FOR_PATTERN: 5,   // Minimum transactions needed for pattern analysis
};
