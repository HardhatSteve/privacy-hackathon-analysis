import { type NextRequest, NextResponse } from "next/server"

const API_KEY = process.env.STARPAY_API_KEY || ""
const BASE_URL = "https://www.starpay.cards/api/v1"

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get("cardId")

    if (!cardId) {
      return NextResponse.json({ error: "cardId query parameter is required" }, { status: 400 })
    }

    const response = await fetch(`${BASE_URL}/cards/status?cardId=${cardId}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[Starpay API] Get card status failed:", response.status, data)
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[Starpay API] Get card status error:", error)
    return NextResponse.json({ error: "NETWORK_ERROR", message: "Failed to connect to Starpay API" }, { status: 500 })
  }
}
