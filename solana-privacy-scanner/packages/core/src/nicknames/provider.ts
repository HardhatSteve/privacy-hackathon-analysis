import { readFileSync, writeFileSync, existsSync } from 'fs';
import type { NicknameStore, NicknameProvider } from '../types/index.js';

/**
 * Create an empty NicknameStore
 */
function createEmptyStore(): NicknameStore {
  const now = Date.now();
  return {
    version: '1.0.0',
    nicknames: {},
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Validate that an object is a valid NicknameStore
 */
function isValidNicknameStore(obj: unknown): obj is NicknameStore {
  if (!obj || typeof obj !== 'object') return false;
  const store = obj as Record<string, unknown>;
  return (
    store.version === '1.0.0' &&
    typeof store.nicknames === 'object' &&
    store.nicknames !== null &&
    typeof store.createdAt === 'number' &&
    typeof store.updatedAt === 'number'
  );
}

/**
 * In-memory nickname provider
 * Useful for testing and as a base for other implementations
 */
export class MemoryNicknameProvider implements NicknameProvider {
  protected nicknames: Map<string, string>;
  protected createdAt: number;
  protected updatedAt: number;

  constructor(initialStore?: NicknameStore) {
    this.nicknames = new Map();
    const now = Date.now();
    this.createdAt = now;
    this.updatedAt = now;

    if (initialStore) {
      this.import(initialStore, true);
    }
  }

  get(address: string): string | null {
    return this.nicknames.get(address) ?? null;
  }

  set(address: string, nickname: string): void {
    if (!address || !nickname) {
      throw new Error('Address and nickname are required');
    }
    // Validate address looks like a Solana address (32-44 base58 chars)
    if (address.length < 32 || address.length > 44) {
      throw new Error('Invalid Solana address length');
    }
    // Trim and limit nickname length
    const trimmed = nickname.trim().slice(0, 50);
    if (trimmed.length === 0) {
      throw new Error('Nickname cannot be empty');
    }
    this.nicknames.set(address, trimmed);
    this.updatedAt = Date.now();
  }

  remove(address: string): void {
    if (this.nicknames.delete(address)) {
      this.updatedAt = Date.now();
    }
  }

  has(address: string): boolean {
    return this.nicknames.has(address);
  }

  getAll(): Map<string, string> {
    return new Map(this.nicknames);
  }

  count(): number {
    return this.nicknames.size;
  }

  export(): NicknameStore {
    return {
      version: '1.0.0',
      nicknames: Object.fromEntries(this.nicknames),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  import(store: NicknameStore, overwrite: boolean = false): void {
    if (!isValidNicknameStore(store)) {
      throw new Error('Invalid nickname store format');
    }

    for (const [address, nickname] of Object.entries(store.nicknames)) {
      if (overwrite || !this.nicknames.has(address)) {
        // Skip validation here since we trust the store format
        if (typeof nickname === 'string' && nickname.trim().length > 0) {
          this.nicknames.set(address, nickname.trim().slice(0, 50));
        }
      }
    }
    this.updatedAt = Date.now();
  }

  clear(): void {
    this.nicknames.clear();
    this.updatedAt = Date.now();
  }
}

/**
 * File-based nickname provider
 * Persists nicknames to a JSON file (for CLI use)
 */
export class FileNicknameProvider extends MemoryNicknameProvider {
  private filePath: string;
  private autoSave: boolean;

  /**
   * Create a file-based nickname provider
   * @param filePath - Path to the JSON file
   * @param autoSave - Whether to automatically save on every change (default: true)
   */
  constructor(filePath: string, autoSave: boolean = true) {
    super();
    this.filePath = filePath;
    this.autoSave = autoSave;
    this.loadFromFile();
  }

  /**
   * Load nicknames from the file
   */
  private loadFromFile(): void {
    if (!existsSync(this.filePath)) {
      return; // Start with empty store
    }

    try {
      const data = readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);

      if (isValidNicknameStore(parsed)) {
        this.import(parsed, true);
        this.createdAt = parsed.createdAt;
      } else {
        console.warn(`Invalid nickname store format in ${this.filePath}`);
      }
    } catch (error) {
      console.warn(`Failed to load nicknames from ${this.filePath}:`, error);
    }
  }

  /**
   * Save nicknames to the file
   */
  save(): void {
    try {
      const store = this.export();
      writeFileSync(this.filePath, JSON.stringify(store, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Failed to save nicknames to ${this.filePath}:`, error);
      throw error;
    }
  }

  override set(address: string, nickname: string): void {
    super.set(address, nickname);
    if (this.autoSave) {
      this.save();
    }
  }

  override remove(address: string): void {
    super.remove(address);
    if (this.autoSave) {
      this.save();
    }
  }

  override import(store: NicknameStore, overwrite: boolean = false): void {
    super.import(store, overwrite);
    if (this.autoSave) {
      this.save();
    }
  }

  override clear(): void {
    super.clear();
    if (this.autoSave) {
      this.save();
    }
  }

  /**
   * Get the file path
   */
  getFilePath(): string {
    return this.filePath;
  }
}

/**
 * Create a nickname provider from a file path
 * If the file doesn't exist, it will be created on first save
 */
export function createFileNicknameProvider(filePath: string): FileNicknameProvider {
  return new FileNicknameProvider(filePath);
}

/**
 * Create an empty in-memory nickname provider
 */
export function createMemoryNicknameProvider(): MemoryNicknameProvider {
  return new MemoryNicknameProvider();
}

/**
 * Load nicknames from a JSON string (for browser localStorage use)
 */
export function parseNicknameStore(json: string): NicknameStore {
  const parsed = JSON.parse(json);
  if (!isValidNicknameStore(parsed)) {
    throw new Error('Invalid nickname store format');
  }
  return parsed;
}

/**
 * Serialize a nickname store to JSON
 */
export function serializeNicknameStore(store: NicknameStore): string {
  return JSON.stringify(store, null, 2);
}
