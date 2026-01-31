import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createPaylinkLimiter,
  getClientIp,
  checkRateLimit,
} from "@/lib/ratelimit";
import { CreatePaylinkSchema, createPaylink } from "@/lib/paylinks";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed } = await checkRateLimit(createPaylinkLimiter, ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const data = CreatePaylinkSchema.parse(body);
    const result = await createPaylink(data);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Failed to create paylink:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
