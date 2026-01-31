'use client'

import { Suspense, lazy } from 'react'
import { Footer } from '@/components/footer'
import { HeroSection, AnimatedWrapper } from '@/components/landing'
import { LeakLensNavbar } from '@/components/ui/resizable-navbar'
import { cn } from '@/lib/utils'

// Lazy load non-critical sections for better performance
const FeatureBento = lazy(() =>
  import('@/components/landing/feature-bento').then(module => ({
    default: module.FeatureBento
  }))
)

const WhatWalletReveals = lazy(() =>
  import('@/components/landing/what-wallet-reveals').then(module => ({
    default: module.WhatWalletReveals
  }))
)

const ReduceExposure = lazy(() =>
  import('@/components/landing/reduce-exposure').then(module => ({
    default: module.ReduceExposure
  }))
)

// Loading fallback for lazy-loaded Bento section
const FeatureBentoSkeleton = () => (
  <div className="py-20 sm:py-28 px-4 sm:px-6">
    <div className="max-w-6xl mx-auto grid grid-cols-1 gap-4 md:grid-cols-3 md:auto-rows-[28rem]">
      {[2, 1, 1, 2].map((span, i) => (
        <div
          key={i}
          className={`h-80 md:h-auto rounded-xl bg-card/50 animate-pulse ${span === 2 ? 'md:col-span-2' : 'md:col-span-1'}`}
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  </div>
)

const WhatWalletRevealsSkeleton = () => (
  <div className="py-12 sm:py-16 px-4 sm:px-6 border-t border-border/40">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10 sm:mb-12">
        <div className="h-10 w-64 mx-auto bg-card/50 rounded animate-pulse mb-4" />
        <div className="h-5 w-96 mx-auto bg-card/30 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-lg bg-card/50 animate-pulse" />
        ))}
      </div>
      <div className="h-5 w-64 mx-auto bg-card/30 rounded animate-pulse mb-8" />
      <div className="h-10 w-40 mx-auto bg-card/50 rounded animate-pulse" />
    </div>
  </div>
)

const ReduceExposureSkeleton = () => (
  <div className="py-12 sm:py-16 px-4 sm:px-6 border-t border-border/40">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <div className="h-10 w-80 mx-auto bg-card/50 rounded animate-pulse mb-4" />
        <div className="h-5 w-96 mx-auto bg-card/30 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-card/50 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-40 rounded-lg bg-card/50 animate-pulse" />
        ))}
      </div>
      <div className="h-10 w-48 mx-auto bg-card/50 rounded animate-pulse" />
    </div>
  </div>
)

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background animate-page-fade-in relative">
      <LeakLensNavbar />

      {/* Hero Section - Load immediately (critical above the fold) */}
      <HeroSection />

      {/* Feature Bento - Lazy load for better initial performance */}
      <Suspense fallback={<FeatureBentoSkeleton />}>
        <div className={cn(
          "relative flex w-full items-center justify-center",
          "bg-black",
        )}>
          <div
            className={cn(
              "absolute inset-0",
              "[background-size:40px_40px]",
              "[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
            )}
          />
          {/* Radial gradient for the container to give a faded look */}
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
          <div className="relative z-10 w-full">
            <FeatureBento />
          </div>
        </div>
      </Suspense>

      {/* What Wallet Reveals - Lazy load for better initial performance */}
      <Suspense fallback={<WhatWalletRevealsSkeleton />}>
        <WhatWalletReveals />
      </Suspense>

      {/* Reduce Exposure - Lazy load for better initial performance */}
      <Suspense fallback={<ReduceExposureSkeleton />}>
        <ReduceExposure />
      </Suspense>

      {/* Footer with scroll animation */}
      <AnimatedWrapper direction="fade" threshold={0.2}>
        <Footer />
      </AnimatedWrapper>
    </div>
  )
}
