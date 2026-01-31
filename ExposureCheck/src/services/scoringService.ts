import type { WalletData, CategoryScore, RiskLevel } from '../types/exposure';

function getRiskLevel(score: number): RiskLevel {
  if (score < 40) return 'Low';
  if (score < 70) return 'Medium';
  return 'High';
}

// Convert exact amounts to privacy-preserving ranges
function toValueRange(solAmount: number): string {
  const estimatedUSD = solAmount * 100; // Rough estimate: 1 SOL ~ $100

  if (estimatedUSD < 10) return '<$10';
  if (estimatedUSD < 100) return '$10-$100';
  if (estimatedUSD < 500) return '$100-$500';
  if (estimatedUSD < 1000) return '$500-$1K';
  if (estimatedUSD < 5000) return '$1K-$5K';
  if (estimatedUSD < 10000) return '$5K-$10K';
  if (estimatedUSD < 50000) return '$10K-$50K';
  if (estimatedUSD < 100000) return '$50K-$100K';
  if (estimatedUSD < 500000) return '$100K-$500K';
  if (estimatedUSD < 1000000) return '$500K-$1M';
  return '$1M+';
}

function toSolRange(solAmount: number): string {
  if (solAmount < 0.1) return '<0.1 SOL';
  if (solAmount < 1) return '0.1-1 SOL';
  if (solAmount < 5) return '1-5 SOL';
  if (solAmount < 10) return '5-10 SOL';
  if (solAmount < 50) return '10-50 SOL';
  if (solAmount < 100) return '50-100 SOL';
  if (solAmount < 500) return '100-500 SOL';
  if (solAmount < 1000) return '500-1K SOL';
  return '1K+ SOL';
}

function clamp(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateWalletActivityScore(data: WalletData): CategoryScore {
  const signals: string[] = [];
  let score = 0;

  // Wallet age analysis
  if (data.walletAge.ageInDays !== null) {
    if (data.walletAge.isNew) {
      signals.push(`New wallet (${data.walletAge.ageInDays} days old)`);
      // New wallets have less exposure history
    } else if (data.walletAge.ageInDays > 365) {
      score += 15;
      signals.push(`Established wallet (${Math.floor(data.walletAge.ageInDays / 365)}+ years old)`);
    } else if (data.walletAge.ageInDays > 90) {
      score += 10;
      signals.push(`Active wallet (${data.walletAge.ageInDays} days old)`);
    }
  } else {
    signals.push('No transaction history (brand new wallet)');
  }

  const txCount = data.transactions.length;
  if (txCount > 50) {
    score += 35;
    signals.push(`High transaction volume (${txCount}+ txs)`);
  } else if (txCount > 20) {
    score += 25;
    signals.push(`Moderate transaction volume (${txCount} txs)`);
  } else if (txCount > 5) {
    score += 15;
    signals.push(`Low transaction volume (${txCount} txs)`);
  } else if (txCount > 0) {
    signals.push(`Minimal activity (${txCount} txs)`);
  }

  const tokenCount = data.tokenBalances.length;
  if (tokenCount > 10) {
    score += 30;
    signals.push(`Diverse token portfolio (${tokenCount} tokens)`);
  } else if (tokenCount > 3) {
    score += 20;
    signals.push(`Moderate token diversity (${tokenCount} tokens)`);
  } else if (tokenCount > 0) {
    score += 10;
    signals.push(`Few token holdings (${tokenCount} tokens)`);
  }

  // Check transaction frequency
  const recentTxs = data.transactions.filter(
    (tx) => tx.blockTime && Date.now() / 1000 - tx.blockTime < 7 * 24 * 60 * 60
  );
  if (recentTxs.length > 10) {
    score += 20;
    signals.push('Very active in past week');
  } else if (recentTxs.length > 3) {
    score += 10;
    signals.push('Active in past week');
  }

  return {
    name: 'Wallet Activity',
    score: clamp(score),
    level: getRiskLevel(clamp(score)),
    weight: 0.18,
    signals,
    description: 'Transaction frequency, wallet age, and token diversity create activity patterns',
  };
}

export function calculateAddressLinkabilityScore(data: WalletData): CategoryScore {
  const signals: string[] = [];
  let score = 0;

  // Analyze unique counterparties (simplified - would need parsed tx data)
  const txCount = data.transactions.length;
  const estimatedCounterparties = Math.min(txCount, Math.floor(txCount * 0.7));

  if (estimatedCounterparties > 30) {
    score += 35;
    signals.push(`Many unique interactions (~${estimatedCounterparties} addresses)`);
  } else if (estimatedCounterparties > 10) {
    score += 25;
    signals.push(`Moderate address network (~${estimatedCounterparties} addresses)`);
  } else if (estimatedCounterparties > 0) {
    score += 15;
    signals.push(`Limited address connections`);
  }

  // Funding source analysis
  const funding = data.fundingAnalysis;
  if (funding) {
    // CEX funding is highly linkable (KYC required)
    if (funding.hasCexFunding) {
      score += 30;
      signals.push('Funded from centralized exchange (KYC-linked)');
    }

    // Multiple funding sources increase linkability
    if (funding.hasMultipleFundingSources) {
      score += 15;
      signals.push(`Multiple funding sources (${funding.sources.length} addresses)`);
    }

    // Show primary funding type
    if (funding.primaryFundingType && funding.primaryFundingType !== 'wallet') {
      const typeLabels: Record<string, string> = {
        'cex': 'CEX',
        'dex': 'DEX',
        'nft': 'NFT marketplace',
        'contract': 'Smart contract',
      };
      const label = typeLabels[funding.primaryFundingType] || funding.primaryFundingType;
      signals.push(`Primary funding via ${label}`);
    }

    // Significant funding amount
    if (funding.totalFundingReceived > 10) {
      score += 10;
      signals.push(`${funding.totalFundingReceived.toFixed(2)} SOL received from tracked sources`);
    }
  }

  // Token holdings create links to other holders
  if (data.tokenBalances.length > 5) {
    score += 15;
    signals.push('Multiple token communities linked');
  } else if (data.tokenBalances.length > 0) {
    score += 5;
    signals.push('Some token community exposure');
  }

  // SOL balance indicates mainnet presence
  if (data.solBalance > 10) {
    score += 10;
    signals.push('Significant SOL balance visible');
  } else if (data.solBalance > 1) {
    score += 5;
    signals.push('Moderate SOL balance');
  }

  return {
    name: 'Address Linkability',
    score: clamp(score),
    level: getRiskLevel(clamp(score)),
    weight: 0.22,
    signals,
    description: 'How easily this wallet can be linked to other addresses',
  };
}

export function calculateSocialExposureScore(data: WalletData): CategoryScore {
  const signals: string[] = [];
  let score = 0;
  const social = data.socialLinks;

  // X/Twitter linking - highest exposure risk
  if (social.twitter) {
    score += 40;
    signals.push(`X/Twitter linked: @${social.twitter}`);
  }

  // Farcaster - high exposure (public social graph)
  if (social.farcaster) {
    score += 35;
    signals.push(`Farcaster: @${social.farcaster}`);
  }

  // Lens Protocol - high exposure (on-chain social)
  if (social.lens) {
    score += 30;
    signals.push(`Lens: ${social.lens}`);
  }

  // ENS name - cross-chain identity exposure
  if (social.ens) {
    score += 30;
    signals.push(`ENS: ${social.ens}`);
  }

  // Basename (Base chain identity)
  if (social.basename) {
    score += 25;
    signals.push(`Basename: ${social.basename}`);
  }

  // SNS domain names
  if (social.snsNames.length > 0) {
    score += 30;
    signals.push(`SNS domain: ${social.snsNames.join(', ')}`);
  }

  // AllDomains (multiple Solana TLDs)
  if (social.allDomains && social.allDomains.length > 0) {
    const uniqueDomains = social.allDomains.filter(
      d => !social.snsNames.some(sns => d.includes(sns.replace('.sol', '')))
    );
    if (uniqueDomains.length > 0) {
      score += 20;
      signals.push(`Other domains: ${uniqueDomains.slice(0, 3).join(', ')}${uniqueDomains.length > 3 ? ` (+${uniqueDomains.length - 3} more)` : ''}`);
    }
  }

  // Backpack username
  if (social.backpack) {
    score += 25;
    signals.push(`Backpack username: ${social.backpack}`);
  }

  // Discord
  if (social.discord) {
    score += 20;
    signals.push(`Discord linked: ${social.discord}`);
  }

  // Telegram
  if (social.telegram) {
    score += 20;
    signals.push(`Telegram linked: ${social.telegram}`);
  }

  // GitHub
  if (social.github) {
    score += 15;
    signals.push(`GitHub linked: ${social.github}`);
  }

  // Count total social links for summary
  const totalSocialLinks = [
    social.twitter, social.farcaster, social.lens, social.ens,
    social.basename, social.backpack, social.discord, social.telegram, social.github
  ].filter(Boolean).length + social.snsNames.length + (social.allDomains?.length || 0);

  // No social links found
  if (totalSocialLinks === 0) {
    signals.push('No social accounts linked - low identity exposure');
  } else if (totalSocialLinks >= 5) {
    score += 15;
    signals.push(`High social presence: ${totalSocialLinks} linked accounts`);
  }

  // High-value wallets often get indexed by explorers
  if (data.solBalance > 100) {
    score += 10;
    signals.push('High-value wallet likely indexed');
  }

  // Many tokens suggest DeFi/NFT activity often shared socially
  if (data.tokenBalances.length > 15) {
    score += 5;
    signals.push('Extensive token activity may be tracked');
  }

  return {
    name: 'Social Exposure',
    score: clamp(score),
    level: getRiskLevel(clamp(score)),
    weight: 0.15,
    signals,
    description: 'Social media links, usernames, and public identity exposure',
  };
}

export function calculateBehavioralProfilingScore(data: WalletData): CategoryScore {
  const signals: string[] = [];
  let score = 0;

  // Use detailed time-of-day analysis if available
  const timeAnalysis = data.timeOfDayAnalysis;
  if (timeAnalysis) {
    // Activity concentration scoring
    if (timeAnalysis.activityConcentration === 'high') {
      score += 35;
      signals.push('Highly concentrated activity pattern');
    } else if (timeAnalysis.activityConcentration === 'medium') {
      score += 20;
      signals.push('Moderately concentrated activity pattern');
    } else {
      score += 10;
      signals.push('Varied transaction timing');
    }

    // Show specific active hours
    if (timeAnalysis.activeHourRange && timeAnalysis.activeHourRange !== 'Insufficient data') {
      signals.push(`Peak activity: ${timeAnalysis.activeHourRange}`);
    }

    // Show inferred timezone
    if (timeAnalysis.inferredTimezone) {
      score += 15;
      signals.push(`Likely timezone: ${timeAnalysis.inferredTimezone}`);
    }
  } else {
    // Fallback to basic analysis
    const txWithTime = data.transactions.filter((tx) => tx.blockTime !== null);
    if (txWithTime.length > 10) {
      const hours = txWithTime.map((tx) => new Date(tx.blockTime! * 1000).getUTCHours());
      const uniqueHours = new Set(hours).size;

      if (uniqueHours < 8) {
        score += 35;
        signals.push('Consistent timezone pattern detected');
      } else if (uniqueHours < 16) {
        score += 20;
        signals.push('Some time-of-day patterns visible');
      } else {
        score += 10;
        signals.push('Varied transaction timing');
      }
    }
  }

  // Protocol diversity
  const tokenMints = new Set(data.tokenBalances.map((t) => t.mint));
  if (tokenMints.size > 10) {
    score += 30;
    signals.push('Diverse protocol usage fingerprint');
  } else if (tokenMints.size > 3) {
    score += 15;
    signals.push('Moderate protocol interaction');
  }

  // Transaction regularity
  if (data.transactions.length > 20) {
    const intervals: number[] = [];
    for (let i = 1; i < Math.min(data.transactions.length, 20); i++) {
      const t1 = data.transactions[i - 1].blockTime;
      const t2 = data.transactions[i].blockTime;
      if (t1 && t2) {
        intervals.push(Math.abs(t1 - t2));
      }
    }
    if (intervals.length > 5) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev < avgInterval * 0.5) {
        score += 15;
        signals.push('Regular transaction interval pattern');
      }
    }
  }

  // Transaction velocity analysis
  const velocity = data.transactionVelocity;
  if (velocity) {
    // Activity level
    if (velocity.recentActivityLevel === 'high') {
      score += 15;
      signals.push(`High recent activity (${velocity.avgTxPerDay.toFixed(1)} tx/day avg)`);
    } else if (velocity.recentActivityLevel === 'medium') {
      score += 10;
      signals.push(`Moderate activity (${velocity.avgTxPerDay.toFixed(1)} tx/day avg)`);
    } else if (velocity.recentActivityLevel === 'dormant') {
      signals.push('Dormant wallet (no recent activity)');
    }

    // Activity trend
    if (velocity.activityTrend === 'increasing') {
      score += 10;
      signals.push('Increasing activity trend');
    } else if (velocity.activityTrend === 'decreasing') {
      signals.push('Decreasing activity trend');
    }

    // Bursty behavior is more fingerprintable
    if (velocity.burstyBehavior) {
      score += 15;
      signals.push('Bursty transaction pattern (clustered activity)');
    }

    // Peak activity period
    if (velocity.peakActivityPeriod) {
      signals.push(`Peak: ${velocity.peakActivityPeriod}`);
    }

    // Long gaps can indicate specific usage patterns
    if (velocity.longestGapDays && velocity.longestGapDays > 30) {
      signals.push(`Longest inactivity: ${velocity.longestGapDays} days`);
    }
  }

  return {
    name: 'Behavioral Profiling',
    score: clamp(score),
    level: getRiskLevel(clamp(score)),
    weight: 0.17,
    signals,
    description: 'Timing patterns and protocol usage that create behavioral fingerprints',
  };
}

export function calculateFinancialFootprintScore(data: WalletData): CategoryScore {
  const signals: string[] = [];
  let score = 0;

  // Use ranges instead of exact values for privacy
  const solRange = toSolRange(data.solBalance);
  const valueRange = toValueRange(data.solBalance);

  if (data.solBalance > 100) {
    score += 35;
    signals.push(`Large holdings (${solRange}, est. ${valueRange})`);
  } else if (data.solBalance > 10) {
    score += 20;
    signals.push(`Moderate holdings (${solRange}, est. ${valueRange})`);
  } else if (data.solBalance > 1) {
    score += 10;
    signals.push(`Small holdings (${solRange}, est. ${valueRange})`);
  } else {
    signals.push(`Minimal balance (${solRange})`);
  }

  // Token risk analysis
  const tokenRisk = data.tokenRiskAnalysis;
  if (tokenRisk) {
    // Show risk profile
    const profileLabels: Record<string, string> = {
      conservative: 'Conservative (mostly stablecoins)',
      balanced: 'Balanced portfolio',
      aggressive: 'Aggressive (volatile assets)',
      speculative: 'Speculative (memecoins detected)',
    };
    signals.push(`Token profile: ${profileLabels[tokenRisk.riskProfile]}`);

    // Score based on token composition
    if (tokenRisk.stablecoinCount > 0) {
      score += 10;
      signals.push(`${tokenRisk.stablecoinCount} stablecoin(s) held`);
    }

    if (tokenRisk.bluechipCount > 0) {
      score += 15;
      signals.push(`${tokenRisk.bluechipCount} blue-chip token(s)`);
    }

    if (tokenRisk.memecoinCount > 0) {
      score += 20;
      signals.push(`${tokenRisk.memecoinCount} potential memecoin(s) detected`);
    }

    if (tokenRisk.volatileCount > 5) {
      score += 15;
      signals.push('Diverse volatile token exposure');
    }
  } else {
    // Fallback to basic token analysis
    const totalTokens = data.tokenBalances.reduce((sum, t) => sum + t.uiAmount, 0);
    if (totalTokens > 10000) {
      score += 25;
      signals.push('Large token positions visible');
    } else if (totalTokens > 100) {
      score += 15;
      signals.push('Moderate token positions');
    }
  }

  // Transaction volume indicates financial activity
  const txCount = data.transactions.length;
  if (txCount > 50) {
    score += 20;
    signals.push('High transaction volume trackable');
  } else if (txCount > 20) {
    score += 10;
    signals.push('Moderate financial activity');
  }

  return {
    name: 'Financial Footprint',
    score: clamp(score),
    level: getRiskLevel(clamp(score)),
    weight: 0.18,
    signals,
    description: 'Value held and transaction volumes reveal financial profile',
  };
}

export function calculatePrivacyHygieneScore(data: WalletData): CategoryScore {
  const signals: string[] = [];
  let score = 0;

  const privacy = data.privacyHygiene;

  // No privacy data available - neutral score
  if (!privacy) {
    signals.push('Privacy behavior analysis pending');
    return {
      name: 'Privacy Hygiene',
      score: 30,
      level: 'Low',
      weight: 0.10,
      signals,
      description: 'Privacy tool usage and transaction patterns affecting anonymity',
    };
  }

  // Privacy protocol interactions detected
  if (privacy.hasPrivacyAttempts) {
    if (privacy.immediateReuseAfterPrivacy) {
      score += 45;
      signals.push('Privacy attempt detected but wallet reused immediately');
      signals.push('Immediate reuse negates privacy benefits');
    } else {
      score += 20;
      signals.push(`Privacy protocol interactions: ${privacy.privacyProgramInteractions}`);
      signals.push('Some privacy awareness detected');
    }
  }

  // Analyze time delays
  if (privacy.avgTimeDelayAfterReceive !== null) {
    if (privacy.avgTimeDelayAfterReceive < 60) {
      score += 35;
      signals.push('Funds moved within 1 minute of receiving');
    } else if (privacy.avgTimeDelayAfterReceive < 300) {
      score += 25;
      signals.push('Funds typically moved within 5 minutes');
    } else if (privacy.avgTimeDelayAfterReceive < 3600) {
      score += 15;
      signals.push('Some delay between receiving and sending');
    } else {
      score += 5;
      signals.push('Good timing separation between transactions');
    }
  }

  // Consistent amounts are bad for privacy
  if (privacy.hasConsistentAmounts) {
    score += 30;
    signals.push('Repeated transaction amounts create linkability');
  }

  // Add any additional risk signals from analysis
  for (const signal of privacy.riskSignals) {
    if (!signals.includes(signal)) {
      signals.push(signal);
    }
  }

  // No privacy issues detected
  if (signals.length === 0 || score === 0) {
    signals.push('No obvious privacy concerns detected');
    score = 15;
  }

  return {
    name: 'Privacy Hygiene',
    score: clamp(score),
    level: getRiskLevel(clamp(score)),
    weight: 0.10,
    signals,
    description: 'Privacy tool usage and transaction patterns affecting anonymity',
  };
}

export function calculateOverallScore(categories: CategoryScore[]): number {
  const weightedSum = categories.reduce(
    (sum, cat) => sum + cat.score * cat.weight,
    0
  );
  return Math.round(clamp(weightedSum));
}
