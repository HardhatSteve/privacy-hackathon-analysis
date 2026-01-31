import type { TestResult } from './big5-questions'
import { 
  initZK, 
  generateTraitProof, 
  generateSalt, 
  generateTestCompletedProof,
  generateRoleFitProof,
  verifyTraitProof,
  type TraitProof
} from './zk-proofs'

export type ProofType = 
  | 'test_completed'
  | 'trait_level'
  | 'trait_range'
  | 'role_fit'

export interface ZKProof {
  id: string
  type: ProofType
  statement: string
  proof: string
  publicInputs: Record<string, string | number | boolean>
  createdAt: number
  expiresAt: number | null
  walletAddress: string
  // Real ZK proof data (optional, for Noir proofs)
  noirProof?: {
    proof: string  // Base64 encoded
    commitment: string
    threshold: number
    trait: string
  }
  // On-chain data (optional, set after saving to blockchain)
  ipfsHash?: string
  solanaSignature?: string
}

export interface ProofRequest {
  type: ProofType
  trait?: keyof TestResult
  threshold?: number
  range?: { min: number; max: number }
  role?: string
  testType?: string  // big5, disc, mbti, enneagram
}

function generateProofId(): string {
  return 'zkp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function hashData(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(16, '0')
}

// Convert Uint8Array to base64
function uint8ArrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
}

// Convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Generate a real ZK proof using Noir for trait_level proofs
 */
export async function generateZKProofAsync(
  results: TestResult,
  request: ProofRequest,
  walletAddress: string,
  expiresInHours: number | null = 24
): Promise<ZKProof> {
  const proofId = generateProofId()
  const timestamp = Date.now()
  
  let statement: string
  let publicInputs: Record<string, string | number | boolean> = {}
  let noirProof: ZKProof['noirProof'] = undefined
  
  switch (request.type) {
    case 'test_completed':
      // Generate real ZK proof for test completion
      const testTypeName = request.testType || 'personality'
      const testTypeLabels: Record<string, string> = {
        'big5': 'Big Five',
        'disc': 'DISC',
        'mbti': 'MBTI',
        'enneagram': 'Enneagram',
        'personality': 'personality'
      }
      const testLabel = testTypeLabels[testTypeName] || testTypeName
      
      try {
        await initZK()
        const completedSalt = generateSalt()
        const scores = Object.values(results as unknown as Record<string, number>).slice(0, 5)
        while (scores.length < 5) scores.push(50)
        
        const completedProof = await generateTestCompletedProof({
          scores: scores.map(s => Math.round(s)),
          salt: completedSalt
        })
        
        noirProof = {
          proof: uint8ArrayToBase64(completedProof.proof),
          commitment: completedProof.publicInputs.commitment,
          threshold: 0,
          trait: 'all'
        }
        
        statement = `I have completed a ${testLabel} assessment (ZK verified)`
        publicInputs = {
          testType: testTypeName,
          completed: true,
          timestamp: timestamp,
          zkVerified: true,
        }
      } catch (error) {
        console.warn('Test completed proof generation failed:', error)
        statement = `I have completed a ${testLabel} assessment`
        publicInputs = {
          testType: testTypeName,
          completed: true,
          timestamp: timestamp,
          zkVerified: false,
        }
      }
      break
      
    case 'trait_level':
      if (!request.trait || request.threshold === undefined) {
        throw new Error('trait and threshold required for trait_level proof')
      }
      // Support any trait name, not just Big5
      const traitValue = (results as unknown as Record<string, number>)[request.trait as string]
      if (traitValue === undefined) {
        throw new Error(`Trait ${request.trait} not found in results`)
      }
      const meetsThreshold = traitValue >= request.threshold
      
      if (meetsThreshold) {
        // Generate real Noir ZK proof
        try {
          await initZK()
          const salt = generateSalt()
          const realProof = await generateTraitProof({
            score: Math.round(traitValue),
            salt,
            threshold: request.threshold
          })
          
          noirProof = {
            proof: uint8ArrayToBase64(realProof.proof),
            commitment: realProof.publicInputs.commitment,
            threshold: request.threshold,
            trait: request.trait as string
          }
          
          statement = `My ${request.trait} score is ≥${request.threshold}% (ZK verified)`
        } catch (error) {
          console.warn('Noir proof generation failed, using simulated proof:', error)
          statement = `My ${request.trait} score is HIGH (threshold: ${request.threshold})`
        }
      } else {
        statement = `My ${request.trait} score is below ${request.threshold}%`
      }
      
      publicInputs = {
        trait: request.trait as string,
        level: meetsThreshold ? 'HIGH' : 'LOW',
        threshold: request.threshold,
        meetsThreshold: meetsThreshold,
        zkVerified: !!noirProof,
      }
      break
      
    case 'trait_range':
      if (!request.trait || !request.range) {
        throw new Error('trait and range required for trait_range proof')
      }
      const value = results[request.trait]
      const inRange = value >= request.range.min && value <= request.range.max
      statement = `My ${request.trait} score is within range ${request.range.min}-${request.range.max}`
      publicInputs = {
        trait: request.trait,
        rangeMin: request.range.min,
        rangeMax: request.range.max,
        inRange: inRange,
      }
      break
      
    case 'role_fit':
      if (!request.role) {
        throw new Error('role required for role_fit proof')
      }
      // Map role name to role ID for the circuit
      const roleNameToId: Record<string, number> = {
        'Leader': 1,
        'Researcher': 2,
        'Mediator': 3,
        'Creative': 4,
        'Analyst': 5
      }
      const roleId = roleNameToId[request.role] || 0
      
      // Get Big5 scores (or map from other test types)
      const big5Results = results as unknown as Record<string, number>
      const openness = big5Results.openness ?? big5Results.type7 ?? 50
      const conscientiousness = big5Results.conscientiousness ?? big5Results.type1 ?? 50
      const extraversion = big5Results.extraversion ?? big5Results.dominance ?? 50
      const agreeableness = big5Results.agreeableness ?? big5Results.type2 ?? 50
      const neuroticism = big5Results.neuroticism ?? big5Results.type6 ?? 50
      
      if (roleId >= 1 && roleId <= 5) {
        await initZK()
        const roleSalt = generateSalt()
        
        // This will throw if user doesn't meet role requirements
        const roleFitProof = await generateRoleFitProof({
          openness: Math.round(openness),
          conscientiousness: Math.round(conscientiousness),
          extraversion: Math.round(extraversion),
          agreeableness: Math.round(agreeableness),
          neuroticism: Math.round(neuroticism),
          salt: roleSalt,
          roleId
        })
        
        noirProof = {
          proof: uint8ArrayToBase64(roleFitProof.proof),
          commitment: roleFitProof.publicInputs.commitment,
          threshold: roleId,
          trait: request.role
        }
        
        statement = `This candidate is suitable for ${request.role} role (ZK verified)`
        publicInputs = {
          role: request.role,
          fit: true,
          confidence: 100,
          zkVerified: true,
        }
      } else {
        throw new Error(`Unknown role: ${request.role}`)
      }
      break
      
    default:
      throw new Error(`Unknown proof type: ${request.type}`)
  }

  const proofData = JSON.stringify({
    id: proofId,
    statement,
    publicInputs,
    timestamp,
    wallet: walletAddress,
  })
  
  const proof = noirProof 
    ? 'noir_' + noirProof.proof.slice(0, 32) + '...'
    : 'zk_' + hashData(proofData) + '_' + hashData(walletAddress + timestamp)

  return {
    id: proofId,
    type: request.type,
    statement,
    proof,
    publicInputs,
    createdAt: timestamp,
    expiresAt: expiresInHours ? timestamp + (expiresInHours * 60 * 60 * 1000) : null,
    walletAddress,
    noirProof,
  }
}

// Synchronous version for backwards compatibility
export function generateZKProof(
  results: TestResult,
  request: ProofRequest,
  walletAddress: string,
  expiresInHours: number | null = 24
): ZKProof {
  const proofId = generateProofId()
  const timestamp = Date.now()
  
  let statement: string
  let publicInputs: Record<string, string | number | boolean> = {}
  
  switch (request.type) {
    case 'test_completed':
      statement = 'I have completed the Big Five personality assessment'
      publicInputs = {
        testType: 'big5',
        completed: true,
        timestamp: timestamp,
      }
      break
      
    case 'trait_level':
      if (!request.trait || request.threshold === undefined) {
        throw new Error('trait and threshold required for trait_level proof')
      }
      const traitValue = results[request.trait]
      const isHigh = traitValue >= request.threshold
      statement = `My ${request.trait} score is ${isHigh ? 'HIGH' : 'LOW'} (threshold: ${request.threshold})`
      publicInputs = {
        trait: request.trait,
        level: isHigh ? 'HIGH' : 'LOW',
        threshold: request.threshold,
        meetsThreshold: isHigh,
      }
      break
      
    case 'trait_range':
      if (!request.trait || !request.range) {
        throw new Error('trait and range required for trait_range proof')
      }
      const value = results[request.trait]
      const inRange = value >= request.range.min && value <= request.range.max
      statement = `My ${request.trait} score is within range ${request.range.min}-${request.range.max}`
      publicInputs = {
        trait: request.trait,
        rangeMin: request.range.min,
        rangeMax: request.range.max,
        inRange: inRange,
      }
      break
      
    case 'role_fit':
      if (!request.role) {
        throw new Error('role required for role_fit proof')
      }
      const roleFit = calculateRoleFit(results, request.role)
      statement = `I am ${roleFit.fit ? 'suitable' : 'not suitable'} for ${request.role} role`
      publicInputs = {
        role: request.role,
        fit: roleFit.fit,
        confidence: roleFit.confidence,
      }
      break
      
    default:
      throw new Error(`Unknown proof type: ${request.type}`)
  }

  const proofData = JSON.stringify({
    id: proofId,
    statement,
    publicInputs,
    timestamp,
    wallet: walletAddress,
  })
  
  const proof = 'zk_' + hashData(proofData) + '_' + hashData(walletAddress + timestamp)

  return {
    id: proofId,
    type: request.type,
    statement,
    proof,
    publicInputs,
    createdAt: timestamp,
    expiresAt: expiresInHours ? timestamp + (expiresInHours * 60 * 60 * 1000) : null,
    walletAddress,
  }
}

/**
 * Verify a ZK proof - uses Noir verification for real proofs
 */
export async function verifyZKProofAsync(proof: ZKProof): Promise<{ valid: boolean; reason?: string }> {
  if (proof.expiresAt && Date.now() > proof.expiresAt) {
    return { valid: false, reason: 'Proof has expired' }
  }
  
  // If it has a real Noir proof, verify it
  if (proof.noirProof) {
    try {
      const realProof: TraitProof = {
        proof: base64ToUint8Array(proof.noirProof.proof),
        publicInputs: {
          threshold: proof.noirProof.threshold.toString(),
          commitment: proof.noirProof.commitment
        }
      }
      const isValid = await verifyTraitProof(realProof)
      return { valid: isValid, reason: isValid ? undefined : 'Noir proof verification failed' }
    } catch (error) {
      return { valid: false, reason: 'Proof verification error' }
    }
  }
  
  // Fallback to simple validation for simulated proofs
  if (!proof.proof.startsWith('zk_') && !proof.proof.startsWith('noir_')) {
    return { valid: false, reason: 'Invalid proof format' }
  }
  
  if (!proof.id.startsWith('zkp_')) {
    return { valid: false, reason: 'Invalid proof ID' }
  }
  
  return { valid: true }
}

export function verifyZKProof(proof: ZKProof): { valid: boolean; reason?: string } {
  if (proof.expiresAt && Date.now() > proof.expiresAt) {
    return { valid: false, reason: 'Proof has expired' }
  }
  
  if (!proof.proof.startsWith('zk_') && !proof.proof.startsWith('noir_')) {
    return { valid: false, reason: 'Invalid proof format' }
  }
  
  if (!proof.id.startsWith('zkp_')) {
    return { valid: false, reason: 'Invalid proof ID' }
  }
  
  return { valid: true }
}

interface RoleFitResult {
  fit: boolean
  confidence: number
  traits: Record<string, boolean>
}

const ROLE_REQUIREMENTS: Record<string, Partial<Record<keyof TestResult, { min?: number; max?: number }>>> = {
  'Software Engineer': {
    openness: { min: 60 },
    conscientiousness: { min: 50 },
  },
  'Product Manager': {
    extraversion: { min: 50 },
    agreeableness: { min: 50 },
    conscientiousness: { min: 60 },
  },
  'Designer': {
    openness: { min: 70 },
    agreeableness: { min: 40 },
  },
  'Sales': {
    extraversion: { min: 70 },
    agreeableness: { min: 50 },
    neuroticism: { max: 50 },
  },
  'Researcher': {
    openness: { min: 70 },
    conscientiousness: { min: 60 },
  },
  'Team Lead': {
    extraversion: { min: 50 },
    conscientiousness: { min: 60 },
    agreeableness: { min: 50 },
    neuroticism: { max: 60 },
  },
}

function calculateRoleFit(results: TestResult, role: string): RoleFitResult {
  const requirements = ROLE_REQUIREMENTS[role]
  
  if (!requirements) {
    return { fit: true, confidence: 50, traits: {} }
  }
  
  const traitResults: Record<string, boolean> = {}
  let matchCount = 0
  let totalRequirements = 0
  
  for (const [trait, req] of Object.entries(requirements)) {
    const traitKey = trait as keyof TestResult
    const value = results[traitKey]
    totalRequirements++
    
    let meets = true
    if (req.min !== undefined && value < req.min) meets = false
    if (req.max !== undefined && value > req.max) meets = false
    
    traitResults[trait] = meets
    if (meets) matchCount++
  }
  
  const confidence = Math.round((matchCount / totalRequirements) * 100)
  const fit = confidence >= 70
  
  return { fit, confidence, traits: traitResults }
}

export function getAvailableRoles(): string[] {
  // Only ZK-verified roles
  return ['Leader', 'Researcher', 'Mediator', 'Creative', 'Analyst']
}

export function storeProof(proof: ZKProof): void {
  const proofs = getStoredProofs()
  proofs.push(proof)
  localStorage.setItem('nahualli_proofs', JSON.stringify(proofs))
}

export function getStoredProofs(): ZKProof[] {
  const stored = localStorage.getItem('nahualli_proofs')
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function getProofsByWallet(walletAddress: string): ZKProof[] {
  return getStoredProofs().filter(p => p.walletAddress === walletAddress)
}

export function generateShareableLink(proof: ZKProof): string {
  const encoded = btoa(JSON.stringify({
    id: proof.id,
    type: proof.type,
    statement: proof.statement,
    publicInputs: proof.publicInputs,
    proof: proof.proof,
    expiresAt: proof.expiresAt,
  }))
  return `${window.location.origin}/verify?proof=${encoded}`
}

export function decodeShareableProof(encoded: string): Partial<ZKProof> | null {
  try {
    return JSON.parse(atob(encoded))
  } catch {
    return null
  }
}
