import { type NextRequest, NextResponse } from "next/server"

const API_KEY = process.env.STARPAY_API_KEY || ""
const BASE_URL = "https://www.starpay.cards/api/v1"

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    console.error("[Starpay API] STARPAY_API_KEY environment variable is not set")
    return NextResponse.json(
      {
        error: "STARPAY_API_KEY_MISSING",
        message: "Server not configured. Add STARPAY_API_KEY to environment variables in the Vars section.",
      },
      { status: 500 },
    )
  }

  try {
    const body = await request.json()
    const { amount, cardType, email } = body

    if (!amount || !cardType || !email) {
      return NextResponse.json({ error: "Missing required fields: amount, cardType, email" }, { status: 400 })
    }

    if (amount < 5 || amount > 10000) {
      return NextResponse.json({ error: "Amount must be between $5 and $10,000" }, { status: 400 })
    }

    if (!["visa", "mastercard"].includes(cardType)) {
      return NextResponse.json({ error: "Card type must be visa or mastercard" }, { status: 400 })
    }

    const response = await fetch(`${BASE_URL}/cards/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, cardType, email }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[Starpay API] Create card failed:", response.status, data)
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[Starpay API] Create card error:", error)
    return NextResponse.json({ error: "NETWORK_ERROR", message: "Failed to connect to Starpay API" }, { status: 500 })
  }
}
