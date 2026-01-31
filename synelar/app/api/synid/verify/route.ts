import { NextResponse } from "next/server"
import { Connection } from "@solana/web3.js"

const RPC_URL = "https://api.devnet.solana.com"

export async function POST(request: Request) {
  try {
    const { walletAddress, signature } = await request.json()

    if (!walletAddress || !signature) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const connection = new Connection(RPC_URL, "confirmed")
    const tx = await connection.getTransaction(signature, { maxSupportedTransactionVersion: 0 })

    if (!tx) {
      return NextResponse.json({ verified: false, error: "Transaction not found" })
    }

    const isConfirmed = tx.meta?.err === null

    return NextResponse.json({
      verified: isConfirmed,
      slot: tx.slot,
      blockTime: tx.blockTime,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
