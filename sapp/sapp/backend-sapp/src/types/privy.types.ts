/**
 * Privy Wallet API Types
 *
 * Type definitions for wallet-related API requests and responses.
 */

// ===========================================
// Chain Types
// ===========================================

export type ChainType = 'solana' | 'ethereum';

export type SolanaCluster = 'mainnet-beta' | 'devnet' | 'testnet';

// ===========================================
// Wallet Creation
// ===========================================

export interface WalletCreateRequest {
  /** Blockchain network for the wallet */
  chainType: ChainType;
}

export interface WalletCreateResponse {
  /** Unique wallet identifier (Privy internal ID) */
  walletId: string;
  /** Wallet address on the blockchain */
  address: string;
  /** Blockchain type */
  chainType: string;
  /** Compressed public key */
  publicKey: string;
}

// ===========================================
// Wallet Retrieval
// ===========================================

export interface WalletInfo {
  /** Unique wallet identifier */
  id: string;
  /** Wallet address */
  address: string;
  /** Public key */
  publicKey: string;
  /** Chain type */
  chainType: ChainType;
  /** Creation timestamp (Unix ms) */
  createdAt: number;
  /** Owner ID (user or key quorum) */
  ownerId?: string;
}

export interface WalletListResponse {
  wallets: WalletInfo[];
}

// ===========================================
// Message Signing
// ===========================================

export interface SignMessageRequest {
  /** Privy wallet ID */
  walletId: string;
  /** Message to sign (base64 for Solana, UTF-8 for Ethereum) */
  message: string;
  /** Optional: Chain type to determine signing method */
  chainType?: ChainType;
}

export interface SignMessageResponse {
  /** Signature (base64 for Solana, hex for Ethereum) */
  signature: string;
}

// ===========================================
// Transaction Signing
// ===========================================

export interface SignTransactionRequest {
  /** Privy wallet ID */
  walletId: string;
  /** Base64-encoded serialized transaction */
  transaction: string;
}

export interface SignTransactionResponse {
  /** Base64-encoded signed transaction */
  signedTransaction: string;
}

// ===========================================
// Sign and Send
// ===========================================

export interface SignAndSendRequest {
  /** Privy wallet ID */
  walletId: string;
  /** Base64-encoded serialized transaction */
  transaction: string;
  /** Solana cluster (default: devnet) */
  cluster?: SolanaCluster;
}

export interface SignAndSendResponse {
  /** Transaction signature/hash */
  transactionHash: string;
}

// ===========================================
// EIP-712 Typed Data (Ethereum)
// ===========================================

export interface SignTypedDataRequest {
  /** Privy wallet ID */
  walletId: string;
  /** EIP-712 typed data (JSON string or object) */
  typedData: string | object;
}

export interface SignTypedDataResponse {
  /** Hex signature */
  signature: string;
}

// ===========================================
// Wallet Export
// ===========================================

export interface ExportWalletRequest {
  /** Privy wallet ID to export */
  walletId: string;
}

export interface ExportWalletResponse {
  /** Decrypted private key */
  privateKey: string;
}

// ===========================================
// Authorization Context
// ===========================================

export interface AuthorizationContext {
  /** User JWTs for user-owned wallet operations */
  userJwts?: string[];
  /** Authorization private keys for app-owned wallet operations */
  authorizationPrivateKeys?: string[];
}

// ===========================================
// Error Types
// ===========================================

export interface PrivyApiError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** HTTP status code */
  statusCode: number;
}

// ===========================================
// Internal Service Types
// ===========================================

export interface CreateWalletParams {
  /** Privy user ID who will own the wallet */
  userId: string;
  /** Blockchain type */
  chainType: ChainType;
  /** User's Privy access token (optional - not needed when using authorization key) */
  userJwt?: string;
}

export interface SignSolanaMessageParams {
  walletId: string;
  /** Base64-encoded message */
  message: string;
  /** User's Privy access token (optional - not needed when using authorization key) */
  userJwt?: string;
}

export interface SignSolanaTransactionParams {
  walletId: string;
  /** Base64-encoded serialized transaction */
  transaction: string;
  /** User's Privy access token (optional - not needed when using authorization key) */
  userJwt?: string;
}

export interface SignAndSendSolanaTransactionParams {
  walletId: string;
  transaction: string;
  /** User's Privy access token (optional - not needed when using authorization key) */
  userJwt?: string;
  cluster: SolanaCluster;
}

export interface SignEthereumMessageParams {
  walletId: string;
  message: string;
  /** User's Privy access token (optional - not needed when using authorization key) */
  userJwt?: string;
}

export interface SignEip712Params {
  walletId: string;
  /** JSON string of EIP-712 typed data */
  typedData: string;
  /** User's Privy access token (optional - not needed when using authorization key) */
  userJwt?: string;
}

export interface ExportWalletParams {
  walletId: string;
  /** User's Privy access token (optional - not needed when using authorization key) */
  userJwt?: string;
}
