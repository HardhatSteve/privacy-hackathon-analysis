import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { synidOwner, requester, signature } = await request.json()

    if (!synidOwner || !requester || !signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      revocation: {
        synidOwner,
        requester,
        revokedAt: Date.now(),
        txSignature: signature,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to revoke access" }, { status: 500 })
  }
}
