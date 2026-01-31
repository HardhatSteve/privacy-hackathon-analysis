import Foundation
import Combine

// MARK: - Privy Auth Service Protocol

/// Protocol defining the authentication and wallet operations interface.
/// Enables dependency injection and testability.
///
/// Note: Wallet types use `Any` because the concrete types come from PrivySDK.
/// Implementations should cast appropriately when needed.
protocol PrivyAuthServiceProtocol: AnyObject {

    // MARK: - State Publishers

    var authStatePublisher: AnyPublisher<SappAuthState, Never> { get }
    var currentAuthState: SappAuthState { get }

    // MARK: - Published State (for SwiftUI bindings)

    var authState: SappAuthState { get }
    var currentUser: SappUser? { get }
    var useServerWallets: Bool { get }

    // MARK: - OTP Flow State

    var pendingPhoneNumber: String? { get }
    var pendingEmail: String? { get }

    // MARK: - Wallet Addresses

    var solanaWalletAddress: String? { get }
    var ethereumWalletAddress: String? { get }
    var unifiedSolanaWalletAddress: String? { get }

    // MARK: - Authentication Methods

    /// Check current authentication state
    func checkAuthState() async

    /// Send OTP code to phone number (E.164 format)
    func sendSmsCode(to phoneNumber: String) async throws

    /// Verify SMS OTP and complete login
    func loginWithSmsCode(_ code: String, phoneNumber: String?) async throws -> SappUser

    /// Send OTP code to email
    func sendEmailCode(to email: String) async throws

    /// Verify email OTP and complete login
    func loginWithEmailCode(_ code: String, email: String?) async throws -> SappUser

    /// Logout the current user
    func logout() async

    // MARK: - Embedded Wallet Operations

    /// Sign a message with embedded Solana wallet
    func signMessage(_ base64Message: String) async throws -> String

    /// Sign a Solana transaction
    func signTransaction(_ base64Transaction: String) async throws -> String

    /// Sign and send a Solana transaction
    func signAndSendTransaction(_ base64Transaction: String) async throws -> String

    /// Sign a message with embedded Ethereum wallet
    func signEthereumMessage(_ message: String) async throws -> String

    /// Sign EIP-712 typed data
    func signEip712TypedData(_ typedData: String) async throws -> String

    // MARK: - Server Wallet Operations

    /// Create server-side wallets
    func createServerWallets() async throws

    /// Load existing server wallets
    func loadServerWallets() async throws

    /// Sign message via server
    func signMessageViaServer(_ message: String) async throws -> String

    /// Sign transaction via server
    func signTransactionViaServer(_ base64Transaction: String) async throws -> String

    /// Sign and send transaction via server
    func signAndSendTransactionViaServer(_ base64Transaction: String) async throws -> String

    /// Export wallet via server
    func exportWalletViaServer() async throws -> String

    /// Sign EIP-712 typed data via server
    func signEip712TypedDataViaServer(_ typedData: [String: Any]) async throws -> String

    // MARK: - Unified API

    /// Sign message - routes to server or embedded based on config
    func unifiedSignMessage(_ message: String) async throws -> String

    /// Sign transaction - routes to server or embedded based on config
    func unifiedSignTransaction(_ base64Transaction: String) async throws -> String

    /// Sign and send transaction - routes to server or embedded based on config
    func unifiedSignAndSendTransaction(_ base64Transaction: String) async throws -> String

    // MARK: - Access Token

    /// Get current Privy access token for API authentication
    func getAccessToken() async -> String?
}
