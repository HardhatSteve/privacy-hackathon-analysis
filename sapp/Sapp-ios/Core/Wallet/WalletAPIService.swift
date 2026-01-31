import Foundation
import Combine

// MARK: - Wallet API Service

/// Service for server-side wallet operations via the Sapp backend.
/// Communicates with Privy server wallets through REST API.
///
/// Based on PRIVY_REF.md:
/// - Uses Basic auth with app credentials for server-side operations
/// - walletId is required for all operations
/// - Supports gas sponsorship via `sponsor` parameter
@MainActor
final class WalletAPIService: ObservableObject {

    // MARK: - Singleton

    static let shared = WalletAPIService()

    // MARK: - Configuration

    private let baseURL: String
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    // MARK: - Published State

    @Published private(set) var solanaWallet: WalletInfo?
    @Published private(set) var ethereumWallet: WalletInfo?
    @Published private(set) var isLoading: Bool = false
    @Published private(set) var lastError: WalletAPIError?

    // MARK: - Access Token Provider

    /// Closure to get the current Privy access token
    var getAccessToken: (() async -> String?)?

    // MARK: - Initialization

    private init() {
        self.baseURL = AppConfig.sappAPIURL
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)

        print("[WalletAPIService] Initialized with API URL: \(baseURL)")
    }

    // MARK: - Computed Properties

    var solanaAddress: String? { solanaWallet?.address }
    var solanaWalletId: String? { solanaWallet?.id }
    var ethereumAddress: String? { ethereumWallet?.address }
    var ethereumWalletId: String? { ethereumWallet?.id }
}

// MARK: - Wallet Creation

extension WalletAPIService {

    /// Create a new server-side wallet
    func createWallet(chainType: WalletChainType) async throws -> WalletCreateResponse {
        let endpoint = "/api/sapp/wallet/create"
        let body = ["chainType": chainType.rawValue]

        let response: WalletCreateResponse = try await post(endpoint: endpoint, body: body, expectedStatus: 201)

        // Update local state
        let walletInfo = response.toWalletInfo()

        switch chainType {
        case .solana:
            solanaWallet = walletInfo
        case .ethereum:
            ethereumWallet = walletInfo
        }

        print("[WalletAPIService] Created \(chainType.rawValue) wallet: \(response.address)")
        return response
    }
}

// MARK: - Wallet Retrieval

extension WalletAPIService {

    /// List all wallets for the current user
    func listWallets() async throws -> [WalletInfo] {
        let endpoint = "/api/sapp/wallet/user/list"

        let response: WalletListResponse = try await get(endpoint: endpoint)

        // Update local state
        for wallet in response.wallets {
            switch wallet.chainType {
            case "solana":
                solanaWallet = wallet
            case "ethereum":
                ethereumWallet = wallet
            default:
                break
            }
        }

        return response.wallets
    }

    /// Get a specific wallet by ID
    func getWallet(walletId: String) async throws -> WalletInfo {
        let endpoint = "/api/sapp/wallet/\(walletId)"
        return try await get(endpoint: endpoint)
    }
}

// MARK: - Message Signing

extension WalletAPIService {

    /// Sign a message with the specified wallet
    func signMessage(
        walletId: String,
        message: String,
        chainType: WalletChainType = .solana
    ) async throws -> String {
        let endpoint = "/api/sapp/wallet/sign-message"
        let body: [String: String] = [
            "walletId": walletId,
            "message": message,
            "chainType": chainType.rawValue
        ]

        let response: SignatureResponse = try await post(endpoint: endpoint, body: body)
        return response.signature
    }
}

// MARK: - Transaction Signing

extension WalletAPIService {

    /// Sign a Solana transaction (returns signed tx, doesn't broadcast)
    func signTransaction(
        walletId: String,
        transaction: String
    ) async throws -> String {
        let endpoint = "/api/sapp/wallet/sign-transaction"
        let body: [String: String] = [
            "walletId": walletId,
            "transaction": transaction
        ]

        let response: SignedTransactionResponse = try await post(endpoint: endpoint, body: body)
        return response.signedTransaction
    }

    /// Sign and send a Solana transaction
    func signAndSendTransaction(
        walletId: String,
        transaction: String,
        cluster: AppSolanaCluster = .devnet,
        sponsor: Bool = false
    ) async throws -> String {
        let endpoint = "/api/sapp/wallet/sign-and-send"
        let body: [String: Any] = [
            "walletId": walletId,
            "transaction": transaction,
            "cluster": cluster.rawValue,
            "sponsor": sponsor
        ]

        let response: TransactionHashResponse = try await post(endpoint: endpoint, body: body)
        return response.transactionHash
    }
}

// MARK: - EIP-712 Signing

extension WalletAPIService {

    /// Sign EIP-712 typed data (Ethereum)
    func signTypedData(
        walletId: String,
        typedData: [String: Any]
    ) async throws -> String {
        let endpoint = "/api/sapp/wallet/sign-typed-data"
        let body: [String: Any] = [
            "walletId": walletId,
            "typedData": typedData
        ]

        let response: SignatureResponse = try await post(endpoint: endpoint, body: body)
        return response.signature
    }
}

// MARK: - Wallet Export

extension WalletAPIService {

    /// Export wallet private key
    /// - Warning: Handle the returned private key with extreme care
    func exportWallet(walletId: String) async throws -> String {
        let endpoint = "/api/sapp/wallet/export"
        let body = ["walletId": walletId]

        let response: ExportWalletResponse = try await post(endpoint: endpoint, body: body)
        print("[WalletAPIService] Wallet exported: \(walletId)")
        return response.privateKey
    }
}

// MARK: - State Management

extension WalletAPIService {

    /// Clear local wallet state (on logout)
    func clearState() {
        solanaWallet = nil
        ethereumWallet = nil
        lastError = nil
        isLoading = false
    }
}

// MARK: - Network Layer

private extension WalletAPIService {

    func getAuthToken() async throws -> String {
        guard let tokenProvider = getAccessToken else {
            throw WalletAPIError.missingAccessToken
        }
        guard let token = await tokenProvider() else {
            throw WalletAPIError.missingAccessToken
        }
        return token
    }

    func get<T: Decodable>(endpoint: String, expectedStatus: Int = 200) async throws -> T {
        let token = try await getAuthToken()

        guard let url = URL(string: baseURL + endpoint) else {
            throw WalletAPIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        return try await execute(request, expectedStatus: expectedStatus)
    }

    func post<T: Decodable>(
        endpoint: String,
        body: [String: Any],
        expectedStatus: Int = 200
    ) async throws -> T {
        let token = try await getAuthToken()

        guard let url = URL(string: baseURL + endpoint) else {
            throw WalletAPIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        return try await execute(request, expectedStatus: expectedStatus)
    }

    func post<T: Decodable, B: Encodable>(
        endpoint: String,
        body: B,
        expectedStatus: Int = 200
    ) async throws -> T {
        let token = try await getAuthToken()

        guard let url = URL(string: baseURL + endpoint) else {
            throw WalletAPIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try encoder.encode(body)

        return try await execute(request, expectedStatus: expectedStatus)
    }

    func execute<T: Decodable>(_ request: URLRequest, expectedStatus: Int) async throws -> T {
        isLoading = true
        defer { isLoading = false }

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw WalletAPIError.invalidResponse
            }

            if httpResponse.statusCode != expectedStatus {
                throw try parseError(from: data, statusCode: httpResponse.statusCode)
            }

            do {
                return try decoder.decode(T.self, from: data)
            } catch let error as DecodingError {
                throw WalletAPIError.from(error)
            }
        } catch let error as WalletAPIError {
            lastError = error
            throw error
        } catch {
            let apiError = WalletAPIError.from(error)
            lastError = apiError
            throw apiError
        }
    }

    func parseError(from data: Data, statusCode: Int) throws -> WalletAPIError {
        // Try to decode structured error response
        if let errorResponse = try? decoder.decode(WalletAPIResponse<WalletInfo>.self, from: data) {
            let errorCode = errorResponse.code ?? ""
            let errorMessage = errorResponse.error ?? "Unknown error"

            switch errorCode {
            case "WALLET_NOT_FOUND":
                return .walletNotFound
            case "WALLET_AUTH_FAILED", "INVALID_TOKEN", "AUTH_REQUIRED":
                return .authorizationFailed
            case "RATE_LIMIT_EXCEEDED":
                return .rateLimitExceeded
            default:
                return .serverError(errorMessage)
            }
        }

        // Generic status code handling
        switch statusCode {
        case 401, 403:
            return .authorizationFailed
        case 404:
            return .walletNotFound
        case 429:
            return .rateLimitExceeded
        case 500...599:
            return .serverUnavailable
        default:
            return .serverError("Server error: \(statusCode)")
        }
    }
}
