'use client'

import { memo } from 'react'
import { FeatureCard } from './feature-card'
import { FEATURES } from './constants'
import { AnimatedWrapper } from './animated-wrapper'

export const FeatureHighlights = memo(function FeatureHighlights() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 md:gap-6">
          {FEATURES.map((feature, index) => (
            <AnimatedWrapper
              key={index}
              delay={index * 100}
              direction="up"
              threshold={0.1}
            >
              <FeatureCard feature={feature} index={index} />
            </AnimatedWrapper>
          ))}
        </div>
      </div>
    </section>
  )
})

FeatureHighlights.displayName = 'FeatureHighlights'
