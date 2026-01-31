import Foundation
import Combine
import PrivySDK

// MARK: - Privy Authentication Service

/// Service wrapper around the official Privy SDK for authentication and embedded wallets.
/// Handles both embedded (client-side) and server-managed wallets.
///
/// Based on PRIVY_REF.md best practices:
/// - No private key extraction - design around RPC-based signing
/// - Uses provider pattern for signing operations
/// - Supports both embedded and server wallets
@MainActor
final class PrivyAuthService: ObservableObject, PrivyAuthServiceProtocol {

    // MARK: - Singleton

    static let shared = PrivyAuthService()

    // MARK: - Configuration

    private let configuration: PrivyConfiguration

    // MARK: - Published State

    @Published private(set) var authState: SappAuthState = .notReady
    @Published private(set) var currentUser: SappUser?
    @Published private(set) var embeddedSolanaWallet: EmbeddedSolanaWallet?
    @Published private(set) var embeddedEthereumWallet: EmbeddedEthereumWallet?

    // MARK: - Server Wallet State

    /// Whether the user has server-created wallets (vs. client-side embedded wallets)
    @Published private(set) var useServerWallets: Bool = false
    @Published private(set) var serverSolanaWalletId: String?
    @Published private(set) var serverEthereumWalletId: String?

    // MARK: - OTP Flow State

    @Published var pendingPhoneNumber: String?
    @Published var pendingEmail: String?

    // MARK: - Privy SDK

    private var privy: Privy!
    private var cachedPrivyUser: PrivySDK.PrivyUser?

    // MARK: - Combine

    private let authStateSubject = CurrentValueSubject<SappAuthState, Never>(.unauthenticated)

    var authStatePublisher: AnyPublisher<SappAuthState, Never> {
        authStateSubject.eraseToAnyPublisher()
    }

    var currentAuthState: SappAuthState {
        authStateSubject.value
    }

    // MARK: - Initialization

    private init() {
        self.configuration = PrivyConfiguration.fromAppConfig()
        initializePrivy()
        setupDependencies()
    }

    /// Initialize with custom configuration (for testing)
    init(configuration: PrivyConfiguration) {
        self.configuration = configuration
        initializePrivy()
        setupDependencies()
    }

    // MARK: - Setup

    private func initializePrivy() {
        guard configuration.isValid else {
            let errors = configuration.validationErrors
            print("[PrivyAuthService] ERROR: \(errors.joined(separator: ", "))")
            authState = .error("Privy configuration missing")
            return
        }

        print("[PrivyAuthService] Initializing with appId: \(configuration.appId.prefix(10))...")

        let config = PrivyConfig(
            appId: configuration.appId,
            appClientId: configuration.clientId
        )

        privy = PrivySdk.initialize(config: config)

        Task {
            await checkAuthState()
        }
    }

    private func setupDependencies() {
        // Configure WalletAPIService with token provider
        WalletAPIService.shared.getAccessToken = { [weak self] in
            await self?.getAccessToken()
        }
    }
}

// MARK: - Authentication State

extension PrivyAuthService {

    func checkAuthState() async {
        guard privy != nil else {
            authState = .error("Privy not initialized")
            return
        }

        let sdkAuthState = await privy.getAuthState()

        switch sdkAuthState {
        case .authenticated(let privyUser):
            await handleAuthenticated(privyUser)

        case .notReady:
            authState = .notReady
            authStateSubject.send(.unauthenticated)

        case .unauthenticated:
            handleUnauthenticated()

        case .authenticatedUnverified:
            // Prior session exists but can't be verified (no network)
            // Treat as not ready until network is available
            authState = .notReady
            authStateSubject.send(.unauthenticated)

        @unknown default:
            authState = .unauthenticated
            authStateSubject.send(.unauthenticated)
        }
    }

    private func handleAuthenticated(_ privyUser: PrivySDK.PrivyUser) async {
        cachedPrivyUser = privyUser
        let user = mapPrivyUser(privyUser)
        currentUser = user
        authState = .authenticated(user)
        authStateSubject.send(.authenticated(user))
        await loadEmbeddedWallets(from: privyUser)
    }

    private func handleUnauthenticated() {
        currentUser = nil
        cachedPrivyUser = nil
        embeddedSolanaWallet = nil
        embeddedEthereumWallet = nil
        authState = .unauthenticated
        authStateSubject.send(.unauthenticated)
    }
}

// MARK: - SMS Authentication

extension PrivyAuthService {

    /// Send OTP code to phone number (E.164 format required, e.g., "+14155552671")
    func sendSmsCode(to phoneNumber: String) async throws {
        guard privy != nil else {
            throw PrivyAuthError.notInitialized
        }

        do {
            try await privy.sms.sendCode(to: phoneNumber)
            pendingPhoneNumber = phoneNumber
        } catch {
            throw PrivyAuthError.sendCodeFailed(error.localizedDescription)
        }
    }

    /// Verify OTP and complete SMS login
    func loginWithSmsCode(_ code: String, phoneNumber: String? = nil) async throws -> SappUser {
        guard privy != nil else {
            throw PrivyAuthError.notInitialized
        }

        let phone = phoneNumber ?? pendingPhoneNumber
        guard let phone else {
            throw PrivyAuthError.noPhoneNumber
        }

        do {
            let privyUser = try await privy.sms.loginWithCode(code, sentTo: phone)
            return try await completeLogin(with: privyUser, clearPending: { [weak self] in
                self?.pendingPhoneNumber = nil
            })
        } catch {
            throw PrivyAuthError.loginFailed(error.localizedDescription)
        }
    }
}

// MARK: - Email Authentication

extension PrivyAuthService {

    /// Send OTP code to email
    func sendEmailCode(to email: String) async throws {
        guard privy != nil else {
            throw PrivyAuthError.notInitialized
        }

        do {
            try await privy.email.sendCode(to: email)
            pendingEmail = email
        } catch {
            throw PrivyAuthError.sendCodeFailed(error.localizedDescription)
        }
    }

    /// Verify OTP and complete email login
    func loginWithEmailCode(_ code: String, email: String? = nil) async throws -> SappUser {
        guard privy != nil else {
            throw PrivyAuthError.notInitialized
        }

        let emailAddress = email ?? pendingEmail
        guard let emailAddress else {
            throw PrivyAuthError.noEmail
        }

        do {
            let privyUser = try await privy.email.loginWithCode(code, sentTo: emailAddress)
            return try await completeLogin(with: privyUser, clearPending: { [weak self] in
                self?.pendingEmail = nil
            })
        } catch {
            throw PrivyAuthError.loginFailed(error.localizedDescription)
        }
    }
}

// MARK: - Login Completion

extension PrivyAuthService {

    private func completeLogin(with privyUser: PrivySDK.PrivyUser, clearPending: @escaping () -> Void) async throws -> SappUser {
        cachedPrivyUser = privyUser
        let user = mapPrivyUser(privyUser)
        currentUser = user
        authState = .authenticated(user)
        authStateSubject.send(.authenticated(user))
        clearPending()
        await loadEmbeddedWallets(from: privyUser)
        return user
    }
}

// MARK: - Logout

extension PrivyAuthService {

    func logout() async {
        guard privy != nil else { return }

        // Logout via Privy SDK
        if let user = await privy.getUser() {
            await user.logout()
        }

        // Clear local state
        currentUser = nil
        cachedPrivyUser = nil
        embeddedSolanaWallet = nil
        embeddedEthereumWallet = nil
        authState = .unauthenticated
        authStateSubject.send(.unauthenticated)

        // Clear server wallet state
        useServerWallets = false
        serverSolanaWalletId = nil
        serverEthereumWalletId = nil
        WalletAPIService.shared.clearState()

        // Clear dependent services
        SilentSwapService.shared.clearEntropy()
    }
}

// MARK: - Embedded Solana Wallet

extension PrivyAuthService {

    /// Create a Solana embedded wallet for the authenticated user
    @discardableResult
    func createSolanaWallet() async throws -> EmbeddedSolanaWallet {
        let privyUser = try await getAuthenticatedUser()

        do {
            let wallet = try await privyUser.createSolanaWallet()
            embeddedSolanaWallet = wallet
            return wallet
        } catch {
            throw PrivyAuthError.walletCreationFailed(error.localizedDescription)
        }
    }

    /// Sign a message with the embedded Solana wallet
    func signMessage(_ base64Message: String) async throws -> String {
        guard let wallet = embeddedSolanaWallet else {
            throw PrivyAuthError.noWallet
        }

        do {
            return try await wallet.provider.signMessage(message: base64Message)
        } catch {
            throw PrivyAuthError.signatureFailed(error.localizedDescription)
        }
    }

    /// Sign a Solana transaction with the embedded wallet
    /// - Parameter base64Transaction: Base64-encoded serialized transaction message
    /// - Returns: Base64-encoded signed transaction ready to send
    func signTransaction(_ base64Transaction: String) async throws -> String {
        guard let wallet = embeddedSolanaWallet else {
            throw PrivyAuthError.noWallet
        }

        guard let transactionData = Data(base64Encoded: base64Transaction) else {
            throw PrivyAuthError.invalidTransaction
        }

        do {
            return try await wallet.provider.signTransaction(transaction: transactionData)
        } catch {
            throw PrivyAuthError.signatureFailed(error.localizedDescription)
        }
    }

    /// Sign and send a Solana transaction using the embedded wallet
    /// - Parameter base64Transaction: Base64-encoded serialized transaction message
    /// - Returns: Transaction signature
    func signAndSendTransaction(_ base64Transaction: String) async throws -> String {
        guard let wallet = embeddedSolanaWallet else {
            throw PrivyAuthError.noWallet
        }

        guard let transactionData = Data(base64Encoded: base64Transaction) else {
            throw PrivyAuthError.invalidTransaction
        }

        let cluster = mapToPrivyCluster(configuration.solanaCluster)

        do {
            return try await wallet.provider.signAndSendTransaction(
                transaction: transactionData,
                cluster: cluster
            )
        } catch {
            throw PrivyAuthError.transactionFailed(error.localizedDescription)
        }
    }

    /// Get the Solana wallet address (prefers server wallet if available)
    var solanaWalletAddress: String? {
        if useServerWallets {
            return WalletAPIService.shared.solanaAddress
        }
        return embeddedSolanaWallet?.address
    }

    private func mapToPrivyCluster(_ appCluster: AppSolanaCluster) -> PrivySDK.SolanaCluster {
        // Map our SolanaCluster enum to PrivySDK.SolanaCluster
        if appCluster == .mainnetBeta {
            return PrivySDK.SolanaCluster.mainnet
        } else if appCluster == .devnet {
            return PrivySDK.SolanaCluster.devnet
        } else {
            // testnet maps to devnet in Privy SDK
            return PrivySDK.SolanaCluster.devnet
        }
    }
}

// MARK: - Embedded Ethereum Wallet

extension PrivyAuthService {

    /// Create an Ethereum embedded wallet for the authenticated user
    @discardableResult
    func createEthereumWallet() async throws -> EmbeddedEthereumWallet {
        let privyUser = try await getAuthenticatedUser()

        do {
            let wallet = try await privyUser.createEthereumWallet()
            embeddedEthereumWallet = wallet
            return wallet
        } catch {
            throw PrivyAuthError.walletCreationFailed(error.localizedDescription)
        }
    }

    /// Sign a message with the embedded Ethereum wallet (EIP-191 personal sign)
    func signEthereumMessage(_ message: String) async throws -> String {
        guard let wallet = embeddedEthereumWallet else {
            throw PrivyAuthError.noWallet
        }

        do {
            let rpcRequest = PrivySDK.EthereumRpcRequest(
                method: "personal_sign",
                params: [message, wallet.address]
            )
            return try await wallet.provider.request(rpcRequest)
        } catch {
            throw PrivyAuthError.signatureFailed(error.localizedDescription)
        }
    }

    /// Sign EIP-712 typed data with the embedded Ethereum wallet
    /// - Parameter typedData: JSON string of EIP-712 typed data
    /// - Returns: Hex signature string
    func signEip712TypedData(_ typedData: String) async throws -> String {
        guard let wallet = embeddedEthereumWallet else {
            throw PrivyAuthError.noWallet
        }

        // Validate JSON format
        guard let jsonData = typedData.data(using: .utf8),
              let _ = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
            throw PrivyAuthError.signatureFailed("Invalid JSON format for typed data")
        }

        do {
            let rpcRequest = PrivySDK.EthereumRpcRequest(
                method: "eth_signTypedData_v4",
                params: [wallet.address, typedData]
            )
            return try await wallet.provider.request(rpcRequest)
        } catch {
            throw PrivyAuthError.signatureFailed(error.localizedDescription)
        }
    }

    /// Get the Ethereum wallet address (prefers server wallet if available)
    var ethereumWalletAddress: String? {
        if useServerWallets {
            return WalletAPIService.shared.ethereumAddress
        }
        return embeddedEthereumWallet?.address
    }
}

// MARK: - Access Token

extension PrivyAuthService {

    /// Get the current Privy access token for API authentication
    func getAccessToken() async -> String? {
        guard privy != nil else {
            print("[PrivyAuthService] getAccessToken: Privy not initialized")
            return nil
        }

        let privyUser = await privy.getUser() ?? cachedPrivyUser

        guard let user = privyUser else {
            print("[PrivyAuthService] getAccessToken: No authenticated user")
            return nil
        }

        do {
            let token = try await user.getAccessToken()
            print("[PrivyAuthService] getAccessToken: Successfully retrieved token (length: \(token.count))")
            return token
        } catch {
            print("[PrivyAuthService] getAccessToken error: \(error)")
            print("[PrivyAuthService] getAccessToken error type: \(type(of: error))")
            print("[PrivyAuthService] getAccessToken error description: \(error.localizedDescription)")
            
            // Check if it's a JWT-related error
            let errorString = "\(error)"
            if errorString.lowercased().contains("jwt") || 
               errorString.lowercased().contains("token") ||
               errorString.lowercased().contains("expired") {
                print("[PrivyAuthService] ⚠️ JWT/Token error detected - session may have expired")
            }
            
            return nil
        }
    }
}

// MARK: - Server Wallet Operations

extension PrivyAuthService {

    /// Create server-side wallets for the authenticated user
    func createServerWallets() async throws {
        // Create Solana wallet
        do {
            let solanaWallet = try await WalletAPIService.shared.createWallet(chainType: .solana)
            serverSolanaWalletId = solanaWallet.walletId
            useServerWallets = true
            print("[PrivyAuthService] Created server Solana wallet: \(solanaWallet.address)")
        } catch {
            print("[PrivyAuthService] Failed to create server Solana wallet: \(error)")
            throw error
        }

        // Optionally create Ethereum wallet (non-blocking)
        do {
            let ethWallet = try await WalletAPIService.shared.createWallet(chainType: .ethereum)
            serverEthereumWalletId = ethWallet.walletId
            print("[PrivyAuthService] Created server Ethereum wallet: \(ethWallet.address)")
        } catch {
            print("[PrivyAuthService] Failed to create server Ethereum wallet: \(error)")
            // Don't throw - Ethereum wallet is optional
        }
    }

    /// Load existing server wallets for the user
    func loadServerWallets() async throws {
        let wallets = try await WalletAPIService.shared.listWallets()

        var foundSolana = false
        var foundEthereum = false

        for wallet in wallets {
            if wallet.chainType == "solana" {
                serverSolanaWalletId = wallet.id
                foundSolana = true
            } else if wallet.chainType == "ethereum" {
                serverEthereumWalletId = wallet.id
                foundEthereum = true
            }
        }

        if foundSolana || foundEthereum {
            useServerWallets = true
        }

        print("[PrivyAuthService] Loaded \(wallets.count) server wallets (Solana: \(foundSolana), Ethereum: \(foundEthereum))")
    }

    /// Sign a message using server wallet
    func signMessageViaServer(_ message: String) async throws -> String {
        guard let walletId = serverSolanaWalletId else {
            throw PrivyAuthError.noWallet
        }

        return try await WalletAPIService.shared.signMessage(
            walletId: walletId,
            message: message,
            chainType: .solana
        )
    }

    /// Sign a transaction using server wallet
    func signTransactionViaServer(_ base64Transaction: String) async throws -> String {
        guard let walletId = serverSolanaWalletId else {
            throw PrivyAuthError.noWallet
        }

        return try await WalletAPIService.shared.signTransaction(
            walletId: walletId,
            transaction: base64Transaction
        )
    }

    /// Sign and send a transaction using server wallet
    func signAndSendTransactionViaServer(_ base64Transaction: String) async throws -> String {
        guard let walletId = serverSolanaWalletId else {
            throw PrivyAuthError.noWallet
        }

        let cluster: AppSolanaCluster = configuration.solanaCluster == .mainnetBeta ? .mainnetBeta : .devnet

        return try await WalletAPIService.shared.signAndSendTransaction(
            walletId: walletId,
            transaction: base64Transaction,
            cluster: cluster
        )
    }

    /// Export wallet private key via server
    func exportWalletViaServer() async throws -> String {
        let walletId = serverSolanaWalletId ?? WalletAPIService.shared.solanaWalletId

        guard let walletId else {
            throw PrivyAuthError.noWallet
        }

        return try await WalletAPIService.shared.exportWallet(walletId: walletId)
    }

    /// Sign EIP-712 typed data via server
    func signEip712TypedDataViaServer(_ typedData: [String: Any]) async throws -> String {
        guard let walletId = serverEthereumWalletId else {
            throw PrivyAuthError.noWallet
        }

        return try await WalletAPIService.shared.signTypedData(
            walletId: walletId,
            typedData: typedData
        )
    }
}

// MARK: - Unified API

extension PrivyAuthService {

    /// Unified sign message - routes to server or embedded based on configuration
    func unifiedSignMessage(_ message: String) async throws -> String {
        if useServerWallets {
            return try await signMessageViaServer(message)
        } else {
            return try await signMessage(message)
        }
    }

    /// Unified sign transaction - routes to server or embedded based on configuration
    func unifiedSignTransaction(_ base64Transaction: String) async throws -> String {
        if useServerWallets {
            return try await signTransactionViaServer(base64Transaction)
        } else {
            return try await signTransaction(base64Transaction)
        }
    }

    /// Unified sign and send transaction - routes to server or embedded based on configuration
    func unifiedSignAndSendTransaction(_ base64Transaction: String) async throws -> String {
        if useServerWallets {
            return try await signAndSendTransactionViaServer(base64Transaction)
        } else {
            return try await signAndSendTransaction(base64Transaction)
        }
    }

    /// Get the current Solana wallet address (server or embedded)
    var unifiedSolanaWalletAddress: String? {
        if useServerWallets {
            return WalletAPIService.shared.solanaAddress
        } else {
            return embeddedSolanaWallet?.address
        }
    }
}

// MARK: - Private Helpers

private extension PrivyAuthService {

    func getAuthenticatedUser() async throws -> PrivySDK.PrivyUser {
        guard privy != nil else {
            throw PrivyAuthError.notInitialized
        }

        // Prefer cached user for immediate post-login operations
        if let cached = cachedPrivyUser {
            return cached
        }

        if let fromSDK = await privy.getUser() {
            return fromSDK
        }

        throw PrivyAuthError.notAuthenticated
    }

    func loadEmbeddedWallets(from privyUser: PrivySDK.PrivyUser) async {
        // Load Solana wallet
        if let wallet = privyUser.embeddedSolanaWallets.first {
            embeddedSolanaWallet = wallet
        }

        // Load Ethereum wallet
        if let wallet = privyUser.embeddedEthereumWallets.first {
            embeddedEthereumWallet = wallet
        }

        // Also try to load server wallets
        do {
            try await loadServerWallets()
        } catch {
            print("[PrivyAuthService] Failed to load server wallets: \(error)")
            // Non-blocking - server wallets are optional
        }
    }

    func mapPrivyUser(_ privyUser: PrivySDK.PrivyUser) -> SappUser {
        var linkedAccounts: [LinkedAccount] = []

        for account in privyUser.linkedAccounts {
            switch account {
            case .phone(let phoneAccount):
                linkedAccounts.append(LinkedAccount(
                    type: .phone,
                    identifier: phoneAccount.phoneNumber,
                    verifiedAt: nil
                ))

            case .email(let emailAccount):
                linkedAccounts.append(LinkedAccount(
                    type: .email,
                    identifier: emailAccount.email,
                    verifiedAt: nil
                ))

            case .embeddedSolanaWallet(let walletAccount):
                linkedAccounts.append(LinkedAccount(
                    type: .wallet,
                    identifier: walletAccount.address,
                    verifiedAt: nil
                ))

            case .embeddedEthereumWallet(let walletAccount):
                linkedAccounts.append(LinkedAccount(
                    type: .wallet,
                    identifier: walletAccount.address,
                    verifiedAt: nil
                ))

            case .apple(let appleAccount):
                linkedAccounts.append(LinkedAccount(
                    type: .apple,
                    identifier: appleAccount.email,
                    verifiedAt: nil
                ))

            case .google(let googleAccount):
                linkedAccounts.append(LinkedAccount(
                    type: .google,
                    identifier: googleAccount.email,
                    verifiedAt: nil
                ))

            default:
                break
            }
        }

        return SappUser(
            id: privyUser.id,
            createdAt: Date(),
            linkedAccounts: linkedAccounts
        )
    }
}
