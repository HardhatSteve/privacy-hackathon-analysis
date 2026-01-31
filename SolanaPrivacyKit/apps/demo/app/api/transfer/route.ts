import { NextResponse } from "next/server";
import { createPrivateTransfer } from "@privacy-devkit/sdk";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipient, amount } = body as { recipient?: string; amount?: number };
    if (!recipient || typeof recipient !== "string" || recipient.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Invalid recipient" },
        { status: 400 }
      );
    }
    if (amount == null || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }
    const result = await createPrivateTransfer(recipient.trim(), amount);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Transfer failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
