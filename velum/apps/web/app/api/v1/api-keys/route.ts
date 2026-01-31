import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateApiKey, hashApiKey } from "@/lib/api-auth";
import { getClientIp, checkRateLimit, createPaylinkLimiter } from "@/lib/ratelimit";
import { verifyWalletSignature } from "@/lib/wallet-auth";

/**
 * POST /api/v1/api-keys
 *
 * Create a new API key. Requires wallet signature verification.
 * This is the only endpoint that doesn't require an API key.
 *
 * Body:
 *   - walletAddress: The owner's wallet public key
 *   - signature: Signed message proving wallet ownership
 *   - message: The message that was signed (must include nonce)
 *   - name: Optional name for the API key
 */

const createApiKeySchema = z.object({
  walletAddress: z.string().min(32).max(64),
  signature: z.string().min(1),
  message: z.string().min(1),
  name: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  // Rate limit by IP (reusing paylink limiter)
  const ip = getClientIp(request);
  const rateLimitResult = await checkRateLimit(createPaylinkLimiter, ip);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { walletAddress, signature, message, name } = parsed.data;

  // Verify message format contains expected prefix and a nonce
  const expectedPrefix = "Welcome to Velum";
  if (!message.startsWith(expectedPrefix)) {
    return NextResponse.json(
      { error: "Invalid message format. Must start with 'Welcome to Velum'" },
      { status: 400 }
    );
  }

  // Server-side signature verification - proves wallet ownership
  if (!verifyWalletSignature(walletAddress, signature, message)) {
    return NextResponse.json(
      { error: "Invalid signature. Please sign the message with your wallet." },
      { status: 401 }
    );
  }

  // Check existing API keys for this wallet
  const existingKeys = await prisma.apiKey.count({
    where: {
      ownerWallet: walletAddress,
      revokedAt: null,
    },
  });

  // Limit to 5 active API keys per wallet
  if (existingKeys >= 5) {
    return NextResponse.json(
      { error: "Maximum number of API keys (5) reached for this wallet" },
      { status: 400 }
    );
  }

  // Generate new API key
  const { key, prefix, hash } = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      keyHash: hash,
      keyPrefix: prefix,
      name: name || `API Key ${existingKeys + 1}`,
      ownerWallet: walletAddress,
    },
  });

  return NextResponse.json(
    {
      success: true,
      apiKey: {
        id: apiKey.id,
        key, // Only returned once at creation!
        prefix: apiKey.keyPrefix,
        name: apiKey.name,
        createdAt: apiKey.createdAt.toISOString(),
        rateLimit: apiKey.rateLimit,
      },
      warning: "Save this API key securely. It will not be shown again.",
    },
    { status: 201 }
  );
}

/**
 * GET /api/v1/api-keys
 *
 * List API keys for authenticated user (by API key).
 * Only returns metadata, not the actual keys.
 */
export async function GET(request: Request) {
  const apiKeyHeader = request.headers.get("x-api-key");
  if (!apiKeyHeader) {
    return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 });
  }

  const keyHash = hashApiKey(apiKeyHeader);
  const currentKey = await prisma.apiKey.findUnique({
    where: { keyHash },
  });

  if (!currentKey || currentKey.revokedAt) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  // Get all keys for this wallet
  const keys = await prisma.apiKey.findMany({
    where: { ownerWallet: currentKey.ownerWallet },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    apiKeys: keys.map((k) => ({
      id: k.id,
      prefix: k.keyPrefix,
      name: k.name,
      createdAt: k.createdAt.toISOString(),
      lastUsedAt: k.lastUsedAt?.toISOString(),
      revokedAt: k.revokedAt?.toISOString(),
      rateLimit: k.rateLimit,
      isCurrent: k.id === currentKey.id,
    })),
  });
}

/**
 * DELETE /api/v1/api-keys
 *
 * Revoke an API key.
 * Query params:
 *   - id: The API key ID to revoke
 */
export async function DELETE(request: Request) {
  const apiKeyHeader = request.headers.get("x-api-key");
  if (!apiKeyHeader) {
    return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 });
  }

  const keyHash = hashApiKey(apiKeyHeader);
  const currentKey = await prisma.apiKey.findUnique({
    where: { keyHash },
  });

  if (!currentKey || currentKey.revokedAt) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const keyIdToRevoke = searchParams.get("id");

  if (!keyIdToRevoke) {
    return NextResponse.json(
      { error: "id query parameter is required" },
      { status: 400 }
    );
  }

  // Find the key to revoke
  const keyToRevoke = await prisma.apiKey.findUnique({
    where: { id: keyIdToRevoke },
  });

  if (!keyToRevoke) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  // Verify ownership (must be same wallet)
  if (keyToRevoke.ownerWallet !== currentKey.ownerWallet) {
    return NextResponse.json(
      { error: "Not authorized to revoke this API key" },
      { status: 403 }
    );
  }

  if (keyToRevoke.revokedAt) {
    return NextResponse.json(
      { error: "API key is already revoked" },
      { status: 400 }
    );
  }

  // Revoke the key
  await prisma.apiKey.update({
    where: { id: keyIdToRevoke },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    message: "API key revoked successfully",
  });
}
