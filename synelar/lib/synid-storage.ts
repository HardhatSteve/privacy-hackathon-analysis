const SYNID_STORAGE_KEY = "synid_data"
const ACCESS_LOG_KEY = "synid_access_log"
const EARNINGS_KEY = "synid_earnings"

export interface StoredSynID {
  walletAddress: string
  mintAddress: string
  encryptedCid: string
  metadataCid: string
  encryptionKey: string
  txHash: string
  name: string
  username?: string
  displayName?: string
  email?: string
  bio: string
  twitter: string
  github: string
  website?: string
  location?: string
  profilePhoto?: string
  createdAt: number
}

export interface AccessLogEntry {
  id: string
  app: string
  appIcon: string
  requester: string
  fields: string[]
  amount: number
  timestamp: number
  status: "approved" | "denied"
}

export interface EarningsData {
  totalEarnings: number
  accessCount: number
  lastUpdated: number
}

export function saveSynID(data: StoredSynID): void {
  if (typeof window === "undefined") return
  const existing = getAllSynIDs()
  existing[data.walletAddress] = data
  localStorage.setItem(SYNID_STORAGE_KEY, JSON.stringify(existing))
}

export function getSynID(walletAddress: string): StoredSynID | null {
  if (typeof window === "undefined") return null
  const existing = getAllSynIDs()
  return existing[walletAddress] || null
}

export function getSynIDData(walletAddress: string): StoredSynID | null {
  return getSynID(walletAddress)
}

export function getAllSynIDs(): Record<string, StoredSynID> {
  if (typeof window === "undefined") return {}
  try {
    const data = localStorage.getItem(SYNID_STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

export function removeSynID(walletAddress: string): void {
  if (typeof window === "undefined") return
  const existing = getAllSynIDs()
  delete existing[walletAddress]
  localStorage.setItem(SYNID_STORAGE_KEY, JSON.stringify(existing))
}

export function hasSynID(walletAddress: string): boolean {
  return getSynID(walletAddress) !== null
}

export function getAccessLog(walletAddress: string): AccessLogEntry[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(`${ACCESS_LOG_KEY}_${walletAddress}`)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function addAccessLogEntry(walletAddress: string, entry: AccessLogEntry): void {
  if (typeof window === "undefined") return
  const log = getAccessLog(walletAddress)
  log.unshift(entry)
  if (log.length > 50) log.pop()
  localStorage.setItem(`${ACCESS_LOG_KEY}_${walletAddress}`, JSON.stringify(log))
}

export function getEarnings(walletAddress: string): EarningsData {
  if (typeof window === "undefined") return { totalEarnings: 0, accessCount: 0, lastUpdated: Date.now() }
  try {
    const data = localStorage.getItem(`${EARNINGS_KEY}_${walletAddress}`)
    return data ? JSON.parse(data) : { totalEarnings: 0, accessCount: 0, lastUpdated: Date.now() }
  } catch {
    return { totalEarnings: 0, accessCount: 0, lastUpdated: Date.now() }
  }
}

export function updateEarnings(walletAddress: string, amount: number): void {
  if (typeof window === "undefined") return
  const earnings = getEarnings(walletAddress)
  earnings.totalEarnings += amount
  earnings.accessCount += 1
  earnings.lastUpdated = Date.now()
  localStorage.setItem(`${EARNINGS_KEY}_${walletAddress}`, JSON.stringify(earnings))
}
