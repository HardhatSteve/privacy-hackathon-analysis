import { NextResponse } from "next/server"

const RPC_URL = "https://api.devnet.solana.com"
const PINATA_JWT = process.env.PINATA_JWT

export async function POST(request: Request) {
  try {
    const { walletAddress, metadata, encryptedCid } = await request.json()

    if (!PINATA_JWT) {
      return NextResponse.json({ error: "IPFS not configured" }, { status: 500 })
    }

    if (!walletAddress || !metadata) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" })
    const formData = new FormData()
    formData.append("file", metadataBlob, "metadata.json")
    formData.append("pinataMetadata", JSON.stringify({ name: `synid-${walletAddress.slice(-8)}` }))

    const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${PINATA_JWT}` },
      body: formData,
    })

    if (!pinataRes.ok) {
      return NextResponse.json({ error: "Failed to upload metadata" }, { status: 500 })
    }

    const pinataData = await pinataRes.json()
    const metadataUri = `https://gateway.pinata.cloud/ipfs/${pinataData.IpfsHash}`

    return NextResponse.json({
      success: true,
      metadataUri,
      metadataHash: pinataData.IpfsHash,
      encryptedCid,
      walletAddress,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
