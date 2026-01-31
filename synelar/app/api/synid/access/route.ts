import { NextResponse } from "next/server"

interface AccessRequest {
  synidOwner: string
  requester: string
  appName: string
  fields: string[]
  payment: number
}

const accessRequests: Map<string, AccessRequest[]> = new Map()

export async function POST(request: Request) {
  try {
    const { synidOwner, requester, appName, fields, payment } = await request.json()

    const accessRequest: AccessRequest = {
      synidOwner,
      requester,
      appName,
      fields,
      payment,
    }

    const existing = accessRequests.get(synidOwner) || []
    existing.push(accessRequest)
    accessRequests.set(synidOwner, existing)

    return NextResponse.json({ success: true, requestId: `${synidOwner}-${Date.now()}` })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const owner = url.searchParams.get("owner")

    if (!owner) {
      return NextResponse.json({ error: "Missing owner" }, { status: 400 })
    }

    const requests = accessRequests.get(owner) || []
    return NextResponse.json({ requests })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
