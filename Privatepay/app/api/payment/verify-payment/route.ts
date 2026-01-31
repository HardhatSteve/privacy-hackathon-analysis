import { type NextRequest, NextResponse } from "next/server"
import { verifyPaymentToAddressWithBackoff } from "@/lib/solana-verify"
import { getSupabaseServer } from "@/lib/supabase-server"
import { sweepFundsToMaster } from "@/lib/sweep-funds"
import { createCard } from "@/lib/starpay-client"

export async function POST(request: NextRequest) {
  try {
    const { depositRequestId } = await request.json()

    if (!depositRequestId) {
      return NextResponse.json({ error: "Missing depositRequestId" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()

    // Get deposit request details
    const { data: depositRequest, error: fetchError } = await supabase
      .from("deposit_requests")
      .select("*")
      .eq("id", depositRequestId)
      .single()

    if (fetchError || !depositRequest) {
      return NextResponse.json({ error: "Deposit request not found" }, { status: 404 })
    }

    console.log(
      "[v0] Checking payment for address:",
      depositRequest.deposit_address,
      "Expected:",
      depositRequest.expected_amount,
    )

    const verification = await verifyPaymentToAddressWithBackoff(
      depositRequest.deposit_address,
      depositRequest.expected_amount,
    )

    console.log(" Verification result:", verification.verified, "Amount received:", verification.amountReceived)

    if (verification.verified) {
      console.log(" Payment verified! Updating database...")

      await supabase
        .from("deposit_requests")
        .update({
          payment_verified: true,
          transaction_signature: verification.transactionSignature,
          actual_amount_received: verification.amountReceived,
          updated_at: new Date().toISOString(),
        })
        .eq("id", depositRequestId)

      if (depositRequest.derived_private_key && process.env.MASTER_WALLET_ADDRESS) {
        console.log(" Starting fund sweep to master wallet...")
        try {
          const sweepResult = await sweepFundsToMaster(
            depositRequest.derived_private_key,
            process.env.MASTER_WALLET_ADDRESS,
            depositRequest.derived_private_key_salt || "default-salt",
          )

          console.log(" Sweep result:", sweepResult)

          await supabase
            .from("deposit_requests")
            .update({
              funds_swept: sweepResult.success,
              sweep_transaction_signature: sweepResult.signature,
              sweep_status: sweepResult.success ? "completed" : "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", depositRequestId)
        } catch (sweepError) {
          console.error(" Sweep error:", sweepError)
        }
      }

      console.log(" Attempting to issue card...")
      try {
        const cardResponse = await createCard({
          amount: depositRequest.card_value,
          cardType: depositRequest.card_type,
          cardholderName: depositRequest.cardholder_name,
          email: depositRequest.email,
        })

        console.log(" Card created successfully:", cardResponse.id)

        await supabase
          .from("deposit_requests")
          .update({
            card_issued: true,
            issued_card_id: cardResponse.id,
            card_issue_status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", depositRequestId)
      } catch (cardError) {
        const errorMsg = cardError instanceof Error ? cardError.message : "Unknown error"
        console.error("Card creation error:", errorMsg)

        // Queue card if creation fails
        await supabase
          .from("deposit_requests")
          .update({
            card_queued: true,
            card_issue_status: "queued",
            card_error_message: errorMsg,
            updated_at: new Date().toISOString(),
          })
          .eq("id", depositRequestId)
      }
    }

    return NextResponse.json(
      {
        verified: verification.verified,
        message: verification.verified ? "Payment verified and processed" : "Payment not yet received",
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ verified: false }, { status: 200 })
  }
}
