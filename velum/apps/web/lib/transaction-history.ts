/**
 * Transaction History Module
 *
 * Provides IndexedDB-based storage for transaction history.
 * Data is stored locally per wallet address, never sent to server.
 * Limits to 100 most recent transactions.
 */

export type TransactionType = "deposit" | "withdraw";
export type TransactionStatus = "pending" | "confirmed" | "failed";
export type TransactionToken = "SOL" | "USDC" | "USDT";

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  token: TransactionToken;
  amount: string; // Human-readable amount (e.g., "1.5")
  amountRaw: string; // Raw amount in base units
  timestamp: number;
  signature: string;
  status: TransactionStatus;
  paylinkId?: string; // For deposits to paylinks
  walletAddress: string; // Owner wallet address
}

const DB_NAME = "privacy-paylink-history";
const DB_VERSION = 1;
const STORE_NAME = "transactions";
const MAX_TRANSACTIONS = 100;

/**
 * Check if IndexedDB is available in the current environment
 */
function isIndexedDBAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return "indexedDB" in window;
}

/**
 * Open the transaction history database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open transaction history database"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store with id as key
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        // Create indexes for filtering and sorting
        store.createIndex("walletAddress", "walletAddress", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("token", "token", { unique: false });
        store.createIndex("wallet_timestamp", ["walletAddress", "timestamp"], {
          unique: false,
        });
      }
    };
  });
}

/**
 * Generate a unique transaction ID
 */
function generateTransactionId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Add a transaction to history
 */
export async function addTransaction(
  transaction: Omit<TransactionRecord, "id">
): Promise<TransactionRecord> {
  if (!isIndexedDBAvailable()) {
    throw new Error("IndexedDB is not available");
  }

  const record: TransactionRecord = {
    ...transaction,
    id: generateTransactionId(),
  };

  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const request = store.add(record);

      request.onsuccess = () => {
        resolve(record);
      };

      request.onerror = () => {
        reject(new Error("Failed to add transaction to history"));
      };

      tx.oncomplete = () => {
        db.close();
        // Prune old transactions asynchronously
        pruneOldTransactions(transaction.walletAddress);
      };
    });
  } catch (error) {
    console.warn("Failed to add transaction:", error);
    throw error;
  }
}

/**
 * Update a transaction's status
 */
export async function updateTransactionStatus(
  id: string,
  status: TransactionStatus
): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const record = getRequest.result as TransactionRecord | undefined;
        if (record) {
          record.status = status;
          store.put(record);
        }
      };

      tx.oncomplete = () => {
        db.close();
        resolve();
      };

      tx.onerror = () => {
        reject(new Error("Failed to update transaction status"));
      };
    });
  } catch (error) {
    console.warn("Failed to update transaction status:", error);
  }
}

/**
 * Get transactions for a wallet address with optional filters
 */
export async function getTransactions(
  walletAddress: string,
  filters?: {
    type?: TransactionType;
    token?: TransactionToken;
  }
): Promise<TransactionRecord[]> {
  if (!isIndexedDBAvailable()) return [];

  try {
    const db = await openDatabase();

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("walletAddress");

      const request = index.getAll(walletAddress);

      request.onsuccess = () => {
        let transactions = request.result as TransactionRecord[];

        // Apply filters
        if (filters?.type) {
          transactions = transactions.filter((t) => t.type === filters.type);
        }
        if (filters?.token) {
          transactions = transactions.filter((t) => t.token === filters.token);
        }

        // Sort by timestamp descending (newest first)
        transactions.sort((a, b) => b.timestamp - a.timestamp);

        resolve(transactions);
      };

      request.onerror = () => {
        resolve([]);
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    return [];
  }
}

/**
 * Clear all transactions for a wallet address
 */
export async function clearTransactions(walletAddress: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("walletAddress");

      const request = index.openCursor(walletAddress);

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      tx.oncomplete = () => {
        db.close();
        resolve();
      };

      tx.onerror = () => {
        reject(new Error("Failed to clear transaction history"));
      };
    });
  } catch (error) {
    console.warn("Failed to clear transactions:", error);
  }
}

/**
 * Prune old transactions to keep only the most recent MAX_TRANSACTIONS
 */
async function pruneOldTransactions(walletAddress: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDatabase();

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("walletAddress");

      const request = index.getAll(walletAddress);

      request.onsuccess = () => {
        const transactions = request.result as TransactionRecord[];

        if (transactions.length > MAX_TRANSACTIONS) {
          // Sort by timestamp ascending (oldest first)
          transactions.sort((a, b) => a.timestamp - b.timestamp);

          // Delete oldest transactions
          const toDelete = transactions.slice(
            0,
            transactions.length - MAX_TRANSACTIONS
          );
          for (const record of toDelete) {
            store.delete(record.id);
          }
        }
      };

      tx.oncomplete = () => {
        db.close();
        resolve();
      };

      tx.onerror = () => {
        resolve();
      };
    });
  } catch {
    // Ignore pruning errors
  }
}

/**
 * Get transaction count for a wallet
 */
export async function getTransactionCount(
  walletAddress: string
): Promise<number> {
  if (!isIndexedDBAvailable()) return 0;

  try {
    const db = await openDatabase();

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("walletAddress");

      const request = index.count(walletAddress);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(0);
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    return 0;
  }
}
