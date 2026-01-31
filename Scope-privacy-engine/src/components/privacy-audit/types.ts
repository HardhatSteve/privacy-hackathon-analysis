/**
 * Privacy Audit Types
 * Matches the backend PrivacyReport structure
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Warning {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  message: string;
}

export interface Recommendation {
  priority: 'low' | 'medium' | 'high';
  category: string;
  action: string;
  tool?: string;
  toolUrl?: string;
}

export interface CEXDetectionResult {
  detected: boolean;
  deposits: Array<{
    signature: string;
    exchangeName: string;
    amount?: number;
  }>;
  withdrawals: Array<{
    signature: string;
    exchangeName: string;
    amount?: number;
  }>;
  totalCEXTransactions: number;
  exchangesInvolved: string[];
  riskContribution: number;
}

export interface ClusteringResult {
  detected: boolean;
  clusteringPercentage: number;
  pattern: string;
  riskContribution: number;
}

export interface AssetsDetectionResult {
  detected: boolean;
  nftsDetected: Array<{ mint: string; type: string }>;
  solDomainsDetected: string[];
  poapsDetected: Array<{ mint: string; type: string }>;
  identityExposureLevel: 'none' | 'low' | 'medium' | 'high';
  riskContribution: number;
}

export interface RangeCheckResult {
  address: string;
  status: 'Clean' | 'Sanctioned' | 'Flagged' | 'Unknown';
  riskScore: number;
}

export interface PrivacyReport {
  walletAddress: string;
  analyzedAt: string;
  transactionsAnalyzed: number;
  score: number;
  riskLevel: RiskLevel;
  riskDescription: string;
  warnings: Warning[];
  actions: Recommendation[];
  detectorResults: {
    cex: CEXDetectionResult;
    clustering: ClusteringResult;
    assets: AssetsDetectionResult;
    compliance: RangeCheckResult;
    interactingAddressRisks: {
      sanctionedAddresses: string[];
      flaggedAddresses: string[];
      totalChecked: number;
    };
  };
  analysisMetadata: {
    heliusEnabled: boolean;
    apiLimitReached: boolean;
    analysisTimeMs: number;
  };
  financialExposure: {
    exposedSol: number;
    exposedUsd: number;
    cexVolumeSol: number;
  };
}

export interface ScanState {
  status: 'idle' | 'loading' | 'success' | 'error';
  report: PrivacyReport | null;
  error: string | null;
}
