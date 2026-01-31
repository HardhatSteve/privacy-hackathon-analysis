"use client"

import { useState } from "react"
import { useSafeDynamicContext } from "@/hooks/useSafeDynamicContext"
import { usePrivacySession } from "@/hooks/usePrivacySession"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { usePrivacyBalance, useShieldSol } from "@/hooks/usePrivacy"
import { usePrivacyStore } from "@/store/privacyStore"

type ShieldStatus = "idle" | "initializing" | "proving" | "signing" | "submitting" | "confirming" | "success"

const STATUS_LABELS: Record<ShieldStatus, string> = {
  idle: "",
  initializing: "Initializing privacy session...",
  proving: "Generating ZK proof...",
  signing: "Signing transaction...",
  submitting: "Submitting to network...",
  confirming: "Confirming transaction...",
  success: "Shield confirmed!",
}

const STATUS_PROGRESS: Record<ShieldStatus, number> = {
  idle: 0,
  initializing: 10,
  proving: 30,
  signing: 60,
  submitting: 75,
  confirming: 90,
  success: 100,
}

export function ShieldModal() {
  const { primaryWallet } = useSafeDynamicContext()
  const { initialize, isInitialized, isInitializing } = usePrivacySession()
  const { data } = usePrivacyBalance()
  const { mutateAsync, isPending } = useShieldSol()
  const isOpen = usePrivacyStore((state) => state.isShieldModalOpen)
  const closeShieldModal = usePrivacyStore((state) => state.closeShieldModal)
  const [amount, setAmount] = useState("")
  const [status, setStatus] = useState<ShieldStatus>("idle")

  const resetState = () => {
    setAmount("")
    setStatus("idle")
  }

  const handleClose = () => {
    resetState()
    closeShieldModal()
  }

  const handleSubmit = async () => {
    const value = Number.parseFloat(amount)
    if (!value || value <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    if (!primaryWallet) {
      toast.error("Connect your wallet to continue")
      return
    }

    try {
      // Step 1: Ensure session is initialized
      if (!isInitialized) {
        setStatus("initializing")
        await initialize()
      }

      // Step 2: The SDK handles proof generation, signing, relay, and confirmation
      setStatus("proving")
      await mutateAsync(value)

      setStatus("success")
      toast.success("Shield transaction confirmed")
      handleClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Shielding failed"
      )
      setStatus("idle")
    }
  }

  const isProcessing = status !== "idle" && status !== "success"

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Shield SOL</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>Shielded SOL can be used to send anonymous tips.</p>
          <div className="space-y-2">
            <Label htmlFor="shield-amount">Amount (SOL)</Label>
            <Input
              id="shield-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.5"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={isProcessing}
            />
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-xs">
            <p>
              Available balance: {typeof data?.available === "number" ? data.available.toFixed(4) : "0"} SOL
            </p>
            <p className="mt-1">Shielding is reversible via withdrawal.</p>
          </div>
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={STATUS_PROGRESS[status]} />
              <p className="text-xs text-center">{STATUS_LABELS[status]}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || isProcessing || isInitializing}>
              {isProcessing ? "Processing..." : "Shield"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
