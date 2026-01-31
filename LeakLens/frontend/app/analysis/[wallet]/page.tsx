'use client'

import { useEffect, useState, use, useCallback, lazy, Suspense } from 'react'
import {
  // Types
  type AnalysisResult,
  // Navigation Components
  TopNavBar,
  LoadingState,
  ErrorState,
  // Section Components (eagerly loaded - above fold)
  ExposureSummary,
  WhyTrackable,
  // Shared
  AnimatedSection,
  SectionSkeleton,
} from '@/components/analysis'
import { Badge } from '@/components/ui/badge'
import { Copy, CheckCircle } from 'lucide-react'

// Lazy load below-fold components for performance
const WalletLinkage = lazy(() => import('@/components/analysis/wallet-linkage').then(m => ({ default: m.WalletLinkage })))
const OpsecFailuresSection = lazy(() => import('@/components/analysis/opsec-failures').then(m => ({ default: m.OpsecFailuresSection })))
const ExposureBreakdown = lazy(() => import('@/components/analysis/exposure-breakdown').then(m => ({ default: m.ExposureBreakdown })))
const FinancialContext = lazy(() => import('@/components/analysis/financial-context').then(m => ({ default: m.FinancialContext })))
const ImplicationsSection = lazy(() => import('@/components/analysis/implications').then(m => ({ default: m.ImplicationsSection })))
const MitigationCTA = lazy(() => import('@/components/analysis/implications').then(m => ({ default: m.MitigationCTA })))
const SearchWalletElsewhere = lazy(() => import('@/components/analysis/search-wallet-elsewhere').then(m => ({ default: m.SearchWalletElsewhere })))

export default function AnalysisPage({ params }: { params: Promise<{ wallet: string }> }) {
  const resolvedParams = use(params)
  const wallet = resolvedParams.wallet
  const [data, setData] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const abortController = new AbortController()
    let aborted = false

    const fetchAnalysis = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await fetch('/api/analyze-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet, limit: 100 }),
          signal: abortController.signal,
        })

        if (aborted) return
        if (!response.ok) {
          let message = `Analysis failed: ${response.statusText}`
          try {
            const body = await response.json() as { error?: string; details?: string }
            let msg = body?.error ?? ''
            if (msg && typeof msg === 'string' && (msg.startsWith('{') || msg.startsWith('['))) {
              try {
                const parsed = JSON.parse(msg) as { detail?: string; error?: string }
                msg = parsed.detail ?? parsed.error ?? msg
              } catch {
                /* keep msg as-is */
              }
            }
            if (msg) message = msg
            if (body?.details) message += ` — ${body.details}`
          } catch {
            /* body not JSON, use statusText */
          }
          throw new Error(message)
        }
        const result = await response.json()
        if (aborted) return
        setData(result)
      } catch (err: any) {
        if (err.name === 'AbortError') {
          aborted = true
          return
        }
        if (aborted) return
        
        // Log full error details in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Analysis error:', err)
          console.error('Error name:', err.name)
          console.error('Error message:', err.message)
          console.error('Error stack:', err.stack)
        }
        
        // Provide more helpful error messages
        let errorMessage = err.message || 'Failed to analyze wallet'
        if (err.message === 'fetch failed' || err.name === 'TypeError') {
          errorMessage = 'Backend server is not responding. Please ensure the Python backend is running on http://localhost:8000'
        }
        
        setError(errorMessage)
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    fetchAnalysis()

    return () => {
      aborted = true
      abortController.abort()
    }
  }, [wallet])

  const copyAddress = useCallback(() => {
    navigator.clipboard.writeText(wallet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [wallet])

  if (loading) return <LoadingState wallet={wallet} />
  if (error && !data) return <ErrorState error={error} wallet={wallet} />
  if (!data) return <ErrorState error="No data received" wallet={wallet} />

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <TopNavBar 
        wallet={wallet} 
        copied={copied} 
        onCopy={copyAddress} 
        confidence={data.confidence}
        riskLevel={data.surveillance_exposure?.risk_level || 'MEDIUM'}
        data={data}
      />

      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-6 sm:pb-8 space-y-6">

        {/* Page title: wallet address + SCAN COMPLETE / Confidence */}
        <div className="pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-mono text-xl sm:text-2xl font-semibold text-foreground break-all pr-2">
              {wallet}
            </h1>
            <button
              onClick={copyAddress}
              className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Copy address"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              SCAN COMPLETE
            </Badge>
            <Badge variant="outline" className="text-xs">
              {data.confidence} Confidence
            </Badge>
          </div>
        </div>

        {/* 1. Exposure Summary (TL;DR) - Always Expanded */}
        <AnimatedSection>
          <ExposureSummary data={data} />
        </AnimatedSection>

        {/* 2. Why This Wallet Can Be Tracked - Collapsible (first expanded) */}
        <AnimatedSection delay={100}>
          <WhyTrackable data={data} />
        </AnimatedSection>

        {/* 3. Wallet Linkage Visualization - Graph visible, details collapsed */}
        <AnimatedSection delay={150}>
          <Suspense fallback={<SectionSkeleton />}>
            <WalletLinkage data={data.ego_network} />
          </Suspense>
        </AnimatedSection>

        {/* 4. Operational Security Failures - Accordion */}
        <AnimatedSection delay={200}>
          <Suspense fallback={<SectionSkeleton />}>
            <OpsecFailuresSection data={data.opsec_failures} />
          </Suspense>
        </AnimatedSection>

        {/* 4b. Search wallet on Arkham / X */}
        <AnimatedSection delay={225}>
          <Suspense fallback={<SectionSkeleton />}>
            <SearchWalletElsewhere wallet={wallet} />
          </Suspense>
        </AnimatedSection>

        {/* 5. Exposure Score Breakdown - Collapsed by default */}
        <AnimatedSection delay={250}>
          <Suspense fallback={<SectionSkeleton />}>
            <ExposureBreakdown data={data} />
          </Suspense>
        </AnimatedSection>

        {/* 6. Financial Activity Context - Collapsed, secondary */}
        <AnimatedSection delay={300}>
          <Suspense fallback={<SectionSkeleton />}>
            <FinancialContext 
              tradingPnl={data.token_trading_pnl} 
              netWorth={data.net_worth} 
            />
          </Suspense>
        </AnimatedSection>

        {/* 7. What This Means For You - Always Expanded */}
        <AnimatedSection delay={350}>
          <Suspense fallback={<SectionSkeleton />}>
            <ImplicationsSection />
          </Suspense>
        </AnimatedSection>

        {/* 8. Final CTA Section - Minimal, centered */}
        <AnimatedSection delay={400}>
          <Suspense fallback={<SectionSkeleton />}>
            <MitigationCTA />
          </Suspense>
        </AnimatedSection>

        {/* Footer Trust Signal */}
        <div className="text-center py-6 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-md mx-auto">
            This analysis uses heuristic inference based on publicly available on-chain data.
            Results are probabilistic estimates similar to those used by blockchain surveillance platforms.
          </p>
        </div>
      </main>
    </div>
  )
}
