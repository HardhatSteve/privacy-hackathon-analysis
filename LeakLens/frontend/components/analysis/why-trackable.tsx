'use client'

import { memo, useState } from 'react'
import { Fingerprint, Clock, Users, Activity, ChevronDown, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { AnalysisResult } from './types'

interface WhyTrackableProps {
  data: AnalysisResult
}

interface ExplanationBlockProps {
  icon: React.ReactNode
  title: string
  summary: string
  explanation: string
  evidence: { label: string; value: string }[]
  impact: string
  impactLevel: 'low' | 'medium' | 'high'
  defaultOpen?: boolean
}

const ExplanationBlock = memo(function ExplanationBlock({ 
  icon, 
  title, 
  summary,
  explanation, 
  evidence, 
  impact,
  impactLevel,
  defaultOpen = false
}: ExplanationBlockProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  const impactColors = {
    low: { badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', accent: 'border-cyan-500/30' },
    medium: { badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', accent: 'border-yellow-500/30' },
    high: { badge: 'bg-red-500/10 text-red-400 border-red-500/20', accent: 'border-red-500/30' }
  }
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "rounded-lg border transition-all duration-200",
        isOpen ? "bg-muted/20 border-primary/30" : "bg-muted/10 border-border/40 hover:border-border/60"
      )}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                isOpen ? "bg-primary/20 border border-primary/30" : "bg-primary/10 border border-primary/20"
              )}>
                {icon}
              </div>
              <div className="text-left">
                <h4 className="font-medium text-sm">{title}</h4>
                {!isOpen && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{summary}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={cn("text-[10px] hidden sm:flex", impactColors[impactLevel].badge)}>
                {impactLevel} impact
              </Badge>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* Full Explanation */}
            <p className="text-sm text-muted-foreground leading-relaxed pl-11">
              {explanation}
            </p>
            
            {/* Evidence Tags */}
            <div className="flex flex-wrap gap-2 pl-11">
              {evidence.map((item, i) => (
                <div key={i} className="px-2.5 py-1 rounded bg-muted/50 border border-border/50">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</span>
                  <span className="text-xs font-medium ml-1.5 text-primary">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Why This Matters */}
            <div className={cn(
              "ml-11 p-3 rounded-lg border-l-2 bg-muted/30",
              impactColors[impactLevel].accent
            )}>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Why this matters: </span>
                {impact}
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
})

export const WhyTrackable = memo(function WhyTrackable({ data }: WhyTrackableProps) {
  // Extract relevant data
  const reactionSpeed = data.reaction_speed
  const geographic = data.geographic_origin
  const sleepWindow = data.sleep_window
  const activityPattern = data.activity_pattern
  const surveillanceSignals = data.surveillance_exposure?.signals
  const egoNetwork = data.ego_network

  // Determine trader type for explanation
  const isLikelyBot = (reactionSpeed?.bot_confidence || 0) > 60
  const fastestReaction = reactionSpeed?.fastest_reaction || 0
  const humanReactions = reactionSpeed?.human_reactions || 0
  const totalReactions = reactionSpeed?.total_pairs || 1
  const humanPct = Math.round((humanReactions / totalReactions) * 100)

  // Geographic inference
  const topRegion = Object.entries(geographic || {})
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]
  const regionName = {
    europe: 'Europe',
    americas: 'Americas', 
    asia_pacific: 'Asia-Pacific',
    other: 'Unknown'
  }[topRegion?.[0] || 'other'] || 'Unknown'
  const regionConfidence = (topRegion?.[1] as number) || 0

  // Sleep window
  const sleepStart = sleepWindow?.start_hour ?? 0
  const sleepEnd = sleepWindow?.end_hour ?? 8
  const sleepConfidence = sleepWindow?.confidence || 0

  // Counterparty data
  const repeatedCounterparties = surveillanceSignals?.repeated_counterparties || 0
  const strongestLinks = egoNetwork?.summary?.strongest_links?.length || 0
  const fundingSources = data.opsec_failures?.funding_sources?.length || 0
  const withdrawalTargets = data.opsec_failures?.withdrawal_targets?.length || 0

  // Peak activity calculation
  const hourlyPattern = activityPattern?.hourly || []
  const peakHour = hourlyPattern.length > 0 ? hourlyPattern.indexOf(Math.max(...hourlyPattern)) : 0

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Fingerprint className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-base">Why this wallet can be tracked</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Understanding how blockchain surveillance systems identify and classify wallets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Block A: Behavioral Fingerprint - Default Open */}
        <ExplanationBlock
          icon={<Activity className="w-4 h-4 text-primary" />}
          title="Behavior creates a fingerprint"
          summary="Reaction speed and execution patterns identify trader type"
          explanation={
            isLikelyBot
              ? "This wallet shows automated execution patterns. Reaction times and consistency suggest algorithmic trading or bot usage, which creates a distinct behavioral signature."
              : "Reaction speed, execution consistency, and repetitive patterns distinguish human traders from bots. Your trading rhythm is identifiable."
          }
          evidence={[
            { 
              label: 'Fastest', 
              value: fastestReaction < 1000 
                ? `${fastestReaction}ms` 
                : `${(fastestReaction / 1000).toFixed(1)}s` 
            },
            { 
              label: 'Human-speed', 
              value: `${humanPct}%` 
            },
            { 
              label: 'Bot Score', 
              value: `${Math.round(reactionSpeed?.bot_confidence || 0)}%` 
            }
          ]}
          impact="Surveillance firms use reaction speed analysis to classify wallets as human, bot, or institutional. Consistent patterns make wallets easier to track across chains."
          impactLevel={isLikelyBot || humanPct < 30 ? 'high' : humanPct < 60 ? 'medium' : 'low'}
          defaultOpen={true}
        />

        {/* Block B: Timing Patterns */}
        <ExplanationBlock
          icon={<Clock className="w-4 h-4 text-primary" />}
          title="Timing reveals routines"
          summary={`Active ${regionName} timezone, sleep ${sleepStart}:00-${sleepEnd}:00 UTC`}
          explanation="Transaction timestamps reveal your timezone, sleep schedule, and daily activity patterns. This temporal fingerprint narrows geographic location."
          evidence={[
            { 
              label: 'Region', 
              value: `${regionName} (${Math.round(regionConfidence)}%)` 
            },
            { 
              label: 'Sleep', 
              value: `${sleepStart}:00-${sleepEnd}:00` 
            },
            { 
              label: 'Peak', 
              value: `${peakHour}:00 UTC` 
            }
          ]}
          impact="Regular timing patterns allow surveillance systems to infer your approximate location and identify you across multiple wallets by matching activity windows."
          impactLevel={sleepConfidence > 70 ? 'high' : sleepConfidence > 40 ? 'medium' : 'low'}
        />

        {/* Block C: Counterparty Links */}
        <ExplanationBlock
          icon={<Users className="w-4 h-4 text-primary" />}
          title="Repeated counterparties create links"
          summary={`${repeatedCounterparties} repeated interactions, ${strongestLinks} strong links`}
          explanation="Every time you interact with the same wallet—for funding, trading, or withdrawals—you strengthen the link between those addresses. Surveillance systems cluster wallets based on these patterns."
          evidence={[
            { label: 'Repeated', value: repeatedCounterparties.toString() },
            { label: 'Strong Links', value: strongestLinks.toString() },
            { label: 'Funding', value: fundingSources.toString() },
            { label: 'Cashouts', value: withdrawalTargets.toString() }
          ]}
          impact="Repeated interactions are the primary method surveillance firms use to infer wallet ownership. Even one shared funding source can permanently link wallets."
          impactLevel={repeatedCounterparties > 5 || strongestLinks > 3 ? 'high' : repeatedCounterparties > 2 ? 'medium' : 'low'}
        />

        {/* Block D: Transaction Patterns (conditional) */}
        {(surveillanceSignals?.mev_execution_detected || (surveillanceSignals?.swap_count || 0) > 20) && (
          <ExplanationBlock
            icon={<Zap className="w-4 h-4 text-primary" />}
            title="Transaction patterns reveal sophistication"
            summary={`${surveillanceSignals?.swap_count || 0} swaps, ${surveillanceSignals?.mev_execution_detected ? 'MEV detected' : 'standard execution'}`}
            explanation="The complexity of your transactions—MEV awareness, swap frequency, and execution style—creates a profile of your trading sophistication and likely wallet type."
            evidence={[
              { label: 'MEV', value: surveillanceSignals?.mev_execution_detected ? 'Yes' : 'No' },
              { label: 'Swaps', value: (surveillanceSignals?.swap_count || 0).toString() },
              { label: 'Concentration', value: `${surveillanceSignals?.portfolio_concentration || 0}%` }
            ]}
            impact="Sophisticated trading patterns classify you as a professional or institutional trader, which triggers enhanced monitoring by surveillance platforms."
            impactLevel={surveillanceSignals?.mev_execution_detected ? 'high' : 'medium'}
          />
        )}

        {/* Educational Footer */}
        <div className="mt-4 p-4 rounded-lg bg-card border border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-primary font-medium">How surveillance works: </span>
            Blockchain analysis firms combine these signals to build probabilistic identity clusters. 
            No single factor reveals identity—but patterns compound. Each identifiable behavior 
            reduces the anonymity set and increases confidence in wallet clustering.
          </p>
        </div>
      </CardContent>
    </Card>
  )
})
