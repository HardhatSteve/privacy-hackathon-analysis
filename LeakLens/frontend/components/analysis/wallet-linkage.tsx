'use client'

import { memo, useMemo, useState } from 'react'
import { Network, ArrowRight, ArrowLeft, RefreshCw, Info, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn, shortenAddress } from '@/lib/utils'
import { SolscanLink } from './shared'
import type { EgoNetwork, NetworkEdge } from './types'

interface WalletLinkageProps {
  data: EgoNetwork
}

// Determine edge type for display
function getEdgeType(edge: NetworkEdge): { label: string; color: string; icon: React.ReactNode } {
  if (edge.has_funding && edge.has_cashout) {
    return { 
      label: 'Bidirectional', 
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      icon: <RefreshCw className="w-3 h-3" />
    }
  }
  if (edge.has_funding) {
    return { 
      label: 'Funding', 
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      icon: <ArrowRight className="w-3 h-3" />
    }
  }
  if (edge.has_cashout) {
    return { 
      label: 'Cashout', 
      color: 'text-red-400 bg-red-500/10 border-red-500/30',
      icon: <ArrowLeft className="w-3 h-3" />
    }
  }
  if (edge.has_repeated) {
    return { 
      label: 'Repeated', 
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      icon: <RefreshCw className="w-3 h-3" />
    }
  }
  return { 
    label: 'Connected', 
    color: 'text-muted-foreground bg-muted/30 border-border',
    icon: <Network className="w-3 h-3" />
  }
}

// Simplified educational visualization with cyan glow
const LinkageVisualization = memo(function LinkageVisualization({ 
  edges, 
  nodes 
}: { 
  edges: NetworkEdge[]
  nodes: EgoNetwork['nodes']
}) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  
  const displayEdges = useMemo(() => {
    return edges.slice(0, 8).map((edge, i) => {
      const targetNode = nodes.find(n => n.id === edge.target)
      const edgeType = getEdgeType(edge)
      const angle = (i / 8) * 2 * Math.PI - Math.PI / 2
      const radius = 85
      const x = 150 + radius * Math.cos(angle)
      const y = 115 + radius * Math.sin(angle)
      return { edge, targetNode, edgeType, x, y, angle }
    }).filter(item => item.targetNode)
  }, [edges, nodes])

  return (
    <div className="relative h-56 sm:h-60 bg-muted/5 rounded-lg overflow-hidden border border-border/30">
      {/* Subtle radial gradient background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at center, oklch(0.75 0.15 195 / 0.1) 0%, transparent 50%)'
        }}
      />
      
      <svg className="w-full h-full relative z-10" viewBox="0 0 300 230" preserveAspectRatio="xMidYMid meet">
        {/* Connection lines */}
        {displayEdges.map((item, i) => {
          const isHovered = hoveredNode === item.edge.target
          return (
            <g key={i}>
              <line 
                x1="150" y1="115" 
                x2={item.x} y2={item.y}
                stroke={
                  isHovered ? 'oklch(0.75 0.15 195)' :
                  item.edge.has_funding ? 'rgba(34, 211, 238, 0.4)' :
                  item.edge.has_cashout ? 'rgba(239, 68, 68, 0.4)' :
                  'rgba(148, 163, 184, 0.25)'
                }
                strokeWidth={isHovered ? 2.5 : Math.max(1.5, item.edge.confidence * 2.5)}
                strokeDasharray={item.edge.has_repeated ? "none" : "4,4"}
                className="transition-all duration-200"
              />
            </g>
          )
        })}
        
        {/* Center node (target wallet) with glow */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="150" cy="115" r="22" fill="oklch(0.75 0.15 195)" filter="url(#glow)" />
        <circle cx="150" cy="115" r="26" fill="none" stroke="oklch(0.75 0.15 195)" strokeWidth="1.5" opacity="0.4" />
        <text x="150" y="150" textAnchor="middle" fill="oklch(0.75 0.15 195)" fontSize="9" fontWeight="500">
          Target
        </text>

        {/* Connected nodes */}
        {displayEdges.map((item, i) => {
          const isHovered = hoveredNode === item.edge.target
          const nodeColor = item.edge.has_funding ? '#22d3ee' :
                           item.edge.has_cashout ? '#ef4444' :
                           item.edge.has_repeated ? '#eab308' :
                           '#64748b'
          return (
            <g 
              key={i} 
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode(item.edge.target)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <a href={`https://solscan.io/account/${item.edge.target}`} target="_blank" rel="noopener noreferrer">
                <circle 
                  cx={item.x} cy={item.y} 
                  r={isHovered ? 12 : 9} 
                  fill={isHovered ? 'oklch(0.75 0.15 195)' : nodeColor}
                  opacity={isHovered ? 1 : 0.75}
                  className="transition-all duration-200"
                />
                <text 
                  x={item.x} 
                  y={item.y + 18} 
                  textAnchor="middle" 
                  fill={isHovered ? 'oklch(0.75 0.15 195)' : '#9ca3af'}
                  fontSize="7"
                  className="transition-colors duration-200"
                >
                  {item.targetNode?.label || shortenAddress(item.edge.target, 3)}
                </text>
              </a>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <Badge variant="outline" className="text-[9px] gap-1 bg-background/90 border-cyan-500/30 py-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
          Funding
        </Badge>
        <Badge variant="outline" className="text-[9px] gap-1 bg-background/90 border-red-500/30 py-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Cashout
        </Badge>
        <Badge variant="outline" className="text-[9px] gap-1 bg-background/90 border-yellow-500/30 py-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          Repeated
        </Badge>
      </div>
    </div>
  )
})

// Individual link card with explanation
const LinkCard = memo(function LinkCard({ 
  edge, 
  node 
}: { 
  edge: NetworkEdge
  node: EgoNetwork['nodes'][0] | undefined
}) {
  const edgeType = getEdgeType(edge)
  
  return (
    <div className="p-3 rounded-lg bg-muted/15 border border-border/30 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <SolscanLink 
              address={edge.target} 
              className="font-mono text-xs truncate hover:text-primary"
            >
              {node?.label || shortenAddress(edge.target, 6)}
            </SolscanLink>
            <Badge variant="outline" className={cn("text-[9px] shrink-0 py-0", edgeType.color)}>
              {edgeType.icon}
              <span className="ml-1">{edgeType.label}</span>
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {edge.interactions} interaction{edge.interactions !== 1 ? 's' : ''} 
            {edge.total_sol > 0 && ` • ${edge.total_sol.toFixed(2)} SOL`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-medium text-primary tabular-nums">{Math.round(edge.confidence * 100)}%</p>
          <p className="text-[9px] text-muted-foreground">confidence</p>
        </div>
      </div>
    </div>
  )
})

export const WalletLinkage = memo(function WalletLinkage({ data }: WalletLinkageProps) {
  const [showConnections, setShowConnections] = useState(false)
  
  // Get the most significant links to display
  const significantLinks = useMemo(() => {
    return data.edges
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6)
  }, [data.edges])

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Network className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-base">How this wallet is connected</CardTitle>
          </div>
          <Badge variant="outline" className="w-fit border-primary/30 text-primary">
            {data.total_links} links
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Visual representation of wallet relationships inferred from on-chain patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simplified Visualization - Always visible */}
        <LinkageVisualization edges={data.edges} nodes={data.nodes} />

        {/* Caption */}
        <div className="p-2.5 rounded bg-muted/20 border-l-2 border-primary/40">
          <p className="text-[11px] text-muted-foreground">
            These links represent patterns used by surveillance firms to infer shared ownership. 
            Hover over nodes to highlight connections.
          </p>
        </div>

        {/* Collapsible Strongest Links */}
        <Collapsible open={showConnections} onOpenChange={setShowConnections}>
          <CollapsibleTrigger className="w-full">
            <div className={cn(
              "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
              showConnections 
                ? "bg-muted/20 border-primary/30" 
                : "bg-muted/10 border-border/40 hover:border-border/60"
            )}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Strongest Connections</span>
                <Badge variant="outline" className="text-[10px] py-0">{significantLinks.length}</Badge>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                showConnections && "rotate-180"
              )} />
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="pt-3 space-y-2">
              {significantLinks.map((edge, i) => {
                const node = data.nodes.find(n => n.id === edge.target)
                return <LinkCard key={i} edge={edge} node={node} />
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Risk Highlights */}
        {data.summary?.risk_highlights && data.summary.risk_highlights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.summary.risk_highlights.map((highlight, i) => (
              <Badge key={i} variant="outline" className="bg-orange-500/5 text-orange-400 border-orange-500/20 text-[10px]">
                {highlight}
              </Badge>
            ))}
          </div>
        )}

        {/* Educational Note */}
        <div className="p-3 rounded-lg bg-card border border-border/40">
          <div className="flex gap-2.5">
            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Wallet clustering: </span>
              Surveillance platforms use fund flows, timing patterns, and repeated interactions 
              to build "identity clusters" that can be linked to known entities.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
