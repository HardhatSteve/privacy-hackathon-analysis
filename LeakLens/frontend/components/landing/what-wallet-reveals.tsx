'use client'

import { memo, useCallback } from 'react'
import Link from 'next/link'
import { BarChart3, Network, Clock, AlertTriangle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEMO_WALLET } from './constants'

const reveals = [
  {
    icon: BarChart3,
    title: 'Exposure Score',
    description: 'A simple signal showing how identifiable your wallet activity is.',
  },
  {
    icon: Network,
    title: 'Linked Wallets',
    description: 'Addresses connected to yours through behavior, funding, or interaction patterns.',
  },
  {
    icon: Clock,
    title: 'Timing & Behavior',
    description: 'Activity rhythms that suggest routines, automation, or coordination.',
  },
  {
    icon: AlertTriangle,
    title: 'Risk Signals',
    description: 'Patterns commonly associated with deanonymization or surveillance tracking.',
  },
]

export const WhatWalletReveals = memo(function WhatWalletReveals() {
  const handleScrollToHero = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Focus on the input after scroll completes
    setTimeout(() => {
      const input = document.querySelector('input[placeholder="Paste a Solana wallet address"]') as HTMLInputElement
      if (input) {
        input.focus()
      }
    }, 500)
  }, [])

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-border/40">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-foreground">
            What your wallet reveals
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            A high-level view of how on-chain activity exposes identity signals.
          </p>
        </div>

        {/* Reveals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {reveals.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                className={cn(
                  'flex flex-col items-start p-5 rounded-lg',
                  'border border-border/40 bg-card/50',
                  'hover:border-border/60 hover:bg-card/70 transition-colors'
                )}
              >
                <div className="mb-3 p-2 rounded-md bg-muted/30">
                  <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {item.title}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Trust Statement */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground">
            Read-only analysis. Public blockchain data only.
            <br />
            No signatures. No permissions. No wallet connection.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleScrollToHero}
            className={cn(
              'inline-flex items-center gap-2 px-8 py-3.5',
              'text-base font-medium text-foreground',
              'hover:text-foreground/90 transition-all',
              'border-2 border-border/50 rounded-lg',
              'hover:border-border/70 hover:bg-card/60',
              'bg-card/40 shadow-sm',
              'hover:shadow-md hover:scale-[1.02]'
            )}
          >
            Analyze your own wallet
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-4 w-full max-w-xs">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/60 to-border/60" />
            <span className="text-sm font-medium text-muted-foreground px-3">or</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border/60 to-border/60" />
          </div>

            <Link
              href={`/analysis/${DEMO_WALLET}`}
              className="hover:underline inline-flex items-center gap-1"
              style={{ color: 'var(--color-cyan-600)' }}
            >
              View a real example
            </Link>

        </div>
      </div>
    </section>
  )
})

WhatWalletReveals.displayName = 'WhatWalletReveals'
