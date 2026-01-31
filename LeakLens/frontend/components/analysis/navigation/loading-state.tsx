'use client'

import { memo } from 'react'
import { motion } from 'motion/react'
import { LockIcon, Wallet } from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import WorldMap from '@/components/ui/world-map'

// ============================================================================
// TYPES
// ============================================================================

interface LoadingStateProps {
  wallet: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Global blockchain network connection points for the map
const blockchainNetworkDots = [
  {
    start: { lat: 40.7128, lng: -74.006 }, // New York
    end: { lat: 51.5074, lng: -0.1278 }, // London
  },
  {
    start: { lat: 51.5074, lng: -0.1278 }, // London
    end: { lat: 1.3521, lng: 103.8198 }, // Singapore
  },
  {
    start: { lat: 1.3521, lng: 103.8198 }, // Singapore
    end: { lat: 35.6762, lng: 139.6503 }, // Tokyo
  },
  {
    start: { lat: 35.6762, lng: 139.6503 }, // Tokyo
    end: { lat: 37.5665, lng: 126.978 }, // Seoul
  },
  {
    start: { lat: 40.7128, lng: -74.006 }, // New York
    end: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  },
  {
    start: { lat: 37.7749, lng: -122.4194 }, // San Francisco
    end: { lat: 35.6762, lng: 139.6503 }, // Tokyo
  },
  {
    start: { lat: 51.5074, lng: -0.1278 }, // London
    end: { lat: 47.3769, lng: 8.5417 }, // Zurich
  },
  {
    start: { lat: 47.3769, lng: 8.5417 }, // Zurich
    end: { lat: 25.2048, lng: 55.2708 }, // Dubai
  },
]

const loadingMessages = [
  "Scanning blockchain networks...",
  "Cross-referencing 50+ data points...",
  "Analyzing transaction patterns...",
  "Detecting anomalies...",
  "Mapping fund flows...",
]

// ============================================================================
// LOADING STATE
// ============================================================================

export const LoadingState = memo(function LoadingState({ wallet }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Header text */}
        <motion.div 
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <motion.div 
              className="w-3 h-3 rounded-full bg-cyan-500"
              animate={{ 
                scale: [1, 1.2, 1],
                boxShadow: [
                  '0 0 0 0 rgba(6, 182, 212, 0.4)',
                  '0 0 0 10px rgba(6, 182, 212, 0)',
                  '0 0 0 0 rgba(6, 182, 212, 0)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-cyan-500 font-semibold tracking-wider text-sm uppercase">
              LeakLens Active
            </span>
          </div>
          
          <motion.h1 
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <span className="text-foreground">Tracing </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Global Network
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-muted-foreground text-sm md:text-base max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Analyzing wallet connections across decentralized networks
          </motion.p>
        </motion.div>

        {/* World Map */}
        <motion.div 
          className="w-full max-w-4xl mx-auto relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {/* Glow effect behind map */}
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-cyan-500/20 via-transparent to-blue-500/20 rounded-full scale-75" />
          
          <WorldMap 
            dots={blockchainNetworkDots}
            lineColor="#06b6d4"
          />
        </motion.div>

        {/* Wallet info card */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-card/50 border border-cyan-500/20 backdrop-blur-sm">
            <div className="relative">
              <Wallet className="w-5 h-5 text-cyan-500" />
              <motion.div 
                className="absolute inset-0 rounded-full bg-cyan-500/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">Target Wallet</p>
              <p className="font-mono text-sm text-foreground">{formatAddress(wallet)}</p>
            </div>
          </div>
        </motion.div>

        {/* Loading indicator */}
        <motion.div 
          className="mt-6 flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {/* Animated loading text */}
          <div className="h-5 overflow-hidden">
            <motion.div
              animate={{ y: [0, -20, -40, -60, -80, 0] }}
              transition={{ 
                duration: 10, 
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.2, 0.4, 0.6, 0.8, 1]
              }}
            >
              {loadingMessages.map((msg, idx) => (
                <p key={idx} className="h-5 text-sm text-muted-foreground">
                  {msg}
                </p>
              ))}
            </motion.div>
          </div>

          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-cyan-500"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-48 h-1 bg-muted/30 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{ width: '50%' }}
            />
          </div>
        </motion.div>

        {/* Trust badge */}
        <motion.p 
          className="mt-8 text-xs text-muted-foreground/60 flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <LockIcon className="w-4 h-4" /> Read-only analysis • No wallet connection required
        </motion.p>
      </div>
    </div>
  )
})
