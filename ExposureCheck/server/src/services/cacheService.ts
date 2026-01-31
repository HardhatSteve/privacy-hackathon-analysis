import type { ExposureResult, CacheEntry } from '../types/exposure.js';

const cache = new Map<string, CacheEntry>();

const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300') * 1000; // Convert to ms

export function getCachedResult(address: string): ExposureResult | null {
  const entry = cache.get(address.toLowerCase());

  if (!entry) {
    return null;
  }

  // Check if cache is expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(address.toLowerCase());
    return null;
  }

  return { ...entry.result, cached: true };
}

export function setCachedResult(address: string, result: ExposureResult): void {
  cache.set(address.toLowerCase(), {
    result,
    timestamp: Date.now(),
  });
}

export function clearCache(): void {
  cache.clear();
}

export function getCacheStats(): { size: number; ttl: number } {
  return {
    size: cache.size,
    ttl: CACHE_TTL / 1000,
  };
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 60000); // Run every minute
