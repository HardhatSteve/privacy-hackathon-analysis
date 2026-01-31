import type { PublicKey } from "@solana/web3.js"

export enum AccessStatus {
  Pending = 0,
  Approved = 1,
  Denied = 2,
  Expired = 3,
}

export interface SynidAccountData {
  owner: PublicKey
  mint: PublicKey
  encryptedCid: string
  encryptionKeyHash: Uint8Array
  createdAt: number
  updatedAt: number
  tokenId: number
  soulbound: boolean
  accessCount: number
  totalEarnings: number
  reputationScore: number
  verified: boolean
}

export interface AccessRequestData {
  synid: PublicKey
  requester: PublicKey
  fields: string[]
  offeredPayment: number
  createdAt: number
  expiresAt: number
  status: AccessStatus
}

export interface AccessGrantData {
  synid: PublicKey
  requester: PublicKey
  fields: string[]
  payment: number
  grantedAt: number
  expiresAt: number
  active: boolean
}

export interface ConfigData {
  authority: PublicKey
  mintCount: number
  mintPrice: number
  accessFee: number
  treasury: PublicKey
  paused: boolean
  totalRevenue: number
}

export interface MintResult {
  signature: string
  mint: PublicKey
  tokenAccount: PublicKey
  synidAccount: PublicKey
  metadataAccount: PublicKey
}

export interface EncryptedProfile {
  encrypted: string
  iv: string
  salt: string
  algorithm: string
  version: string
}

export interface ProfileData {
  name: string
  bio: string
  twitter: string
  github: string
  wallet: string
  createdAt: number
}

export interface NFTMetadata {
  name: string
  symbol: string
  description: string
  image: string
  external_url: string
  attributes: Array<{
    trait_type: string
    value: string | number | boolean
  }>
  properties: {
    files: Array<{ uri: string; type: string }>
    category: string
    creators: Array<{ address: string; share: number }>
  }
}

export interface AccessRequestParams {
  synidOwner: string
  fields: string[]
  offeredPayment: number
  expiresInSeconds: number
}

export interface ApproveAccessParams {
  requester: string
}

export interface VerificationResult {
  valid: boolean
  owner: string
  tokenId: number
  verified: boolean
  reputationScore: number
}

export interface EarningsData {
  total: number
  accessCount: number
  averagePerAccess: number
  recentPayments: Array<{
    from: string
    amount: number
    timestamp: number
    fields: string[]
  }>
}
