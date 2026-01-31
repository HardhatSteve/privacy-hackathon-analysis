import type { ReactNode } from 'react'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-cream-dark/50 rounded-2xl p-8 text-center hover:bg-cream-dark/70 transition-colors">
      <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-teal">
        {icon}
      </div>
      <h3 className="font-serif text-xl font-semibold text-brown mb-2">{title}</h3>
      <p className="text-brown-light text-sm leading-relaxed">{description}</p>
    </div>
  )
}
