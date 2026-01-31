"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type AccountInfo, getAccountInfo } from "@/lib/starpay-client"

interface StarpayContextType {
  accountInfo: AccountInfo | null
  loading: boolean
  error: string | null
  refreshAccountInfo: () => Promise<void>
}

const StarpayContext = createContext<StarpayContextType | undefined>(undefined)

export function StarpayProvider({ children }: { children: React.ReactNode }) {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshAccountInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      const info = await getAccountInfo()
      setAccountInfo(info)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load account info"
      setError(message)
      console.error(" Starpay context error:", message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshAccountInfo()
  }, [])

  return (
    <StarpayContext.Provider value={{ accountInfo, loading, error, refreshAccountInfo }}>
      {children}
    </StarpayContext.Provider>
  )
}

export function useStarpay() {
  const context = useContext(StarpayContext)
  if (context === undefined) {
    throw new Error("useStarpay must be used within StarpayProvider")
  }
  return context
}
