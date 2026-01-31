'use client'

import { memo } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAddress } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface ErrorStateProps {
  error: string
  wallet: string
}

// ============================================================================
// ERROR STATE
// ============================================================================

export const ErrorState = memo(function ErrorState({ error, wallet }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <AlertTriangle className="w-14 h-14 sm:w-16 sm:h-16 text-red-500 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-semibold">Analysis Failed</h2>
          <p className="text-muted-foreground font-mono text-xs sm:text-sm break-all">
            {formatAddress(wallet)}
          </p>
          <p className="text-sm text-red-400">{error}</p>
        </div>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    </div>
  )
})
