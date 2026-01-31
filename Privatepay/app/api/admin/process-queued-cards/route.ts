import { NextResponse } from "next/server"
import { createCard, getAccountBalance } from "@/lib/starpay-client"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = await getSupabaseServer()

    // Get current balance
    const balanceResponse = await getAccountBalance()
    console.log("[v0] Current Starpay balance:", balanceResponse.balance)

    // Get all queued cards
    const { data: queuedCards } = await supabase
      .from("deposit_requests")
      .select("*")
      .eq("card_issue_status", "pending_balance")
      .order("created_at", { ascending: true })

    if (!queuedCards || queuedCards.length === 0) {
      return NextResponse.json({
        message: "No queued cards to process",
        balance: balanceResponse.balance,
      })
    }

    let processedCount = 0
    let failedCount = 0
    let currentBalance = balanceResponse.balance

    // Process each queued card
    for (const card of queuedCards) {
      const requiredAmount = card.card_value + card.card_value * 0.025

      if (currentBalance < requiredAmount) {
        console.log("[v0] Insufficient balance for card", card.id, "Need:", requiredAmount, "Have:", currentBalance)
        break // Stop processing as we don't have enough balance
      }

      try {
        // Create card on Starpay
        const cardResponse = await createCard({
          amount: card.card_value,
          cardholderName: card.user_id,
        })

        // Update as issued
        await supabase
          .from("deposit_requests")
          .update({
            card_issued: true,
            issued_card_id: cardResponse.id,
            card_issue_status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", card.id)

        processedCount++
        currentBalance -= requiredAmount
      } catch (error) {
        console.error("[v0] Failed to process card", card.id, error)
        failedCount++

        await supabase
          .from("deposit_requests")
          .update({
            card_issue_status: "error",
            card_error_message: String(error),
            updated_at: new Date().toISOString(),
          })
          .eq("id", card.id)
      }
    }

    return NextResponse.json({
      message: "Queued cards processed",
      processedCount,
      failedCount,
      remainingBalance: currentBalance,
      totalQueuedCards: queuedCards.length,
    })
  } catch (error) {
    console.error("[v0] Failed to process queued cards:", error)
    return NextResponse.json({ error: "Failed to process queued cards" }, { status: 500 })
  }
}
