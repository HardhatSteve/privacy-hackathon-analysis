import Foundation

/// ShadowWire API Client - Handles HTTP requests to backend ShadowWire endpoints
actor ShadowWireAPI {
    // MARK: - Properties

    private let baseURL: String
    private let session: URLSession

    // MARK: - Initialization

    init(baseURL: String = AppConfig.sappAPIURL) {
        self.baseURL = baseURL
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)
    }

    // MARK: - Balance

    /// Get ShadowWire balance for a wallet
    func getBalance(walletAddress: String, token: String = "SOL") async throws -> ShadowWireBalanceResponse {
        let endpoint = "/api/sapp/crypto/balance/\(walletAddress)?token=\(token)"
        return try await request(endpoint: endpoint, method: "GET")
    }

    // MARK: - Transfer

    /// Execute a ShadowWire transfer
    func transfer(request transferRequest: ShadowWireTransferRequest) async throws -> ShadowWireTransferResponse {
        let endpoint = "/api/sapp/crypto/transfer"
        return try await request(endpoint: endpoint, method: "POST", body: transferRequest)
    }

    /// Execute transfer to a Sapp user by handle
    func transferToHandle(request handleRequest: ShadowWireTransferToHandleRequest) async throws -> ShadowWireTransferToHandleResponse {
        let endpoint = "/api/sapp/crypto/transfer/to-handle"
        return try await request(endpoint: endpoint, method: "POST", body: handleRequest)
    }

    // MARK: - Deposit/Withdraw

    /// Deposit funds into ShadowWire
    func deposit(request depositRequest: ShadowWireDepositRequest) async throws -> ShadowWireDepositResponse {
        let endpoint = "/api/sapp/crypto/deposit"
        return try await request(endpoint: endpoint, method: "POST", body: depositRequest)
    }

    /// Withdraw funds from ShadowWire
    func withdraw(request withdrawRequest: ShadowWireWithdrawRequest) async throws -> ShadowWireWithdrawResponse {
        let endpoint = "/api/sapp/crypto/withdraw"
        return try await request(endpoint: endpoint, method: "POST", body: withdrawRequest)
    }

    // MARK: - Fees

    /// Get fee information for a token
    func getFeeInfo(token: String, amount: Double? = nil) async throws -> ShadowWireFeeResponse {
        var endpoint = "/api/sapp/crypto/fee/\(token)"
        if let amount = amount {
            endpoint += "?amount=\(amount)"
        }
        return try await request(endpoint: endpoint, method: "GET")
    }

    // MARK: - Tokens

    /// Get list of supported tokens
    func getSupportedTokens() async throws -> ShadowWireTokensResponse {
        let endpoint = "/api/sapp/crypto/tokens"
        return try await request(endpoint: endpoint, method: "GET")
    }

    // MARK: - Generic Request Handler

    private func request<T: Decodable>(
        endpoint: String,
        method: String,
        body: (any Encodable)? = nil
    ) async throws -> T {
        // Construct URL
        guard let url = URL(string: baseURL + endpoint) else {
            throw ShadowWireError.apiError("Invalid URL: \(baseURL + endpoint)")
        }

        // Create request
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        // Add authorization header with Privy token
        if let authToken = await PrivyAuthService.shared.getAccessToken() {
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        } else {
            print("[ShadowWireAPI] Warning: No auth token available for \(endpoint)")
        }

        // Add body if present
        if let body = body {
            do {
                let encoder = JSONEncoder()
                encoder.dateEncodingStrategy = .iso8601
                request.httpBody = try encoder.encode(body)
            } catch {
                throw ShadowWireError.apiError("Failed to encode request body")
            }
        }

        // Execute request
        let (data, response) = try await session.data(for: request)

        // Validate response
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ShadowWireError.networkError(URLError(.badServerResponse))
        }

        // Handle errors
        if !(200...299).contains(httpResponse.statusCode) {
            // Try to decode error response
            if let errorResponse = try? JSONDecoder().decode(ShadowWireErrorResponse.self, from: data) {
                switch errorResponse.error {
                case "INVALID_ADDRESS":
                    throw ShadowWireError.invalidAddress
                case "RECIPIENT_NOT_FOUND":
                    throw ShadowWireError.recipientNotFound
                case "INSUFFICIENT_BALANCE":
                    throw ShadowWireError.insufficientBalance
                case "TRANSFER_FAILED", "DEPOSIT_FAILED", "WITHDRAW_FAILED":
                    throw ShadowWireError.transferFailed(errorResponse.message)
                default:
                    throw ShadowWireError.apiError(errorResponse.message)
                }
            }

            throw ShadowWireError.apiError("HTTP \(httpResponse.statusCode)")
        }

        // Decode response
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode(T.self, from: data)
        } catch {
            print("[ShadowWireAPI] Decoding error: \(error)")
            print("[ShadowWireAPI] Response data: \(String(data: data, encoding: .utf8) ?? "nil")")
            throw ShadowWireError.decodingError
        }
    }
}
