'use client'

import { memo } from 'react'
import { StepCard } from './step-card'
import { STEPS } from './constants'
import { AnimatedWrapper } from './animated-wrapper'

export const InvestigationProcess = memo(function InvestigationProcess() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 border-t border-border/40">
      <div className="max-w-5xl mx-auto">
        <AnimatedWrapper direction="fade" delay={0}>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-foreground">
              Investigation Process
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              How LeakLens deconstructs on-chain data to find your vulnerabilities.
            </p>
          </div>
        </AnimatedWrapper>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {STEPS.map((step, index) => (
            <AnimatedWrapper
              key={index}
              delay={index * 150}
              direction="up"
              threshold={0.1}
            >
              <StepCard 
                step={step} 
                index={index} 
                isLast={index === STEPS.length - 1} 
              />
            </AnimatedWrapper>
          ))}
        </div>
      </div>
    </section>
  )
})

InvestigationProcess.displayName = 'InvestigationProcess'
