import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Falls back to always-false if env var is missing.
 */
function secureCompare(a: string | null, b: string | undefined): boolean {
  if (!a || !b) return false;

  // Ensure both buffers are same length to use timingSafeEqual
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) return false;

  return timingSafeEqual(bufA, bufB);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedAuth = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : undefined;

  if (!secureCompare(authHeader, expectedAuth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await prisma.paylink.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron cleanup-paylinks failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Cleanup operation failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
