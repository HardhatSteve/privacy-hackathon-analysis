/**
 * Browser-based nickname provider using localStorage
 * Nicknames are NEVER sent to any server - purely client-side
 */

const STORAGE_KEY = 'solana-privacy-scanner-nicknames';
const STORE_VERSION = '1.0.0';

export interface NicknameStore {
  version: '1.0.0';
  nicknames: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface NicknameProvider {
  get(address: string): string | null;
  set(address: string, nickname: string): void;
  remove(address: string): void;
  has(address: string): boolean;
  getAll(): Map<string, string>;
  count(): number;
  export(): NicknameStore;
  import(store: NicknameStore, overwrite?: boolean): void;
  clear(): void;
}

function createEmptyStore(): NicknameStore {
  const now = Date.now();
  return {
    version: STORE_VERSION,
    nicknames: {},
    createdAt: now,
    updatedAt: now,
  };
}

function isValidStore(obj: unknown): obj is NicknameStore {
  if (!obj || typeof obj !== 'object') return false;
  const store = obj as Record<string, unknown>;
  return (
    store.version === STORE_VERSION &&
    typeof store.nicknames === 'object' &&
    store.nicknames !== null &&
    typeof store.createdAt === 'number' &&
    typeof store.updatedAt === 'number'
  );
}

/**
 * Load store from localStorage
 */
function loadStore(): NicknameStore {
  if (typeof window === 'undefined') {
    return createEmptyStore();
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return createEmptyStore();
    }

    const parsed = JSON.parse(data);
    if (isValidStore(parsed)) {
      return parsed;
    }

    console.warn('Invalid nickname store in localStorage, resetting');
    return createEmptyStore();
  } catch (error) {
    console.warn('Failed to load nicknames from localStorage:', error);
    return createEmptyStore();
  }
}

/**
 * Save store to localStorage
 */
function saveStore(store: NicknameStore): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.error('Failed to save nicknames to localStorage:', error);
  }
}

/**
 * Create a browser-based nickname provider
 * All data stays in localStorage - never sent to server
 */
export function createBrowserNicknameProvider(): NicknameProvider {
  let store = loadStore();

  return {
    get(address: string): string | null {
      return store.nicknames[address] ?? null;
    },

    set(address: string, nickname: string): void {
      if (!address || !nickname) {
        throw new Error('Address and nickname are required');
      }
      // Validate address looks like a Solana address
      if (address.length < 32 || address.length > 44) {
        throw new Error('Invalid Solana address length');
      }
      // Trim and limit nickname length
      const trimmed = nickname.trim().slice(0, 50);
      if (trimmed.length === 0) {
        throw new Error('Nickname cannot be empty');
      }

      store.nicknames[address] = trimmed;
      store.updatedAt = Date.now();
      saveStore(store);
    },

    remove(address: string): void {
      if (address in store.nicknames) {
        delete store.nicknames[address];
        store.updatedAt = Date.now();
        saveStore(store);
      }
    },

    has(address: string): boolean {
      return address in store.nicknames;
    },

    getAll(): Map<string, string> {
      return new Map(Object.entries(store.nicknames));
    },

    count(): number {
      return Object.keys(store.nicknames).length;
    },

    export(): NicknameStore {
      return { ...store };
    },

    import(newStore: NicknameStore, overwrite: boolean = false): void {
      if (!isValidStore(newStore)) {
        throw new Error('Invalid nickname store format');
      }

      for (const [address, nickname] of Object.entries(newStore.nicknames)) {
        if (overwrite || !(address in store.nicknames)) {
          if (typeof nickname === 'string' && nickname.trim().length > 0) {
            store.nicknames[address] = nickname.trim().slice(0, 50);
          }
        }
      }
      store.updatedAt = Date.now();
      saveStore(store);
    },

    clear(): void {
      store = createEmptyStore();
      saveStore(store);
    },
  };
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address || address.length <= chars * 2 + 3) {
    return address;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Display address with nickname/label priority
 */
export function displayAddress(
  address: string,
  nicknames: NicknameProvider | null,
  labels: { lookup: (addr: string) => { name: string } | null } | null,
  options: { showSuffix?: boolean; truncateChars?: number } = {}
): string {
  const { showSuffix = true, truncateChars = 4 } = options;

  // Check nickname first
  const nickname = nicknames?.get(address);
  if (nickname) {
    if (showSuffix) {
      return `${nickname} (${truncateAddress(address, truncateChars)})`;
    }
    return nickname;
  }

  // Check label
  const label = labels?.lookup(address);
  if (label) {
    return label.name;
  }

  // Fall back to truncated
  return truncateAddress(address, truncateChars);
}
