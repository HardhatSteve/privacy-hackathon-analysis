/**
 * Multi-Matcher Architecture for AuroraZK
 * 
 * Implements a decentralized matching system where multiple matchers
 * can propose matches, and consensus is required before execution.
 * 
 * Features:
 * - Multiple matcher nodes
 * - Threshold signatures (t-of-n)
 * - Match proposal and verification
 * - Slashing conditions for malicious behavior
 */

import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

// Matcher node configuration
export interface MatcherNode {
  id: string;
  publicKey: Uint8Array;
  endpoint: string;
  weight: number; // Voting weight (stake-weighted)
  reputation: number; // 0-100, based on historical accuracy
  isActive: boolean;
  lastSeen: Date;
}

// Match proposal from a matcher
export interface MatchProposal {
  proposalId: string;
  proposer: string; // Matcher ID
  buyOrderId: string;
  sellOrderId: string;
  executionPrice: number;
  executionSize: number;
  timestamp: number;
  signature: Uint8Array;
  // For verification
  buyPriceHash: string;
  sellPriceHash: string;
}

// Verification vote from a matcher
export interface MatchVerification {
  proposalId: string;
  verifier: string; // Matcher ID
  approved: boolean;
  reason?: string;
  signature: Uint8Array;
  timestamp: number;
}

// Consensus result
export interface ConsensusResult {
  proposalId: string;
  approved: boolean;
  approvals: number;
  rejections: number;
  totalWeight: number;
  threshold: number;
  signatures: Uint8Array[];
  timestamp: number;
}

// Slashing event for malicious behavior
export interface SlashingEvent {
  matcherId: string;
  reason: 'invalid_proposal' | 'double_signing' | 'front_running' | 'censorship';
  evidence: string;
  slashAmount: number;
  timestamp: number;
}

// Multi-matcher configuration
export interface MultiMatcherConfig {
  // Minimum number of matchers required for consensus
  minMatchers: number;
  // Threshold for approval (e.g., 0.67 = 2/3 majority)
  approvalThreshold: number;
  // Time window for collecting votes (ms)
  votingWindow: number;
  // Minimum reputation to participate
  minReputation: number;
}

const DEFAULT_CONFIG: MultiMatcherConfig = {
  minMatchers: 3,
  approvalThreshold: 0.67,
  votingWindow: 5000, // 5 seconds
  minReputation: 50,
};

/**
 * Multi-Matcher Orchestrator
 * 
 * Coordinates multiple matcher nodes for decentralized order matching
 */
export class MultiMatcherOrchestrator {
  private matchers: Map<string, MatcherNode> = new Map();
  private proposals: Map<string, MatchProposal> = new Map();
  private verifications: Map<string, MatchVerification[]> = new Map();
  private config: MultiMatcherConfig;
  private slashingEvents: SlashingEvent[] = [];

  constructor(config: Partial<MultiMatcherConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a new matcher node
   */
  registerMatcher(node: Omit<MatcherNode, 'isActive' | 'lastSeen'>): void {
    this.matchers.set(node.id, {
      ...node,
      isActive: true,
      lastSeen: new Date(),
    });
    console.log(`📡 Registered matcher: ${node.id}`);
  }

  /**
   * Remove a matcher node
   */
  unregisterMatcher(matcherId: string): void {
    this.matchers.delete(matcherId);
    console.log(`📴 Unregistered matcher: ${matcherId}`);
  }

  /**
   * Get all active matchers meeting minimum requirements
   */
  getActiveMatchers(): MatcherNode[] {
    const now = Date.now();
    const staleThreshold = 60000; // 1 minute

    return Array.from(this.matchers.values()).filter(m => {
      const isRecent = now - m.lastSeen.getTime() < staleThreshold;
      const hasReputation = m.reputation >= this.config.minReputation;
      return m.isActive && isRecent && hasReputation;
    });
  }

  /**
   * Submit a match proposal
   */
  async submitProposal(proposal: MatchProposal): Promise<string> {
    // Verify proposer is a valid matcher
    const matcher = this.matchers.get(proposal.proposer);
    if (!matcher) {
      throw new Error('Unknown proposer');
    }

    if (matcher.reputation < this.config.minReputation) {
      throw new Error('Proposer reputation too low');
    }

    // Verify signature
    const message = this.serializeProposal(proposal);
    const isValid = nacl.sign.detached.verify(
      message,
      proposal.signature,
      matcher.publicKey
    );

    if (!isValid) {
      // Slash for invalid signature
      this.recordSlashing(proposal.proposer, 'invalid_proposal', 'Invalid signature');
      throw new Error('Invalid proposal signature');
    }

    // Store proposal
    this.proposals.set(proposal.proposalId, proposal);
    this.verifications.set(proposal.proposalId, []);

    // Broadcast to other matchers for verification
    await this.broadcastForVerification(proposal);

    return proposal.proposalId;
  }

  /**
   * Submit a verification vote
   */
  submitVerification(verification: MatchVerification): void {
    const proposal = this.proposals.get(verification.proposalId);
    if (!proposal) {
      throw new Error('Unknown proposal');
    }

    const matcher = this.matchers.get(verification.verifier);
    if (!matcher) {
      throw new Error('Unknown verifier');
    }

    // Verify signature
    const message = this.serializeVerification(verification);
    const isValid = nacl.sign.detached.verify(
      message,
      verification.signature,
      matcher.publicKey
    );

    if (!isValid) {
      this.recordSlashing(verification.verifier, 'invalid_proposal', 'Invalid verification signature');
      throw new Error('Invalid verification signature');
    }

    // Check for double voting
    const existingVotes = this.verifications.get(verification.proposalId) || [];
    if (existingVotes.some(v => v.verifier === verification.verifier)) {
      this.recordSlashing(verification.verifier, 'double_signing', 'Double voting detected');
      throw new Error('Double voting not allowed');
    }

    existingVotes.push(verification);
    this.verifications.set(verification.proposalId, existingVotes);
  }

  /**
   * Check if consensus has been reached for a proposal
   */
  checkConsensus(proposalId: string): ConsensusResult | null {
    const proposal = this.proposals.get(proposalId);
    const votes = this.verifications.get(proposalId);

    if (!proposal || !votes) return null;

    const activeMatchers = this.getActiveMatchers();
    if (activeMatchers.length < this.config.minMatchers) {
      return null; // Not enough matchers
    }

    // Calculate weighted votes
    let approvalWeight = 0;
    let rejectionWeight = 0;
    let totalWeight = 0;
    const signatures: Uint8Array[] = [];

    for (const vote of votes) {
      const matcher = this.matchers.get(vote.verifier);
      if (matcher && matcher.isActive) {
        const weight = matcher.weight * (matcher.reputation / 100);
        totalWeight += weight;

        if (vote.approved) {
          approvalWeight += weight;
          signatures.push(vote.signature);
        } else {
          rejectionWeight += weight;
        }
      }
    }

    // Check if we have enough votes
    const totalPossibleWeight = activeMatchers.reduce(
      (sum, m) => sum + m.weight * (m.reputation / 100),
      0
    );

    const votingComplete = totalWeight >= totalPossibleWeight * 0.8; // 80% participation
    const threshold = totalPossibleWeight * this.config.approvalThreshold;

    if (!votingComplete) return null;

    return {
      proposalId,
      approved: approvalWeight >= threshold,
      approvals: votes.filter(v => v.approved).length,
      rejections: votes.filter(v => !v.approved).length,
      totalWeight,
      threshold,
      signatures,
      timestamp: Date.now(),
    };
  }

  /**
   * Execute a match after consensus
   */
  async executeMatch(proposalId: string): Promise<{
    success: boolean;
    txSignature?: string;
    error?: string;
  }> {
    const consensus = this.checkConsensus(proposalId);

    if (!consensus) {
      return { success: false, error: 'Consensus not reached' };
    }

    if (!consensus.approved) {
      return { success: false, error: 'Proposal rejected by consensus' };
    }

    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    // In production, this would submit the reveal_and_match transaction
    // with aggregated signatures from multiple matchers
    console.log(`✅ Executing match with ${consensus.signatures.length} signatures`);
    console.log(`   Buy: ${proposal.buyOrderId}`);
    console.log(`   Sell: ${proposal.sellOrderId}`);
    console.log(`   Price: $${proposal.executionPrice}`);
    console.log(`   Size: ${proposal.executionSize} SOL`);

    // Update matcher reputations based on outcome
    const votes = this.verifications.get(proposalId) || [];
    for (const vote of votes) {
      this.updateReputation(vote.verifier, vote.approved ? 1 : -1);
    }

    // Clean up
    this.proposals.delete(proposalId);
    this.verifications.delete(proposalId);

    return {
      success: true,
      txSignature: 'simulated_multi_matcher_tx_' + proposalId,
    };
  }

  /**
   * Record a slashing event
   */
  private recordSlashing(matcherId: string, reason: SlashingEvent['reason'], evidence: string): void {
    const event: SlashingEvent = {
      matcherId,
      reason,
      evidence,
      slashAmount: this.calculateSlashAmount(reason),
      timestamp: Date.now(),
    };

    this.slashingEvents.push(event);

    // Reduce reputation
    const matcher = this.matchers.get(matcherId);
    if (matcher) {
      matcher.reputation = Math.max(0, matcher.reputation - 20);
      
      // Deactivate if reputation too low
      if (matcher.reputation < 20) {
        matcher.isActive = false;
      }
    }

    console.log(`⚠️ Slashing event: ${matcherId} - ${reason}`);
  }

  /**
   * Calculate slash amount based on violation type
   */
  private calculateSlashAmount(reason: SlashingEvent['reason']): number {
    switch (reason) {
      case 'front_running':
        return 100; // Severe
      case 'double_signing':
        return 50;
      case 'invalid_proposal':
        return 25;
      case 'censorship':
        return 75;
      default:
        return 10;
    }
  }

  /**
   * Update matcher reputation
   */
  private updateReputation(matcherId: string, delta: number): void {
    const matcher = this.matchers.get(matcherId);
    if (matcher) {
      matcher.reputation = Math.min(100, Math.max(0, matcher.reputation + delta));
    }
  }

  /**
   * Serialize proposal for signing
   */
  private serializeProposal(proposal: MatchProposal): Uint8Array {
    const data = JSON.stringify({
      buyOrderId: proposal.buyOrderId,
      sellOrderId: proposal.sellOrderId,
      executionPrice: proposal.executionPrice,
      executionSize: proposal.executionSize,
      timestamp: proposal.timestamp,
    });
    return naclUtil.decodeUTF8(data);
  }

  /**
   * Serialize verification for signing
   */
  private serializeVerification(verification: MatchVerification): Uint8Array {
    const data = JSON.stringify({
      proposalId: verification.proposalId,
      approved: verification.approved,
      timestamp: verification.timestamp,
    });
    return naclUtil.decodeUTF8(data);
  }

  /**
   * Broadcast proposal to other matchers
   */
  private async broadcastForVerification(proposal: MatchProposal): Promise<void> {
    const activeMatchers = this.getActiveMatchers().filter(
      m => m.id !== proposal.proposer
    );

    console.log(`📢 Broadcasting proposal ${proposal.proposalId} to ${activeMatchers.length} matchers`);

    // In production, this would make HTTP/WebSocket calls to other matchers
    for (const matcher of activeMatchers) {
      try {
        // await fetch(`${matcher.endpoint}/verify`, { ... })
        console.log(`   → Sent to ${matcher.id}`);
      } catch (error) {
        console.error(`   ✗ Failed to reach ${matcher.id}`);
      }
    }
  }

  /**
   * Get orchestrator statistics
   */
  getStats(): {
    totalMatchers: number;
    activeMatchers: number;
    pendingProposals: number;
    slashingEvents: number;
    avgReputation: number;
  } {
    const matchers = Array.from(this.matchers.values());
    const active = this.getActiveMatchers();

    return {
      totalMatchers: matchers.length,
      activeMatchers: active.length,
      pendingProposals: this.proposals.size,
      slashingEvents: this.slashingEvents.length,
      avgReputation: matchers.length > 0
        ? matchers.reduce((sum, m) => sum + m.reputation, 0) / matchers.length
        : 0,
    };
  }
}

// Singleton instance
export const multiMatcher = new MultiMatcherOrchestrator();

// Helper to generate matcher keypair
export function generateMatcherKeypair(): {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
} {
  return nacl.sign.keyPair();
}

// Helper to sign a proposal
export function signProposal(
  proposal: Omit<MatchProposal, 'signature'>,
  secretKey: Uint8Array
): MatchProposal {
  const data = JSON.stringify({
    buyOrderId: proposal.buyOrderId,
    sellOrderId: proposal.sellOrderId,
    executionPrice: proposal.executionPrice,
    executionSize: proposal.executionSize,
    timestamp: proposal.timestamp,
  });
  const message = naclUtil.decodeUTF8(data);
  const signature = nacl.sign.detached(message, secretKey);

  return { ...proposal, signature };
}

// Helper to sign a verification
export function signVerification(
  verification: Omit<MatchVerification, 'signature'>,
  secretKey: Uint8Array
): MatchVerification {
  const data = JSON.stringify({
    proposalId: verification.proposalId,
    approved: verification.approved,
    timestamp: verification.timestamp,
  });
  const message = naclUtil.decodeUTF8(data);
  const signature = nacl.sign.detached(message, secretKey);

  return { ...verification, signature };
}
