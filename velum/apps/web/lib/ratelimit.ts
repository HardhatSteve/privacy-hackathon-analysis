import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting configuration using Upstash Redis
 *
 * Security policy:
 * - Production: Fail-closed. If Redis is unavailable, requests are rejected.
 * - Development: Fail-open. Allows requests without rate limiting for testing.
 */

const isProduction = process.env.NODE_ENV === "production";

// Check if Redis env vars are configured
const hasRedisConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Only create Redis instance if env vars are set
const redis = hasRedisConfig ? Redis.fromEnv() : null;

/**
 * Rate limiter for paylink creation (POST /api/paylinks)
 * More restrictive: 10 requests per 60 seconds per IP
 * Returns null if Redis is not configured (dev mode)
 */
export const createPaylinkLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: true,
      prefix: "ratelimit:paylink:create",
    })
  : null;

/**
 * Rate limiter for paylink retrieval (GET /api/paylinks/[id])
 * More permissive: 60 requests per 60 seconds per IP
 * Returns null if Redis is not configured (dev mode)
 */
export const getPaylinkLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60 s"),
      analytics: true,
      prefix: "ratelimit:paylink:get",
    })
  : null;

/**
 * Extract client IP address from request headers
 * Handles proxy headers (x-forwarded-for) for deployments behind load balancers
 */
export function getClientIp(request: Request): string {
  // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "anonymous";
  return ip;
}

/**
 * Check rate limit with environment-aware strategy
 * - Production: Fail-closed. Rejects requests if Redis is unavailable.
 * - Development: Fail-open. Allows requests for testing convenience.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ allowed: boolean; remaining?: number; error?: string }> {
  // If limiter is not configured
  if (!limiter) {
    if (isProduction) {
      // Fail-closed in production: reject if rate limiter not configured
      console.error("Rate limiter not configured in production - rejecting request");
      return { allowed: false, error: "Rate limiting unavailable" };
    }
    // Fail-open in development: allow all requests
    return { allowed: true };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
    };
  } catch (error) {
    if (isProduction) {
      // Fail-closed in production: reject if Redis fails
      console.error("Rate limit check failed in production - rejecting request:", error);
      return { allowed: false, error: "Rate limiting temporarily unavailable" };
    }
    // Fail-open in development: allow request if Redis is unavailable
    console.error("Rate limit check failed (allowing request in dev mode):", error);
    return { allowed: true };
  }
}
