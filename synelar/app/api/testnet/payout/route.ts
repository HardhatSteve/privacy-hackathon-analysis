import { type NextRequest, NextResponse } from "next/server"
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, type Keypair } from "@solana/web3.js"
import { parsePrivateKey } from "@/lib/solana-keys"

const DEVNET_RPC = "https://api.devnet.solana.com"
const PAYER_WALLET = "4zMMUHXrWmGSNEZWX7weVZAPJS2RfsLyVeYCMy5DNbdp"
const PAYER_SECRET_KEY = process.env.SOLANA_PAYER_SECRET_KEY || ""

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, amount, appName, fields } = await request.json()

    if (!walletAddress || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!PAYER_SECRET_KEY) {
      return NextResponse.json(
        {
          error: "Server not configured for payouts",
          message: "Add SOLANA_PAYER_SECRET_KEY environment variable",
          fundingAddress: PAYER_WALLET,
          faucetUrl: "https://faucet.solana.com",
        },
        { status: 500 },
      )
    }

    try {
      const connection = new Connection(DEVNET_RPC, "confirmed")
      const recipientPubkey = new PublicKey(walletAddress)
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL)

      let payerKeypair: Keypair
      try {
        payerKeypair = parsePrivateKey(PAYER_SECRET_KEY)
      } catch (error) {
        throw new Error(
          "Invalid SOLANA_PAYER_SECRET_KEY format. Paste your base58 private key from Phantom or JSON array format.",
        )
      }

      const latestBlockhash = await connection.getLatestBlockhash("confirmed")

      const transaction = new Transaction({
        recentBlockhash: latestBlockhash.blockhash,
        feePayer: payerKeypair.publicKey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: payerKeypair.publicKey,
          toPubkey: recipientPubkey,
          lamports,
        }),
      )

      transaction.sign(payerKeypair)
      const signature = await connection.sendTransaction(transaction, [payerKeypair], {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      })

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      })

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
      }

      const newBalance = await connection.getBalance(recipientPubkey)

      return NextResponse.json({
        success: true,
        signature,
        amount,
        lamports,
        newBalance: newBalance / LAMPORTS_PER_SOL,
        appName,
        fields,
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      })
    } catch (solanaErr) {
      console.error("Solana error:", solanaErr)
      throw solanaErr
    }
  } catch (error) {
    console.error("Testnet payout error:", error)

    const errorMessage = error instanceof Error ? error.message : "Payout failed"

    return NextResponse.json(
      {
        error: errorMessage,
        fundingAddress: PAYER_WALLET,
        faucetUrl: "https://faucet.solana.com",
        instruction: "Send devnet SOL to the funding address to enable payouts",
      },
      { status: 400 },
    )
  }
}
