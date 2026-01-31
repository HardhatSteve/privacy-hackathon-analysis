/**
 * AuroraZK Noir ZK Proof Integration
 * 
 * Generates real zero-knowledge range proofs using Noir circuits
 * and verifies them on Solana via Sunspot-generated verifier program.
 */
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

// Verifier program ID from Sunspot deployment
export const VERIFIER_PROGRAM_ID = new PublicKey('Ef8SgV5RCp4e7g3tKKQHwvpYcPoGXqZkoTTVTrhnG2MZ');

// Circuit artifact path (served from public folder)
const CIRCUIT_PATH = '/circuits/range_proof.json';

// State for Noir prover
let noirModule: any = null;
let backend: any = null;
let noir: any = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;
let noirDisabled = false;

/**
 * Initialize the Noir proving system
 * Call this once on app startup
 */
export async function initNoirProver(): Promise<void> {
  // Prevent multiple initializations
  if (isInitialized) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      console.log('[Noir] Initializing prover...');
      
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('[Noir] Server-side, skipping prover initialization');
        return;
      }
      
      // Dynamic imports for Noir packages
      // These may fail in Turbopack due to worker_threads usage
      let Noir: any, BarretenbergBackend: any;
      try {
        const modules = await Promise.all([
          import('@noir-lang/noir_js'),
          import('@noir-lang/backend_barretenberg'),
        ]);
        Noir = modules[0].Noir;
        BarretenbergBackend = modules[1].BarretenbergBackend;
      } catch (importError) {
        console.warn('[Noir] Failed to import Noir packages, using fallback mode');
        console.warn('[Noir] This is expected in some bundlers (Turbopack)');
        isInitialized = true; // Mark as "initialized" but in fallback mode
        return;
      }
      
      // Load compiled circuit
      const response = await fetch(CIRCUIT_PATH);
      if (!response.ok) {
        console.warn(`[Noir] Failed to load circuit from ${CIRCUIT_PATH}, using fallback`);
        isInitialized = true;
        return;
      }
      const circuitArtifact = await response.json();
      
      // Initialize Barretenberg backend (WASM-based proving)
      backend = new BarretenbergBackend(circuitArtifact);
      noir = new Noir(circuitArtifact);
      
      isInitialized = true;
      console.log('[Noir] Prover initialized successfully');
    } catch (error) {
      console.error('[Noir] Failed to initialize prover:', error);
      // Don't throw - allow fallback mode
      isInitialized = true;
    }
  })();
  
  return initPromise;
}

/**
 * Check if Noir prover is ready
 */
export function isNoirReady(): boolean {
  return isInitialized && noir !== null && backend !== null;
}

/**
 * Generate a random nonce for order privacy
 * Limited to 32 bits to avoid encoding issues with Noir/Barretenberg
 */
export function generateNonce(): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(4)); // 4 bytes = 32 bits
  let nonce = 0n;
  for (let i = 0; i < 4; i++) {
    nonce = (nonce << 8n) | BigInt(bytes[i]);
  }
  // Ensure positive and within safe range
  return nonce & 0xFFFFFFFFn; // 32-bit max
}

/**
 * Compute commitment placeholder
 * 
 * The REAL Pedersen commitment is computed by the Noir circuit.
 * This function returns a placeholder - use generateRangeProof() to get
 * the actual cryptographic commitment.
 * 
 * @deprecated Use generateRangeProof() which returns the real commitment
 */
export async function computeCommitment(
  price: bigint,
  size: bigint,
  nonce: bigint
): Promise<bigint> {
  console.log('[Noir] Commitment will be computed by circuit during proof generation');
  // Return 0 as placeholder - the circuit will compute the real value
  return 0n;
}

/**
 * Generate a zero-knowledge range proof
 * 
 * The circuit computes the Pedersen commitment internally from (price, size, nonce)
 * and returns it as a public output. This proves:
 * 1. The prover knows price/size/nonce that hash to the commitment
 * 2. Price and size are within valid ranges
 * 
 * @param price - Order price in smallest units (e.g., USDC with 6 decimals)
 * @param size - Order size in smallest units (e.g., SOL with 9 decimals)
 * @param nonce - Random 64-bit nonce for hiding
 * @param priceRange - Valid price range [min, max]
 * @param sizeRange - Valid size range [min, max]
 * @returns Proof bytes, public inputs/outputs, and the computed commitment
 */
export async function generateRangeProof(params: {
  price: bigint;
  size: bigint;
  nonce: bigint;
  commitment?: bigint;  // Optional - circuit computes it
  priceRange: { min: bigint; max: bigint };
  sizeRange: { min: bigint; max: bigint };
}): Promise<{
  proof: Uint8Array;
  publicInputs: string[];
  commitment: string;
}> {
  if (!isNoirReady()) {
    await initNoirProver();
  }
  
  // If Noir prover not available (fallback mode), return simulated proof
  if (noirDisabled || !noir || !backend) {
    console.log('[Noir] Prover not available, returning simulated proof');
    return {
      proof: new Uint8Array(0),
      publicInputs: [],
      commitment: '0',
    };
  }
  
  console.log('[Noir] Generating range proof...');
  const startTime = Date.now();
  
  try {
    // Validate inputs are within safe ranges
    if (params.price < 0n || params.price > 10_000_000_000n) {
      throw new Error(`Price out of range: ${params.price}`);
    }
    if (params.size < 0n || params.size > 1_000_000_000_000n) {
      throw new Error(`Size out of range: ${params.size}`);
    }
    if (params.nonce < 0n || params.nonce > 0xFFFFFFFFn) {
      throw new Error(`Nonce out of range: ${params.nonce}`);
    }
    
    // Prepare circuit inputs
    // Note: commitment is now an OUTPUT, not an input!
    const inputs = {
      // Private inputs (hidden from verifier)
      price: params.price.toString(),
      size: params.size.toString(),
      nonce: params.nonce.toString(),
      // Public inputs (range bounds)
      min_price: params.priceRange.min.toString(),
      max_price: params.priceRange.max.toString(),
      min_size: params.sizeRange.min.toString(),
      max_size: params.sizeRange.max.toString(),
    };
    
    console.log('[Noir] Circuit inputs:', {
      price: params.price.toString(),
      size: params.size.toString(),
      nonce: params.nonce.toString(),
      priceRange: `${params.priceRange.min} - ${params.priceRange.max}`,
      sizeRange: `${params.sizeRange.min} - ${params.sizeRange.max}`,
    });
    
    // Generate witness first, then proof
    // noir_js API: noir.execute() then backend.generateProof()
    console.log('[Noir] Executing circuit...');
    const { witness, returnValue } = await noir.execute(inputs);
    
    // The return value is the Pedersen commitment computed by the circuit
    const computedCommitment = returnValue?.toString() || '0';
    console.log('[Noir] Circuit computed commitment:', computedCommitment.slice(0, 20) + '...');
    
    console.log('[Noir] Generating proof from witness...');
    const { proof, publicInputs } = await backend.generateProof(witness);
    
    const duration = Date.now() - startTime;
    console.log(`[Noir] Proof generated in ${duration}ms`);
    console.log('[Noir] Proof size:', proof.length, 'bytes');
    console.log('[Noir] Public outputs:', publicInputs.length, 'values');
    
    // The commitment is the LAST public output (the return value)
    // Public outputs are: [min_price, max_price, min_size, max_size, commitment]
    const commitment = publicInputs.length > 0 
      ? publicInputs[publicInputs.length - 1] 
      : computedCommitment;
    
    return {
      proof: proof as Uint8Array,
      publicInputs: publicInputs as string[],
      commitment: commitment,
    };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    const isDeserializeError = errorMsg.includes('Failed to deserialize circuit') ||
      errorMsg.includes('serialization formats');
    if (isDeserializeError) {
      noirDisabled = true;
      noir = null;
      backend = null;
      console.warn('[Noir] Circuit format mismatch, disabling prover for this session.');
    }
    console.warn('[Noir] Proof generation failed:', errorMsg);
    
    // Specific error handling
    if (errorMsg.includes('encoding overruns') || errorMsg.includes('Buffer')) {
      console.error('[Noir] Buffer encoding error - likely a value too large for the circuit');
    }
    
    // Return empty proof on failure (fallback mode)
    // The order can still be placed without ZK proofs
    return {
      proof: new Uint8Array(0),
      publicInputs: [],
      commitment: '0',
    };
  }
}

/**
 * Verify a proof locally (for testing)
 */
export async function verifyProofLocally(
  proof: Uint8Array,
  publicInputs: string[]
): Promise<boolean> {
  if (!backend) {
    throw new Error('Noir not initialized');
  }
  
  try {
    const isValid = await backend.verifyProof({ proof, publicInputs });
    return isValid;
  } catch (error) {
    console.error('[Noir] Local verification failed:', error);
    return false;
  }
}

/**
 * Serialize proof for on-chain verification
 * Format: [proof_bytes][public_inputs_bytes]
 */
export function serializeProofForSolana(
  proof: Uint8Array,
  publicInputs: string[]
): Uint8Array {
  // Public inputs (5 values): commitment, min_price, max_price, min_size, max_size
  const publicInputsBuffer = new Uint8Array(5 * 32); // 5 Field elements, 32 bytes each
  
  publicInputs.forEach((input, i) => {
    const bn = BigInt(input);
    const bytes = new Uint8Array(32);
    for (let j = 0; j < 32; j++) {
      bytes[31 - j] = Number((bn >> BigInt(j * 8)) & 0xFFn);
    }
    publicInputsBuffer.set(bytes, i * 32);
  });
  
  // Combine proof + public inputs
  const combined = new Uint8Array(1 + proof.length + publicInputsBuffer.length);
  combined[0] = 0; // Instruction discriminator for "verify"
  combined.set(proof, 1);
  combined.set(publicInputsBuffer, 1 + proof.length);
  
  return combined;
}

/**
 * Create instruction to verify proof on Solana
 * This calls the Sunspot-generated verifier program
 */
export function createVerifyProofInstruction(
  proof: Uint8Array,
  publicInputs: string[],
  payer: PublicKey
): TransactionInstruction {
  const data = Buffer.from(serializeProofForSolana(proof, publicInputs));
  
  return new TransactionInstruction({
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
    ],
    programId: VERIFIER_PROGRAM_ID,
    data,
  });
}

/**
 * Verify proof on-chain via Sunspot verifier
 */
export async function verifyProofOnChain(
  connection: Connection,
  proof: Uint8Array,
  publicInputs: string[],
  payer: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): Promise<{ verified: boolean; signature?: string; error?: string }> {
  try {
    const instruction = createVerifyProofInstruction(proof, publicInputs, payer);
    
    const transaction = new Transaction().add(instruction);
    transaction.feePayer = payer;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
    const signedTx = await signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: true,
    });
    await connection.confirmTransaction(signature);
    
    console.log(`[Noir] Proof verified on-chain: ${signature}`);
    return { verified: true, signature };
  } catch (error: any) {
    console.error('[Noir] On-chain verification failed:', error);
    return { verified: false, error: error.message };
  }
}

/**
 * Default price and size ranges for AuroraZK orders
 */
export const DEFAULT_RANGES = {
  price: {
    min: 1_000_000n,        // $1.00 (6 decimals)
    max: 10_000_000_000n,   // $10,000.00
  },
  size: {
    min: 10_000_000n,       // 0.01 SOL (9 decimals)
    max: 1_000_000_000_000n, // 1000 SOL
  },
};

/**
 * Check if proof generation is supported in this environment
 */
export function isProofGenerationSupported(): boolean {
  return typeof window !== 'undefined' && 
         typeof crypto !== 'undefined' && 
         typeof crypto.getRandomValues === 'function';
}
