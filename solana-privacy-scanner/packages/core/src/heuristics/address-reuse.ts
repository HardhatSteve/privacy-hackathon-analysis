import type { ScanContext, PrivacySignal, Evidence } from '../types/index.js';

/**
 * Detect address reuse across different contexts
 * 
 * Using the same wallet for multiple distinct activities
 * (DeFi, NFTs, gaming, DAO, etc.) links all those activities
 * together, creating a comprehensive profile.
 */
export function detectAddressReuse(context: ScanContext): PrivacySignal[] {
  const signals: PrivacySignal[] = [];

  // Only relevant for wallet scans
  if (context.targetType !== 'wallet' || context.transactionCount < 5) {
    return signals;
  }

  // Categorize activity types based on programs and interactions
  const activityTypes = new Set<string>();
  const activityDetails = new Map<string, { count: number; programs: Set<string> }>();

  // Known program categories
  const DEFI_PROGRAMS = new Set([
    'JUP', 'Raydium', 'Orca', 'Marinade', 'Lido', 'Lifinity', 'Serum',
    // Add more as needed
  ]);

  const NFT_PROGRAMS = new Set([
    'Magic Eden', 'Tensor', 'OpenSea', 'Metaplex', 
  ]);

  const GAMING_PROGRAMS = new Set([
    'Star Atlas', 'Genopets', 'Aurory',
  ]);

  const DAO_PROGRAMS = new Set([
    'Realms', 'Squads', 'Tribeca',
  ]);

  // Analyze program interactions
  for (const inst of context.instructions) {
    const label = context.labels.get(inst.programId);
    const programName = label?.name || '';

    // Check program categories
    if (DEFI_PROGRAMS.has(programName) || /swap|pool|stake|lend|borrow/i.test(programName)) {
      activityTypes.add('DeFi');
      if (!activityDetails.has('DeFi')) {
        activityDetails.set('DeFi', { count: 0, programs: new Set() });
      }
      const details = activityDetails.get('DeFi')!;
      details.count++;
      details.programs.add(programName || inst.programId.slice(0, 8));
    }

    if (NFT_PROGRAMS.has(programName) || /nft|marketplace|mint/i.test(programName)) {
      activityTypes.add('NFT');
      if (!activityDetails.has('NFT')) {
        activityDetails.set('NFT', { count: 0, programs: new Set() });
      }
      const details = activityDetails.get('NFT')!;
      details.count++;
      details.programs.add(programName || inst.programId.slice(0, 8));
    }

    if (GAMING_PROGRAMS.has(programName) || /game|play/i.test(programName)) {
      activityTypes.add('Gaming');
      if (!activityDetails.has('Gaming')) {
        activityDetails.set('Gaming', { count: 0, programs: new Set() });
      }
      const details = activityDetails.get('Gaming')!;
      details.count++;
      details.programs.add(programName || inst.programId.slice(0, 8));
    }

    if (DAO_PROGRAMS.has(programName) || /dao|governance|vote/i.test(programName)) {
      activityTypes.add('DAO');
      if (!activityDetails.has('DAO')) {
        activityDetails.set('DAO', { count: 0, programs: new Set() });
      }
      const details = activityDetails.get('DAO')!;
      details.count++;
      details.programs.add(programName || inst.programId.slice(0, 8));
    }
  }

  // Check for CEX interactions
  const hasExchangeInteraction = Array.from(context.labels.values())
    .some(label => label.type === 'exchange');
  
  if (hasExchangeInteraction) {
    activityTypes.add('Exchange');
    activityDetails.set('Exchange', { 
      count: context.transfers.filter(t => 
        context.labels.has(t.from) || context.labels.has(t.to)
      ).length,
      programs: new Set(['CEX'])
    });
  }

  // Check for simple transfers (no program interaction)
  const simpleTransfers = context.transfers.filter(t => {
    const tx = context.transactions?.find(tx => tx.signature === t.signature);
    return tx && tx.programs && tx.programs.length <= 2; // Only system + token programs
  });

  if (simpleTransfers.length >= 3) {
    activityTypes.add('P2P Transfers');
    activityDetails.set('P2P Transfers', {
      count: simpleTransfers.length,
      programs: new Set(['Direct'])
    });
  }

  // Evaluate diversity
  const diversityCount = activityTypes.size;

  if (diversityCount >= 4) {
    const evidence: Evidence[] = Array.from(activityDetails.entries()).map(([type, details]) => ({
      description: `${type}: ${details.count} transaction(s) across ${details.programs.size} program(s)`,
      severity: 'HIGH',
      reference: undefined,
    }));

    signals.push({
      id: 'address-high-diversity',
      name: 'High Activity Diversity on Single Address',
      severity: 'HIGH',
      confidence: 0.85,
      category: 'linkability',
      reason: `This wallet is used for ${diversityCount} different types of activity: ${Array.from(activityTypes).join(', ')}. Anyone looking at this wallet can see everything you do across all these categories.`,
      impact: 'Using one wallet for many different activities lets anyone build a complete picture of your on-chain behavior.',
      mitigation: 'Use separate wallets for different purposes — one for DeFi, one for NFTs, one for DAO voting, etc. This way, no single wallet reveals everything you do.',
      evidence,
    });
  } else if (diversityCount === 3) {
    const evidence: Evidence[] = Array.from(activityDetails.entries()).map(([type, details]) => ({
      description: `${type}: ${details.count} transaction(s)`,
      severity: 'MEDIUM',
      reference: undefined,
    }));

    signals.push({
      id: 'address-moderate-diversity',
      name: 'Moderate Activity Diversity on Single Address',
      severity: 'MEDIUM',
      confidence: 0.7,
      category: 'linkability',
      reason: `This wallet is used for ${diversityCount} activity types: ${Array.from(activityTypes).join(', ')}. This connects activities that could otherwise be kept separate.`,
      impact: 'Anyone watching this wallet can see multiple types of activity linked to the same address.',
      mitigation: 'Consider using separate wallets for different types of activity to keep them from being connected.',
      evidence,
    });
  }

  // Check for long-term single address usage
  if (context.timeRange.earliest && context.timeRange.latest) {
    const timeSpanDays = (context.timeRange.latest - context.timeRange.earliest) / (60 * 60 * 24);
    
    if (timeSpanDays > 180 && context.transactionCount > 50) {
      signals.push({
        id: 'address-long-term-usage',
        name: 'Long-Term Single Address Usage',
        severity: 'MEDIUM',
        confidence: 0.75,
        category: 'behavioral',
        reason: `This wallet has been used for ${Math.round(timeSpanDays)} days with ${context.transactionCount} transactions. The longer you use one wallet, the more information about you it reveals.`,
        impact: 'Months of transaction history on one wallet gives anyone a detailed picture of your activity over time.',
        mitigation: 'Periodically move to a new wallet to limit how much history is visible in one place.',
        evidence: [{
          description: `${context.transactionCount} transactions over ${Math.round(timeSpanDays)} days`,
          severity: 'MEDIUM',
          reference: undefined,
        }],
      });
    }
  }

  return signals;
}
