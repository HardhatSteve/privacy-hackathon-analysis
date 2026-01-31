import { NextResponse } from "next/server"

const PINATA_JWT = process.env.PINATA_JWT

export async function POST(request: Request) {
  if (!PINATA_JWT) {
    return NextResponse.json({ error: "Pinata not configured" }, { status: 500 })
  }

  try {
    const { ipMetadata, nftMetadata } = await request.json()

    // Upload IP Metadata
    const ipResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: ipMetadata,
        pinataMetadata: { name: `synid-ip-${Date.now()}` },
      }),
    })

    if (!ipResponse.ok) {
      throw new Error("Failed to upload IP metadata")
    }

    const ipData = await ipResponse.json()

    // Upload NFT Metadata
    const nftResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: nftMetadata,
        pinataMetadata: { name: `synid-nft-${Date.now()}` },
      }),
    })

    if (!nftResponse.ok) {
      throw new Error("Failed to upload NFT metadata")
    }

    const nftData = await nftResponse.json()

    return NextResponse.json({
      ipMetadataHash: ipData.IpfsHash,
      nftMetadataHash: nftData.IpfsHash,
    })
  } catch (error) {
    console.error("Metadata upload error:", error)
    return NextResponse.json({ error: "Failed to upload metadata" }, { status: 500 })
  }
}
