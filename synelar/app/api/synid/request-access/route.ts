import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { synidOwner, requester, fields, offeredPayment, expiresAt } = await request.json()

    if (!synidOwner || !requester || !fields || !offeredPayment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      request: {
        synidOwner,
        requester,
        fields,
        offeredPayment,
        expiresAt,
        status: "pending",
        createdAt: Date.now(),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create access request" }, { status: 500 })
  }
}
