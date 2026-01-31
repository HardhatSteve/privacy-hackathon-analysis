'use client'

import { memo, useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Minus, Info, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { AnalysisResult } from './types'

interface ExposureBreakdownProps {
  data: AnalysisResult
}

type ImpactLevel = 'high' | 'medium' | 'low' | 'minimal'

interface ExposureFactor {
  name: string
  impact: ImpactLevel
  description: string
  detected: boolean
}

// Get impact styling
function getImpactStyles(impact: ImpactLevel): { 
  bg: string
  text: string
  bar: string
  width: string
} {
  const styles: Record<ImpactLevel, { bg: string; text: string; bar: string; width: string }> = {
    high: { 
      bg: 'bg-red-500/10', 
      text: 'text-red-400', 
      bar: 'bg-red-500',
      width: 'w-full'
    },
    medium: { 
      bg: 'bg-yellow-500/10', 
      text: 'text-yellow-400', 
      bar: 'bg-yellow-500',
      width: 'w-2/3'
    },
    low: { 
      bg: 'bg-cyan-500/10', 
      text: 'text-cyan-400', 
      bar: 'bg-cyan-500',
      width: 'w-1/3'
    },
    minimal: { 
      bg: 'bg-muted/30', 
      text: 'text-muted-foreground', 
      bar: 'bg-muted-foreground/50',
      width: 'w-1/6'
    }
  }
  return styles[impact]
}

// Compact factor bar for collapsed view
const FactorBar = memo(function FactorBar({ factor }: { factor: ExposureFactor }) {
  const styles = getImpactStyles(factor.impact)
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{factor.name}</span>
        <span className={cn("text-[10px] font-medium uppercase", styles.text)}>
          {factor.impact}
        </span>
      </div>
      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all",
            factor.detected ? styles.bar : 'bg-muted-foreground/20',
            factor.detected ? styles.width : 'w-0'
          )}
        />
      </div>
    </div>
  )
})

// Detailed factor row for expanded view
const FactorRow = memo(function FactorRow({ factor }: { factor: ExposureFactor }) {
  const styles = getImpactStyles(factor.impact)
  const ImpactIcon = factor.impact === 'high' ? TrendingUp : 
                     factor.impact === 'medium' ? Minus : TrendingDown
  
  return (
    <div className={cn(
      "p-3 rounded-lg border transition-colors",
      factor.detected ? styles.bg : 'bg-muted/10',
      factor.detected ? 'border-border/50' : 'border-border/30'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-xs">{factor.name}</span>
            {!factor.detected && (
              <span className="text-[10px] text-muted-foreground/60">(not detected)</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {factor.description}
          </p>
        </div>
        <div className={cn("flex items-center gap-1 shrink-0", styles.text)}>
          <ImpactIcon className="w-3 h-3" />
          <span className="text-[10px] font-medium uppercase">{factor.impact}</span>
        </div>
      </div>
      {/* Impact bar */}
      <div className="mt-2 h-1 bg-muted/30 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all",
            factor.detected ? styles.bar : 'bg-muted-foreground/20',
            factor.detected ? styles.width : 'w-0'
          )}
        />
      </div>
    </div>
  )
})

export const ExposureBreakdown = memo(function ExposureBreakdown({ data }: ExposureBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const signals = data.surveillance_exposure?.signals
  const opsec = data.opsec_failures
  const sleepWindow = data.sleep_window
  const reactionSpeed = data.reaction_speed
  const egoNetwork = data.ego_network

  // Calculate factors with their impact levels based on actual data
  const factors: ExposureFactor[] = [
    {
      name: 'Timing Patterns',
      impact: (sleepWindow?.confidence || 0) > 70 ? 'high' : 
              (sleepWindow?.confidence || 0) > 40 ? 'medium' : 'low',
      description: 'Regular activity timing reveals timezone and daily routines',
      detected: (sleepWindow?.confidence || 0) > 30
    },
    {
      name: 'Repeated Counterparties',
      impact: (signals?.repeated_counterparties || 0) > 5 ? 'high' :
              (signals?.repeated_counterparties || 0) > 2 ? 'medium' : 'low',
      description: 'Frequent interactions with the same wallets enable clustering',
      detected: (signals?.repeated_counterparties || 0) > 0
    },
    {
      name: 'Funding Links',
      impact: (opsec?.funding_sources?.length || 0) > 3 ? 'high' :
              (opsec?.funding_sources?.length || 0) > 1 ? 'medium' : 'low',
      description: 'Identifiable funding sources create permanent ownership links',
      detected: (opsec?.funding_sources?.length || 0) > 0
    },
    {
      name: 'Execution Style',
      impact: (reactionSpeed?.bot_confidence || 0) > 70 ? 'high' :
              (reactionSpeed?.bot_confidence || 0) > 30 ? 'medium' : 'low',
      description: 'Reaction speed and execution patterns classify trader type',
      detected: reactionSpeed?.total_pairs ? reactionSpeed.total_pairs > 5 : false
    },
    {
      name: 'Transaction Complexity',
      impact: signals?.mev_execution_detected ? 'high' :
              (signals?.swap_count || 0) > 50 ? 'medium' : 'low',
      description: 'MEV awareness and sophistication reveal professional patterns',
      detected: signals?.mev_execution_detected || (signals?.swap_count || 0) > 20
    }
  ]

  // Sort by impact
  const sortedFactors = [...factors].sort((a, b) => {
    if (a.detected !== b.detected) return a.detected ? -1 : 1
    const impactOrder: Record<ImpactLevel, number> = { high: 0, medium: 1, low: 2, minimal: 3 }
    return impactOrder[a.impact] - impactOrder[b.impact]
  })

  // Count by impact level for detected factors
  const impactCounts = factors.filter(f => f.detected).reduce((acc, f) => {
    acc[f.impact] = (acc[f.impact] || 0) + 1
    return acc
  }, {} as Record<ImpactLevel, number>)

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="border-border/40">
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="pb-4 cursor-pointer hover:bg-muted/10 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Exposure Score Breakdown</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Factors contributing to surveillance exposure
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Impact summary badges */}
                <div className="hidden sm:flex gap-1.5">
                  {impactCounts.high && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] py-0">
                      {impactCounts.high} high
                    </Badge>
                  )}
                  {impactCounts.medium && (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[10px] py-0">
                      {impactCounts.medium} med
                    </Badge>
                  )}
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  isExpanded && "rotate-180"
                )} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        {/* Collapsed: Show compact bars */}
        {!isExpanded && (
          <CardContent className="pt-0 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sortedFactors.slice(0, 6).map((factor, i) => (
                <FactorBar key={i} factor={factor} />
              ))}
            </div>
          </CardContent>
        )}

        {/* Expanded: Show detailed breakdown */}
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {sortedFactors.map((factor, i) => (
              <FactorRow key={i} factor={factor} />
            ))}

            {/* Methodology Note */}
            <div className="p-3 rounded-lg bg-card border border-border/40 mt-4">
              <div className="flex gap-2.5">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">How this works: </span>
                  Exposure scores are heuristic estimates similar to those used by surveillance platforms. 
                  Higher impact factors have greater influence on your overall exposure score.
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
})
