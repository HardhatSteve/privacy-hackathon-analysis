import { NextResponse } from "next/server"

const PINATA_JWT = process.env.PINATA_JWT

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cid = searchParams.get("cid")

    if (!cid) {
      return NextResponse.json({ error: "CID required" }, { status: 400 })
    }

    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`)
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch from IPFS" }, { status: 404 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (!PINATA_JWT) {
      return NextResponse.json({ error: "IPFS service not configured" }, { status: 500 })
    }

    const { encryptedData, wallet } = await request.json()

    if (!encryptedData || !wallet) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: encryptedData,
        pinataMetadata: {
          name: `synid-profile-${wallet}-${Date.now()}`,
          keyvalues: { wallet, type: "profile-update", version: "2" },
        },
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to upload to IPFS" }, { status: 500 })
    }

    const result = await response.json()
    return NextResponse.json({ cid: result.IpfsHash })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
