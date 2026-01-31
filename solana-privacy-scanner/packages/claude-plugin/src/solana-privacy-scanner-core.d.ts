/**
 * Type declarations for solana-privacy-scanner-core
 */

declare module 'solana-privacy-scanner-core' {
  // RPC Client
  export class RPCClient {
    constructor(config?: RPCClientConfig | string);
    healthCheck(): Promise<boolean>;
    getStats(): { activeRequests: number; queueLength: number };
    getConnection(): any;
  }

  export interface RPCClientConfig {
    rpcUrl?: string;
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
    maxConcurrency?: number;
    debug?: boolean;
  }

  // Data Collection
  export function collectWalletData(
    client: RPCClient,
    address: string,
    options?: WalletCollectionOptions
  ): Promise<RawWalletData>;

  export function collectTransactionData(
    client: RPCClient,
    signature: string
  ): Promise<RawTransactionData>;

  export function collectProgramData(
    client: RPCClient,
    programId: string,
    options?: ProgramCollectionOptions
  ): Promise<RawProgramData>;

  export interface WalletCollectionOptions {
    maxSignatures?: number;
    includeTokenAccounts?: boolean;
  }

  export interface ProgramCollectionOptions {
    maxAccounts?: number;
    maxTransactions?: number;
  }

  export interface RawWalletData {
    target: string;
    signatures: any[];
    transactions: any[];
    tokenAccounts: any[];
  }

  export interface RawTransactionData {
    target: string;
    transaction: any;
  }

  export interface RawProgramData {
    target: string;
    accounts: any[];
    transactions: any[];
  }

  // Normalization
  export function normalizeWalletData(
    rawData: RawWalletData,
    labelProvider?: LabelProvider
  ): ScanContext;

  export function normalizeTransactionData(
    rawData: RawTransactionData,
    labelProvider?: LabelProvider
  ): ScanContext;

  export function normalizeProgramData(
    rawData: RawProgramData,
    labelProvider?: LabelProvider
  ): ScanContext;

  export interface ScanContext {
    target: string;
    targetType: 'wallet' | 'transaction' | 'program';
    transfers: any[];
    instructions: any[];
    counterparties: Set<string>;
    labels: Map<string, Label>;
    tokenAccounts: any[];
    timeRange: {
      earliest: number | null;
      latest: number | null;
    };
    transactionCount: number;
    transactions: any[];
    tokenAccountEvents: any[];
    pdaInteractions: any[];
    feePayers: Set<string>;
    signers: Set<string>;
    programs: Set<string>;
  }

  // Report Generation
  export function generateReport(context: ScanContext): PrivacyReport;
  export function evaluateHeuristics(context: ScanContext): PrivacySignal[];

  // Label Provider
  export function createDefaultLabelProvider(): LabelProvider;

  export class StaticLabelProvider implements LabelProvider {
    constructor(labelsPath?: string);
    lookup(address: string): Label | null;
    lookupMany(addresses: string[]): Map<string, Label>;
    getAllLabels(): Label[];
    getCount(): number;
  }

  export interface LabelProvider {
    lookup(address: string): Label | null;
    lookupMany(addresses: string[]): Map<string, Label>;
    getAllLabels(): Label[];
    getCount(): number;
  }

  // Analyzer
  export interface AnalyzerResult {
    filesAnalyzed: number;
    issues: Issue[];
    summary: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  }

  export interface Issue {
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    file: string;
    line: number;
    column: number;
    message: string;
    suggestion?: string;
    codeSnippet?: string;
    identifier?: string;
    occurrences?: number;
  }

  export interface PrivacyReport {
    version: string;
    timestamp: number;
    targetType: 'wallet' | 'transaction' | 'program';
    target: string;
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    signals: PrivacySignal[];
    summary: {
      totalSignals: number;
      highRiskSignals: number;
      mediumRiskSignals: number;
      lowRiskSignals: number;
      transactionsAnalyzed: number;
    };
    mitigations: string[];
    knownEntities: Label[];
  }

  export interface PrivacySignal {
    id: string;
    name: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence: number;
    reason: string;
    evidence: Evidence[];
    mitigation?: string;
  }

  export interface Evidence {
    type: string;
    value: any;
  }

  export interface Label {
    address: string;
    name: string;
    type: 'exchange' | 'bridge' | 'protocol' | 'service' | 'other';
    description?: string;
    relatedAddresses?: string[];
  }
}
