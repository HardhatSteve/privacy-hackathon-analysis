import { NextResponse } from "next/server"
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"

const RPC_URL = "https://api.devnet.solana.com"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    const connection = new Connection(RPC_URL, "confirmed")
    const pubkey = new PublicKey(wallet)
    const balance = await connection.getBalance(pubkey)

    return NextResponse.json({
      wallet,
      balance: balance / LAMPORTS_PER_SOL,
      lamports: balance,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch balance" }, { status: 500 })
  }
}
