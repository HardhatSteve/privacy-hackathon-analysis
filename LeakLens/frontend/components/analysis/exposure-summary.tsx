'use client'

import { memo, useRef, useEffect, useState } from 'react'
import { Eye, Shield, Clock, AlertTriangle, Activity, Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getSeverityColor, formatDate, STROKE_COLORS } from './utils'
import type { AnalysisResult } from './types'

interface ExposureSummaryProps {
  data: AnalysisResult
}

// Generate contextual explanation based on actual data
function getExposureExplanation(data: AnalysisResult): string {
  const score = data.surveillance_exposure?.surveillance_score || 0
  
  if (score >= 70) {
    return 'This wallet shows highly consistent behavioral patterns that make it strongly linkable and classifiable over time.'
  }
  if (score >= 50) {
    return 'This wallet shows consistent behavioral patterns that make it linkable over time.'
  }
  if (score >= 30) {
    return 'This wallet has some identifiable patterns but maintains moderate operational separation.'
  }
  return 'This wallet shows relatively low behavioral fingerprinting but is not fully anonymous.'
}

export const ExposureSummary = memo(function ExposureSummary({ data }: ExposureSummaryProps) {
  const gaugeRef = useRef<HTMLDivElement>(null)
  const [animatedScore, setAnimatedScore] = useState(0)
  const hasAnimated = useRef(false)

  const score = Math.round(data.surveillance_exposure?.surveillance_score || 0)
  const riskLevel = data.surveillance_exposure?.risk_level || 'MEDIUM'
  const colors = getSeverityColor(riskLevel)
  const strokeColor = STROKE_COLORS[riskLevel] || STROKE_COLORS.MEDIUM
  
  // Circular gauge calculations
  const circumference = 2 * Math.PI * 42
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  // Animate gauge on scroll into view
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReducedMotion) {
      setAnimatedScore(score)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          let current = 0
          const step = score / 30
          const interval = setInterval(() => {
            current += step
            if (current >= score) {
              setAnimatedScore(score)
              clearInterval(interval)
            } else {
              setAnimatedScore(current)
            }
          }, 20)
        }
      },
      { threshold: 0.3 }
    )

    if (gaugeRef.current) observer.observe(gaugeRef.current)
    return () => observer.disconnect()
  }, [score])

  return (
    <Card className="relative border-border/40 bg-linear-to-br from-card via-card to-card/80 overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />
      
      <CardContent className="relative pt-6 pb-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Eye className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Wallet Exposure Overview</h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start">
          {/* Exposure Score Gauge with Glow */}
          <div ref={gaugeRef} className="relative w-32 h-32 shrink-0">
            {/* Glow effect */}
            <div 
              className="absolute inset-0 rounded-full blur-xl opacity-20 transition-opacity duration-700"
              style={{ 
                background: `radial-gradient(circle, ${strokeColor} 0%, transparent 70%)`,
                opacity: animatedScore > 0 ? 0.7 : 0
              }} 
            />
            
            <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
              {/* Background track */}
              <circle 
                cx="50" cy="50" r="42" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="6" 
                className="text-border/20" 
              />
              {/* Progress arc */}
              <circle 
                cx="50" cy="50" r="42" 
                fill="none" 
                stroke={strokeColor} 
                strokeWidth="6" 
                strokeLinecap="round"
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                className="transition-all duration-700 ease-out"
                style={{
                  filter: `drop-shadow(0 0 6px ${strokeColor})`
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <span 
                className="text-3xl font-bold tabular-nums"
                style={{ 
                  textShadow: `0 0 20px ${strokeColor}40`
                }}
              >
                {Math.round(animatedScore)}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">of 100</span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="flex-1 space-y-5 w-full">
            {/* Primary Status Row */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              <Badge 
                className={cn(
                  colors.bg, colors.text, colors.border, 
                  "text-sm px-3 py-1.5 shadow-sm"
                )}
                style={{
                  boxShadow: riskLevel === 'HIGH' || riskLevel === 'CRITICAL' 
                    ? `0 0 12px ${strokeColor}30` 
                    : undefined
                }}
              >
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                {riskLevel} Risk
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1.5 border-primary/30 text-primary">
                {data.confidence} Confidence
              </Badge>
            </div>

            {/* Top Leak Vectors */}
            {data.surveillance_exposure?.top_leak_vectors && data.surveillance_exposure.top_leak_vectors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.surveillance_exposure.top_leak_vectors.slice(0, 3).map((vector, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="bg-red-500/5 text-red-400 border-red-500/20 text-xs"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />{vector}
                  </Badge>
                ))}
              </div>
            )}

            {/* Explanation */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {getExposureExplanation(data)}
            </p>

            {/* Activity & Chain Info */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(data.most_recent_transaction)}
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                {data.total_transactions} txns
              </span>
              <span className="uppercase font-medium text-foreground/70">
                {data.chain}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Stats - Key Metrics Grid */}
        <div className="mt-8 pt-6 border-t border-border/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center hover:border-primary/30 transition-colors">
              <p className="text-xl font-semibold text-primary tabular-nums">{data.total_transactions}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Transactions</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center hover:border-primary/30 transition-colors">
              <p className="text-xl font-semibold text-primary tabular-nums">{data.ego_network?.total_links || 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Linked Wallets</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center hover:border-primary/30 transition-colors">
              <p className="text-xl font-semibold tabular-nums" style={{ color: data.opsec_failures?.critical_leaks?.length ? '#ef4444' : 'inherit' }}>
                {data.opsec_failures?.critical_leaks?.length || 0}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Critical Leaks</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-center hover:border-primary/30 transition-colors">
              <p className="text-xl font-semibold tabular-nums">
                {data.surveillance_exposure?.signals?.repeated_counterparties || 0}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Counterparties</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
