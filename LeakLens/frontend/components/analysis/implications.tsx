'use client'

import { memo } from 'react'
import { Lightbulb, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const ImplicationsSection = memo(function ImplicationsSection() {
  return (
    <Card className="border-border/40 bg-linear-to-br from-card via-card to-primary/5 overflow-hidden relative">
      {/* Subtle gradient accent */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, oklch(0.75 0.15 195 / 0.5), transparent)'
        }}
      />
      
      <CardContent className="py-8 px-6 relative">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          {/* Icon with glow */}
          <div className="flex justify-center">
            <div 
              className="p-3 rounded-full bg-primary/10 border border-primary/20"
              style={{
                boxShadow: '0 0 20px oklch(0.75 0.15 195 / 0.2)'
              }}
            >
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">
              What this means for you
            </h3>
            
            <div className="space-y-3">
              <p className="text-base text-muted-foreground leading-relaxed">
                <span className="text-foreground font-medium">This does not mean your identity is known.</span>
              </p>
              <p className="text-sm leading-relaxed">
                <span className="text-muted-foreground">It means your activity is </span>
                <span 
                  className="text-primary font-medium"
                  style={{ textShadow: '0 0 10px oklch(0.75 0.15 195 / 0.3)' }}
                >
                  classifiable
                </span>
                <span className="text-muted-foreground">.</span>
              </p>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-4 rounded-lg bg-muted/20 border border-border/40 text-left">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="text-primary">Classification</span> is the first step in the surveillance pipeline. 
              Once a wallet is classified, it can be <span className="text-foreground">tracked</span>, <span className="text-foreground">labeled</span>, and <span className="text-foreground">profiled</span>. 
              This data is aggregated, sold, and shared with governments, financial institutions, and compliance services.
            </p>
          </div>

          {/* Pipeline Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-lg bg-muted/10 border border-border/30 hover:border-primary/30 transition-colors">
              <p 
                className="text-2xl font-bold text-primary mb-1"
                style={{ textShadow: '0 0 15px oklch(0.75 0.15 195 / 0.3)' }}
              >
                1
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-medium">Classify</span>
                <br />
                <span className="text-muted-foreground/80">Behavioral patterns detected</span>
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/10 border border-border/30 hover:border-primary/30 transition-colors">
              <p 
                className="text-2xl font-bold text-primary mb-1"
                style={{ textShadow: '0 0 15px oklch(0.75 0.15 195 / 0.3)' }}
              >
                2
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-medium">Cluster</span>
                <br />
                <span className="text-muted-foreground/80">Wallets grouped by ownership</span>
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/10 border border-border/30 hover:border-primary/30 transition-colors">
              <p 
                className="text-2xl font-bold text-primary mb-1"
                style={{ textShadow: '0 0 15px oklch(0.75 0.15 195 / 0.3)' }}
              >
                3
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-medium">Label</span>
                <br />
                <span className="text-muted-foreground/80">Identities inferred or confirmed</span>
              </p>
            </div>
          </div>

          {/* Closing */}
          <p className="text-xs text-muted-foreground/70 pt-2">
            Understanding these mechanisms is the first step toward making <span className="text-primary">informed decisions</span> about on-chain privacy.
          </p>
        </div>
      </CardContent>
    </Card>
  )
})

export const MitigationCTA = memo(function MitigationCTA() {
  return (
    <div className="py-8 text-center space-y-6">
      <h3 className="text-base font-medium text-muted-foreground">
        What comes next?
      </h3>
      
      <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-md mx-auto">
        Now that you understand how surveillance systems classify wallets, 
        you can make more informed decisions about how you interact on-chain.
      </p>

      {/* Primary CTA with glow */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link
          href="/learn"
          className={cn(
            "inline-flex items-center justify-center gap-2",
            "px-6 py-3 rounded-lg",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 transition-all duration-200",
            "font-medium text-sm",
            "shadow-lg"
          )}
          style={{
            boxShadow: '0 0 20px oklch(0.75 0.15 195 / 0.3)'
          }}
        >
          Learn how exposure can be reduced
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Secondary Link */}
      <div>
        <Link
          href="/learn#privacy-concepts"
          className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
        >
          Explore selective privacy concepts
        </Link>
      </div>

      {/* Trust Note */}
      <p className="text-[10px] text-muted-foreground/50 pt-4 max-w-sm mx-auto">
        LeakLens is an educational tool. We do not collect wallet data or store analysis results.
      </p>
    </div>
  )
})
