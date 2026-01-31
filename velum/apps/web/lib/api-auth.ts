import { prisma } from "./db";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

/**
 * API Key Authentication Middleware
 *
 * Validates API keys via x-api-key header for external API access.
 * Keys are stored as SHA-256 hashes for security.
 */

// Redis instance for per-key rate limiting
const hasRedisConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);
const redis = hasRedisConfig ? Redis.fromEnv() : null;

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Generate a new API key
 * Format: pk_live_<32 random hex chars>
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const randomPart = randomBytes(16).toString("hex");
  const key = `pk_live_${randomPart}`;
  const prefix = key.substring(0, 12); // "pk_live_xxxx"
  const hash = hashApiKey(key);
  return { key, prefix, hash };
}

/**
 * Validate API key from request headers
 * Returns the ApiKey record if valid, null otherwise
 */
export async function validateApiKey(request: Request) {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return { error: "Missing x-api-key header", status: 401 };
  }

  const keyHash = hashApiKey(apiKey);

  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { keyHash },
  });

  if (!apiKeyRecord) {
    return { error: "Invalid API key", status: 401 };
  }

  if (apiKeyRecord.revokedAt) {
    return { error: "API key has been revoked", status: 401 };
  }

  // Update last used timestamp (non-blocking)
  prisma.apiKey
    .update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {
      // Ignore errors for non-critical update
    });

  return { apiKey: apiKeyRecord };
}

/**
 * Rate limit check for API key
 * Uses per-key rate limits from the database
 */
export async function checkApiKeyRateLimit(
  apiKeyId: string,
  rateLimit: number
): Promise<{ allowed: boolean; remaining?: number }> {
  if (!redis) {
    return { allowed: true };
  }

  try {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(rateLimit, "60 s"),
      analytics: true,
      prefix: `ratelimit:apikey:${apiKeyId}`,
    });

    const result = await limiter.limit(apiKeyId);
    return {
      allowed: result.success,
      remaining: result.remaining,
    };
  } catch (error) {
    console.error("API key rate limit check failed (allowing request):", error);
    return { allowed: true };
  }
}

/**
 * Combined authentication and rate limit middleware
 * Returns either an error response or the validated API key
 */
export async function authenticateApiRequest(request: Request) {
  const validation = await validateApiKey(request);

  if ("error" in validation) {
    return {
      error: NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      ),
    };
  }

  const { apiKey } = validation;

  // Check per-key rate limit
  const rateLimitResult = await checkApiKeyRateLimit(apiKey.id, apiKey.rateLimit);

  if (!rateLimitResult.allowed) {
    return {
      error: NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: 60,
        },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Remaining": "0",
          },
        }
      ),
    };
  }

  return {
    apiKey,
    headers: {
      "X-RateLimit-Remaining": String(rateLimitResult.remaining ?? "unlimited"),
    },
  };
}
