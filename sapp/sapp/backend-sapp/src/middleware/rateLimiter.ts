import type { Request, Response, NextFunction } from 'express';

// MARK: - Rate Limiter Types

interface RateLimitRecord {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

interface RateLimiterOptions {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Maximum requests per window
  message?: string;        // Custom error message
  keyGenerator?: (req: Request) => string;  // Custom key generator
  skipFailedRequests?: boolean;  // Don't count failed requests
  skipSuccessfulRequests?: boolean;  // Don't count successful requests
}

// MARK: - In-Memory Store

// Simple in-memory store for rate limiting
// In production, consider using Redis for distributed rate limiting
class RateLimitStore {
  private store: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  get(key: string): RateLimitRecord | undefined {
    return this.store.get(key);
  }

  set(key: string, record: RateLimitRecord): void {
    this.store.set(key, record);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      // Remove entries older than 1 hour
      if (now - record.lastRequest > 3600000) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Shared store instance
const store = new RateLimitStore();

// MARK: - Rate Limiter Factory

export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    keyGenerator = defaultKeyGenerator,
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = store.get(key);

    // Initialize or reset if window expired
    if (!record || now - record.firstRequest > windowMs) {
      record = {
        count: 0,
        firstRequest: now,
        lastRequest: now,
      };
    }

    // Check if limit exceeded
    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.firstRequest + windowMs - now) / 1000);

      res.set('Retry-After', String(retryAfter));
      res.set('X-RateLimit-Limit', String(maxRequests));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(Math.ceil((record.firstRequest + windowMs) / 1000)));

      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message,
        retryAfter,
      });
    }

    // Set rate limit headers
    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - record.count - 1)));
    res.set('X-RateLimit-Reset', String(Math.ceil((record.firstRequest + windowMs) / 1000)));

    // Increment count (unless configured to skip based on response)
    if (!skipFailedRequests && !skipSuccessfulRequests) {
      record.count++;
      record.lastRequest = now;
      store.set(key, record);
    } else {
      // Use response finish event to conditionally count
      const originalEnd = res.end.bind(res);
      res.end = function(chunk?: any, encoding?: any, callback?: any) {
        const shouldSkip =
          (skipFailedRequests && res.statusCode >= 400) ||
          (skipSuccessfulRequests && res.statusCode < 400);

        if (!shouldSkip) {
          record!.count++;
          record!.lastRequest = Date.now();
          store.set(key, record!);
        }

        return originalEnd(chunk, encoding, callback);
      };
    }

    next();
  };
}

// MARK: - Default Key Generator

function defaultKeyGenerator(req: Request): string {
  // Use IP address as default key
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim()
    : req.ip || req.socket.remoteAddress || 'unknown';

  return `rate-limit:${ip}`;
}

// MARK: - Pre-configured Rate Limiters

/**
 * Standard API rate limiter
 * 100 requests per 15 minutes
 */
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

/**
 * Strict rate limiter for auth endpoints
 * 5 requests per hour per IP
 */
export const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again after an hour',
  skipSuccessfulRequests: false,
});

/**
 * Registration rate limiter
 * 15 registrations per 2 minutes per IP (more lenient for development)
 */
export const registrationLimiter = createRateLimiter({
  windowMs: 2 * 60 * 1000,  // 2 minutes
  maxRequests: 15,
  message: 'Too many registration attempts, please try again in 2 minutes',
});

/**
 * Search rate limiter
 * 30 searches per minute
 */
export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 30,
  message: 'Too many search requests, please slow down',
});

/**
 * Handle check rate limiter
 * 20 checks per minute
 */
export const handleCheckLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 20,
  message: 'Too many handle check requests, please slow down',
});

// MARK: - User-specific Rate Limiter

/**
 * Create a rate limiter that uses user identifier (email/handle) instead of IP
 */
export function createUserRateLimiter(options: Omit<RateLimiterOptions, 'keyGenerator'> & {
  userKeyField: string;  // Request body field containing user identifier
}) {
  const { userKeyField, ...rest } = options;

  return createRateLimiter({
    ...rest,
    keyGenerator: (req: Request) => {
      const userKey = req.body?.[userKeyField] || req.query?.[userKeyField] || 'anonymous';
      return `rate-limit:user:${userKey}`;
    },
  });
}

export default {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  registrationLimiter,
  searchLimiter,
  handleCheckLimiter,
  createUserRateLimiter,
};
