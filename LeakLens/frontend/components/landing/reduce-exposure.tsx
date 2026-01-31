'use client'

import { memo} from 'react'
import Link from 'next/link'
import { Wallet, GitBranch, Clock, ArrowRight, Shield, Eye, EyeOff, X, Check, Link2, Lock, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button' 

const recommendations = [
  {
    icon: Wallet,
    title: 'Wallet separation',
    description: 'Use different wallets for trading, holding, governance, and experimentation to avoid cross-linking behavior.',
  },
  {
    icon: GitBranch,
    title: 'Flow isolation',
    description: 'Prevent identity correlation by avoiding repeated funding paths, counterparties, or shared bridges.',
  },
  {
    icon: Clock,
    title: 'Timing discipline',
    description: 'Irregular activity and delayed execution reduce behavioral fingerprinting over time.',
  },
]

const beforeAfter = {
  before: {
    subtitle: 'Behavioral Clusters',
    description: 'Your transactions create a fingerprint. Regular intervals, consistent gas amounts, and repeated interactions with specific contracts form clusters that are easily identified by surveillance firms.',
  },
  after: {
    subtitle: 'Fragmented Activity',
    description: 'Breaking the linkability. By randomizing timing, varying amounts, and using privacy pools, your on-chain footprint becomes noise rather than a signal. Correlation becomes statistically impossible.',
  },
}

const privacyComparison = {
  without: [
    'Full transaction history permanently visible',
    'Wallet associations easily linkable',
    'Assets fully transparent to observers',
  ],
  with: [
    'Transactions encrypted via zk-SNARKs',
    'Behavioral links broken effectively',
    'Assets visible only when you share viewing keys',
  ],
}




export const ReduceExposure = memo(function ReduceExposure() {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-border/40 bg-background">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-foreground">
            How to reduce on-chain exposure
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Understanding exposure is the first step. Reducing it is a choice.
          </p>
        </div>

        {/* Practical Steps */}
        <div className="mb-16 sm:mb-20">
          <div className="mb-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              CORE PRINCIPLES
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">
            Practical steps that reduce exposure
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={index}
                  className={cn(
                    'flex flex-col items-start p-6 rounded-xl',
                    'border border-[var(--color-cyan-600)]/30 bg-card/60 backdrop-blur-sm',
                    'hover:border-[var(--color-cyan-600)]/50 hover:bg-card/70',
                    'transition-all duration-300',
                    'relative overflow-hidden group',
                    'shadow-[0_0_15px_rgba(8,145,178,0.08)] hover:shadow-[0_0_25px_rgba(8,145,178,0.15)]'
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-cyan-600)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="mb-4 p-3 rounded-lg bg-[var(--color-cyan-600)]/20 group-hover:bg-[var(--color-cyan-600)]/30 transition-colors relative z-10 border border-[var(--color-cyan-600)]/30">
                    <Icon className="w-5 h-5 text-[var(--color-cyan-600)]" strokeWidth={2} />
                  </div>
                  <h4 className="text-base font-bold mb-2.5 text-foreground relative z-10 group-hover:text-[var(--color-cyan-600)] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Before vs After */}
        <div className="mb-16 sm:mb-20">
          <h3 className="text-xl sm:text-2xl font-semibold mb-8 text-foreground">
            Before vs after exposure
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={cn(
              'p-6 rounded-xl border-2',
              'border-destructive/40 bg-card/50 backdrop-blur-sm',
              'hover:border-destructive/60 hover:bg-card/60',
              'transition-all duration-300',
              'relative overflow-hidden'
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              {/* Background decorative icon - broken chain */}
              <div className="absolute top-4 right-4 w-32 h-32 opacity-10 pointer-events-none">
                <Link2 className="w-full h-full text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <span className="w-2 h-2 rounded-full bg-destructive"></span>
                <h4 className="text-lg font-bold text-foreground uppercase">BEFORE</h4>
              </div>
              <h5 className="text-xl font-bold mb-4 text-foreground relative z-10">
                {beforeAfter.before.subtitle}
              </h5>
              <p className="text-sm text-foreground leading-relaxed relative z-10">
                {beforeAfter.before.description}
              </p>
            </div>
            <div className={cn(
              'p-6 rounded-xl border-2',
              'border-[var(--color-cyan-600)]/60 bg-card/50 backdrop-blur-sm',
              'hover:border-[var(--color-cyan-600)]/80 hover:bg-card/60',
              'transition-all duration-300',
              'relative overflow-hidden',
              'shadow-[0_0_30px_rgba(8,145,178,0.2)] hover:shadow-[0_0_40px_rgba(8,145,178,0.3)]'
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-cyan-600)]/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              {/* Background decorative icon - shield */}
              <div className="absolute top-4 right-4 w-32 h-32 opacity-10 pointer-events-none">
                <Shield className="w-full h-full text-[var(--color-cyan-600)]" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <span className="w-2 h-2 rounded-full bg-[var(--color-cyan-600)]"></span>
                <h4 className="text-lg font-bold text-foreground uppercase">AFTER</h4>
              </div>
              <h5 className="text-xl font-bold mb-4 text-foreground relative z-10">
                {beforeAfter.after.subtitle}
              </h5>
              <p className="text-sm text-foreground leading-relaxed relative z-10">
                {beforeAfter.after.description}
              </p>
            </div>
          </div>
        </div>

        {/* Selective Privacy Comparison */}
        <div id="privacy-concepts" className="mb-16 sm:mb-20 scroll-mt-24">
          <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground">
            Selective Privacy Outcomes
          </h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
            Compare the visibility of your assets on the public ledger versus using LeakLens selective privacy.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Public Ledger Card */}
            <div className={cn(
              'rounded-xl border',
              'border-border/50 bg-card/30 backdrop-blur-sm',
              'transition-all duration-300',
              'relative overflow-hidden',
              'flex flex-col'
            )}>
              {/* Top visual element - dots and line */}
              <div className="p-6 pb-0 relative z-10 h-24 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40"></div>
                  <div className="flex-1 h-px border-t border-dashed border-muted-foreground/30"></div>
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40"></div>
                  <div className="flex-1 h-px border-t border-dashed border-muted-foreground/30"></div>
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40"></div>
                </div>
                <div className="flex items-center justify-end mt-4">
                  <Eye className="w-5 h-5 text-muted-foreground/50" />
                </div>
              </div>
              {/* Content */}
              <div className="p-6 pt-4 flex-1">
                <h4 className="text-lg font-bold text-foreground mb-5">
                  Public Ledger
                </h4>
                <div className="space-y-3">
                  {privacyComparison.without.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <X className="w-4 h-4 text-destructive shrink-0" strokeWidth={2.5} />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Selective Privacy Card */}
            <div className={cn(
              'rounded-xl border-2',
              'border-[var(--color-cyan-600)]/50 bg-card/30 backdrop-blur-sm',
              'transition-all duration-300',
              'relative overflow-hidden',
              'shadow-[0_0_30px_rgba(8,145,178,0.15)]',
              'flex flex-col'
            )}>
              {/* Top visual element - dots and line with lock in center */}
              <div className="p-6 pb-0 relative z-10 h-24 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40"></div>
                  <div className="flex-1 h-px border-t border-dashed border-[var(--color-cyan-600)]/40"></div>
                  {/* Lock icon in circle */}
                  <div className="w-8 h-8 rounded-full bg-[var(--color-cyan-600)]/20 border border-[var(--color-cyan-600)]/40 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-[var(--color-cyan-600)]" />
                  </div>
                  <div className="flex-1 h-px border-t border-dashed border-[var(--color-cyan-600)]/40"></div>
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40"></div>
                </div>
                <div className="flex items-center justify-end mt-4">
                  <EyeOff className="w-5 h-5 text-[var(--color-cyan-600)]" />
                </div>
              </div>
              {/* Content */}
              <div className="p-6 pt-4 flex-1">
                <div className="mb-5">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-bold text-foreground">
                      Selective Privacy
                    </h4>
                    <span className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                      'bg-[var(--color-cyan-600)] text-[var(--color-gray-100)]'
                    )}>
                      RECOMMENDED
                    </span>
                  </div>
                  <a 
                    href="https://encrypt.trade" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--color-cyan-600)]/70 hover:text-[var(--color-cyan-600)] transition-colors mt-1 inline-block"
                  >
                    via encrypt.trade
                  </a>
                </div>
                <div className="space-y-3">
                  {privacyComparison.with.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-[var(--color-cyan-600)] shrink-0" strokeWidth={2.5} />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bridge + CTA */}
        <div className="text-center space-y-6">
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground max-w-3xl mx-auto leading-tight mb-3">
            Selective privacy doesn&apos;t mean disappearing.
            <br />
            <span className="text-[var(--color-cyan-600)]">It means choosing when to be visible.</span>
          </p>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Take control of your on-chain narrative today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 px-8 rounded-md border border-black font-medium bg-[var(--color-cyan-600)] hover:bg-[var(--color-cyan-600)]/90 text-[var(--color-gray-100)] shadow-[0_0_20px_-5px_rgba(8,145,178,0.5)]"
              style={{
                backgroundClip: 'unset',
                WebkitBackgroundClip: 'unset'
              }}
            >
              <a href="https://encrypt.trade" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                Use encrypt.trade
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            
            <Button
              asChild
              size="lg"
              className="h-12 px-6 rounded-md border border-[var(--color-cyan-600)]/40 bg-background hover:bg-background/90 text-[var(--color-cyan-600)] font-medium"
            >
              <Link href="/learn" className="flex items-center gap-2">
                Learn why wallets aren&apos;t private
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="h-12 px-6"
              style={{ color: 'var(--color-cyan-600)' }}
            >
              <a href="https://docs.encifher.io/docs/how-it-works" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                Read documentation
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
})

ReduceExposure.displayName = 'ReduceExposure'
