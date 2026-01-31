'use client'

import { useState, memo, useRef, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { cn, shortenAddress } from '@/lib/utils'

// ============================================================================
// SOLSCAN LINK COMPONENT - Clickable addresses
// ============================================================================

interface SolscanLinkProps {
  address: string
  type?: 'account' | 'tx'
  children?: React.ReactNode
  className?: string
  showIcon?: boolean
}

export const SolscanLink = memo(function SolscanLink({ 
  address, 
  type = 'account', 
  children, 
  className,
  showIcon = true 
}: SolscanLinkProps) {
  const baseUrl = type === 'tx' 
    ? 'https://solscan.io/tx/' 
    : 'https://solscan.io/account/'
  
  return (
    <a 
      href={`${baseUrl}${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 font-mono text-xs hover:text-primary transition-colors group",
        className
      )}
      title="View on Solscan"
    >
      {children || shortenAddress(address, 4)}
      {showIcon && (
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
      )}
    </a>
  )
})

// ============================================================================
// ANIMATED SECTION WRAPPER - Scroll reveal
// ============================================================================

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export const AnimatedSection = memo(function AnimatedSection({ 
  children, 
  className,
  delay = 0 
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check for reduced motion preference
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
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      {children}
    </div>
  )
})

// ============================================================================
// SKELETON LOADER COMPONENT
// ============================================================================

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'card' | 'circle' | 'bar'
}

export const Skeleton = memo(function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const baseClass = "animate-pulse bg-muted/50 rounded"
  
  const variants = {
    text: "h-4 w-full",
    card: "h-32 w-full rounded-lg",
    circle: "h-12 w-12 rounded-full",
    bar: "h-2 w-full rounded-full"
  }
  
  return <div className={cn(baseClass, variants[variant], className)} />
})

// ============================================================================
// SECTION SKELETON - Matches layout to prevent CLS
// ============================================================================

export const SectionSkeleton = memo(function SectionSkeleton() {
  return (
    <Card className="border-border/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton variant="circle" className="w-5 h-5" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton variant="bar" />
          <Skeleton variant="bar" className="w-3/4" />
          <Skeleton variant="bar" className="w-1/2" />
        </div>
      </CardContent>
    </Card>
  )
})
