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
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const data = await response.json()

    if (!response.ok) {
      console.error("[Starpay API] Get account info failed:", response.status, data)
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    let errorMessage = "Failed to connect to Starpay API"

    if (error instanceof TypeError && error.message.includes("fetch")) {
      errorMessage = "Network error: Check internet connection or Starpay API availability"
    } else if (error instanceof Error && error.name === "AbortError") {
      errorMessage = "Request timeout: Starpay API is not responding (5s timeout)"
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    console.error("[Starpay API] Get account info error:", errorMessage, error)
    return NextResponse.json({ error: "NETWORK_ERROR", message: errorMessage }, { status: 503 })
  }
}
