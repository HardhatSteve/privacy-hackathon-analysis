import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

/**
 * GET /api/v1/balance
 *
 * Retrieve balance snapshots for authenticated API key.
 * Query params:
 *   - utxoPubkey: Filter by specific UTXO pubkey
 *   - token: Filter by token (SOL, USDC, USDT)
 */
export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const utxoPubkey = searchParams.get("utxoPubkey");
  const token = searchParams.get("token");

  const where: Record<string, unknown> = { apiKeyId: auth.apiKey.id };
  if (utxoPubkey) where.utxoPubkey = utxoPubkey;
  if (token) where.token = token;

  const snapshots = await prisma.uTXOSnapshot.findMany({
    where,
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

  return NextResponse.json(
    {
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
    },
    { headers: auth.headers }
  );
}

const syncBalanceSchema = z.object({
  utxoPubkey: z.string().min(1),
  token: z.string().min(1),
  balanceLamports: z.string().regex(/^\d+$/),
  utxoCount: z.number().int().min(0),
  utxoData: z.string().optional(),
  lastBlockSlot: z.string().regex(/^\d+$/),
});

/**
 * POST /api/v1/balance
 *
 * Sync/update balance snapshot for a UTXO pubkey.
 * This endpoint is called by the client after scanning the blockchain.
 */
export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return auth.error;

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

  const { utxoPubkey, token, balanceLamports, utxoCount, utxoData, lastBlockSlot } =
    parsed.data;

  const snapshot = await prisma.uTXOSnapshot.upsert({
    where: {
      apiKeyId_utxoPubkey_token: {
        apiKeyId: auth.apiKey.id,
        utxoPubkey,
        token,
      },
    },
    update: {
      balanceLamports: BigInt(balanceLamports),
      utxoCount,
      utxoData,
      lastBlockSlot: BigInt(lastBlockSlot),
      lastSyncedAt: new Date(),
    },
    create: {
      apiKeyId: auth.apiKey.id,
      utxoPubkey,
      token,
      balanceLamports: BigInt(balanceLamports),
      utxoCount,
      utxoData,
      lastBlockSlot: BigInt(lastBlockSlot),
    },
  });

  return NextResponse.json(
    {
      success: true,
      snapshot: {
        utxoPubkey: snapshot.utxoPubkey,
        token: snapshot.token,
        balanceLamports: snapshot.balanceLamports.toString(),
        utxoCount: snapshot.utxoCount,
        lastSyncedAt: snapshot.lastSyncedAt.toISOString(),
      },
    },
    { status: 200, headers: auth.headers }
  );
}

/**
 * DELETE /api/v1/balance
 *
 * Delete balance snapshot(s).
 * Query params:
 *   - utxoPubkey: Required - the UTXO pubkey to delete
 *   - token: Optional - specific token to delete (otherwise all tokens)
 */
export async function DELETE(request: Request) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const utxoPubkey = searchParams.get("utxoPubkey");
  const token = searchParams.get("token");

  if (!utxoPubkey) {
    return NextResponse.json(
      { error: "utxoPubkey query parameter is required" },
      { status: 400 }
    );
  }

  const where: Record<string, unknown> = {
    apiKeyId: auth.apiKey.id,
    utxoPubkey,
  };
  if (token) where.token = token;

  const result = await prisma.uTXOSnapshot.deleteMany({ where });

  return NextResponse.json(
    { success: true, deleted: result.count },
    { headers: auth.headers }
  );
}
