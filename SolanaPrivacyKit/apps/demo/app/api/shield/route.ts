import { NextResponse } from "next/server";
import { shieldAmount } from "@privacy-devkit/sdk";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, token } = body as { amount?: number; token?: string };
    if (amount == null || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }
    const result = await shieldAmount(amount, token ?? "SOL");
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Shield failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
