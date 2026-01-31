'use client'

import { memo } from 'react'

interface FeatureCardProps {
  feature: {
    icon: React.ElementType
    title: string
    description: string
  }
  index: number
}

export const FeatureCard = memo(function FeatureCard({ 
  feature, 
  index 
}: FeatureCardProps) {
  return (
    <div
      className="group relative p-6 rounded-[18px] overflow-hidden card-entrance feature-card-base"
      style={{ 
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Soft teal/cyan border glow - intensifies on hover */}
      <div className="absolute inset-0 rounded-[18px] feature-card-border" />
      
      {/* Subtle background gradient shift on hover */}
      <div className="absolute inset-0 rounded-[18px] feature-card-hover-gradient" />
      
      <div className="relative z-10">
        {/* Icon in subtle rounded container */}
        <div className="relative w-12 h-12 rounded-xl feature-card-icon-container flex items-center justify-center mb-4">
          <feature.icon className="w-6 h-6 feature-card-icon" />
        </div>
        
        {/* Uppercase title, medium weight, high contrast */}
        <h3 className="font-medium text-lg mb-2.5 text-foreground uppercase tracking-wide feature-card-title">
          {feature.title}
        </h3>
        
        {/* Muted body text with increased line height */}
        <p className="text-sm feature-card-description">
          {feature.description}
        </p>
      </div>
    </div>
  )
})

FeatureCard.displayName = 'FeatureCard'
