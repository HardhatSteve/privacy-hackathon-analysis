import { useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import type { Transaction } from '@solana/web3.js'
import { 
  encryptForStorage, 
  decryptFromStorage, 
  exportKey, 
  importKey,
  deriveKeyFromSignature,
  getKeyDerivationMessage
} from '../lib/encryption'
import type { EncryptedPayload } from '../lib/encryption'
import { uploadToIPFS, fetchFromIPFS, storeLocalResult, getLocalResultsByWallet } from '../lib/ipfs'
import type { StoredTestResult } from '../lib/ipfs'
import { storeOnChain, fetchFromChain, type OnChainResult } from '../lib/solana-storage'
import type { TestResult } from '../lib/big5-questions'
import type { DISCResult } from '../lib/disc-questions'
import type { MBTIResult } from '../lib/mbti-questions'
import type { EnneagramResult } from '../lib/enneagram-questions'

type AnyTestResult = TestResult | DISCResult | MBTIResult | EnneagramResult

const ENCRYPTION_KEY_STORAGE = 'nahualli_encryption_key'

export function useEncryptedStorage() {
  const { publicKey, signTransaction, signMessage } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Derive encryption key from wallet signature - deterministic and recoverable
  const getOrCreateKey = useCallback(async (): Promise<CryptoKey> => {
    const walletAddress = publicKey?.toBase58()
    if (!walletAddress) throw new Error('Wallet not connected')

    // Check if we have a cached key
    const storedKey = localStorage.getItem(`${ENCRYPTION_KEY_STORAGE}_${walletAddress}`)
    if (storedKey) {
      return await importKey(storedKey)
    }

    // Derive key from wallet signature (deterministic)
    if (!signMessage) {
      throw new Error('Wallet does not support message signing')
    }

    const message = new TextEncoder().encode(getKeyDerivationMessage())
    const signature = await signMessage(message)
    const key = await deriveKeyFromSignature(signature)
    
    // Cache the key locally for convenience
    const exportedKey = await exportKey(key)
    localStorage.setItem(`${ENCRYPTION_KEY_STORAGE}_${walletAddress}`, exportedKey)
    
    return key
  }, [publicKey, signMessage])

  const saveTestResult = useCallback(async (
    testType: string,
    answers: Record<number, number>,
    scores: AnyTestResult
  ): Promise<StoredTestResult | null> => {
    if (!publicKey) {
      setError('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const key = await getOrCreateKey()
      
      const dataToEncrypt = {
        testType,
        answers,
        scores,
        timestamp: Date.now(),
        walletAddress: publicKey.toBase58(),
      }

      const encryptedPayload = await encryptForStorage(dataToEncrypt, key)
      
      let ipfsHash = 'local_' + Date.now().toString(36)
      
      try {
        ipfsHash = await uploadToIPFS(encryptedPayload)
      } catch (ipfsError) {
        console.warn('IPFS upload failed, storing locally:', ipfsError)
        localStorage.setItem(`nahualli_encrypted_${ipfsHash}`, JSON.stringify(encryptedPayload))
      }

      const storedResult: StoredTestResult = {
        ipfsHash,
        timestamp: Date.now(),
        testType,
        walletAddress: publicKey.toBase58(),
      }

      storeLocalResult(storedResult)
      
      // Store on Solana if we have a real IPFS hash and can sign
      if (!ipfsHash.startsWith('local_') && signTransaction) {
        try {
          const signature = await storeOnChain(
            ipfsHash,
            testType,
            signTransaction as (tx: Transaction) => Promise<Transaction>,
            publicKey
          )
          console.log('Stored on Solana:', signature)
        } catch (chainError) {
          console.warn('Failed to store on chain (will retry later):', chainError)
        }
      }
      
      return storedResult
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save result'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [publicKey, getOrCreateKey])

  const loadTestResult = useCallback(async (ipfsHash: string): Promise<object | null> => {
    if (!publicKey) {
      setError('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('loadTestResult: getting key for', ipfsHash)
      const key = await getOrCreateKey()
      console.log('loadTestResult: got key')
      
      let encryptedPayload: EncryptedPayload

      if (ipfsHash.startsWith('local_')) {
        const stored = localStorage.getItem(`nahualli_encrypted_${ipfsHash}`)
        if (!stored) throw new Error('Local data not found')
        encryptedPayload = JSON.parse(stored)
      } else {
        console.log('loadTestResult: fetching from IPFS')
        encryptedPayload = await fetchFromIPFS(ipfsHash)
        console.log('loadTestResult: fetched payload', encryptedPayload ? 'success' : 'null')
      }

      console.log('loadTestResult: decrypting')
      const decrypted = await decryptFromStorage(encryptedPayload, key)
      console.log('loadTestResult: decrypted', decrypted ? 'success' : 'null')
      return decrypted
    } catch (err) {
      console.error('loadTestResult error:', err)
      const message = err instanceof Error ? err.message : 'Failed to load result'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [publicKey, getOrCreateKey])

  const getMyResults = useCallback((): StoredTestResult[] => {
    if (!publicKey) return []
    return getLocalResultsByWallet(publicKey.toBase58())
  }, [publicKey])

  // Fetch results from Solana blockchain and merge with local
  const syncFromChain = useCallback(async (): Promise<StoredTestResult[]> => {
    if (!publicKey) return []
    
    try {
      const chainResults = await fetchFromChain(publicKey.toBase58())
      const localResults = getLocalResultsByWallet(publicKey.toBase58())
      
      // Merge: add chain results not in local
      const localHashes = new Set(localResults.map(r => r.ipfsHash))
      
      for (const chainResult of chainResults) {
        if (!localHashes.has(chainResult.ipfsHash)) {
          const newResult: StoredTestResult = {
            ipfsHash: chainResult.ipfsHash,
            testType: chainResult.testType,
            timestamp: chainResult.timestamp,
            walletAddress: publicKey.toBase58(),
          }
          storeLocalResult(newResult)
        }
      }
      
      return getLocalResultsByWallet(publicKey.toBase58())
    } catch (error) {
      console.error('Failed to sync from chain:', error)
      return getLocalResultsByWallet(publicKey.toBase58())
    }
  }, [publicKey])

  const getChainResults = useCallback(async (): Promise<OnChainResult[]> => {
    if (!publicKey) return []
    return fetchFromChain(publicKey.toBase58())
  }, [publicKey])

  return {
    saveTestResult,
    loadTestResult,
    getMyResults,
    syncFromChain,
    getChainResults,
    isLoading,
    error,
  }
}
