import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'

// Memo Program ID (official Solana Memo Program)
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

// RPC endpoint - use Helius if available, otherwise default devnet
const RPC_URL = import.meta.env.VITE_HELIUS_RPC_URL || 'https://api.devnet.solana.com'

// Prefix for Nahualli memos to identify them
const MEMO_PREFIX = 'NAHUALLI:'
const ZK_PROOF_PREFIX = 'NAHUALLI_ZK:'

export interface OnChainResult {
  signature: string
  ipfsHash: string
  testType: string
  timestamp: number
}

export interface OnChainZKProof {
  signature: string
  proofId: string
  proofType: string
  ipfsHash: string
  commitment: string
  timestamp: number
}

/**
 * Store a test result CID on Solana using Memo Program
 * Format: NAHUALLI:<testType>:<ipfsHash>:<timestamp>
 */
export async function storeOnChain(
  ipfsHash: string,
  testType: string,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  publicKey: PublicKey
): Promise<string> {
  const connection = new Connection(RPC_URL, 'confirmed')
  
  // Create memo content
  const timestamp = Date.now()
  const memoContent = `${MEMO_PREFIX}${testType}:${ipfsHash}:${timestamp}`
  
  // Create memo instruction
  const memoInstruction = new TransactionInstruction({
    keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoContent, 'utf-8'),
  })
  
  // Build transaction
  const transaction = new Transaction().add(memoInstruction)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.lastValidBlockHeight = lastValidBlockHeight
  transaction.feePayer = publicKey
  
  // Sign with wallet
  const signedTx = await signTransaction(transaction)
  
  // Send transaction
  const signature = await connection.sendRawTransaction(signedTx.serialize())
  
  // Wait for confirmation
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  })
  
  console.log('Stored on Solana:', signature)
  return signature
}

/**
 * Fetch all Nahualli results for a wallet from Solana
 * Reads transaction history and parses memo data
 */
export async function fetchFromChain(walletAddress: string): Promise<OnChainResult[]> {
  const connection = new Connection(RPC_URL, 'confirmed')
  const publicKey = new PublicKey(walletAddress)
  
  try {
    // Get transaction signatures for the wallet
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit: 100, // Last 100 transactions
    })
    
    const results: OnChainResult[] = []
    
    // Fetch each transaction and look for Nahualli memos
    for (const sig of signatures) {
      try {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        })
        
        if (!tx?.meta?.logMessages) continue
        
        // Look for memo in logs
        for (const log of tx.meta.logMessages) {
          if (log.includes('Program log: Memo') || log.includes(MEMO_PREFIX)) {
            // Extract memo content
            const memoMatch = log.match(/NAHUALLI:([^:]+):([^:]+):(\d+)/)
            if (memoMatch) {
              results.push({
                signature: sig.signature,
                testType: memoMatch[1],
                ipfsHash: memoMatch[2],
                timestamp: parseInt(memoMatch[3]),
              })
            }
          }
        }
      } catch (e) {
        // Skip failed transaction fetches
        continue
      }
    }
    
    // Sort by timestamp descending
    return results.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Failed to fetch from chain:', error)
    return []
  }
}

/**
 * Store a ZK proof on Solana using Memo Program
 * Format: NAHUALLI_ZK:<proofType>:<proofId>:<ipfsHash>:<commitment>:<timestamp>
 */
export async function storeZKProofOnChain(
  proofId: string,
  proofType: string,
  ipfsHash: string,
  commitment: string,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  publicKey: PublicKey
): Promise<string> {
  const connection = new Connection(RPC_URL, 'confirmed')
  
  // Create memo content (truncate commitment to save space)
  const timestamp = Date.now()
  const shortCommitment = commitment.slice(0, 16) // First 16 chars of commitment
  const memoContent = `${ZK_PROOF_PREFIX}${proofType}:${proofId}:${ipfsHash}:${shortCommitment}:${timestamp}`
  
  // Create memo instruction
  const memoInstruction = new TransactionInstruction({
    keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoContent, 'utf-8'),
  })
  
  // Build transaction
  const transaction = new Transaction().add(memoInstruction)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.lastValidBlockHeight = lastValidBlockHeight
  transaction.feePayer = publicKey
  
  // Sign with wallet
  const signedTx = await signTransaction(transaction)
  
  // Send transaction
  const signature = await connection.sendRawTransaction(signedTx.serialize())
  
  // Wait for confirmation
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  })
  
  console.log('ZK Proof stored on Solana:', signature)
  return signature
}

/**
 * Fetch all ZK proofs for a wallet from Solana
 */
export async function fetchZKProofsFromChain(walletAddress: string): Promise<OnChainZKProof[]> {
  const connection = new Connection(RPC_URL, 'confirmed')
  const publicKey = new PublicKey(walletAddress)
  
  try {
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit: 100,
    })
    
    const results: OnChainZKProof[] = []
    
    for (const sig of signatures) {
      try {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        })
        
        if (!tx?.meta?.logMessages) continue
        
        for (const log of tx.meta.logMessages) {
          if (log.includes(ZK_PROOF_PREFIX)) {
            // Format: NAHUALLI_ZK:<proofType>:<proofId>:<ipfsHash>:<commitment>:<timestamp>
            const zkMatch = log.match(/NAHUALLI_ZK:([^:]+):([^:]+):([^:]+):([^:]+):(\d+)/)
            if (zkMatch) {
              results.push({
                signature: sig.signature,
                proofType: zkMatch[1],
                proofId: zkMatch[2],
                ipfsHash: zkMatch[3],
                commitment: zkMatch[4],
                timestamp: parseInt(zkMatch[5]),
              })
            }
          }
        }
      } catch (e) {
        continue
      }
    }
    
    return results.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Failed to fetch ZK proofs from chain:', error)
    return []
  }
}

/**
 * Get Solana Explorer URL for a transaction
 */
export function getExplorerUrl(signature: string): string {
  const cluster = RPC_URL.includes('devnet') ? 'devnet' : 'mainnet-beta'
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`
}
