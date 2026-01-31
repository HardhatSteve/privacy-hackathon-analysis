import Foundation
import Combine

// MARK: - Lulo Service

@MainActor
final class LuloService: ObservableObject {

    // MARK: - Singleton

    static let shared = LuloService()

    // MARK: - Published State

    @Published private(set) var pools: [LuloPoolWithRate] = []
    @Published private(set) var userPositions: [LuloPosition] = []
    @Published private(set) var pendingWithdrawals: [LuloPendingWithdrawal] = []
    @Published private(set) var isLoadingPools = false
    @Published private(set) var isLoadingAccount = false
    @Published private(set) var isDepositing = false
    @Published private(set) var isWithdrawing = false
    @Published private(set) var lastError: LuloError?

    // MARK: - Private Properties

    private let baseURL: String
    private let urlSession: URLSession

    // Cache timestamps
    private var poolsCacheTime: Date?
    private let poolsCacheDuration: TimeInterval = 5 * 60 // 5 minutes

    // MARK: - Initialization

    private init() {
        self.baseURL = AppConfig.sappAPIURL

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.urlSession = URLSession(configuration: config)

        print("[LuloService] Initialized with base URL: \(baseURL)")
    }

    // MARK: - Pool Operations

    /// Load all available yield pools with their APY rates
    func loadPools(forceRefresh: Bool = false) async throws {
        // Check cache
        if !forceRefresh,
           let cacheTime = poolsCacheTime,
           Date().timeIntervalSince(cacheTime) < poolsCacheDuration,
           !pools.isEmpty {
            print("[LuloService] Using cached pools")
            return
        }

        isLoadingPools = true
        lastError = nil
        defer { isLoadingPools = false }

        let endpoint = "\(baseURL)/api/sapp/lulo/pools"

        guard let url = URL(string: endpoint) else {
            throw LuloError.networkError("Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authorization header
        if let authToken = await PrivyAuthService.shared.getAccessToken() {
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw LuloError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw LuloError.networkError("HTTP \(httpResponse.statusCode)")
        }

        let apiResponse = try JSONDecoder().decode(LuloPoolsAPIResponse.self, from: data)

        guard apiResponse.success else {
            throw LuloError.apiError("Failed to load pools")
        }

        self.pools = apiResponse.data
        self.poolsCacheTime = Date()

        print("[LuloService] Loaded \(pools.count) pools")
    }

    /// Get a specific pool by mint address
    func getPool(mintAddress: String) -> LuloPoolWithRate? {
        pools.first { $0.pool.mintAddress == mintAddress }
    }

    /// Get pools sorted by APY (highest first)
    var sortedPoolsByAPY: [LuloPoolWithRate] {
        pools.sorted { $0.rate.apy > $1.rate.apy }
    }

    // MARK: - Account Operations

    /// Load user's positions and earnings
    func loadAccount(walletAddress: String) async throws {
        isLoadingAccount = true
        lastError = nil
        defer { isLoadingAccount = false }

        let endpoint = "\(baseURL)/api/sapp/lulo/account/\(walletAddress)"

        guard let url = URL(string: endpoint) else {
            throw LuloError.networkError("Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authorization header
        if let authToken = await PrivyAuthService.shared.getAccessToken() {
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw LuloError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw LuloError.networkError("HTTP \(httpResponse.statusCode)")
        }

        let apiResponse = try JSONDecoder().decode(LuloAccountAPIResponse.self, from: data)

        guard apiResponse.success, let account = apiResponse.data else {
            throw LuloError.apiError(apiResponse.error ?? "Failed to load account")
        }

        self.userPositions = account.positions

        print("[LuloService] Loaded \(userPositions.count) positions for \(walletAddress)")
    }

    /// Load pending withdrawals for a user
    func loadPendingWithdrawals(walletAddress: String) async throws {
        let endpoint = "\(baseURL)/api/sapp/lulo/account/\(walletAddress)/withdrawals"

        guard let url = URL(string: endpoint) else {
            throw LuloError.networkError("Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authorization header
        if let authToken = await PrivyAuthService.shared.getAccessToken() {
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw LuloError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw LuloError.networkError("HTTP \(httpResponse.statusCode)")
        }

        let apiResponse = try JSONDecoder().decode(LuloPendingWithdrawalsAPIResponse.self, from: data)

        guard apiResponse.success else {
            throw LuloError.apiError("Failed to load pending withdrawals")
        }

        self.pendingWithdrawals = apiResponse.data

        print("[LuloService] Loaded \(pendingWithdrawals.count) pending withdrawals")
    }

    // MARK: - Transaction Operations

    /// Generate a deposit transaction
    /// Returns the base64-encoded transaction that needs to be signed and sent
    func generateDepositTransaction(
        walletAddress: String,
        mintAddress: String,
        amount: Double,
        mode: LuloDepositMode
    ) async throws -> String {
        isDepositing = true
        lastError = nil
        defer { isDepositing = false }

        let endpoint = "\(baseURL)/api/sapp/lulo/deposit"

        guard let url = URL(string: endpoint) else {
            throw LuloError.networkError("Invalid URL")
        }

        let requestBody: [String: Any] = [
            "owner": walletAddress,
            "mintAddress": mintAddress,
            "regularAmount": mode == .regular ? amount : 0,
            "protectedAmount": mode == .protected ? amount : 0
        ]

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        // Add authorization header
        if let authToken = await PrivyAuthService.shared.getAccessToken() {
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw LuloError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            // Try to decode error message
            if let errorResponse = try? JSONDecoder().decode(LuloTransactionAPIResponse.self, from: data),
               let error = errorResponse.error {
                throw LuloError.apiError(error)
            }
            throw LuloError.networkError("HTTP \(httpResponse.statusCode)")
        }

        let apiResponse = try JSONDecoder().decode(LuloTransactionAPIResponse.self, from: data)

        guard apiResponse.success, let txResponse = apiResponse.data else {
            throw LuloError.transactionFailed(apiResponse.error ?? "Failed to generate deposit transaction")
        }

        print("[LuloService] Generated deposit transaction for \(amount) \(mintAddress)")

        return txResponse.transaction
    }

    /// Generate a withdraw transaction
    /// Returns the base64-encoded transaction that needs to be signed and sent
    func generateWithdrawTransaction(
        walletAddress: String,
        mintAddress: String,
        amount: Double
    ) async throws -> String {
        isWithdrawing = true
        lastError = nil
        defer { isWithdrawing = false }

        let endpoint = "\(baseURL)/api/sapp/lulo/withdraw"

        guard let url = URL(string: endpoint) else {
            throw LuloError.networkError("Invalid URL")
        }

        let requestBody: [String: Any] = [
            "owner": walletAddress,
            "mintAddress": mintAddress,
            "amount": amount
        ]

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        // Add authorization header
        if let authToken = await PrivyAuthService.shared.getAccessToken() {
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw LuloError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            // Try to decode error message
            if let errorResponse = try? JSONDecoder().decode(LuloTransactionAPIResponse.self, from: data),
               let error = errorResponse.error {
                throw LuloError.apiError(error)
            }
            throw LuloError.networkError("HTTP \(httpResponse.statusCode)")
        }

        let apiResponse = try JSONDecoder().decode(LuloTransactionAPIResponse.self, from: data)

        guard apiResponse.success, let txResponse = apiResponse.data else {
            throw LuloError.transactionFailed(apiResponse.error ?? "Failed to generate withdraw transaction")
        }

        print("[LuloService] Generated withdraw transaction for \(amount) \(mintAddress)")

        return txResponse.transaction
    }

    // MARK: - Computed Properties

    /// Total earnings across all positions
    var totalEarnings: Double {
        userPositions.reduce(0) { $0 + $1.earningsDouble }
    }

    /// Total deposited value across all positions
    var totalDeposited: Double {
        userPositions.reduce(0) { $0 + $1.totalBalanceDouble }
    }

    /// Check if user has any active positions
    var hasPositions: Bool {
        !userPositions.isEmpty
    }

    /// Check if user has any pending withdrawals
    var hasPendingWithdrawals: Bool {
        !pendingWithdrawals.isEmpty
    }

    // MARK: - Helpers

    /// Format APY for display
    func formatAPY(_ apy: Double) -> String {
        String(format: "%.2f%%", apy)
    }

    /// Get position for a specific token
    func getPosition(for mintAddress: String) -> LuloPosition? {
        userPositions.first { $0.mintAddress == mintAddress }
    }

    /// Clear all cached data
    func clearCache() {
        pools = []
        poolsCacheTime = nil
        userPositions = []
        pendingWithdrawals = []
        lastError = nil
        print("[LuloService] Cache cleared")
    }

    /// Refresh all data for a wallet
    func refreshAll(walletAddress: String) async throws {
        try await loadPools(forceRefresh: true)
        try await loadAccount(walletAddress: walletAddress)
        try await loadPendingWithdrawals(walletAddress: walletAddress)
    }
}
