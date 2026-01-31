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
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: "MISSING_ORDER_ID", message: "orderId is required" }, { status: 400 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(`${BASE_URL}/cards/order/status?orderId=${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const data = await response.json()

    if (!response.ok) {
      console.error("[Starpay API] Check order status failed:", response.status, data)
      return NextResponse.json(
        {
          ...data,
          message: data.message || `Starpay API returned ${response.status}`,
        },
        { status: response.status },
      )
    }

    console.log("[Starpay API] Order status response:", JSON.stringify(data, null, 2))

    // Ensure status field exists
    if (!data.status) {
      console.warn("[Starpay API] Response missing status field:", data)
      return NextResponse.json(
        {
          ...data,
          status: "unknown",
          message: "Response from Starpay missing status field",
        },
        { status: 200 },
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    let errorMessage = "Failed to check order status"

    if (error instanceof TypeError && error.message.includes("fetch")) {
      errorMessage = "Network error: Check internet connection or Starpay API availability"
    } else if (error instanceof Error && error.name === "AbortError") {
      errorMessage = "Request timeout: Starpay API is not responding (10s timeout)"
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    console.error("[Starpay API] Check order status error:", errorMessage, error)
    return NextResponse.json({ error: "NETWORK_ERROR", message: errorMessage }, { status: 503 })
  }
}
