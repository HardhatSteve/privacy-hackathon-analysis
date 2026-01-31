/**
 * Serializable store format for nicknames
 * Used for import/export and persistence
 */
export interface NicknameStore {
  /**
   * Schema version for forward compatibility
   */
  version: '1.0.0';

  /**
   * Map of address to nickname
   */
  nicknames: Record<string, string>;

  /**
   * When the store was created (Unix timestamp ms)
   */
  createdAt: number;

  /**
   * When the store was last modified (Unix timestamp ms)
   */
  updatedAt: number;
}

/**
 * Interface for nickname providers
 * Implementations handle storage (localStorage, file, memory)
 */
export interface NicknameProvider {
  /**
   * Get nickname for an address
   * @returns nickname or null if not set
   */
  get(address: string): string | null;

  /**
   * Set nickname for an address
   * @param address - Solana address
   * @param nickname - Human-readable nickname
   */
  set(address: string, nickname: string): void;

  /**
   * Remove nickname for an address
   */
  remove(address: string): void;

  /**
   * Check if an address has a nickname
   */
  has(address: string): boolean;

  /**
   * Get all nicknames as a Map
   */
  getAll(): Map<string, string>;

  /**
   * Get count of stored nicknames
   */
  count(): number;

  /**
   * Export all nicknames as a serializable store
   */
  export(): NicknameStore;

  /**
   * Import nicknames from a store (merges with existing)
   * @param store - NicknameStore to import
   * @param overwrite - If true, overwrites existing nicknames on conflict
   */
  import(store: NicknameStore, overwrite?: boolean): void;

  /**
   * Clear all nicknames
   */
  clear(): void;
}

/**
 * Options for displaying addresses
 */
export interface DisplayAddressOptions {
  /**
   * Nickname provider for custom names
   */
  nicknames?: NicknameProvider;

  /**
   * Label provider for known entities
   */
  labels?: import('./label.js').LabelProvider;

  /**
   * Number of characters to show at start/end when truncating
   * @default 4
   */
  truncateChars?: number;

  /**
   * Whether to show address suffix after nickname
   * @default true
   */
  showAddressSuffix?: boolean;

  /**
   * Format for display
   * - 'full': Show full address (44 chars)
   * - 'truncated': Show truncated address (e.g., "CG2j...wJwb")
   * - 'smart': Use nickname/label if available, else truncate
   * @default 'smart'
   */
  format?: 'full' | 'truncated' | 'smart';
}
