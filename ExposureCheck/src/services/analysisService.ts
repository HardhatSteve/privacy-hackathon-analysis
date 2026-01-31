import type { WalletData, ExposureResult, AnalysisProgress, RiskLevel } from '../types/exposure';
import {
  getSolBalance,
  getTransactionHistory,
  getTokenBalances,
  getSocialLinks,
  getWalletAge,
} from './solanaService';
import {
  calculateWalletActivityScore,
  calculateAddressLinkabilityScore,
  calculateSocialExposureScore,
  calculateBehavioralProfilingScore,
  calculateFinancialFootprintScore,
  calculateOverallScore,
} from './scoringService';

function getRiskLevel(score: number): RiskLevel {
  if (score < 40) return 'Low';
  if (score < 70) return 'Medium';
  return 'High';
}

export async function analyzeWallet(
  address: string,
  onProgress?: (progress: AnalysisProgress) => void
): Promise<ExposureResult> {
  const report = (step: string, progress: number) => {
    onProgress?.({ step, progress });
  };

  report('Fetching SOL balance...', 10);
  const solBalance = await getSolBalance(address);

  report('Loading transaction history...', 30);
  const transactions = await getTransactionHistory(address, 100);

  report('Scanning token holdings...', 50);
  const tokenBalances = await getTokenBalances(address);

  report('Checking social identifiers...', 70);
  const socialLinks = await getSocialLinks(address);

  report('Calculating exposure scores...', 85);

  const walletAge = getWalletAge(transactions);

  const walletData: WalletData = {
    address,
    solBalance,
    transactions,
    tokenBalances,
    socialLinks,
    walletAge,
  };

  const categories = [
    calculateWalletActivityScore(walletData),
    calculateAddressLinkabilityScore(walletData),
    calculateSocialExposureScore(walletData),
    calculateBehavioralProfilingScore(walletData),
    calculateFinancialFootprintScore(walletData),
  ];

  const overallScore = calculateOverallScore(categories);

  report('Analysis complete', 100);

  return {
    address,
    overallScore,
    overallLevel: getRiskLevel(overallScore),
    categories,
    analyzedAt: new Date(),
    txCount: transactions.length,
    tokenCount: tokenBalances.length,
    solBalance,
    walletAge,
    socialLinks,
  };
}
