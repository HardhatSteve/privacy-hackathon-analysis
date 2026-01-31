import type { ScanContext, PrivacySignal, Evidence } from '../types/index.js';

/**
 * Detect Associated Token Account (ATA) linkage patterns
 *
 * When a wallet creates a token account for another wallet, the creator
 * is permanently recorded on-chain as the funding account. If one wallet
 * creates ATAs for multiple other wallets, those wallets are provably linked
 * to the same funding source.
 */
export function detectATALinkage(context: ScanContext): PrivacySignal[] {
  const signals: PrivacySignal[] = [];

  if (!context.tokenAccountEvents || context.tokenAccountEvents.length === 0) {
    return signals;
  }

  const createEvents = context.tokenAccountEvents.filter(e => e.type === 'create');

  if (createEvents.length < 2) {
    return signals;
  }

  // Signal 1: One wallet creates token accounts for multiple different owners
  // Cross-reference creation events with transaction fee payers
  const creatorToOwners = new Map<string, Set<string>>();
  const creatorToSignatures = new Map<string, string[]>();

  for (const event of createEvents) {
    const tx = context.transactions?.find(t => t.signature === event.signature);
    if (!tx) continue;

    const creator = tx.feePayer;
    const owner = event.owner;

    // Skip self-creation (normal behavior)
    if (creator === owner) continue;

    if (!creatorToOwners.has(creator)) {
      creatorToOwners.set(creator, new Set());
      creatorToSignatures.set(creator, []);
    }
    creatorToOwners.get(creator)!.add(owner);
    creatorToSignatures.get(creator)!.push(tx.signature);
  }

  const multiOwnerCreators = Array.from(creatorToOwners.entries())
    .filter(([_, owners]) => owners.size >= 2)
    .sort((a, b) => b[1].size - a[1].size);

  if (multiOwnerCreators.length > 0) {
    const evidence: Evidence[] = multiOwnerCreators.slice(0, 3).map(([creator, owners]) => {
      const label = context.labels.get(creator);
      return {
        description: `${creator.slice(0, 8)}...${label ? ` (${label.name})` : ''} created token accounts for ${owners.size} different owner(s)`,
        severity: 'HIGH' as const,
        reference: creatorToSignatures.get(creator)?.[0]
          ? `https://solscan.io/tx/${creatorToSignatures.get(creator)![0]}`
          : undefined,
      };
    });

    const topCreatorOwnerCount = multiOwnerCreators[0][1].size;

    signals.push({
      id: 'ata-creator-linkage',
      name: 'Token Account Creator Links Multiple Wallets',
      severity: 'HIGH',
      category: 'linkability',
      confidence: 0.85,
      reason: `One wallet created token accounts for ${topCreatorOwnerCount} different owners. This means someone watching the blockchain can see that all these wallets are connected to the same funding source, even if they never send tokens to each other directly.`,
      impact: 'All wallets whose token accounts were created by the same funder are permanently linked together on-chain. This connection cannot be removed.',
      mitigation: 'Have each wallet create its own token accounts using its own funds. Never use a central wallet to set up accounts for multiple other wallets.',
      evidence,
    });
  }

  // Signal 2: Batch token account creation (multiple ATAs created in short time window)
  if (createEvents.length >= 3) {
    const sortedCreates = createEvents
      .filter(e => e.blockTime !== null)
      .sort((a, b) => (a.blockTime ?? 0) - (b.blockTime ?? 0));

    if (sortedCreates.length >= 3) {
      const TEN_MINUTES = 600;
      let maxBurst = 0;

      for (let i = 0; i < sortedCreates.length; i++) {
        let burstCount = 1;
        for (let j = i + 1; j < sortedCreates.length; j++) {
          if ((sortedCreates[j].blockTime! - sortedCreates[i].blockTime!) <= TEN_MINUTES) {
            burstCount++;
          } else {
            break;
          }
        }
        maxBurst = Math.max(maxBurst, burstCount);
      }

      if (maxBurst >= 3) {
        signals.push({
          id: 'ata-funding-pattern',
          name: 'Batch Token Account Creation',
          severity: 'MEDIUM',
          category: 'behavioral',
          confidence: 0.7,
          reason: `${maxBurst} token accounts were created within a 10-minute window. This batch setup pattern suggests automated wallet preparation, which makes it easier to identify these wallets as belonging to the same operator.`,
          impact: 'Batch creation of token accounts reveals coordinated setup, linking all involved wallets together.',
          mitigation: 'Space out token account creation over time. Create accounts only when needed rather than in advance.',
          evidence: [{
            description: `${maxBurst} token accounts created within 10 minutes`,
            severity: 'MEDIUM',
          }],
        });
      }
    }
  }

  return signals;
}
