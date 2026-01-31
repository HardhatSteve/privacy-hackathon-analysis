'use client'

import { ReactNode, memo } from 'react'
import { useScrollAnimation } from './use-scroll-animation'
import { cn } from '@/lib/utils'

interface AnimatedWrapperProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  threshold?: number
  rootMargin?: string
}

export const AnimatedWrapper = memo(function AnimatedWrapper({
  children,
  className,
  delay = 0,
  direction = 'up',
  threshold = 0.1,
  rootMargin = '50px',
}: AnimatedWrapperProps) {
  const { ref, isVisible } = useScrollAnimation({ delay, threshold, rootMargin })

  const getInitialTransform = () => {
    switch (direction) {
      case 'up':
        return 'translateY(30px)'
      case 'down':
        return 'translateY(-30px)'
      case 'left':
        return 'translateX(30px)'
      case 'right':
        return 'translateX(-30px)'
      case 'fade':
      default:
        return 'translateY(0)'
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0 translate-x-0' : 'opacity-0',
        className
      )}
      style={{
        transform: isVisible ? 'translateY(0) translateX(0)' : getInitialTransform(),
      }}
    >
      {children}
    </div>
  )
})

AnimatedWrapper.displayName = 'AnimatedWrapper'
