import type { ScanContext, PrivacySignal, Evidence } from '../types/index.js';

/**
 * Detect signer set overlap - strong linkage vector on Solana
 * 
 * Solana transactions can have multiple signers. If the same signer
 * appears across many transactions, or if the same set of signers is reused,
 * this creates strong linkage.
 * 
 * This is stronger than amount reuse and more reliable than timing patterns.
 */
export function detectSignerOverlap(context: ScanContext): PrivacySignal[] {
  const signals: PrivacySignal[] = [];

  // Need at least a few transactions to detect patterns
  if (context.transactionCount < 2) {
    return signals;
  }

  // Check if Solana-specific data is available
  if (!context.transactions || context.transactions.length === 0) {
    return signals;
  }

  // Build signer frequency map
  const signerFrequency = new Map<string, number>();
  const signerTransactions = new Map<string, string[]>(); // signer -> signature[]
  
  for (const tx of context.transactions) {
    for (const signer of tx.signers) {
      signerFrequency.set(signer, (signerFrequency.get(signer) || 0) + 1);
      
      if (!signerTransactions.has(signer)) {
        signerTransactions.set(signer, []);
      }
      signerTransactions.get(signer)!.push(tx.signature);
    }
  }

  // Case 1: Same signer appears in most/all transactions (excluding target)
  const target = context.target;
  const frequentSigners = Array.from(signerFrequency.entries())
    .filter(([signer]) => signer !== target)
    .filter(([_, count]) => count >= Math.min(3, Math.ceil(context.transactionCount * 0.3)))
    .sort((a, b) => b[1] - a[1]);

  if (frequentSigners.length > 0) {
    const evidence: Evidence[] = frequentSigners.map(([signer, count]) => {
      const label = context.labels.get(signer);
      return {
        description: `${signer}${label ? ` (${label.name})` : ''} signed ${count}/${context.transactionCount} transactions`,
        severity: count > context.transactionCount * 0.7 ? 'HIGH' : 'MEDIUM',
        reference: undefined,
      };
    });

    const topSignerCount = frequentSigners[0][1];
    const severity = topSignerCount > context.transactionCount * 0.7 ? 'HIGH' : 'MEDIUM';

    signals.push({
      id: 'signer-repeated',
      name: 'Repeated Signer Across Transactions',
      severity,
      category: 'linkability',
      reason: `${frequentSigners.length} address(es) keep showing up as signers on this wallet's transactions. The most frequent one signed ${topSignerCount} out of ${context.transactionCount} transactions. This proves these wallets are connected.`,
      impact: 'When the same address signs multiple transactions, anyone can see those transactions are related. This is cryptographic proof of a connection.',
      mitigation: 'Use separate signing keys for unrelated activities. If two wallets should not be linked, never have them sign each other\'s transactions.',
      evidence,
    });
  }

  // Case 2: Multi-signature patterns (same set of signers)
  // Build signature sets
  const signerSets = new Map<string, number>(); // JSON stringified set -> count
  const signerSetExamples = new Map<string, string>(); // JSON stringified set -> example signature
  
  for (const tx of context.transactions) {
    // Sort signers for consistent hashing
    const sortedSigners = [...tx.signers].sort();
    const setKey = JSON.stringify(sortedSigners);
    signerSets.set(setKey, (signerSets.get(setKey) || 0) + 1);
    
    if (!signerSetExamples.has(setKey)) {
      signerSetExamples.set(setKey, tx.signature);
    }
  }

  // Find repeated signer sets (multi-sig patterns)
  const repeatedSets = Array.from(signerSets.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  if (repeatedSets.length > 0) {
    const evidence: Evidence[] = repeatedSets.map(([setKey, count]) => {
      const signers: string[] = JSON.parse(setKey);
      const exampleSig = signerSetExamples.get(setKey)!;
      return {
        description: `${count} transactions with identical signer set: [${signers.map(s => s.slice(0, 8)).join(', ')}...]`,
        severity: count > 2 ? 'MEDIUM' : 'LOW',
        reference: `https://solscan.io/tx/${exampleSig}`,
      };
    });

    signals.push({
      id: 'signer-set-reuse',
      name: 'Repeated Multi-Signature Pattern',
      severity: 'MEDIUM',
      category: 'linkability',
      reason: `The same group of signers is used together in ${repeatedSets.length} different pattern(s). This combination acts like a unique signature that identifies your transactions.`,
      impact: 'A repeated group of signers is easy to spot on-chain. Anyone looking can tell these transactions came from the same group of people or wallets.',
      mitigation: 'Rotate which keys sign together. Avoid using the exact same set of signers every time if you want transactions to be unlinkable.',
      evidence,
    });
  }

  // Case 3: Authority overlap (one signer signs for many different "primary" accounts)
  // This detects if a single signer is acting as an authority for multiple accounts
  if (context.targetType === 'program' || context.transactionCount > 10) {
    // Build a map of: signer -> set of other signers they've co-signed with
    const signerCoSigners = new Map<string, Set<string>>();
    
    for (const tx of context.transactions) {
      for (const signer of tx.signers) {
        if (!signerCoSigners.has(signer)) {
          signerCoSigners.set(signer, new Set());
        }
        for (const otherSigner of tx.signers) {
          if (otherSigner !== signer) {
            signerCoSigners.get(signer)!.add(otherSigner);
          }
        }
      }
    }

    // Find signers that co-sign with many different addresses
    const authorityCandidates = Array.from(signerCoSigners.entries())
      .filter(([_, coSigners]) => coSigners.size >= 3)
      .sort((a, b) => b[1].size - a[1].size);

    if (authorityCandidates.length > 0) {
      const evidence: Evidence[] = authorityCandidates.slice(0, 3).map(([signer, coSigners]) => {
        const label = context.labels.get(signer);
        const txCount = signerFrequency.get(signer) || 0;
        return {
          description: `${signer}${label ? ` (${label.name})` : ''} co-signed with ${coSigners.size} different addresses across ${txCount} transactions`,
          severity: 'HIGH',
          reference: undefined,
        };
      });

      signals.push({
        id: 'signer-authority-hub',
        name: 'Authority Signer Detected',
        severity: 'HIGH',
        category: 'linkability',
        reason: `${authorityCandidates.length} address(es) co-sign transactions with many different wallets, acting as a central authority. This reveals that one entity controls multiple wallets.`,
        impact: 'A central signer connects all the wallets it signs for. Anyone can follow this trail to discover the full set of wallets under one operator.',
        mitigation: 'Use different authority keys for different groups of wallets. Avoid having one master key that signs for everything.',
        evidence,
      });
    }
  }

  return signals;
}
