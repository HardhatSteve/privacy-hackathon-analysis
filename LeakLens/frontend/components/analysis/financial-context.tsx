'use client'

import { memo, useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, ChevronDown, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { TradingPnL, NetWorth } from './types'

interface FinancialContextProps {
  tradingPnl: TradingPnL
  netWorth: NetWorth
}

// Format currency
function formatUSD(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1000) return `$${(value / 1000).toFixed(1)}k`
  return `$${value.toFixed(2)}`
}

function formatSOL(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(2)}k SOL`
  return `${value.toFixed(3)} SOL`
}

export const FinancialContext = memo(function FinancialContext({ tradingPnl, netWorth }: FinancialContextProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const realizedPnlUSD = tradingPnl?.totals?.realized_pnl_usd || 0
  const realizedPnlSOL = tradingPnl?.totals?.realized_pnl_sol || 0
  const distinctPairs = tradingPnl?.totals?.distinct_pairs || 0
  const totalTrades = tradingPnl?.window?.transactions_used || 0

  // Get top win and loss
  const topWin = tradingPnl?.top_wins?.[0]
  const topLoss = tradingPnl?.top_losses?.[0]

  const isProfitable = realizedPnlUSD >= 0

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="border-border/40 border-dashed">
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/10 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted/30">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Financial Activity Context
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Trading behavior contributes to exposure patterns
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* PnL Summary */}
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] py-0",
                    isProfitable 
                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" 
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  )}
                >
                  {isProfitable ? '+' : ''}{formatUSD(realizedPnlUSD)}
                </Badge>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  isExpanded && "rotate-180"
                )} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <p className={cn(
                  "text-lg font-semibold tabular-nums",
                  isProfitable ? "text-cyan-400" : "text-red-400"
                )}>
                  {isProfitable ? '+' : ''}{formatUSD(realizedPnlUSD)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Realized PnL (USD)</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <p className={cn(
                  "text-lg font-semibold tabular-nums",
                  realizedPnlSOL >= 0 ? "text-cyan-400" : "text-red-400"
                )}>
                  {realizedPnlSOL >= 0 ? '+' : ''}{formatSOL(realizedPnlSOL)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Realized PnL (SOL)</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <p className="text-lg font-semibold tabular-nums">{distinctPairs}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Traded Pairs</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <p className="text-lg font-semibold tabular-nums">{totalTrades}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Total Trades</p>
              </div>
            </div>

            {/* Top Win/Loss */}
            {(topWin || topLoss) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topWin && (
                  <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[10px] text-cyan-400 uppercase tracking-wide">Top Performer</span>
                    </div>
                    <p className="text-sm font-medium truncate font-mono">
                      {topWin.mint?.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatUSD(topWin.realized_pnl_usd || 0)} • {topWin.trades} trades
                    </p>
                  </div>
                )}
                {topLoss && topLoss.realized_pnl_usd !== topWin?.realized_pnl_usd && (
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-[10px] text-red-400 uppercase tracking-wide">Biggest Loss</span>
                    </div>
                    <p className="text-sm font-medium truncate font-mono">
                      {topLoss.mint?.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatUSD(topLoss.realized_pnl_usd || 0)} • {topLoss.trades} trades
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Context Note */}
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex gap-2.5">
                <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Note: </span>
                  Financial outcomes are not the focus of this analysis. Trading behavior—frequency, 
                  patterns, and asset selection—contributes to behavioral fingerprinting and exposure patterns.
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
})
