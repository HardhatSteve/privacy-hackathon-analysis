"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { UserDashboard } from "@/components/user-dashboard"
import { hasSynID } from "@/lib/synid-storage"
import { getPhantomProvider } from "@/lib/solana"

export default function DashboardPage() {
  const router = useRouter()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkWallet = async () => {
      const provider = getPhantomProvider()
      if (!provider) {
        router.push("/")
        return
      }

      try {
        const resp = await provider.connect({ onlyIfTrusted: true })
        const address = resp.publicKey.toString()

        if (!hasSynID(address)) {
          router.push("/")
          return
        }

        setWalletAddress(address)
      } catch {
        router.push("/")
      } finally {
        setIsChecking(false)
      }
    }

    checkWallet()
  }, [router])

  const handleDisconnect = async () => {
    const provider = getPhantomProvider()
    if (provider) {
      await provider.disconnect()
    }
    router.push("/")
  }

  if (isChecking || !walletAddress) return null

  return (
    <main className="min-h-screen bg-black">
      <UserDashboard walletAddress={walletAddress} onDisconnect={handleDisconnect} />
    </main>
  )
}
