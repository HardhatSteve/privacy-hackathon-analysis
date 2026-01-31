import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaylinkLimiter, getClientIp, checkRateLimit } from "@/lib/ratelimit";
import { z } from "zod";

const requestSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(50), // Max 50 paylinks per batch
});

/**
 * POST /api/paylinks/batch-status
 *
 * Batch fetch status for multiple paylinks to avoid N+1 queries.
 * Returns status for all requested paylinks in a single response.
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request);
  const { allowed, remaining, error: rateLimitError } = await checkRateLimit(getPaylinkLimiter, ip);
  if (!allowed) {
    return NextResponse.json(
      { error: rateLimitError || "Too many requests" },
      {
        status: 429,
        headers: { "X-RateLimit-Remaining": String(remaining ?? 0) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { ids } = parsed.data;

  // Batch query - single database call for all paylinks
  const paylinks = await prisma.paylink.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      viewCount: true,
      expiresAt: true,
      _count: { select: { transactions: true } },
    },
  });

  const now = new Date();

  // Build response map
  const statusMap: Record<
    string,
    { viewCount: number; transactionCount: number; expired: boolean }
  > = {};

  for (const paylink of paylinks) {
    statusMap[paylink.id] = {
      viewCount: paylink.viewCount,
      transactionCount: paylink._count.transactions,
      expired: paylink.expiresAt ? now > paylink.expiresAt : false,
    };
  }

  return NextResponse.json({ statuses: statusMap });
}
