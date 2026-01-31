/**
 * Circuit Cache Module
 *
 * Provides IndexedDB-based caching for ZK circuit files.
 * Supports versioning for cache invalidation when circuit files are updated.
 */

import {
  CIRCUIT_CACHE_CONFIG,
  CIRCUIT_VERSION,
  type CircuitFileType,
} from "./config/circuits";

interface CircuitMetadata {
  version: string;
  cachedAt: number;
}

interface CachedCircuitFile {
  data: ArrayBuffer;
  version: string;
}

/**
 * Check if IndexedDB is available in the current environment
 */
function isIndexedDBAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return "indexedDB" in window;
}

/**
 * Open the circuit cache database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(
      CIRCUIT_CACHE_CONFIG.dbName,
      CIRCUIT_CACHE_CONFIG.dbVersion
    );

    request.onerror = () => {
      reject(new Error("Failed to open circuit cache database"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(CIRCUIT_CACHE_CONFIG.storeName)) {
        db.createObjectStore(CIRCUIT_CACHE_CONFIG.storeName);
      }
    };
  });
}

/**
 * Get cached circuit file from IndexedDB
 */
export async function getCachedCircuit(
  fileType: CircuitFileType
): Promise<ArrayBuffer | null> {
  if (!isIndexedDBAvailable()) return null;

  try {
    const db = await openDatabase();
    const key =
      fileType === "wasm"
        ? CIRCUIT_CACHE_CONFIG.keys.wasm
        : CIRCUIT_CACHE_CONFIG.keys.zkey;

    return new Promise((resolve) => {
      const transaction = db.transaction(
        CIRCUIT_CACHE_CONFIG.storeName,
        "readonly"
      );
      const store = transaction.objectStore(CIRCUIT_CACHE_CONFIG.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const cached = request.result as CachedCircuitFile | undefined;

        // Check if cached version matches current version
        if (cached && cached.version === CIRCUIT_VERSION && cached.data) {
          resolve(cached.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    return null;
  }
}

/**
 * Store circuit file in IndexedDB cache
 */
export async function cacheCircuit(
  fileType: CircuitFileType,
  data: ArrayBuffer
): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDatabase();
    const key =
      fileType === "wasm"
        ? CIRCUIT_CACHE_CONFIG.keys.wasm
        : CIRCUIT_CACHE_CONFIG.keys.zkey;

    const cached: CachedCircuitFile = {
      data,
      version: CIRCUIT_VERSION,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        CIRCUIT_CACHE_CONFIG.storeName,
        "readwrite"
      );
      const store = transaction.objectStore(CIRCUIT_CACHE_CONFIG.storeName);
      const request = store.put(cached, key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to cache ${fileType} circuit file`));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.warn(`Failed to cache ${fileType} circuit:`, error);
  }
}

/**
 * Check if both circuit files are cached with the correct version
 */
export async function areCircuitsCached(): Promise<boolean> {
  if (!isIndexedDBAvailable()) return false;

  try {
    const [wasm, zkey] = await Promise.all([
      getCachedCircuit("wasm"),
      getCachedCircuit("zkey"),
    ]);

    return wasm !== null && zkey !== null;
  } catch {
    return false;
  }
}

/**
 * Check if cached circuits exist but have a stale (different) version
 * Returns true if cache exists but version doesn't match current CIRCUIT_VERSION
 */
export async function isCacheStale(): Promise<boolean> {
  if (!isIndexedDBAvailable()) return false;

  try {
    const db = await openDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction(
        CIRCUIT_CACHE_CONFIG.storeName,
        "readonly"
      );
      const store = transaction.objectStore(CIRCUIT_CACHE_CONFIG.storeName);
      const request = store.get(CIRCUIT_CACHE_CONFIG.keys.wasm);

      request.onsuccess = () => {
        const cached = request.result as CachedCircuitFile | undefined;

        // Stale if cache exists but version doesn't match
        if (cached && cached.data && cached.version !== CIRCUIT_VERSION) {
          resolve(true);
        } else {
          resolve(false);
        }
      };

      request.onerror = () => {
        resolve(false);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    return false;
  }
}

/**
 * Clear all cached circuit files
 */
export async function clearCircuitCache(): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        CIRCUIT_CACHE_CONFIG.storeName,
        "readwrite"
      );
      const store = transaction.objectStore(CIRCUIT_CACHE_CONFIG.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to clear circuit cache"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.warn("Failed to clear circuit cache:", error);
  }
}

/**
 * Get cache metadata including version and cache time
 */
export async function getCacheMetadata(): Promise<CircuitMetadata | null> {
  if (!isIndexedDBAvailable()) return null;

  try {
    const db = await openDatabase();

    return new Promise((resolve) => {
      const transaction = db.transaction(
        CIRCUIT_CACHE_CONFIG.storeName,
        "readonly"
      );
      const store = transaction.objectStore(CIRCUIT_CACHE_CONFIG.storeName);
      const request = store.get(CIRCUIT_CACHE_CONFIG.keys.metadata);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    return null;
  }
}

/**
 * Update cache metadata after successful caching
 */
export async function updateCacheMetadata(): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDatabase();

    const metadata: CircuitMetadata = {
      version: CIRCUIT_VERSION,
      cachedAt: Date.now(),
    };

    return new Promise((resolve) => {
      const transaction = db.transaction(
        CIRCUIT_CACHE_CONFIG.storeName,
        "readwrite"
      );
      const store = transaction.objectStore(CIRCUIT_CACHE_CONFIG.storeName);
      store.put(metadata, CIRCUIT_CACHE_CONFIG.keys.metadata);

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // Ignore metadata update failures
  }
}
