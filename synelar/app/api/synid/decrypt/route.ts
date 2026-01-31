import { NextResponse } from "next/server"

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs"

export async function POST(request: Request) {
  try {
    const { cid, encryptionKey, iv } = await request.json()

    if (!cid || !encryptionKey || !iv) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const ipfsRes = await fetch(`${PINATA_GATEWAY}/${cid}`)
    if (!ipfsRes.ok) {
      return NextResponse.json({ error: "Failed to fetch from IPFS" }, { status: 500 })
    }

    const encryptedData = await ipfsRes.json()

    return NextResponse.json({
      success: true,
      data: encryptedData,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
