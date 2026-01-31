'use client'

import { useState, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isValidSolanaAddress } from '@/lib/utils'
import { DEMO_WALLET } from './constants'
import { WavyBackground } from '@/components/ui/wavy-background'
import { EncryptedText } from '../ui/encrypted-text'

export const HeroSection = memo(function HeroSection() {
  const router = useRouter()
  const [wallet, setWallet] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = useCallback(async () => {
    setError('')

    if (!wallet.trim()) {
      setError('Please enter a wallet address')
      return
    }

    if (!isValidSolanaAddress(wallet.trim())) {
      setError('Invalid Solana address format')
      return
    }

    setIsLoading(true)
    router.push(`/analysis/${wallet.trim()}`)
  }, [wallet, router])

  const handleDemoWallet = useCallback(() => {
    setIsLoading(true)
    router.push(`/analysis/${DEMO_WALLET}`)
  }, [router])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWallet(e.target.value)
    setError('')
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze()
  }, [handleAnalyze])

  return (
    <WavyBackground className='h-min-content'>
      <section id="analyze" className="pt-32 pb-16 px-4 sm:px-6 flex items-center scroll-mt-20">
        <div className="max-w-7xl mx-auto w-full relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <div className="relative z-20">
              {/* Eyebrow */}
              <div className="mb-6 inline-flex items-center gap-2.5 px-5 py-2.5 backdrop-blur-sm shadow-[0_0_20px_rgba(8,145,178,0.15)] transition-all duration-300 rounded-full bg-transparent border border-transparent hover:border-cyan-600/40 hover:bg-cyan-600/15">
                <span className="text-sm sm:text-base font-bold text-[var(--color-cyan-600)] tracking-wider uppercase">
                  LeakLens
                </span>
                <span className="text-[var(--color-cyan-600)]/50 text-lg">·</span>
                <span className="text-sm sm:text-base font-medium text-[var(--color-cyan-600)] tracking-wide">
                  On-chain Exposure Intelligence
                </span>
              </div>
              
              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-foreground leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                <EncryptedText 
                  text="Your wallet has a profile." 
                  revealDelayMs={45}
                  flipDelayMs={35}
                  className="inline-block"
                />
                <br />
                We show you what it says about you.
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
                <span className="font-semibold text-foreground">
                  LeakLens
                </span>{' '}analyzes real blockchain data to reveal how wallets are tracked, clustered, and linked to identity.
              </p>
            </div>
            {/* Right Column - Analysis Input */}
            <div className="relative z-20">
              <Card className="max-w-lg border-border/60 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Check wallet exposure
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Input + button as single unit */}
                  <div className="rounded-lg border border-input bg-background overflow-hidden flex flex-col sm:flex-row focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                    <div className="relative flex-1 min-w-0 flex">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
                      <Input
                        type="text"
                        value={wallet}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Paste a Solana wallet address"
                        className="h-12 pl-10 pr-3 rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      onClick={handleAnalyze}
                      disabled={isLoading}
                      size="lg"
                      className="h-12 w-full sm:w-auto rounded-none shrink-0 border border-black font-medium px-5 bg-[var(--color-cyan-600)] hover:bg-[var(--color-cyan-600)]/90 text-[var(--color-gray-100)]"
                      style={{
                        backgroundClip: 'unset',
                        WebkitBackgroundClip: 'unset'
                      }}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                          Checking...
                        </>
                      ) : (
                        <>
                          Analyze
                          <ArrowRight className="w-4 h-4 ml-1.5" />
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Improved trust microcopy */}
                  <p className="mt-4 text-sm text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                    Zero access to your wallet. We only read public chain data — no sign-in, no connect, no permissions.
                  </p>

                  {error && (
                    <p className="mt-3 text-sm text-destructive">{error}</p>
                  )}

                  <div className="mt-6">
                    <button
                      onClick={handleDemoWallet}
                      disabled={isLoading}
                      className="text-sm hover:text-primary/80 underline underline-offset-4 transition-colors drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] cursor-pointer"
                      style={{ color: 'var(--color-cyan-600)' }}
                    >
                      Explore a real wallet we&apos;ve analyzed
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </WavyBackground>
  )
})

HeroSection.displayName = 'HeroSection'
