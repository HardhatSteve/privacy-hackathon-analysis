import { EyeOff, Clock, Link2, Shield } from 'lucide-react'

export const DEMO_WALLET = 'DL66m4cajzyz6659m8djQmuY5RdJpevhf7a5vFVEFech'

export const FEATURES = [
  {
    icon: EyeOff,
    title: 'Surveillance Exposure',
    description: 'Quantify your metadata leakage score based on RPC interactions and on-chain behaviors that reveal identity.',
  },
  {
    icon: Clock,
    title: 'Temporal Fingerprinting',
    description: 'Map your activity to specific timezones using transaction timestamps to narrow down geolocation probability.',
  },
  {
    icon: Link2,
    title: 'Wallet Linkage',
    description: 'Discover hidden clusters of wallets connected through funding sources, shared CEX deposit addresses, and liquidity pools.',
  },
  {
    icon: Shield,
    title: 'OpSec Failures',
    description: 'Identify critical operational security mistakes, such as reused nonces or identifiable metadata in NFT mints.',
  },
] as const

export const STEPS = [
  {
    number: '01',
    title: 'Input Target',
    description: 'Enter any Solana public key. Our engine parses the ledger history without requiring wallet connection permissions.',
  },
  {
    number: '02',
    title: 'Deep Scan',
    description: 'We cross-reference 50+ data points including RPC logs, timing attacks, and graph clusters to build an exposure profile.',
  },
  {
    number: '03',
    title: 'Intelligence Report',
    description: 'Receive a comprehensive privacy audit with actionable steps to sever links and regain your on-chain anonymity.',
  },
] as const
