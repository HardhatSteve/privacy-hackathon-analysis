import type { EncryptedPayload } from './encryption'

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs'

export interface StoredTestResult {
  ipfsHash: string
  timestamp: number
  testType: string
  walletAddress: string
}

export async function uploadToIPFS(encryptedPayload: EncryptedPayload): Promise<string> {
  const jwt = import.meta.env.VITE_PINATA_JWT
  
  if (!jwt) {
    console.warn('Pinata JWT not configured, using local storage')
    throw new Error('IPFS not configured')
  }

  console.log('Uploading to Pinata...')
  
  // Use pinFileToIPFS endpoint with form data (works with scoped keys)
  const blob = new Blob([JSON.stringify(encryptedPayload)], { type: 'application/json' })
  const formData = new FormData()
  formData.append('file', blob, `nahualli-${Date.now()}.json`)
  formData.append('pinataMetadata', JSON.stringify({
    name: `nahualli-result-${Date.now()}`
  }))

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Pinata error:', error)
    throw new Error(`Failed to upload to IPFS: ${error}`)
  }

  const result = await response.json()
  console.log('Uploaded to IPFS:', result.IpfsHash)
  return result.IpfsHash
}

export async function fetchFromIPFS(cid: string): Promise<EncryptedPayload> {
  const response = await fetch(`${PINATA_GATEWAY}/${cid}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${response.statusText}`)
  }

  return await response.json()
}

export function getIPFSUrl(cid: string): string {
  return `${PINATA_GATEWAY}/${cid}`
}

export function storeLocalResult(result: StoredTestResult): void {
  const stored = getLocalResults()
  stored.push(result)
  localStorage.setItem('nahualli_results', JSON.stringify(stored))
}

export function getLocalResults(): StoredTestResult[] {
  const stored = localStorage.getItem('nahualli_results')
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function getLocalResultsByWallet(walletAddress: string): StoredTestResult[] {
  return getLocalResults().filter(r => r.walletAddress === walletAddress)
}

/**
 * Upload a ZK proof to IPFS (unencrypted - proofs are meant to be public)
 */
export async function uploadZKProofToIPFS(proof: Record<string, unknown>): Promise<string> {
  const jwt = import.meta.env.VITE_PINATA_JWT
  
  if (!jwt) {
    throw new Error('IPFS not configured')
  }

  console.log('Uploading ZK proof to Pinata...')
  
  const blob = new Blob([JSON.stringify(proof)], { type: 'application/json' })
  const formData = new FormData()
  formData.append('file', blob, `nahualli-zkproof-${Date.now()}.json`)
  formData.append('pinataMetadata', JSON.stringify({
    name: `nahualli-zkproof-${Date.now()}`
  }))

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Pinata error:', error)
    throw new Error(`Failed to upload ZK proof to IPFS: ${error}`)
  }

  const result = await response.json()
  console.log('ZK proof uploaded to IPFS:', result.IpfsHash)
  return result.IpfsHash
}

/**
 * Fetch a ZK proof from IPFS
 */
export async function fetchZKProofFromIPFS(cid: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${PINATA_GATEWAY}/${cid}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ZK proof from IPFS: ${response.statusText}`)
  }

  return await response.json()
}
