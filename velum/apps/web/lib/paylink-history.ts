export type PaylinkToken = "ANY" | "SOL" | "USDC" | "USDT";

export interface PaylinkRecord {
  id: string;
  token: PaylinkToken;
  amountLamports: string | null;
  memo: string | null;
  createdAt: number;
  expiresAt: number | null;
  walletAddress: string;
  url: string;
}

const DB_NAME = "velum-paylinks";
const DB_VERSION = 1;
const STORE_NAME = "paylinks";

function isIndexedDBAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return "indexedDB" in window;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open paylink database"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("walletAddress", "walletAddress", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
}

/** Store a paylink record in IndexedDB */
export async function addPaylink(record: PaylinkRecord): Promise<void> {
  if (!isIndexedDBAvailable()) {
    throw new Error("IndexedDB is not available");
  }

  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const request = store.put(record);

      request.onerror = () => {
        reject(new Error("Failed to add paylink record"));
      };

      tx.oncomplete = () => {
        db.close();
        resolve();
      };

      tx.onerror = () => {
        reject(new Error("Failed to add paylink record"));
      };
    });
  } catch (error) {
    console.warn("Failed to add paylink:", error);
    throw error;
  }
}

/** Get all paylink records for a wallet, sorted by createdAt descending */
export async function getPaylinks(
  walletAddress: string
): Promise<PaylinkRecord[]> {
  if (!isIndexedDBAvailable()) return [];

  try {
    const db = await openDatabase();

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("walletAddress");

      const request = index.getAll(walletAddress);

      request.onsuccess = () => {
        const records = request.result as PaylinkRecord[];
        records.sort((a, b) => b.createdAt - a.createdAt);
        resolve(records);
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

/** Delete all paylink records for a wallet */
export async function clearPaylinks(walletAddress: string): Promise<void> {
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
        reject(new Error("Failed to clear paylink records"));
      };
    });
  } catch (error) {
    console.warn("Failed to clear paylinks:", error);
  }
}
