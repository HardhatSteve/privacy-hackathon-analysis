// 统一的类型定义文件（替代 db.ts）

// Arweave JWK 接口类型
export interface ArweaveJWK {
  kty: string
  e: string
  n: string
  d?: string
  p?: string
  q?: string
  dp?: string
  dq?: string
  qi?: string
  [key: string]: unknown
}

// 钱包密钥类型（可能是 Arweave JWK 或其他格式的字符串）
export type WalletKey = ArweaveJWK | string

export interface WalletRecord {
  id?: number
  address: string
  encryptedKey: string // Encrypted with Master Password
  alias: string
  chain: "ethereum" | "arweave" | "solana" | "sui" | "bitcoin" | "other"
  vaultId: string // Hash of the derived key to separate "compartments"
  createdAt: number
}

export interface VaultMetadata {
  key: string
  value: string // JSON string of encrypted canary
}

// 为了向后兼容，保留 UploadRecord 类型（但数据现在在 SQLite 中）
export interface UploadRecord {
  id?: number
  txId: string
  fileName: string
  fileHash: string
  fileSize?: number // 文件大小（字节）
  mimeType?: string // MIME 类型
  storageType: "arweave"
  ownerAddress: string
  encryptionAlgo: string
  encryptionParams: string // JSON string of nonce etc.
  createdAt: number
}
