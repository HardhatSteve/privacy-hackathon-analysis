import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    return NextResponse.json({
      wallet,
      earnings: {
        total: 0,
        accessCount: 0,
        averagePerAccess: 0,
        recentPayments: [],
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 })
  }
}
