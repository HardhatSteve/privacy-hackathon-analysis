import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const PINATA_JWT = process.env.PINATA_JWT

    if (!PINATA_JWT) {
      return NextResponse.json({ error: "IPFS service not configured" }, { status: 500 })
    }

    // Create the JSON blob for Pinata
    const jsonData = JSON.stringify(body)
    const blob = new Blob([jsonData], { type: "application/json" })

    const formData = new FormData()
    formData.append("file", blob, `synid-${Date.now()}.json`)

    // Add metadata
    const metadata = JSON.stringify({
      name: `SynID-${body.wallet?.slice(0, 8) || "profile"}`,
      keyvalues: {
        wallet: body.wallet || "",
        version: body.version || "1.0",
        algorithm: body.algorithm || "AES-256-GCM",
      },
    })
    formData.append("pinataMetadata", metadata)

    // Pin options
    const options = JSON.stringify({
      cidVersion: 1,
    })
    formData.append("pinataOptions", options)

    // Upload to Pinata
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Pinata error:", errorText)
      return NextResponse.json({ error: "Failed to upload to IPFS" }, { status: 500 })
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      cid: result.IpfsHash,
      size: result.PinSize,
      timestamp: result.Timestamp,
    })
  } catch (error) {
    console.error("IPFS upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
