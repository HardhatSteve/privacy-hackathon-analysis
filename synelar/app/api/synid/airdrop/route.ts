import { NextResponse } from "next/server"
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"

const RPC_URL = "https://api.devnet.solana.com"

export async function POST(request: Request) {
  try {
    const { wallet } = await request.json()

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    const connection = new Connection(RPC_URL, "confirmed")
    const pubkey = new PublicKey(wallet)

    const signature = await connection.requestAirdrop(pubkey, LAMPORTS_PER_SOL)
    await connection.confirmTransaction(signature)

    return NextResponse.json({
      success: true,
      signature,
      amount: 1,
      wallet,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Airdrop failed" }, { status: 500 })
  }
}
