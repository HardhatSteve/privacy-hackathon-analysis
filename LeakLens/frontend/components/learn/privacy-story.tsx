'use client'

import { memo, useRef, useEffect, useState } from 'react'
import { 
  Wallet, ArrowRight, RefreshCcw, Clock, Users, Link2, 
  Eye, EyeOff, Shield, AlertTriangle, ArrowDown,
  Fingerprint, Network, Lock, Unlock, ScanSearch, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ============================================================================
// ANIMATED SCENE WRAPPER
// ============================================================================

interface SceneProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

const Scene = memo(function Scene({ children, className, delay = 0 }: SceneProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px' }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  )
})

// ============================================================================
// SCENE 1: Most of the time, privacy doesn't matter
// ============================================================================

const Scene1 = memo(function Scene1() {
  return (
    <Scene className="min-h-[45vh] flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto text-center px-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-foreground">
          Most of the time, privacy doesn&apos;t matter.
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          You trade. You swap. Nothing bad happens.
        </p>
        
        {/* Visual: Wallet → Swap → Token flow */}
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          <div className="flex flex-col items-center gap-2 opacity-0 animate-[fadeIn_0.6s_ease-out_0.3s_forwards]">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-card border border-border/50 flex items-center justify-center">
              <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Wallet</span>
          </div>
          
          <ArrowRight className="w-5 h-5 text-muted-foreground/50 opacity-0 animate-[fadeIn_0.6s_ease-out_0.5s_forwards]" />
          
          <div className="flex flex-col items-center gap-2 opacity-0 animate-[fadeIn_0.6s_ease-out_0.7s_forwards]">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-card border border-border/50 flex items-center justify-center">
              <RefreshCcw className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Swap</span>
          </div>
          
          <ArrowRight className="w-5 h-5 text-muted-foreground/50 opacity-0 animate-[fadeIn_0.6s_ease-out_0.9s_forwards]" />
          
          <div className="flex flex-col items-center gap-2 opacity-0 animate-[fadeIn_0.6s_ease-out_1.1s_forwards]">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-card border border-border/50 flex items-center justify-center">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600" />
            </div>
            <span className="text-xs text-muted-foreground">Token</span>
          </div>
        </div>
        
        <div className="mt-8 opacity-0 animate-[fadeIn_0.6s_ease-out_1.5s_forwards]">
          <ArrowDown className="w-5 h-5 mx-auto text-muted-foreground/30 animate-bounce" />
        </div>
      </div>
    </Scene>
  )
})

// ============================================================================
// SCENE 2: But everything you do is public
// ============================================================================

const Scene2 = memo(function Scene2() {
  return (
    <Scene className="min-h-[50vh] flex items-center justify-center py-12 border-t border-border/20" delay={100}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-foreground">
            But everything you do is public.
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Blockchains are public databases. Anyone can replay your entire history. This data never expires.
          </p>
        </div>
        
        {/* Timeline visualization */}
        <div className="relative mt-8">
          {/* Timeline line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-border/50 via-primary/50 to-border/50 transform -translate-x-1/2" />
          
          {/* Timeline points */}
          <div className="relative space-y-12">
            <div className="flex items-center gap-6">
              <div className="flex-1 text-right">
                <p className="text-sm text-muted-foreground">Day 1</p>
                <p className="text-foreground font-medium">Wallet created</p>
              </div>
              <div className="w-4 h-4 rounded-full bg-card border-2 border-primary z-10" />
              <div className="flex-1" />
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex-1" />
              <div className="w-4 h-4 rounded-full bg-card border-2 border-primary/60 z-10" />
              <div className="flex-1 text-left">
                <p className="text-sm text-muted-foreground">Week 2</p>
                <p className="text-foreground font-medium">First trade</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex-1 text-right">
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-foreground font-medium">Every action recorded</p>
              </div>
              <div className="w-4 h-4 rounded-full bg-primary z-10 animate-pulse" />
              <div className="flex-1" />
            </div>
          </div>
          
          {/* PUBLIC badge */}
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 rotate-12">
            <div className="px-3 py-1.5 rounded bg-destructive/20 border border-destructive/40">
              <span className="text-xs font-bold tracking-widest text-destructive">PUBLIC</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center opacity-0 animate-[fadeIn_0.6s_ease-out_0.8s_forwards]">
          <ArrowDown className="w-5 h-5 mx-auto text-muted-foreground/30 animate-bounce" />
        </div>
      </div>
    </Scene>
  )
})

// ============================================================================
// SCENE 3: Patterns are where identity leaks
// ============================================================================

const Scene3 = memo(function Scene3() {
  return (
    <Scene className="min-h-[55vh] flex items-center justify-center py-12 border-t border-border/20" delay={100}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-foreground">
            Patterns are where identity leaks.
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-card/50 border border-border/40">
            <Clock className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-foreground font-semibold mb-2">Timing</h3>
            <p className="text-sm text-muted-foreground">Reveals timezone & sleep patterns</p>
          </div>
          
          <div className="p-6 rounded-xl bg-card/50 border border-border/40">
            <Fingerprint className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-foreground font-semibold mb-2">Amounts</h3>
            <p className="text-sm text-muted-foreground">Act like unique fingerprints</p>
          </div>
          
          <div className="p-6 rounded-xl bg-card/50 border border-border/40">
            <Users className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-foreground font-semibold mb-2">Connections</h3>
            <p className="text-sm text-muted-foreground">Form traceable clusters</p>
          </div>
        </div>
        
        {/* Network visualization */}
        <div className="relative h-64 flex items-center justify-center">
          {/* Central wallet */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
              <Wallet className="w-7 h-7 text-primary" />
            </div>
          </div>
          
          {/* Connected wallets */}
          {[
            { x: -120, y: -60, delay: '0.3s' },
            { x: 100, y: -80, delay: '0.5s' },
            { x: -80, y: 70, delay: '0.7s' },
            { x: 130, y: 50, delay: '0.9s' },
            { x: 0, y: -100, delay: '1.1s' },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]"
              style={{
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y}px)`,
                transform: 'translate(-50%, -50%)',
                animationDelay: pos.delay,
              }}
            >
              {/* Connection line */}
              <svg
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  width: Math.abs(pos.x) + 32,
                  height: Math.abs(pos.y) + 32,
                  transform: `translate(-50%, -50%)`,
                  overflow: 'visible',
                }}
              >
                <line
                  x1="50%"
                  y1="50%"
                  x2={-pos.x + 16}
                  y2={-pos.y + 16}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border/60"
                  strokeDasharray="4 4"
                />
              </svg>
              <div className="w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center relative z-10">
                <div className="w-4 h-4 rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-8 italic">
          Patterns alone are enough to identify you.
        </p>
        
        <div className="mt-8 text-center">
          <ArrowDown className="w-5 h-5 mx-auto text-muted-foreground/30 animate-bounce" />
        </div>
      </div>
    </Scene>
  )
})

// ============================================================================
// SCENE 4: One action can permanently reduce privacy
// ============================================================================

const Scene4 = memo(function Scene4() {
  return (
    <Scene className="min-h-[50vh] flex items-center justify-center py-12 border-t border-border/20" delay={100}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-foreground">
            One action can permanently reduce privacy.
          </h2>
          <div className="space-y-2 text-muted-foreground">
            <p>One exchange deposit.</p>
            <p>One interaction with a labeled wallet.</p>
            <p>One careless transaction.</p>
          </div>
        </div>
        
        {/* Before / After split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Before */}
          <div className="p-8 rounded-xl bg-card/30 border border-border/40 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-card border-2 border-primary/40 flex items-center justify-center">
                <Unlock className="w-7 h-7 text-primary/60" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Unlinked</h3>
            <p className="text-sm text-muted-foreground">Anonymous on-chain identity</p>
            
            <div className="mt-6 flex justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <div className="w-px h-3 bg-muted-foreground/30" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            </div>
          </div>
          
          {/* After */}
          <div className="p-8 rounded-xl bg-destructive/5 border-2 border-destructive/30 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 border-2 border-destructive/50 flex items-center justify-center">
                <Lock className="w-7 h-7 text-destructive" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Linked</h3>
            <p className="text-sm text-muted-foreground">Permanently connected to identity</p>
            
            <div className="mt-6 flex justify-center gap-2 items-center">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-8 h-0.5 bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
            </div>
          </div>
        </div>
        
        <p className="text-center text-foreground font-medium mt-8">
          Some links cannot be undone.
        </p>
        
        <div className="mt-8 text-center">
          <ArrowDown className="w-5 h-5 mx-auto text-muted-foreground/30 animate-bounce" />
        </div>
      </div>
    </Scene>
  )
})

// ============================================================================
// SCENE 5: Why starting fresh doesn't fully work
// ============================================================================

const Scene5 = memo(function Scene5() {
  return (
    <Scene className="min-h-[45vh] flex items-center justify-center py-12 border-t border-border/20" delay={100}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-foreground">
            Why starting fresh doesn&apos;t fully work.
          </h2>
        </div>
        
        <div className="space-y-4 max-w-xl mx-auto">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-muted-foreground">New wallets inherit behavioral patterns</p>
          </div>
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-muted-foreground">Timing and counterparties correlate across wallets</p>
          </div>
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-muted-foreground">Surveillance is probabilistic, not naive</p>
          </div>
        </div>
        
        {/* Two wallets with faded connection */}
        <div className="flex items-center justify-center gap-8 mt-8">
          <div className="w-14 h-14 rounded-xl bg-card border border-border/50 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-muted-foreground" />
          </div>
          
          <div className="flex-1 max-w-[100px] h-px bg-gradient-to-r from-border/60 via-muted-foreground/20 to-border/60 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent" />
          </div>
          
          <div className="w-14 h-14 rounded-xl bg-card border border-border/50 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground/60 mt-4">Connection still visible to analysis</p>
        
        <div className="mt-8 text-center">
          <ArrowDown className="w-5 h-5 mx-auto text-muted-foreground/30 animate-bounce" />
        </div>
      </div>
    </Scene>
  )
})

// ============================================================================
// SCENE 6: What selective privacy actually changes
// ============================================================================

const Scene6 = memo(function Scene6() {
  const [stage, setStage] = useState<'before' | 'transition' | 'after'>('before')
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setStage('after')
      setHasAnimated(true)
      return
    }

    const timer = setTimeout(() => {
      if (!hasAnimated) {
        setHasAnimated(true)
        setTimeout(() => setStage('transition'), 1000)
        setTimeout(() => setStage('after'), 2500)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [hasAnimated])

  return (
    <Scene className="min-h-[80vh] flex items-center justify-center py-12 border-t border-border/20" delay={100}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-foreground">
            What just happened to my privacy?
          </h2>
        </div>
        
        {/* Before section */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
            Before, tracking was easy.
          </h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-2xl mx-auto">
            Your wallet was connected to:
          </p>
          
          {/* Connected items */}
          <div className="flex items-center justify-center gap-8 mb-8 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-xl bg-card border-2 border-primary/40 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">other wallets</span>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-xl bg-muted border border-border/50 flex items-center justify-center">
                <div className="w-6 h-6 rounded bg-muted-foreground/40" />
              </div>
              <span className="text-xs text-muted-foreground">exchanges</span>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-xl bg-card border border-border/50 flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">your past behavior</span>
            </div>
          </div>
          
          <p className="text-sm text-foreground text-center max-w-xl mx-auto">
            Those links made it easy to guess who you are.
          </p>
        </div>
        
        {/* Transition: Privacy layer */}
        <div className="mb-12 p-6 rounded-xl bg-primary/5 border border-primary/30">
          <p className="text-sm text-foreground mb-2 text-center">
            Then a privacy layer was used <span className="text-primary">(encrypt.trade)</span>
          </p>
          <div className="text-center space-y-2 text-sm text-muted-foreground mb-4">
            <p>Nothing was hidden.</p>
            <p>Nothing was erased.</p>
          </div>
          <p className="text-sm text-foreground text-center">
            Some links were simply broken.
          </p>
        </div>
        
        {/* After section with animated graph */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
            After that
          </h3>
          
          {/* Animated graph visualization */}
          <div className="p-8 rounded-xl bg-card/30 border border-border/40 mb-6">
            <div className="relative h-64 flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* Central wallet */}
                <div className="absolute left-1/2 top-8 transform -translate-x-1/2">
                  <div className="w-14 h-14 rounded-xl bg-card border-2 border-primary/40 flex items-center justify-center">
                    <Wallet className="w-7 h-7 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block text-center">Your wallet</span>
                </div>
                
                {/* Other wallets */}
                <div className="absolute right-1/4 top-32">
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-card border flex items-center justify-center transition-all duration-1000",
                    stage === 'after' ? "border-border/30 opacity-50" : "border-border/50"
                  )}>
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="absolute left-1/4 top-32">
                  <div className="w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                
                {/* Exchange */}
                <div className={cn(
                  "absolute right-1/4 bottom-8 transition-all duration-1000",
                  stage === 'after' && "opacity-40"
                )}>
                  <div className="w-12 h-12 rounded-xl bg-muted border border-border/50 flex items-center justify-center">
                    <div className="w-5 h-5 rounded bg-muted-foreground/40" />
                  </div>
                </div>
                
                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Links that break */}
                  <line 
                    x1="50%" 
                    y1="36" 
                    x2="75%" 
                    y2="80" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    className={cn(
                      "transition-all duration-1000",
                      stage === 'before' ? "text-border/60" : 
                      stage === 'transition' ? "text-destructive/60 stroke-dasharray-4" :
                      "text-destructive/30 stroke-dasharray-4 opacity-40"
                    )}
                  />
                  {stage === 'transition' && (
                    <X className="w-5 h-5 text-destructive absolute left-[62.5%] top-[58%] transform -translate-x-1/2 -translate-y-1/2 bg-background animate-pulse" />
                  )}
                  {stage === 'after' && (
                    <X className="w-5 h-5 text-destructive/50 absolute left-[62.5%] top-[58%] transform -translate-x-1/2 -translate-y-1/2 bg-background" />
                  )}
                  
                  <line 
                    x1="75%" 
                    y1="104" 
                    x2="75%" 
                    y2="152" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    className={cn(
                      "transition-all duration-1000",
                      stage === 'before' ? "text-border/60" : 
                      stage === 'transition' ? "text-destructive/60 stroke-dasharray-4" :
                      "text-destructive/30 stroke-dasharray-4 opacity-40"
                    )}
                  />
                  
                  {/* Link that stays */}
                  <line 
                    x1="50%" 
                    y1="36" 
                    x2="25%" 
                    y2="80" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    className="text-border/60"
                  />
                </svg>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-foreground mb-4 text-center">
            Tracking still works — just worse.
          </p>
          
          <div className="space-y-3 text-sm text-muted-foreground max-w-xl mx-auto">
            <p className="text-center">• wallets don&apos;t cluster as cleanly</p>
            <p className="text-center">• labels are less confident</p>
            <p className="text-center">• profiles become incomplete</p>
          </div>
          
          <p className="text-sm text-foreground mt-4 text-center">
            Surveillance loses accuracy.
          </p>
        </div>
        
        {/* Important part */}
        <div className="mb-8 p-6 rounded-xl bg-card/30 border border-border/40">
          <h3 className="text-sm font-semibold text-foreground mb-4 text-center">
            The important part
          </h3>
          <p className="text-sm text-foreground mb-2 text-center">
            Your old history is still public.
          </p>
          <p className="text-sm text-muted-foreground text-center">
            But future tracking becomes harder.
          </p>
          <p className="text-sm text-foreground mt-4 text-center">
            That&apos;s what selective privacy does.
          </p>
        </div>
        
        {/* One sentence */}
        <div className="mb-12 p-6 rounded-xl bg-primary/5 border border-primary/30">
          <p className="text-sm font-medium text-foreground mb-2 text-center">
            In one sentence
          </p>
          <p className="text-base text-foreground text-center max-w-2xl mx-auto">
            encrypt.trade reduces how much others can reliably learn from your on-chain activity.
          </p>
        </div>
        
        {/* Final CTA */}
        <div className="text-center mt-12 pt-8 border-t border-border/20">
          <p className="text-lg text-muted-foreground mb-8">
            See what your wallet already reveals.
          </p>
          <Button
            asChild
            size="lg"
            className="h-12 px-8 rounded-md font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_-5px_rgba(8,145,178,0.5)]"
          >
            <a href="/" className="flex items-center gap-2">
              <ScanSearch className="w-5 h-5" />
              Analyze a wallet
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </Scene>
  )
})

// ============================================================================
// MAIN EXPORT
// ============================================================================

export const PrivacyStory = memo(function PrivacyStory() {
  return (
    <div className="relative">
      <Scene1 />
      <Scene2 />
      <Scene3 />
      <Scene4 />
      <Scene5 />
      <Scene6 />
    </div>
  )
})

PrivacyStory.displayName = 'PrivacyStory'
