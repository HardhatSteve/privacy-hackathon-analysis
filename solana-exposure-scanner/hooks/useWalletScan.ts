import { useQuery } from '@tanstack/react-query';
import { ExposureData } from '../types/api';

const fetchWalletExposure = async (address: string): Promise<ExposureData> => {
  const response = await fetch(`/api/scan/${address}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to analyze wallet' }));
    throw new Error(error.message || `HTTP error: ${response.status}`);
  }

  const data = await response.json();

  // Ensure the data structure matches what the frontend expects
  return {
    exposureScore: data.exposureScore ?? 0,
    scoreBreakdown: data.scoreBreakdown ?? {
      identity: 0,
      kycLinks: 0,
      financial: 0,
      clustering: 0,
      activity: 0,
    },
    netWorthUsd: data.netWorthUsd ?? 0,
    realizedLossesUsd: data.realizedLossesUsd ?? 0,
    tradeCount: data.tradeCount ?? 0,
    memecoinTrades: data.memecoinTrades ?? 0,
    clustering: data.clustering ?? {
      interactedCount: 0,
      topAddresses: [],
    },
    risks: data.risks ?? ['No risk data available'],
    snsDomains: data.snsDomains ?? [],
    twitterHandles: data.twitterHandles ?? [],
    links: data.links ?? {
      xSearch: `https://x.com/search?q=${address}`,
      snsSearch: null,
      twitterProfile: null,
      arkham: `https://platform.arkhamintelligence.com/explorer/address/${address}`,
      solscan: `https://solscan.io/account/${address}`,
    },
    recentTxSummary: data.recentTxSummary ?? [],
    // New enhanced features
    defiPositions: data.defiPositions ?? [],
    topLosses: data.topLosses ?? [],
    relatedAddresses: data.relatedAddresses ?? [],
  };
};

export const useWalletScan = (address: string) => {
  return useQuery({
    queryKey: ['walletScan', address],
    queryFn: () => fetchWalletExposure(address),
    enabled: !!address && address.length >= 32,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    retry: 1,
  });
};