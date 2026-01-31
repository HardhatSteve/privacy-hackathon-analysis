import { PublicKey } from '@solana/web3.js'

// Message used to derive encryption key - must be constant
const KEY_DERIVATION_MESSAGE = 'Nahualli: Sign this message to derive your encryption key. This does not cost gas.'

export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * Derive a deterministic encryption key from a wallet signature
 * This allows recovering the key by signing the same message again
 */
export async function deriveKeyFromSignature(signature: Uint8Array): Promise<CryptoKey> {
  // Hash the signature to get a 256-bit key
  const hashBuffer = await crypto.subtle.digest('SHA-256', signature.buffer as ArrayBuffer)
  
  return await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export function getKeyDerivationMessage(): string {
  return KEY_DERIVATION_MESSAGE
}

export async function encryptData(data: string, key: CryptoKey): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(data)
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  )
  
  return { encrypted, iv }
}

export async function decryptData(encrypted: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as Uint8Array<ArrayBuffer> },
    key,
    encrypted
  )
  
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key)
  return arrayBufferToBase64(exported)
}

export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(keyString)
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export function deriveKeyFromWallet(publicKey: PublicKey): string {
  return publicKey.toBase58()
}

export interface EncryptedPayload {
  data: string
  iv: string
  version: number
}

export async function encryptForStorage(data: object, key: CryptoKey): Promise<EncryptedPayload> {
  const jsonString = JSON.stringify(data)
  const { encrypted, iv } = await encryptData(jsonString, key)
  
  return {
    data: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    version: 1,
  }
}

export async function decryptFromStorage(payload: EncryptedPayload, key: CryptoKey): Promise<object> {
  const encrypted = base64ToArrayBuffer(payload.data)
  const ivBuffer = base64ToArrayBuffer(payload.iv)
  const iv = new Uint8Array(ivBuffer)
  
  const decrypted = await decryptData(encrypted, key, iv)
  return JSON.parse(decrypted)
}
