import { PublicKey, Keypair, Connection } from '@solana/web3.js';

export interface RescueLog {
  startTime: number;
  duration: number;
  success: boolean;
  compromisedAddress: string;
  safeAddress: string;
  phases: any[];
  assets?: any[];
  signature?: string;
  error?: string;
  zkProof?: any;
}

export class AtomicRescueEngine {
  constructor();
  executeAtomicRescue(
    compromisedKeypair: Keypair,
    safeAddress: PublicKey,
    usePrivacy?: boolean,
    monitoringCallback?: (alert: any) => void
  ): Promise<RescueLog>;
}

export class PriceOracle {
  getPrice(mintAddress: PublicKey): Promise<{ usd: number; source: string; timestamp: number }>;
  getBatchPrices(mintAddresses: PublicKey[]): Promise<Map<string, { usd: number; source: string; timestamp: number }>>;
}

export class ThreatIntelligence {
  isThreatDetected(address: PublicKey): Promise<boolean>;
  reportThreat(address: PublicKey, evidence: any): Promise<void>;
}

export class ZKPrivacyLayer {
  generateCommitment(assetAmount: any, assetType: string, secret: string, nullifier: string): any;
  generateRescueProof(assets: any[], recipientAddress: PublicKey, emergencyMode?: boolean): Promise<any>;
}

export class SPLTokenEngine {
  buildTokenTransfer(
    sourceWallet: PublicKey,
    destinationWallet: PublicKey,
    tokenMint: PublicKey,
    amount: bigint,
    closeAccount?: boolean
  ): Promise<{ instructions: any[]; sourceATA: any; destATA: any }>;
  scanTokenAccounts(wallet: PublicKey): Promise<any[]>;
}

export const CONFIG: {
  RPC_ENDPOINTS: string[];
  JUPITER_PRICE_API: string;
  PYTH_PROGRAM_ID: PublicKey;
  ZK_PROGRAM_ID: PublicKey;
  MERKLE_TREE_LEVELS: number;
  COMMITMENT_SCHEME: string;
  KNOWN_MALICIOUS_ADDRESSES: Set<any>;
  THREAT_INTELLIGENCE_API: string;
  MAX_RETRY_ATTEMPTS: number;
  COMPUTE_UNIT_LIMIT: number;
  PRIORITY_FEE_LAMPORTS: number;
  TRANSACTION_TIMEOUT_MS: number;
  MAX_PARALLEL_SCANS: number;
  SCAN_BATCH_SIZE: number;
};
