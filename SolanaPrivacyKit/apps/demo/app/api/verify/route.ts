import { NextResponse } from "next/server";
import { verifyZKProof } from "@privacy-devkit/sdk";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proof, publicInputs } = body as { proof?: string; publicInputs?: string[] };
    if (proof == null || typeof proof !== "string") {
      return NextResponse.json(
        { valid: false, error: "Invalid proof" },
        { status: 400 }
      );
    }
    const inputs = Array.isArray(publicInputs) ? publicInputs : [];
    const valid = await verifyZKProof(proof, inputs);
    return NextResponse.json({ valid });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Verify failed";
    return NextResponse.json({ valid: false, error: message }, { status: 500 });
  }
}
