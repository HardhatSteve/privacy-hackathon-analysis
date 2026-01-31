import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { apiError } from "@/lib/api-errors";

/**
 * GET /api/v1/transactions
 *
 * Retrieve transaction history for authenticated API key.
 * Query params:
 *   - utxoPubkey: Filter by UTXO pubkey
 *   - type: Filter by type (deposit, withdraw)
 *   - token: Filter by token (SOL, USDC, USDT)
 *   - limit: Max results (default 50, max 100)
 *   - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) {
    return apiError("UNAUTHORIZED", "Invalid or missing API key", 401);
  }

  const { searchParams } = new URL(request.url);
  const utxoPubkey = searchParams.get("utxoPubkey");
  const type = searchParams.get("type");
  const token = searchParams.get("token");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const where: Record<string, unknown> = { apiKeyId: auth.apiKey.id };
  if (utxoPubkey) where.utxoPubkey = utxoPubkey;
  if (type) where.type = type;
  if (token) where.token = token;

  const [transactions, total] = await Promise.all([
    prisma.transactionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        paylink: {
          select: {
            id: true,
            memo: true,
          },
        },
      },
    }),
    prisma.transactionLog.count({ where }),
  ]);

  return Response.json(
    {
      transactions: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        token: tx.token,
        amountLamports: tx.amountLamports.toString(),
        signature: tx.signature,
        status: tx.status,
        utxoPubkey: tx.utxoPubkey,
        paylinkId: tx.paylinkId,
        paylinkMemo: tx.paylink?.memo ?? null,
        createdAt: tx.createdAt.toISOString(),
      })),
      total,
      limit,
      offset,
    },
    { headers: auth.headers }
  );
}

const createTransactionSchema = z.object({
  type: z.enum(["deposit", "withdraw"]),
  token: z.string().min(1),
  amountLamports: z.string().regex(/^\d+$/),
  signature: z.string().min(1),
  status: z.enum(["pending", "confirmed", "failed"]).optional(),
  utxoPubkey: z.string().optional(),
  paylinkId: z.string().optional(),
});

/**
 * POST /api/v1/transactions
 *
 * Log a new transaction.
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) {
    return apiError("UNAUTHORIZED", "Invalid or missing API key", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = createTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid request data", 400, {
      details: { issues: parsed.error.errors },
    });
  }

  const { type, token, amountLamports, signature, status, utxoPubkey, paylinkId } =
    parsed.data;

  // Check for duplicate signature
  const existing = await prisma.transactionLog.findUnique({
    where: { signature },
  });

  if (existing) {
    return apiError("CONFLICT", "Transaction with this signature already exists", 409);
  }

  // Validate paylinkId if provided
  if (paylinkId) {
    const paylink = await prisma.paylink.findUnique({ where: { id: paylinkId } });
    if (!paylink) {
      return apiError("VALIDATION_ERROR", "Invalid paylinkId", 400);
    }
  }

  const transaction = await prisma.transactionLog.create({
    data: {
      apiKeyId: auth.apiKey.id,
      type,
      token,
      amountLamports: BigInt(amountLamports),
      signature,
      status: status || "confirmed",
      utxoPubkey,
      paylinkId,
    },
  });

  return Response.json(
    {
      id: transaction.id,
      signature: transaction.signature,
      status: transaction.status,
      createdAt: transaction.createdAt.toISOString(),
    },
    { status: 201, headers: auth.headers }
  );
}
