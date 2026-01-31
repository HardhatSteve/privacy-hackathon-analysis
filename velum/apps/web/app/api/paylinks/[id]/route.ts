import { NextRequest, NextResponse } from "next/server";
import {
  getPaylinkLimiter,
  getClientIp,
  checkRateLimit,
} from "@/lib/ratelimit";
import { fetchPaylink } from "@/lib/paylinks";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ip = getClientIp(request);
    const { allowed } = await checkRateLimit(getPaylinkLimiter, ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const result = await fetchPaylink(id);

    if ("error" in result) {
      const message = result.error === "EXPIRED" ? "Paylink expired" : "Paylink not found";
      return NextResponse.json({ error: message }, { status: 404 });
    }

    // Cache paylink data for 60 seconds, allow stale for 5 minutes while revalidating
    return NextResponse.json(result.data, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Failed to fetch paylink:", error);
    return NextResponse.json({ error: "Paylink not found" }, { status: 404 });
  }
}
