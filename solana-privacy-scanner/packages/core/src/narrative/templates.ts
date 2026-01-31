import type { RiskSignal } from '../types/index.js';
import type { SignalTemplate } from './types.js';
import { extractEntityNames, parseCountFromDescription } from './interpolator.js';

// =============================================================================
// IDENTITY TEMPLATES - Direct paths to real-world identity
// =============================================================================

export const IDENTITY_TEMPLATES: SignalTemplate[] = [
  // Exchange interactions - highest identity risk
  {
    pattern: 'known-entity-exchange',
    category: 'identity',
    template:
      'I can see that this wallet has directly interacted with {exchangeCount} centralized exchange(s) including {exchangeNames}. Since exchanges require KYC verification, I can potentially link this wallet to a real-world identity by requesting records from these exchanges.',
    detailTemplates: ['The wallet had {interactionCount} interaction(s) with {exchangeName}.'],
    extractVariables: (signal) => {
      const names = extractEntityNames(signal.evidence.map((e) => e.description));
      return {
        exchangeCount: signal.evidence.length || 1,
        exchangeNames: names.length > 0 ? names.join(', ') : 'known exchanges',
        interactionCount: parseCountFromDescription(signal.evidence[0]?.description || ''),
        exchangeName: names[0] || 'an exchange',
      };
    },
  },

  // Bridge interactions - cross-chain tracking
  {
    pattern: 'known-entity-bridge',
    category: 'identity',
    template:
      "I can follow this wallet's bridge transactions to find their addresses on other blockchains. This allows me to correlate activity across multiple chains and build a more complete profile.",
    extractVariables: (signal) => {
      const names = extractEntityNames(signal.evidence.map((e) => e.description));
      return {
        bridgeCount: signal.evidence.length,
        bridgeNames: names.join(', ') || 'cross-chain bridges',
      };
    },
  },

  // Domain name linkage - permanent identity link
  {
    pattern: 'domain-name-linkage',
    category: 'identity',
    template:
      'I discovered that this wallet has registered or interacted with a .sol domain name. This creates a direct, permanent link between this cryptographic address and a human-readable identity that anyone can look up.',
    extractVariables: () => ({}),
  },

  // NFT metadata exposure - creator identity
  {
    pattern: 'nft-metadata-exposure',
    category: 'identity',
    template:
      'I can see that this wallet has created or updated NFTs via Metaplex. The on-chain metadata permanently associates this wallet with the creator identity, allowing me to identify the owner through their creative work.',
    extractVariables: (signal) => ({
      interactionCount: signal.evidence.length,
    }),
  },

  // Frequent entity interaction (dynamic ID)
  {
    pattern: /^known-entity-frequent-/,
    category: 'identity',
    template:
      "I notice that {concentration}% of this wallet's activity is concentrated with {entityName}. This heavy usage pattern makes it easy to track this user's habits and potentially correlate with off-chain records.",
    extractVariables: (signal) => {
      const match = signal.reason?.match(/(\d+)%/);
      const names = extractEntityNames([signal.reason || '']);
      return {
        concentration: match?.[1] || '30',
        entityName: names[0] || 'a known service',
      };
    },
  },
];

// =============================================================================
// CONNECTIONS TEMPLATES - Wallet relationships and linkage
// =============================================================================

export const CONNECTIONS_TEMPLATES: SignalTemplate[] = [
  // Fee payer - never self (critical)
  {
    pattern: 'fee-payer-never-self',
    category: 'connections',
    template:
      'I have identified that this wallet NEVER pays its own transaction fees. All {txCount} transactions were funded by {feePayerCount} other wallet(s). This tells me definitively that someone else controls or funds this account - I can identify the controller by following the fee payments.',
    extractVariables: (signal) => {
      const txMatch = signal.reason?.match(/All\s+(\d+)/);
      const fpMatch = signal.reason?.match(/by\s+(\d+)/);
      return {
        txCount: txMatch?.[1] || signal.evidence.length || '?',
        feePayerCount: fpMatch?.[1] || '1',
      };
    },
  },

  // Fee payer - external
  {
    pattern: 'fee-payer-external',
    category: 'connections',
    template:
      'I can see that {feePayerCount} external wallet(s) have paid transaction fees for this address. This creates a visible on-chain connection - if I identify any of these fee payers, I automatically link them to this wallet.',
    extractVariables: (signal) => ({
      feePayerCount: signal.evidence.length || 1,
    }),
  },

  // Fee payer - multi signer
  {
    pattern: 'fee-payer-multi-signer',
    category: 'connections',
    template:
      'I have detected that certain fee payers are funding transactions for multiple different signers. This reveals a central operator controlling several wallets - I can now link all these wallets together under one entity.',
    extractVariables: (signal) => ({
      operatorCount: signal.evidence.length,
    }),
  },

  // Signer repeated
  {
    pattern: 'signer-repeated',
    category: 'connections',
    template:
      'I observe that {signerCount} address(es) repeatedly sign transactions for this wallet. This is cryptographic proof that these wallets are connected.',
    extractVariables: (signal) => {
      const match = signal.reason?.match(/(\d+)\s+address/);
      return {
        signerCount: match?.[1] || signal.evidence.length || '1',
      };
    },
  },

  // Signer set reuse
  {
    pattern: 'signer-set-reuse',
    category: 'connections',
    template:
      'I can see that the same group of signers is used repeatedly across {patternCount} different transaction patterns. This combination acts as a unique fingerprint identifying your multi-sig setup.',
    extractVariables: (signal) => ({
      patternCount: signal.evidence.length,
    }),
  },

  // Signer authority hub
  {
    pattern: 'signer-authority-hub',
    category: 'connections',
    template:
      'I have identified {authorityCount} "authority" signer(s) that co-sign transactions with many different wallets. This reveals a central controller - I can map out the entire set of wallets under their control.',
    extractVariables: (signal) => ({
      authorityCount: signal.evidence.length,
    }),
  },

  // ATA creator linkage
  {
    pattern: 'ata-creator-linkage',
    category: 'connections',
    template:
      'I can see that one wallet created token accounts for {ownerCount} different owners. Even though these wallets never send tokens to each other directly, they are permanently linked through their shared funding source.',
    extractVariables: (signal) => {
      const match = signal.reason?.match(/for\s+(\d+)\s+different/);
      return {
        ownerCount: match?.[1] || signal.evidence.length || '2',
      };
    },
  },

  // ATA funding pattern
  {
    pattern: 'ata-funding-pattern',
    category: 'connections',
    template:
      'I detected {burstCount} token accounts created within a short time window. This batch setup pattern tells me these wallets were prepared by the same operator.',
    extractVariables: (signal) => {
      const match = signal.reason?.match(/(\d+)\s+token\s+accounts/);
      return {
        burstCount: match?.[1] || signal.evidence.length || '3',
      };
    },
  },

  // Counterparty reuse
  {
    pattern: 'counterparty-reuse',
    category: 'connections',
    template:
      "I can map out this wallet's regular contacts - {counterpartyCount} address(es) appear repeatedly in transfers, revealing established relationships.",
    extractVariables: (signal) => ({
      counterpartyCount: signal.evidence.length || 1,
    }),
  },

  // PDA reuse
  {
    pattern: 'pda-reuse',
    category: 'connections',
    template:
      "I can track this wallet's repeated interactions with {pdaCount} program-derived account(s). Each visit to these accounts links those transactions together, revealing a complete activity timeline.",
    extractVariables: (signal) => ({
      pdaCount: signal.evidence.length,
    }),
  },
];

// =============================================================================
// BEHAVIOR TEMPLATES - Usage patterns and fingerprints
// =============================================================================

export const BEHAVIOR_TEMPLATES: SignalTemplate[] = [
  // Timing burst
  {
    pattern: 'timing-burst',
    category: 'behavior',
    template:
      'I detected a burst of {txCount} transactions within {timeSpan}. This concentrated activity stands out and could correlate with real-world events or identify this wallet among others.',
    extractVariables: (signal) => {
      const txMatch = signal.reason?.match(/(\d+)\s+transaction/);
      const timeMatch = signal.reason?.match(/within\s+([^\.]+)/);
      return {
        txCount: txMatch?.[1] || signal.evidence.length || '?',
        timeSpan: timeMatch?.[1] || 'a short period',
      };
    },
  },

  // Timing regular interval
  {
    pattern: 'timing-regular-interval',
    category: 'behavior',
    template:
      'I can see transactions happening at regular intervals. This clock-like precision tells me this is likely automated, revealing either a bot or a fixed personal schedule.',
    extractVariables: (signal) => {
      const match = signal.reason?.match(/(\d+)[- ]?(minute|hour|day)/i);
      return {
        interval: match ? `${match[1]} ${match[2]}` : 'predictable',
      };
    },
  },

  // Timing timezone
  {
    pattern: 'timing-timezone-pattern',
    category: 'behavior',
    template:
      "I can determine that {concentration}% of transactions happen during specific hours ({activeHours} UTC). This reveals the user's timezone and daily schedule, narrowing down their geographic location.",
    extractVariables: (signal) => {
      const concMatch = signal.reason?.match(/(\d+)%/);
      const hoursMatch = signal.reason?.match(/during\s+(\d+:\d+.*?)\s*UTC/i);
      return {
        concentration: concMatch?.[1] || '40',
        activeHours: hoursMatch?.[1] || 'consistent hours',
      };
    },
  },

  // Priority fee consistent
  {
    pattern: 'priority-fee-consistent',
    category: 'behavior',
    template:
      'I notice that many transactions use consistent priority fees. This pattern acts as a signature linking these transactions together.',
    extractVariables: (signal) => {
      const concMatch = signal.reason?.match(/(\d+)%/);
      const feeMatch = signal.reason?.match(/(\d+)\s*lamports/);
      return {
        concentration: concMatch?.[1] || '50',
        feeAmount: feeMatch?.[1] || 'specific amounts',
      };
    },
  },

  // Compute budget fingerprint
  {
    pattern: 'compute-budget-fingerprint',
    category: 'behavior',
    template:
      'I can identify a distinctive compute unit pattern in {concentration}% of transactions. This consistency helps identify transactions from the same source.',
    extractVariables: (signal) => {
      const match = signal.reason?.match(/(\d+)%/);
      return {
        concentration: match?.[1] || '60',
      };
    },
  },

  // Instruction sequence pattern
  {
    pattern: 'instruction-sequence-pattern',
    category: 'behavior',
    template:
      'I can identify {sequenceCount} repeated instruction sequence(s). Even across different wallets, this operational fingerprint could link them together.',
    extractVariables: (signal) => ({
      sequenceCount: signal.evidence.length || 1,
    }),
  },

  // Program usage profile
  {
    pattern: 'program-usage-profile',
    category: 'behavior',
    template:
      "I have profiled this wallet's program usage - they regularly interact with {programCount} distinctive programs. This combination creates a behavioral fingerprint that could identify this user across wallets.",
    extractVariables: (signal) => ({
      programCount: signal.evidence.length,
    }),
  },

  // Program reuse
  {
    pattern: 'program-reuse',
    category: 'behavior',
    template:
      "I can see this wallet repeatedly uses the same {programCount} program(s). This pattern of protocol preferences helps identify the user's DeFi strategy and habits.",
    extractVariables: (signal) => ({
      programCount: signal.evidence.length,
    }),
  },

  // Instruction PDA reuse
  {
    pattern: 'instruction-pda-reuse',
    category: 'behavior',
    template:
      'I can track repeated interactions with {pdaCount} program-derived account(s) at the instruction level, creating a detailed activity trail.',
    extractVariables: (signal) => ({
      pdaCount: signal.evidence.length,
    }),
  },

  // Instruction type patterns (dynamic)
  {
    pattern: /^instruction-type-/,
    category: 'behavior',
    template:
      'I see a specific operation type being used {count} times. This repetitive behavior pattern distinguishes this wallet from normal users.',
    extractVariables: (signal) => {
      const match = signal.reason?.match(/(\d+)\s+times/);
      return {
        count: match?.[1] || 'many',
      };
    },
  },

  // Stake delegation pattern
  {
    pattern: 'stake-delegation-pattern',
    category: 'behavior',
    template:
      'I can see staking activity concentrated on {validatorCount} validator(s). This choice reveals preferences that could help identify the staker, especially if using uncommon validators.',
    extractVariables: (signal) => ({
      validatorCount: signal.evidence.length,
    }),
  },

  // Stake timing correlation
  {
    pattern: 'stake-timing-correlation',
    category: 'behavior',
    template:
      'I detect staking operations at regular intervals. This schedule reveals either automation or habitual behavior patterns.',
    extractVariables: (signal) => {
      const match = signal.reason?.match(/(\d+)[- ]?hour/);
      return {
        interval: match?.[1] || 'regular',
      };
    },
  },

  // Address high diversity
  {
    pattern: 'address-high-diversity',
    category: 'behavior',
    template:
      "I can see this single wallet is used for {activityCount} different types of activity. This makes it easy to build a complete profile of the owner's interests and habits.",
    extractVariables: (signal) => {
      const match = signal.reason?.match(/(\d+)\s+different/);
      return {
        activityCount: match?.[1] || '4',
      };
    },
  },

  // Address moderate diversity
  {
    pattern: 'address-moderate-diversity',
    category: 'behavior',
    template:
      'I can see this wallet is used for multiple activity types. These activities are now connected to the same identity.',
    extractVariables: (signal) => {
      const match = signal.reason?.match(/(\d+)\s+activity/);
      return {
        activityCount: match?.[1] || '3',
      };
    },
  },

  // Address long-term usage
  {
    pattern: 'address-long-term-usage',
    category: 'behavior',
    template:
      "I have access to {dayCount} days of transaction history with {txCount} transactions on this wallet. This extended timeline provides a detailed view of the owner's behavior over time.",
    extractVariables: (signal) => {
      const dayMatch = signal.reason?.match(/(\d+)\s*days/);
      const txMatch = signal.reason?.match(/(\d+)\s*transaction/);
      return {
        dayCount: dayMatch?.[1] || 'many',
        txCount: txMatch?.[1] || 'many',
      };
    },
  },
];

// =============================================================================
// EXPOSURE TEMPLATES - Information leaks and metadata
// =============================================================================

export const EXPOSURE_TEMPLATES: SignalTemplate[] = [
  // Memo PII exposure (critical)
  {
    pattern: 'memo-pii-exposure',
    category: 'exposure',
    template:
      'I found personal information directly embedded in {memoCount} transaction memo(s). This data - including possible email addresses, phone numbers, or names - is permanently visible on the blockchain and directly links this wallet to a real identity.',
    detailTemplates: ['Memo content found: "{content}"'],
    extractVariables: (signal) => ({
      memoCount: signal.evidence.length,
    }),
  },

  // Memo descriptive content
  {
    pattern: 'memo-descriptive-content',
    category: 'exposure',
    template:
      'I can read {memoCount} descriptive memo(s) containing URLs, payment references, or descriptions. This context reveals the purpose of transactions and provides additional identifying information.',
    extractVariables: (signal) => ({
      memoCount: signal.evidence.length,
    }),
  },

  // Memo usage (low severity)
  {
    pattern: 'memo-usage',
    category: 'exposure',
    template:
      "I see that {txCount} transaction(s) include memo data. While the current content may seem harmless, any memo adds extra context that observers can use to understand this wallet's activity.",
    extractVariables: (signal) => {
      const match = signal.reason?.match(/(\d+)\s+transaction/);
      return {
        txCount: match?.[1] || signal.evidence.length || '?',
      };
    },
  },

  // Token account churn
  {
    pattern: 'token-account-churn',
    category: 'exposure',
    template:
      'I can trace {closeCount} closed token account(s) through their rent refunds sent back to the owner. This reveals which wallets own the "throwaway" accounts.',
    extractVariables: (signal) => {
      const match = signal.reason?.match(/(\d+)/);
      return {
        closeCount: match?.[1] || signal.evidence.length || '?',
      };
    },
  },

  // Token account short-lived
  {
    pattern: 'token-account-short-lived',
    category: 'exposure',
    template:
      'I detected {accountCount} token account(s) that were created and closed within an hour. This throwaway pattern still leaves a trail through the rent refunds.',
    extractVariables: (signal) => ({
      accountCount: signal.evidence.length,
    }),
  },

  // Token account common owner
  {
    pattern: 'token-account-common-owner',
    category: 'exposure',
    template:
      'I can see that {ownerCount} wallet(s) own multiple token accounts. Since ownership is public, I can link all these accounts to their common owners.',
    extractVariables: (signal) => ({
      ownerCount: signal.evidence.length,
    }),
  },

  // Rent refund clustering
  {
    pattern: 'rent-refund-clustering',
    category: 'exposure',
    template:
      'I traced rent refunds from multiple closed accounts back to the same address(es). This exposes the full scope of their token holdings.',
    extractVariables: (signal) => ({
      recipientCount: signal.evidence.length,
    }),
  },

  // Known entity other
  {
    pattern: 'known-entity-other',
    category: 'exposure',
    template:
      'I can see interactions with {entityCount} known service(s). These public landmarks in the transaction history reveal which protocols and services this wallet uses.',
    extractVariables: (signal) => ({
      entityCount: signal.evidence.length,
    }),
  },

  // Counterparty-program combo
  {
    pattern: 'counterparty-program-combo',
    category: 'exposure',
    template:
      'I identified {comboCount} distinctive counterparty-program combination(s) used repeatedly. This specific pairing is highly identifying - much more so than either element alone.',
    extractVariables: (signal) => ({
      comboCount: signal.evidence.length,
    }),
  },
];

// =============================================================================
// ALL TEMPLATES - Combined and exported
// =============================================================================

export const ALL_TEMPLATES: SignalTemplate[] = [
  ...IDENTITY_TEMPLATES,
  ...CONNECTIONS_TEMPLATES,
  ...BEHAVIOR_TEMPLATES,
  ...EXPOSURE_TEMPLATES,
];

/**
 * Find the matching template for a signal ID
 */
export function findTemplate(signalId: string): SignalTemplate | undefined {
  for (const template of ALL_TEMPLATES) {
    if (typeof template.pattern === 'string') {
      if (template.pattern === signalId) return template;
    } else {
      if (template.pattern.test(signalId)) return template;
    }
  }
  return undefined;
}
