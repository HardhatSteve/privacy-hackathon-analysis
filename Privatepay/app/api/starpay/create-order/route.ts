import { type NextRequest, NextResponse } from "next/server"

const API_KEY = process.env.STARPAY_API_KEY || ""
const BASE_URL = "https://www.starpay.cards/api/v1"

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      {
        error: "STARPAY_API_KEY_MISSING",
        message: "Server not configured. Add STARPAY_API_KEY to environment variables.",
      },
      { status: 500 },
    )
  }

  try {
    const { amount, cardType, email } = await request.json()

    if (!amount || !cardType || !email) {
      return NextResponse.json(
        { error: "MISSING_REQUIRED_FIELDS", message: "amount, cardType, and email are required" },
        { status: 400 },
      )
    }

    if (amount < 5 || amount > 10000) {
      return NextResponse.json(
        { error: "INVALID_AMOUNT", message: "Amount must be between $5 and $10,000" },
        { status: 400 },
      )
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${BASE_URL}/cards/order`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        cardType: cardType.toLowerCase(),
        email,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const data = await response.json()

    if (!response.ok) {
      console.error("[Starpay API] Create order failed:", response.status, data)
      return NextResponse.json(data, { status: response.status })
    }

    console.log("[Starpay API] Order created:", data.orderId)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    let errorMessage = "Failed to create order"

    if (error instanceof TypeError && error.message.includes("fetch")) {
      errorMessage = "Network error: Check internet connection or Starpay API availability"
    } else if (error instanceof Error && error.name === "AbortError") {
      errorMessage = "Request timeout: Starpay API is not responding (5s timeout)"
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    console.error("[Starpay API] Create order error:", errorMessage, error)
    return NextResponse.json({ error: "NETWORK_ERROR", message: errorMessage }, { status: 503 })
  }
}
