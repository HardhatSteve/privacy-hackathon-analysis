import { Noir } from '@noir-lang/noir_js'
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg'

// Import circuits directly
import traitCircuit from '../../circuits/trait_proof/target/trait_proof.json'
import testCompletedCircuit from '../../circuits/test_completed/target/test_completed.json'
import roleFitCircuit from '../../circuits/role_fit/target/role_fit.json'

// Circuit instances
let traitNoir: Noir | null = null
let traitBackend: BarretenbergBackend | null = null

let testCompletedNoir: Noir | null = null
let testCompletedBackend: BarretenbergBackend | null = null

let roleFitNoir: Noir | null = null
let roleFitBackend: BarretenbergBackend | null = null

let initPromise: Promise<void> | null = null

export interface TraitProofInput {
  score: number      // 0-100
  salt: string       // Random hex string
  threshold: number  // Minimum to prove
}

export interface TraitProof {
  proof: Uint8Array
  publicInputs: {
    threshold: string
    commitment: string
  }
}

/**
 * Initialize the Noir circuit and backend
 * Call this once before generating proofs
 */
export async function initZK(): Promise<void> {
  if (traitNoir && traitBackend) return
  if (initPromise) return initPromise
  
  initPromise = (async () => {
    console.log('Initializing ZK circuits...')
    
    // Initialize trait proof circuit
    traitBackend = new BarretenbergBackend(traitCircuit as any)
    traitNoir = new Noir(traitCircuit as any)
    
    // Initialize test completed circuit
    testCompletedBackend = new BarretenbergBackend(testCompletedCircuit as any)
    testCompletedNoir = new Noir(testCompletedCircuit as any)
    
    // Initialize role fit circuit
    roleFitBackend = new BarretenbergBackend(roleFitCircuit as any)
    roleFitNoir = new Noir(roleFitCircuit as any)
    
    console.log('ZK circuits initialized')
  })()
  
  return initPromise
}

/**
 * Generate a commitment for a score using the same hash as the circuit
 * This commitment is stored publicly, the score remains private
 * Truncated to fit within BN254 field (< 2^254)
 */
export async function generateCommitment(score: number, salt: string): Promise<string> {
  // Use Web Crypto for a deterministic hash
  // Note: This should match Pedersen hash in circuit for real verification
  const encoder = new TextEncoder()
  const data = encoder.encode(`${score}:${salt}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  
  // Truncate to 31 bytes (248 bits) to stay within BN254 field modulus
  // BN254 field is ~254 bits, but we use 248 to be safe
  const truncated = hashArray.slice(0, 31)
  return '0x' + truncated.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a ZK proof that a trait score meets a threshold
 * without revealing the actual score
 */
export async function generateTraitProof(input: TraitProofInput): Promise<TraitProof> {
  await initZK()
  
  if (!traitNoir || !traitBackend) {
    throw new Error('ZK not initialized')
  }

  // Validate inputs
  if (input.score < 0 || input.score > 100) {
    throw new Error('Score must be between 0 and 100')
  }
  if (input.threshold < 0 || input.threshold > 100) {
    throw new Error('Threshold must be between 0 and 100')
  }
  if (input.score < input.threshold) {
    throw new Error('Score is below threshold - cannot generate valid proof')
  }

  console.log('Generating ZK proof...', { threshold: input.threshold })
  
  // Convert inputs to Field format
  const scoreField = input.score.toString()
  const saltField = BigInt('0x' + input.salt).toString()
  const thresholdField = input.threshold.toString()
  
  // Generate witness - circuit computes commitment internally and returns it
  const { witness, returnValue } = await traitNoir.execute({
    score: scoreField,
    salt: saltField,
    threshold: thresholdField,
  })
  
  // The commitment is returned by the circuit
  const commitment = returnValue as string
  console.log('Circuit computed commitment:', commitment)

  // Generate the proof
  const proof = await traitBackend.generateProof(witness)
  
  console.log('ZK proof generated successfully')
  
  return {
    proof: proof.proof,
    publicInputs: {
      threshold: thresholdField,
      commitment: commitment
    }
  }
}

/**
 * Verify a ZK proof
 */
export async function verifyTraitProof(proof: TraitProof): Promise<boolean> {
  await initZK()
  
  if (!traitBackend) {
    throw new Error('ZK not initialized')
  }

  console.log('Verifying ZK proof...')
  
  try {
    const isValid = await traitBackend.verifyProof({
      proof: proof.proof,
      publicInputs: [proof.publicInputs.threshold, proof.publicInputs.commitment]
    })
    
    console.log('Proof verification:', isValid ? 'VALID' : 'INVALID')
    return isValid
  } catch (error) {
    console.error('Proof verification failed:', error)
    return false
  }
}

/**
 * Generate a random salt for commitments
 * Uses 16 bytes to stay well within BN254 field modulus
 */
export function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Check if ZK is available (circuit loaded)
 */
export function isZKAvailable(): boolean {
  return traitNoir !== null && traitBackend !== null
}

// ============================================
// TEST COMPLETED PROOF
// ============================================

export interface TestCompletedInput {
  scores: number[]  // Array of 5 scores (0-100)
  salt: string
}

export interface TestCompletedProof {
  proof: Uint8Array
  publicInputs: {
    commitment: string
  }
}

export async function generateTestCompletedProof(input: TestCompletedInput): Promise<TestCompletedProof> {
  await initZK()
  
  if (!testCompletedNoir || !testCompletedBackend) {
    throw new Error('ZK not initialized')
  }

  // Validate inputs
  if (input.scores.length < 5) {
    throw new Error('Need at least 5 scores')
  }
  for (const score of input.scores) {
    if (score < 0 || score > 100) {
      throw new Error('All scores must be between 0 and 100')
    }
  }

  console.log('Generating test_completed ZK proof...')
  
  const saltField = BigInt('0x' + input.salt).toString()
  
  const { witness, returnValue } = await testCompletedNoir.execute({
    score1: input.scores[0].toString(),
    score2: input.scores[1].toString(),
    score3: input.scores[2].toString(),
    score4: input.scores[3].toString(),
    score5: input.scores[4].toString(),
    salt: saltField,
  })
  
  const commitment = returnValue as string
  console.log('Test completed commitment:', commitment)

  const proof = await testCompletedBackend.generateProof(witness)
  
  console.log('Test completed ZK proof generated successfully')
  
  return {
    proof: proof.proof,
    publicInputs: {
      commitment: commitment
    }
  }
}

// ============================================
// ROLE FIT PROOF
// ============================================

export interface RoleFitInput {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
  salt: string
  roleId: number  // 1-5
}

export interface RoleFitProof {
  proof: Uint8Array
  publicInputs: {
    roleId: string
    commitment: string
  }
}

const ROLE_NAMES: Record<number, string> = {
  1: 'Leader',
  2: 'Researcher',
  3: 'Mediator',
  4: 'Creative',
  5: 'Analyst'
}

export function getRoleNames(): Record<number, string> {
  return ROLE_NAMES
}

export async function generateRoleFitProof(input: RoleFitInput): Promise<RoleFitProof> {
  await initZK()
  
  if (!roleFitNoir || !roleFitBackend) {
    throw new Error('ZK not initialized')
  }

  // Validate inputs
  const scores = [input.openness, input.conscientiousness, input.extraversion, input.agreeableness, input.neuroticism]
  for (const score of scores) {
    if (score < 0 || score > 100) {
      throw new Error('All scores must be between 0 and 100')
    }
  }
  if (input.roleId < 1 || input.roleId > 5) {
    throw new Error('Role ID must be between 1 and 5')
  }

  console.log('Generating role_fit ZK proof...', { role: ROLE_NAMES[input.roleId] })
  
  const saltField = BigInt('0x' + input.salt).toString()
  
  const { witness, returnValue } = await roleFitNoir.execute({
    openness: input.openness.toString(),
    conscientiousness: input.conscientiousness.toString(),
    extraversion: input.extraversion.toString(),
    agreeableness: input.agreeableness.toString(),
    neuroticism: input.neuroticism.toString(),
    salt: saltField,
    role_id: input.roleId.toString(),
  })
  
  const commitment = returnValue as string
  console.log('Role fit commitment:', commitment)

  const proof = await roleFitBackend.generateProof(witness)
  
  console.log('Role fit ZK proof generated successfully')
  
  return {
    proof: proof.proof,
    publicInputs: {
      roleId: input.roleId.toString(),
      commitment: commitment
    }
  }
}
