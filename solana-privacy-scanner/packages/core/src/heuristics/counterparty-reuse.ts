import type { ScanContext, PrivacySignal, Evidence } from '../types/index.js';

/**
 * Detect counterparty reuse - Solana-aware version
 * 
 * On Solana, most interactions are via programs, not direct transfers.
 * The "real counterparty" is often:
 * - Program-Derived Address (PDA)
 * - Vault account
 * - Pool account
 * 
 * This heuristic clusters by program ID and PDA address, not just raw transfers.
 */
export function detectCounterpartyReuse(context: ScanContext): PrivacySignal[] {
  const signals: PrivacySignal[] = [];

  // Only applicable to wallet scans with multiple transactions
  if (context.targetType !== 'wallet' || context.transactionCount < 2) {
    return signals;
  }

  // Case 1: Traditional transfer counterparty reuse
  if (context.transfers.length > 0) {
    const interactionCounts = new Map<string, number>();
    
    for (const transfer of context.transfers) {
      const counterparty = transfer.from === context.target ? transfer.to : transfer.from;
      if (counterparty === context.target) continue;
      
      interactionCounts.set(counterparty, (interactionCounts.get(counterparty) || 0) + 1);
    }

    // Find counterparties with multiple interactions
    const reusedCounterparties = Array.from(interactionCounts.entries())
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1]);

    if (reusedCounterparties.length > 0) {
      // Calculate severity based on concentration
      const totalInteractions = context.transfers.length;
      const topCounterpartyInteractions = reusedCounterparties[0][1];
      const concentration = topCounterpartyInteractions / totalInteractions;

      let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (concentration > 0.5 || reusedCounterparties.length >= 5) {
        severity = 'HIGH';
      } else if (concentration > 0.3 || reusedCounterparties.length >= 3) {
        severity = 'MEDIUM';
      }

      const evidence: Evidence[] = reusedCounterparties.slice(0, 5).map(([addr, count]) => {
        const label = context.labels.get(addr);
        return {
          description: `${count} transfers with ${addr.slice(0, 8)}...${addr.slice(-8)}${label ? ` (${label.name})` : ''}`,
          severity: count > totalInteractions * 0.3 ? 'HIGH' : count > totalInteractions * 0.15 ? 'MEDIUM' : 'LOW',
          type: 'address',
          data: { address: addr, interactionCount: count },
        };
      });

      signals.push({
        id: 'counterparty-reuse',
        name: 'Repeated Transfer Counterparties',
        severity,
        category: 'linkability',
        reason: `This wallet keeps sending to or receiving from the same ${reusedCounterparties.length} address(es). The most frequent one appears in ${topCounterpartyInteractions} out of ${totalInteractions} transfers. Anyone can see these wallets regularly transact with each other.`,
        impact: 'Repeated transfers between the same wallets make it obvious they are connected. Someone watching the blockchain can map out your regular contacts.',
        evidence,
        mitigation: 'Use a separate wallet for each person or service you interact with regularly. This prevents anyone from seeing all your relationships in one place.',
      });
    }
  }

  // Case 2: Program interaction patterns (Solana-specific)
  if (context.programs && context.programs.size > 0) {
    const programUsage = new Map<string, number>();
    
    for (const instruction of context.instructions) {
      programUsage.set(instruction.programId, (programUsage.get(instruction.programId) || 0) + 1);
    }

    // Filter out system programs
    const SYSTEM_PROGRAMS = [
      '11111111111111111111111111111111',
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      'ComputeBudget111111111111111111111111111111',
    ];

    const significantPrograms = Array.from(programUsage.entries())
      .filter(([programId]) => !SYSTEM_PROGRAMS.includes(programId))
      .filter(([_, count]) => count >= Math.min(3, Math.ceil(context.instructions.length * 0.1)))
      .sort((a, b) => b[1] - a[1]);

    if (significantPrograms.length >= 2) {
      const evidence: Evidence[] = significantPrograms.slice(0, 5).map(([programId, count]) => {
        const label = context.labels.get(programId);
        return {
          description: `${programId.slice(0, 8)}...${label ? ` (${label.name})` : ''} used in ${count} instruction(s)`,
          severity: 'LOW',
          reference: `https://solscan.io/account/${programId}`,
        };
      });

      signals.push({
        id: 'program-reuse',
        name: 'Repeated Program Interactions',
        severity: 'LOW',
        category: 'behavioral',
        reason: `This wallet repeatedly uses the same ${significantPrograms.length} program(s). The specific combination of programs you use acts like a signature that can identify your wallet.`,
        impact: 'If someone sees two wallets using the exact same set of programs in the same way, they can guess the wallets belong to the same person.',
        mitigation: 'This is hard to avoid when using DeFi regularly. Using a wider variety of protocols can make your usage pattern less distinctive.',
        evidence,
      });
    }
  }

  // Case 3: PDA reuse (most Solana-specific)
  if (context.pdaInteractions && context.pdaInteractions.length > 0) {
    const pdaUsage = new Map<string, { count: number; programId: string }>();
    
    for (const pda of context.pdaInteractions) {
      if (!pdaUsage.has(pda.pda)) {
        pdaUsage.set(pda.pda, { count: 0, programId: pda.programId });
      }
      pdaUsage.get(pda.pda)!.count++;
    }

    // Find PDAs used multiple times
    const repeatedPDAs = Array.from(pdaUsage.entries())
      .filter(([_, { count }]) => count >= 2)
      .sort((a, b) => b[1].count - a[1].count);

    if (repeatedPDAs.length > 0) {
      const evidence: Evidence[] = repeatedPDAs.slice(0, 5).map(([pda, { count, programId }]) => ({
        description: `PDA ${pda.slice(0, 8)}... (program: ${programId.slice(0, 8)}...) used ${count} times`,
        severity: count > 3 ? 'MEDIUM' : 'LOW',
        reference: `https://solscan.io/account/${pda}`,
      }));

      const maxCount = repeatedPDAs[0][1].count;
      const severity = maxCount > 5 ? 'MEDIUM' : 'LOW';

      signals.push({
        id: 'pda-reuse',
        name: 'Repeated PDA Interactions',
        severity,
        category: 'linkability',
        reason: `This wallet interacts with the same ${repeatedPDAs.length} program-derived account(s) over and over. The most-used one appears ${maxCount} times. These accounts are often unique to you, so every interaction with them is linked.`,
        impact: 'A program-derived account (PDA) tied to your wallet is like a permanent bookmark. Anyone can see all the times you interacted with it, linking your transactions together.',
        mitigation: 'Some PDA reuse is unavoidable on Solana. For sensitive activity, use a fresh wallet so those interactions are tied to a different PDA.',
        evidence,
      });
    }
  }

  // Case 4: Program-counterparty combo (advanced)
  // Detect if the same counterparty is used with the same program repeatedly
  // This is more specific than either heuristic alone
  if (context.transfers.length > 0 && context.instructions.length > 0) {
    const combos = new Map<string, number>();
    
    for (const transfer of context.transfers) {
      const counterparty = transfer.from === context.target ? transfer.to : transfer.from;
      if (counterparty === context.target) continue;

      // Find instructions in the same transaction
      const txInstructions = context.instructions.filter(inst => inst.signature === transfer.signature);
      for (const inst of txInstructions) {
        const combo = `${counterparty}:${inst.programId}`;
        combos.set(combo, (combos.get(combo) || 0) + 1);
      }
    }

    const repeatedCombos = Array.from(combos.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1]);

    if (repeatedCombos.length > 0) {
      const evidence: Evidence[] = repeatedCombos.slice(0, 3).map(([combo, count]) => {
        const [counterparty, programId] = combo.split(':');
        const label = context.labels.get(counterparty);
        return {
          description: `${counterparty.slice(0, 8)}...${label ? ` (${label.name})` : ''} + program ${programId.slice(0, 8)}... used ${count} times`,
          severity: 'MEDIUM',
        };
      });

      signals.push({
        id: 'counterparty-program-combo',
        name: 'Repeated Counterparty-Program Combination',
        severity: 'MEDIUM',
        category: 'linkability',
        reason: `This wallet uses the same address-and-program combination ${repeatedCombos.length} time(s). The specific pairing of who you transact with and which program you use is a strong identifying pattern.`,
        impact: 'The combination of a specific counterparty and a specific program is very distinctive. It is much easier to identify you from this pair than from either one alone.',
        mitigation: 'Vary both the addresses you interact with and the programs you use. If you must reuse one, try not to reuse both at the same time.',
        evidence,
      });
    }
  }

  return signals;
}
