import type { ScanContext, PrivacySignal, Evidence } from '../types/index.js';

/**
 * Detect fee payer reuse - CRITICAL privacy leak on Solana
 * 
 * On Solana, the fee payer is the most powerful linkage vector.
 * If one wallet consistently pays fees for multiple "unrelated" accounts,
 * they are trivially linked.
 * 
 * This is different from Ethereum where gas payer isn't as exposed.
 */
export function detectFeePayerReuse(context: ScanContext): PrivacySignal[] {
  const signals: PrivacySignal[] = [];

  // Only relevant for wallet scans (not single transactions)
  if (context.targetType === 'transaction') {
    return signals;
  }

  // Check if Solana-specific data is available
  if (!context.feePayers || !context.transactions || context.transactions.length === 0) {
    return signals;
  }

  const feePayers = context.feePayers;
  const target = context.target;

  // Case 1: Target wallet is the fee payer for all transactions
  // This is normal and expected
  const targetIsFeePayer = feePayers.has(target);
  const onlyTargetPays = feePayers.size === 1 && targetIsFeePayer;

  if (onlyTargetPays) {
    // This is actually good for privacy - no external linkage
    return signals;
  }

  // Case 2: Multiple fee payers (target and others)
  // This suggests the target wallet is being funded/managed by others
  if (feePayers.size > 1 && targetIsFeePayer) {
    const externalFeePayers = Array.from(feePayers).filter(fp => fp !== target);
    
    // Count how many transactions each external fee payer paid for
    const feePayerCounts = new Map<string, number>();
    for (const tx of context.transactions) {
      if (tx.feePayer !== target) {
        feePayerCounts.set(tx.feePayer, (feePayerCounts.get(tx.feePayer) || 0) + 1);
      }
    }

    const evidence: Evidence[] = [];
    for (const [feePayer, count] of feePayerCounts) {
      evidence.push({
        description: `${feePayer} paid fees for ${count} transaction(s)`,
        severity: count > 1 ? 'HIGH' : 'MEDIUM',
        reference: undefined,
      });
    }

    // Check if any fee payer is a known entity
    const knownFeePayerLabel = externalFeePayers.find(fp => context.labels.has(fp));
    const knownLabel = knownFeePayerLabel ? context.labels.get(knownFeePayerLabel) : null;

    signals.push({
      id: 'fee-payer-external',
      name: 'External Fee Payer Detected',
      severity: knownLabel ? 'HIGH' : 'MEDIUM',
      category: 'linkability',
      reason: `${externalFeePayers.length} other wallet(s) paid the transaction fees for this address${knownLabel ? `, including ${knownLabel.name}` : ''}. This creates a visible on-chain connection between your wallet and the fee payer(s) that anyone can see.`,
      impact: 'Your wallet is publicly connected to whoever paid the fees. If anyone identifies the fee payer, they automatically identify you too.',
      mitigation: 'Always pay your own transaction fees. If someone else pays your fees, that connection is permanent and public.',
      evidence,
    });
  }

  // Case 3: Target never pays fees (most critical)
  // All transactions are paid by others - this is a "managed" or "funded" account
  if (!targetIsFeePayer && feePayers.size > 0) {
    const allFeePayers = Array.from(feePayers);
    const feePayerCounts = new Map<string, number>();
    
    for (const tx of context.transactions) {
      feePayerCounts.set(tx.feePayer, (feePayerCounts.get(tx.feePayer) || 0) + 1);
    }

    const evidence: Evidence[] = [];
    for (const [feePayer, count] of feePayerCounts) {
      const label = context.labels.get(feePayer);
      evidence.push({
        description: `${feePayer}${label ? ` (${label.name})` : ''} paid fees for ${count} transaction(s)`,
        severity: 'HIGH',
        reference: undefined,
      });
    }

    // If the same fee payer pays for multiple transactions, this is VERY HIGH severity
    const maxCount = Math.max(...Array.from(feePayerCounts.values()));
    const repeatedFeePayer = maxCount > 1;

    signals.push({
      id: 'fee-payer-never-self',
      name: 'Never Self-Pays Transaction Fees',
      severity: repeatedFeePayer ? 'HIGH' : 'HIGH', // Always HIGH - this is critical
      category: 'linkability',
      reason: `This wallet has never paid its own transaction fees. All ${context.transactionCount} transaction(s) were paid for by ${allFeePayers.length} other wallet(s). This makes it obvious that someone else controls or funds this wallet.`,
      impact: 'This is the strongest privacy leak on Solana. Everyone can see that this wallet is controlled by whoever pays its fees. The connection is permanent and cannot be undone.',
      mitigation: 'Fund this wallet with SOL and pay your own fees. If that is not possible, use a fresh wallet for each operation so no single fee payer is tied to all your activity.',
      evidence,
    });
  }

  // Case 4: Same fee payer used across multiple distinct addresses (program/wallet scan)
  // This is detected at a higher level, but we can flag if we see repeated patterns
  if (context.targetType === 'program') {
    // For program scans, repeated fee payers suggest bot operators or controlled wallets
    const feePayerCounts = new Map<string, Set<string>>();
    
    for (const tx of context.transactions) {
      if (!feePayerCounts.has(tx.feePayer)) {
        feePayerCounts.set(tx.feePayer, new Set());
      }
      // Track which signers this fee payer is associated with
      for (const signer of tx.signers) {
        feePayerCounts.get(tx.feePayer)!.add(signer);
      }
    }

    // Find fee payers associated with multiple signers
    const multiFeePayerOperators: Array<{ feePayer: string; signerCount: number; txCount: number }> = [];
    for (const [feePayer, signers] of feePayerCounts) {
      if (signers.size > 1) {
        const txCount = context.transactions.filter(tx => tx.feePayer === feePayer).length;
        multiFeePayerOperators.push({
          feePayer,
          signerCount: signers.size,
          txCount,
        });
      }
    }

    if (multiFeePayerOperators.length > 0) {
      const evidence: Evidence[] = multiFeePayerOperators.map(op => ({
        description: `${op.feePayer} paid fees for ${op.txCount} transaction(s) involving ${op.signerCount} different signer(s)`,
        severity: 'HIGH',
        reference: undefined,
      }));

      signals.push({
        id: 'fee-payer-multi-signer',
        name: 'Fee Payer Controls Multiple Signers',
        severity: 'HIGH',
        category: 'linkability',
        reason: `${multiFeePayerOperators.length} fee payer(s) are paying fees for transactions signed by multiple different wallets. This reveals that one entity controls several wallets.`,
        impact: 'All wallets funded by the same fee payer are publicly connected. Anyone can see they belong to the same operator.',
        mitigation: 'Use a separate fee payer for each wallet. If managing multiple accounts, never share a fee payer between them.',
        evidence,
      });
    }
  }

  return signals;
}
