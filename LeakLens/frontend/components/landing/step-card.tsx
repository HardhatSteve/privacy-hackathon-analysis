'use client'

import { memo } from 'react'

interface StepCardProps {
  step: {
    number: string
    title: string
    description: string
  }
  index: number
  isLast: boolean
}

export const StepCard = memo(function StepCard({ 
  step, 
  index, 
  isLast 
}: StepCardProps) {
  return (
    <div className="relative group">
      {/* Connector line */}
      {!isLast && (
        <div className="hidden md:block absolute top-16 left-[calc(50%+60px)] w-[calc(100%-120px)] border-t-2 border-dashed border-border/60 group-hover:border-primary/30 transition-colors duration-300" />
      )}
      
      <div className="text-center">
        {/* Step number */}
        <div className="w-32 h-32 mx-auto rounded-full border-2 border-border/60 flex items-center justify-center mb-6 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-300">
          <span className="text-4xl font-light text-muted-foreground group-hover:text-primary transition-colors duration-300">
            {step.number}
          </span>
        </div>
        
        <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors duration-300">
          {step.title}
        </h3>
        <p className="text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">
          {step.description}
        </p>
      </div>
    </div>
  )
})

StepCard.displayName = 'StepCard'
