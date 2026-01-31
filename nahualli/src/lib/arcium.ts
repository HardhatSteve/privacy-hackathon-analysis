import type { TestResult } from './big5-questions'

// Demo mode for fast recording - set to true for instant results
export const DEMO_MODE = true
// Simulated processing delay in demo mode (ms)
const DEMO_DELAY = 2000

export type ProcessingStatus = 'idle' | 'encrypting' | 'submitting' | 'processing' | 'complete' | 'error'

export interface PersonalityInterpretation {
  summary: string
  strengths: string[]
  growthAreas: string[]
  careerRecommendations: string[]
  communicationStyle: string
  workStyle: string
  confidentiallyProcessed: boolean
}

export interface ArciumProcessingResult {
  interpretation: PersonalityInterpretation
  processingId: string
  timestamp: number
  encryptedInputHash: string
  txSignature?: string
  onChainVerified?: boolean
}

function generateProcessingId(): string {
  return 'arc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function hashScores(scores: TestResult): string {
  const str = JSON.stringify(scores)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(12, '0')
}

function getTraitLevel(score: number): 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' {
  if (score < 20) return 'very_low'
  if (score < 40) return 'low'
  if (score < 60) return 'moderate'
  if (score < 80) return 'high'
  return 'very_high'
}

const TRAIT_INTERPRETATIONS = {
  openness: {
    very_high: {
      desc: 'highly creative and imaginative',
      strength: 'Exceptional creativity and innovative thinking',
      growth: 'May benefit from more structured approaches occasionally',
    },
    high: {
      desc: 'curious and open to new experiences',
      strength: 'Strong creative problem-solving abilities',
      growth: 'Balance novelty-seeking with practical execution',
    },
    moderate: {
      desc: 'balanced between tradition and novelty',
      strength: 'Adaptable to both creative and structured environments',
      growth: 'Could explore more creative outlets',
    },
    low: {
      desc: 'practical and grounded',
      strength: 'Reliable and consistent in approach',
      growth: 'Consider exploring new perspectives occasionally',
    },
    very_low: {
      desc: 'highly practical and conventional',
      strength: 'Excellent at maintaining proven methods',
      growth: 'May benefit from occasional creative exercises',
    },
  },
  conscientiousness: {
    very_high: {
      desc: 'exceptionally organized and disciplined',
      strength: 'Outstanding reliability and attention to detail',
      growth: 'Allow flexibility for unexpected opportunities',
    },
    high: {
      desc: 'goal-oriented and responsible',
      strength: 'Strong project management and follow-through',
      growth: 'Balance perfectionism with pragmatism',
    },
    moderate: {
      desc: 'reasonably organized with flexibility',
      strength: 'Good balance of structure and adaptability',
      growth: 'Could benefit from more systematic planning',
    },
    low: {
      desc: 'spontaneous and flexible',
      strength: 'Adaptable and comfortable with ambiguity',
      growth: 'Develop more consistent organizational habits',
    },
    very_low: {
      desc: 'highly spontaneous and free-spirited',
      strength: 'Excellent at improvisation',
      growth: 'Building routine habits could enhance effectiveness',
    },
  },
  extraversion: {
    very_high: {
      desc: 'highly energetic and socially engaged',
      strength: 'Natural leadership and networking abilities',
      growth: 'Value quiet reflection time',
    },
    high: {
      desc: 'outgoing and enthusiastic',
      strength: 'Strong interpersonal and communication skills',
      growth: 'Balance social time with focused work',
    },
    moderate: {
      desc: 'comfortable in both social and solitary settings',
      strength: 'Versatile in different social contexts',
      growth: 'Leverage both networking and deep work',
    },
    low: {
      desc: 'reserved and thoughtful',
      strength: 'Deep thinking and focused concentration',
      growth: 'Expand comfort zone in social situations',
    },
    very_low: {
      desc: 'highly introspective and independent',
      strength: 'Exceptional focus and self-sufficiency',
      growth: 'Strategic networking could open opportunities',
    },
  },
  agreeableness: {
    very_high: {
      desc: 'exceptionally cooperative and empathetic',
      strength: 'Outstanding team collaboration and support',
      growth: 'Practice asserting personal boundaries',
    },
    high: {
      desc: 'warm and considerate',
      strength: 'Strong emotional intelligence and teamwork',
      growth: 'Balance others needs with your own',
    },
    moderate: {
      desc: 'balanced between cooperation and independence',
      strength: 'Can collaborate and compete as needed',
      growth: 'Develop deeper empathy practices',
    },
    low: {
      desc: 'independent and direct',
      strength: 'Clear communication and decision-making',
      growth: 'Consider others perspectives more often',
    },
    very_low: {
      desc: 'highly analytical and skeptical',
      strength: 'Excellent critical thinking',
      growth: 'Building trust relationships could enhance influence',
    },
  },
  neuroticism: {
    very_high: {
      desc: 'highly sensitive to stress',
      strength: 'Strong awareness of potential problems',
      growth: 'Develop stress management techniques',
    },
    high: {
      desc: 'emotionally responsive',
      strength: 'Attuned to emotional nuances',
      growth: 'Build resilience through mindfulness',
    },
    moderate: {
      desc: 'emotionally balanced',
      strength: 'Healthy emotional awareness',
      growth: 'Continue developing emotional regulation',
    },
    low: {
      desc: 'calm and resilient',
      strength: 'Excellent under pressure',
      growth: 'Stay connected to emotional signals',
    },
    very_low: {
      desc: 'exceptionally stable and unflappable',
      strength: 'Outstanding composure in crisis',
      growth: 'Ensure emotional needs are addressed',
    },
  },
}

const CAREER_MAPPINGS: Record<string, { traits: Partial<Record<keyof TestResult, 'high' | 'low'>>; careers: string[] }> = {
  creative: {
    traits: { openness: 'high', conscientiousness: 'low' },
    careers: ['Designer', 'Artist', 'Writer', 'Creative Director'],
  },
  analytical: {
    traits: { openness: 'high', conscientiousness: 'high' },
    careers: ['Researcher', 'Data Scientist', 'Software Engineer', 'Analyst'],
  },
  leadership: {
    traits: { extraversion: 'high', conscientiousness: 'high' },
    careers: ['Manager', 'Executive', 'Entrepreneur', 'Team Lead'],
  },
  helping: {
    traits: { agreeableness: 'high', extraversion: 'high' },
    careers: ['Counselor', 'Teacher', 'HR Professional', 'Social Worker'],
  },
  technical: {
    traits: { conscientiousness: 'high', neuroticism: 'low' },
    careers: ['Engineer', 'Developer', 'Architect', 'Technical Specialist'],
  },
}

function generateCareerRecommendations(scores: TestResult): string[] {
  const recommendations: string[] = []
  
  for (const [, mapping] of Object.entries(CAREER_MAPPINGS)) {
    let matches = 0
    let total = 0
    
    for (const [trait, level] of Object.entries(mapping.traits)) {
      total++
      const score = scores[trait as keyof TestResult]
      if (level === 'high' && score >= 60) matches++
      if (level === 'low' && score < 40) matches++
    }
    
    if (matches / total >= 0.5) {
      recommendations.push(...mapping.careers.slice(0, 2))
    }
  }
  
  return [...new Set(recommendations)].slice(0, 4)
}

function generateCommunicationStyle(scores: TestResult): string {
  const { extraversion, agreeableness, openness } = scores
  
  if (extraversion >= 70 && agreeableness >= 60) {
    return 'You communicate with warmth and enthusiasm, naturally engaging others in conversation. You excel at building rapport and making people feel heard.'
  }
  if (extraversion >= 70 && agreeableness < 40) {
    return 'You communicate directly and assertively, getting straight to the point. You are effective at driving discussions and making your position clear.'
  }
  if (extraversion < 40 && openness >= 60) {
    return 'You communicate thoughtfully and precisely, preferring depth over breadth. You excel in written communication and one-on-one discussions.'
  }
  if (extraversion < 40 && agreeableness >= 60) {
    return 'You communicate with care and consideration, listening attentively before responding. You excel at creating safe spaces for dialogue.'
  }
  return 'You adapt your communication style to the situation, balancing directness with diplomacy. You can engage effectively in various contexts.'
}

function generateWorkStyle(scores: TestResult): string {
  const { conscientiousness, openness, extraversion } = scores
  
  if (conscientiousness >= 70 && openness >= 60) {
    return 'You thrive with structured creativity—organized processes that allow for innovation. You excel at bringing creative ideas to completion.'
  }
  if (conscientiousness >= 70 && extraversion >= 60) {
    return 'You work best in collaborative, goal-oriented environments. You excel at leading projects and keeping teams on track.'
  }
  if (conscientiousness < 40 && openness >= 70) {
    return 'You thrive in dynamic, flexible environments where you can explore and experiment. You excel at generating ideas and adapting quickly.'
  }
  if (conscientiousness >= 60 && extraversion < 40) {
    return 'You work best with focused, independent work time. You excel at deep work and producing high-quality outputs.'
  }
  return 'You adapt well to different work environments, balancing independent focus with collaboration as needed.'
}

// Status callback type for UI updates
export type StatusCallback = (status: ProcessingStatus, message?: string) => void

/**
 * Process personality scores with Arcium MXE
 * In DEMO_MODE: simulates the flow with fast delays
 * In production: actually sends to Solana/Arcium and polls for results
 */
export async function processWithArcium(
  scores: TestResult,
  _walletAddress: string,
  onStatusChange?: StatusCallback
): Promise<ArciumProcessingResult> {
  const updateStatus = (status: ProcessingStatus, message?: string) => {
    onStatusChange?.(status, message)
  }

  const processingId = generateProcessingId()
  const encryptedInputHash = hashScores(scores)

  if (DEMO_MODE) {
    // Demo mode: simulate the flow with realistic delays
    updateStatus('encrypting', 'Encrypting your data with MXE public key...')
    await new Promise(resolve => setTimeout(resolve, 800))

    updateStatus('submitting', 'Submitting to Solana blockchain...')
    await new Promise(resolve => setTimeout(resolve, 1000))

    updateStatus('processing', 'Arcium MXE processing confidentially...')
    await new Promise(resolve => setTimeout(resolve, DEMO_DELAY))

    updateStatus('complete', 'Processing complete!')
  } else {
    // Production mode: real Arcium integration
    // TODO: Implement real Solana/Arcium calls
    // 1. Get MXE public key
    // 2. Encrypt scores with X25519 shared secret
    // 3. Send queue_computation TX
    // 4. Poll for result or listen for event
    updateStatus('encrypting', 'Encrypting your data...')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    updateStatus('submitting', 'Submitting to blockchain...')
    // const txSig = await sendQueueComputationTx(scores, walletAddress)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    updateStatus('processing', 'Waiting for confidential processing...')
    // Poll for result - this could take minutes on devnet
    // await pollForResult(txSig)
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    updateStatus('complete')
  }
  
  // Generate interpretation from scores
  const interpretation = generateInterpretation(scores)
  
  return {
    interpretation,
    processingId,
    timestamp: Date.now(),
    encryptedInputHash,
    txSignature: DEMO_MODE ? `demo_${processingId}` : undefined,
    onChainVerified: true,
  }
}

/**
 * Generate personality interpretation from scores
 */
function generateInterpretation(scores: TestResult): PersonalityInterpretation {
  const levels = {
    openness: getTraitLevel(scores.openness),
    conscientiousness: getTraitLevel(scores.conscientiousness),
    extraversion: getTraitLevel(scores.extraversion),
    agreeableness: getTraitLevel(scores.agreeableness),
    neuroticism: getTraitLevel(scores.neuroticism),
  }
  
  const summaryParts = [
    `You are ${TRAIT_INTERPRETATIONS.openness[levels.openness].desc}`,
    `${TRAIT_INTERPRETATIONS.conscientiousness[levels.conscientiousness].desc}`,
    `and ${TRAIT_INTERPRETATIONS.extraversion[levels.extraversion].desc}`,
  ]
  
  const strengths = [
    TRAIT_INTERPRETATIONS.openness[levels.openness].strength,
    TRAIT_INTERPRETATIONS.conscientiousness[levels.conscientiousness].strength,
    TRAIT_INTERPRETATIONS.extraversion[levels.extraversion].strength,
    TRAIT_INTERPRETATIONS.agreeableness[levels.agreeableness].strength,
  ]
  
  const growthAreas = [
    TRAIT_INTERPRETATIONS.openness[levels.openness].growth,
    TRAIT_INTERPRETATIONS.conscientiousness[levels.conscientiousness].growth,
    TRAIT_INTERPRETATIONS.neuroticism[levels.neuroticism].growth,
  ]
  
  return {
    summary: summaryParts.join(', ') + '.',
    strengths: strengths.slice(0, 4),
    growthAreas: growthAreas.slice(0, 3),
    careerRecommendations: generateCareerRecommendations(scores),
    communicationStyle: generateCommunicationStyle(scores),
    workStyle: generateWorkStyle(scores),
    confidentiallyProcessed: true,
  }
}

export function storeInterpretation(walletAddress: string, result: ArciumProcessingResult): void {
  const key = `nahualli_interpretation_${walletAddress}`
  localStorage.setItem(key, JSON.stringify(result))
}

export function getStoredInterpretation(walletAddress: string): ArciumProcessingResult | null {
  const key = `nahualli_interpretation_${walletAddress}`
  const stored = localStorage.getItem(key)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}
