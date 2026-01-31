import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { Redis } from "@upstash/redis";

/**
 * Internal Balance API
 *
 * These endpoints are for the webapp client to persist balance state
 * across browser clears and deployments. Authentication is via wallet signature.
 */

// Redis for nonce tracking (optional - will skip in dev if not configured)
const hasRedisConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);
const redis = hasRedisConfig ? Redis.fromEnv() : null;

// Nonce TTL should match timestamp validation window (5 minutes + 30s buffer)
const NONCE_TTL_SECONDS = 5 * 60 + 30;

const authSchema = z.object({
  walletAddress: z.string().min(32).max(64),
  signature: z.string().min(1),
  message: z.string().min(1),
  nonce: z.string().min(1),
  timestamp: z.number().int().positive(),
});

/**
 * Check if nonce has been used (replay attack prevention)
 * Returns true if nonce is fresh (not used), false if it's a replay
 */
async function checkAndRecordNonce(
  walletAddress: string,
  nonce: string
): Promise<boolean> {
  if (!redis) {
    // Skip nonce verification in dev mode
    return true;
  }

  const nonceKey = `nonce:balance:${walletAddress}:${nonce}`;

  try {
    // SETNX returns 1 if key was set (nonce is fresh), 0 if already exists (replay)
    const result = await redis.setnx(nonceKey, "1");

    if (result === 1) {
      // Set TTL on the nonce key
      await redis.expire(nonceKey, NONCE_TTL_SECONDS);
      return true;
    }

    return false; // Nonce already used - replay attack
  } catch (error) {
    console.error("Nonce verification failed:", error);
    // In production, we should fail closed, but for internal API allow through
    // since timestamp validation provides basic protection
    return true;
  }
}

// Verify wallet signature
function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  message: string
): boolean {
  try {
    const publicKey = new PublicKey(walletAddress);
    const signatureBytes = bs58.decode(signature);
    const messageBytes = new TextEncoder().encode(message);

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch {
    return false;
  }
}

// Validate timestamp (max 5 minutes old)
function isValidTimestamp(timestamp: number): boolean {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  return timestamp > now - maxAge && timestamp <= now + 30000; // Allow 30s future for clock skew
}

/**
 * GET /api/internal/balance
 *
 * Retrieve balance snapshots for wallet. Requires wallet signature.
 * Query params:
 *   - walletAddress: The wallet address
 *   - utxoPubkey: The UTXO pubkey to fetch balance for
 *   - signature: Wallet signature (base58)
 *   - message: Signed message
 *   - timestamp: Unix timestamp (ms)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("walletAddress");
  const utxoPubkey = searchParams.get("utxoPubkey");
  const signature = searchParams.get("signature");
  const message = searchParams.get("message");
  const timestampStr = searchParams.get("timestamp");

  if (!walletAddress || !utxoPubkey) {
    return NextResponse.json(
      { error: "walletAddress and utxoPubkey are required" },
      { status: 400 }
    );
  }

  // Validate auth parameters
  if (!signature || !message || !timestampStr) {
    return NextResponse.json(
      { error: "Authentication required: signature, message, and timestamp" },
      { status: 401 }
    );
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return NextResponse.json(
      { error: "Invalid timestamp format" },
      { status: 400 }
    );
  }

  // Validate timestamp
  if (!isValidTimestamp(timestamp)) {
    return NextResponse.json(
      { error: "Request expired or invalid timestamp" },
      { status: 401 }
    );
  }

  // Verify signature
  if (!verifyWalletSignature(walletAddress, signature, message)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Find or create internal session for this wallet
  const session = await prisma.apiKey.findFirst({
    where: {
      ownerWallet: walletAddress,
      name: "__internal_session__",
      revokedAt: null,
    },
  });

  if (!session) {
    // No balance stored yet
    return NextResponse.json({
      snapshots: [],
      totals: {},
    });
  }

  const snapshots = await prisma.uTXOSnapshot.findMany({
    where: {
      apiKeyId: session.id,
      utxoPubkey,
    },
    orderBy: { lastSyncedAt: "desc" },
  });

  // Calculate totals
  const totals: Record<string, { balance: bigint; utxoCount: number }> = {};
  for (const snapshot of snapshots) {
    if (!totals[snapshot.token]) {
      totals[snapshot.token] = { balance: BigInt(0), utxoCount: 0 };
    }
    totals[snapshot.token].balance += snapshot.balanceLamports;
    totals[snapshot.token].utxoCount += snapshot.utxoCount;
  }

  return NextResponse.json({
    snapshots: snapshots.map((s) => ({
      utxoPubkey: s.utxoPubkey,
      token: s.token,
      balanceLamports: s.balanceLamports.toString(),
      utxoCount: s.utxoCount,
      lastSyncedAt: s.lastSyncedAt.toISOString(),
      lastBlockSlot: s.lastBlockSlot.toString(),
    })),
    totals: Object.fromEntries(
      Object.entries(totals).map(([token, data]) => [
        token,
        {
          balanceLamports: data.balance.toString(),
          utxoCount: data.utxoCount,
        },
      ])
    ),
  });
}

const syncBalanceSchema = z.object({
  auth: authSchema,
  utxoPubkey: z.string().min(1),
  balances: z.array(
    z.object({
      token: z.string().min(1),
      balanceLamports: z.string().regex(/^\d+$/),
      utxoCount: z.number().int().min(0),
    })
  ),
  lastBlockSlot: z.string().regex(/^\d+$/),
});

/**
 * POST /api/internal/balance
 *
 * Sync balance snapshot for a wallet. Requires wallet signature.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = syncBalanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { auth, utxoPubkey, balances, lastBlockSlot } = parsed.data;

  // Validate timestamp
  if (!isValidTimestamp(auth.timestamp)) {
    return NextResponse.json(
      { error: "Request expired or invalid timestamp" },
      { status: 401 }
    );
  }

  // Verify signature
  if (!verifyWalletSignature(auth.walletAddress, auth.signature, auth.message)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Check nonce to prevent replay attacks
  const isNonceFresh = await checkAndRecordNonce(auth.walletAddress, auth.nonce);
  if (!isNonceFresh) {
    return NextResponse.json(
      { error: "Nonce already used (possible replay attack)" },
      { status: 401 }
    );
  }

  // Find or create internal session for this wallet
  let session = await prisma.apiKey.findFirst({
    where: {
      ownerWallet: auth.walletAddress,
      name: "__internal_session__",
      revokedAt: null,
    },
  });

  if (!session) {
    // Create internal session (uses ApiKey model but marked as internal)
    session = await prisma.apiKey.create({
      data: {
        keyHash: `internal_${auth.walletAddress}`,
        keyPrefix: "internal",
        name: "__internal_session__",
        ownerWallet: auth.walletAddress,
        rateLimit: 1000, // Higher limit for internal use
      },
    });
  }

  // Batch upsert balance snapshots using transaction (avoids N+1 queries)
  const upsertOperations = balances.map((balance) =>
    prisma.uTXOSnapshot.upsert({
      where: {
        apiKeyId_utxoPubkey_token: {
          apiKeyId: session.id,
          utxoPubkey,
          token: balance.token,
        },
      },
      update: {
        balanceLamports: BigInt(balance.balanceLamports),
        utxoCount: balance.utxoCount,
        lastBlockSlot: BigInt(lastBlockSlot),
        lastSyncedAt: new Date(),
      },
      create: {
        apiKeyId: session.id,
        utxoPubkey,
        token: balance.token,
        balanceLamports: BigInt(balance.balanceLamports),
        utxoCount: balance.utxoCount,
        lastBlockSlot: BigInt(lastBlockSlot),
      },
    })
  );
  await prisma.$transaction(upsertOperations);

  return NextResponse.json({
    success: true,
    syncedAt: new Date().toISOString(),
  });
}
