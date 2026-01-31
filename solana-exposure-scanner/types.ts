
export interface ExposureAnalysis {
  score: number; // 0-100, where 100 is high risk
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  summary: string;
  exposurePoints: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  recommendations: string[];
  stats: {
    totalTransactions: number;
    activeDays: number;
    uniqueDApps: number;
    cexConnections: string[];
  };
}

export interface WalletInfo {
  address: string;
  balance?: number;
  tokens?: number;
}
