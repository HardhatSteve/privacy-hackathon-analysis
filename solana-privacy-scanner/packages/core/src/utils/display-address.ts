import type { DisplayAddressOptions, NicknameProvider, LabelProvider } from '../types/index.js';

/**
 * Truncate a Solana address for display
 * @param address - Full Solana address
 * @param chars - Number of characters to show at start and end
 * @returns Truncated address like "CG2j...wJwb"
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address || address.length <= chars * 2 + 3) {
    return address;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Display a Solana address with smart formatting
 *
 * Priority order:
 * 1. Nickname (if set) - e.g., "My Wallet (CG2j...wJwb)"
 * 2. Known label name - e.g., "Binance Hot Wallet 2"
 * 3. Truncated address - e.g., "CG2j...wJwb"
 *
 * @param address - Full Solana address
 * @param options - Display options including nickname/label providers
 * @returns Formatted address string for display
 */
export function displayAddress(
  address: string,
  options: DisplayAddressOptions = {}
): string {
  const {
    nicknames,
    labels,
    truncateChars = 4,
    showAddressSuffix = true,
    format = 'smart',
  } = options;

  // Full format - always return the complete address
  if (format === 'full') {
    return address;
  }

  // Truncated format - always truncate, ignore nicknames/labels
  if (format === 'truncated') {
    return truncateAddress(address, truncateChars);
  }

  // Smart format - use nickname > label > truncated

  // 1. Check for nickname
  const nickname = nicknames?.get(address);
  if (nickname) {
    if (showAddressSuffix) {
      return `${nickname} (${truncateAddress(address, truncateChars)})`;
    }
    return nickname;
  }

  // 2. Check for known label
  const label = labels?.lookup(address);
  if (label) {
    return label.name;
  }

  // 3. Fall back to truncated address
  return truncateAddress(address, truncateChars);
}

/**
 * Get display info for an address
 * Returns structured data for more flexible rendering
 */
export interface AddressDisplayInfo {
  /** The full original address */
  address: string;
  /** What to display (nickname, label name, or truncated) */
  displayText: string;
  /** Type of display value */
  type: 'nickname' | 'label' | 'address';
  /** Truncated form of the address */
  truncated: string;
  /** Nickname if set */
  nickname?: string;
  /** Label if known */
  label?: {
    name: string;
    type: string;
    description?: string;
  };
}

/**
 * Get structured display info for an address
 * Useful for UI components that need more context
 */
export function getAddressDisplayInfo(
  address: string,
  nicknames?: NicknameProvider,
  labels?: LabelProvider
): AddressDisplayInfo {
  const truncated = truncateAddress(address, 4);
  const nickname = nicknames?.get(address) ?? undefined;
  const labelData = labels?.lookup(address);

  let displayText: string;
  let type: 'nickname' | 'label' | 'address';

  if (nickname) {
    displayText = nickname;
    type = 'nickname';
  } else if (labelData) {
    displayText = labelData.name;
    type = 'label';
  } else {
    displayText = truncated;
    type = 'address';
  }

  return {
    address,
    displayText,
    type,
    truncated,
    nickname,
    label: labelData ? {
      name: labelData.name,
      type: labelData.type,
      description: labelData.description,
    } : undefined,
  };
}

/**
 * Format multiple addresses for display
 * Useful for lists of counterparties, signers, etc.
 */
export function displayAddresses(
  addresses: string[],
  options: DisplayAddressOptions = {}
): string[] {
  return addresses.map(addr => displayAddress(addr, options));
}

/**
 * Create a display function with pre-configured options
 * Useful for consistent formatting throughout an application
 */
export function createAddressFormatter(
  options: DisplayAddressOptions
): (address: string) => string {
  return (address: string) => displayAddress(address, options);
}
