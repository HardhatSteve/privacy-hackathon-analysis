import type { WalletData, ExposureResult, RiskLevel } from './types.js';
import {
  getSolBalance,
  getTransactionHistory,
  getTokenBalances,
  getSocialLinks,
  getWalletAge,
  getTransactionCounterparties,
  analyzePrivacyHygiene,
  analyzeFundingSources,
  analyzeTimeOfDay,
  classifyTokens,
  analyzeTransactionVelocity,
  analyzeIncomeSources,
  analyzeNetWorth,
  analyzePnL,
  getSolscanLabel,
} from './solanaService.js';
import {
  calculateWalletActivityScore,
  calculateAddressLinkabilityScore,
  calculateSocialExposureScore,
  calculateBehavioralProfilingScore,
  calculateFinancialFootprintScore,
  calculatePrivacyHygieneScore,
  calculateOverallScore,
} from './scoringService.js';

function getRiskLevel(score: number): RiskLevel {
  if (score < 40) return 'Low';
  if (score < 70) return 'Medium';
  return 'High';
}

export async function analyzeWallet(address: string): Promise<ExposureResult> {
  // Fetch all data in parallel for better performance
  const [solBalance, transactions, tokenBalances, socialLinks, counterparties, solscanLabel] = await Promise.all([
    getSolBalance(address),
    getTransactionHistory(address, 100),
    getTokenBalances(address),
    getSocialLinks(address),
    getTransactionCounterparties(address, 50),
    getSolscanLabel(address),
  ]);

  // Calculate wallet age from transaction history
  const walletAge = await getWalletAge(transactions);

  // Analyze privacy hygiene patterns and funding sources in parallel
  const [privacyHygiene, fundingAnalysis] = await Promise.all([
    analyzePrivacyHygiene(address, transactions),
    analyzeFundingSources(address, transactions),
  ]);

  // Analyze time-of-day patterns, token classification, and velocity (synchronous, no API calls)
  const timeOfDayAnalysis = analyzeTimeOfDay(transactions);
  const tokenRiskAnalysis = classifyTokens(tokenBalances);
  const transactionVelocity = analyzeTransactionVelocity(transactions, walletAge.ageInDays);

  // Analyze income sources, net worth, and P&L in parallel
  const [incomeAnalysis, netWorth, pnlAnalysis] = await Promise.all([
    analyzeIncomeSources(address, transactions),
    analyzeNetWorth(solBalance, tokenBalances, tokenRiskAnalysis),
    analyzePnL(address, transactions, tokenBalances, tokenRiskAnalysis),
  ]);

  const walletData: WalletData = {
    address,
    solBalance,
    transactions,
    tokenBalances,
    socialLinks,
    solscanLabel,
    walletAge,
    privacyHygiene,
    fundingAnalysis,
    timeOfDayAnalysis,
    tokenRiskAnalysis,
    transactionVelocity,
    incomeAnalysis,
    netWorth,
    pnlAnalysis,
  };

  const categories = [
    calculateWalletActivityScore(walletData),
    calculateAddressLinkabilityScore(walletData),
    calculateSocialExposureScore(walletData),
    calculateBehavioralProfilingScore(walletData),
    calculateFinancialFootprintScore(walletData),
    calculatePrivacyHygieneScore(walletData),
  ];

  const overallScore = calculateOverallScore(categories);

  return {
    address,
    overallScore,
    overallLevel: getRiskLevel(overallScore),
    categories,
    analyzedAt: new Date().toISOString(),
    txCount: transactions.length,
    tokenCount: tokenBalances.length,
    solBalance,
    walletAge,
    socialLinks,
    solscanLabel,
    counterparties,
    fundingAnalysis,
    timeOfDayAnalysis,
    tokenRiskAnalysis,
    incomeAnalysis,
    netWorth,
    pnlAnalysis,
  };
}
