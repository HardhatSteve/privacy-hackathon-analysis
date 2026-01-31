/**
 * Types of known entities
 */
export type LabelType =
  | 'exchange'      // Centralized exchanges (CEX)
  | 'bridge'        // Cross-chain bridges
  | 'protocol'      // DeFi protocols (DEX, lending, staking)
  | 'program'       // System/infrastructure programs
  | 'token'         // Token mints
  | 'mev'           // MEV infrastructure (Jito, etc.)
  | 'mixer'         // Privacy/mixing protocols
  | 'marketplace'   // NFT marketplaces
  | 'fee-payer'     // Known fee payer/relay services
  | 'validator'     // Notable validators
  | 'privacy'       // Privacy-focused protocols
  | 'gaming'        // Gaming/entertainment protocols
  | 'oracle'        // Oracle providers
  | 'wallet'        // Wallet provider addresses
  | 'other';        // Uncategorized

/**
 * A label for a known entity on Solana
 */
export interface Label {
  /**
   * The address or program ID
   */
  address: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Type of entity
   */
  type: LabelType;

  /**
   * Additional context or description
   */
  description?: string;

  /**
   * Known associated addresses
   */
  relatedAddresses?: string[];
}

/**
 * Interface for label lookup providers
 */
export interface LabelProvider {
  /**
   * Look up a label for an address
   */
  lookup(address: string): Label | null;

  /**
   * Look up multiple addresses at once
   */
  lookupMany(addresses: string[]): Map<string, Label>;
}
