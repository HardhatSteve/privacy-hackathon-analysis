import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaylinkLimiter, getClientIp, checkRateLimit } from "@/lib/ratelimit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const ip = getClientIp(request);
  const { allowed, remaining } = await checkRateLimit(getPaylinkLimiter, ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "X-RateLimit-Remaining": String(remaining ?? 0) },
      }
    );
  }

  const { id } = await params;

  const paylink = await prisma.paylink.findUnique({
    where: { id },
    select: {
      viewCount: true,
      expiresAt: true,
      _count: { select: { transactions: true } },
    },
  });

  if (!paylink) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const expired = paylink.expiresAt ? new Date() > paylink.expiresAt : false;

  return NextResponse.json({
    viewCount: paylink.viewCount,
    transactionCount: paylink._count.transactions,
    expired,
  });
}
