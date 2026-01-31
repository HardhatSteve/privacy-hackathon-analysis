import { NextResponse } from "next/server"

const PINATA_JWT = process.env.PINATA_JWT

export async function POST(request: Request) {
  try {
    const { metadata, walletAddress } = await request.json()

    if (!PINATA_JWT) {
      return NextResponse.json({ error: "IPFS service not configured" }, { status: 500 })
    }

    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" })
    const formData = new FormData()
    formData.append("file", metadataBlob, "metadata.json")
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: `synid-metadata-${walletAddress.slice(-8)}`,
      }),
    )

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Pinata error:", error)
      return NextResponse.json({ error: "Failed to upload metadata" }, { status: 500 })
    }

    const result = await response.json()
    const metadataUri = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`

    return NextResponse.json({
      success: true,
      metadataUri,
      metadataCid: result.IpfsHash,
      metadataHash: result.IpfsHash,
    })
  } catch (error: any) {
    console.error("Mint API error:", error)
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 })
  }
}
