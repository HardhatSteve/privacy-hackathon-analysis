import Foundation
import Combine

// MARK: - SilentSwap Service

@MainActor
final class SilentSwapService: ObservableObject {

    // MARK: - Singleton

    static let shared = SilentSwapService()

    // MARK: - Published State

    @Published private(set) var supportedTokens: [String: [SilentSwapToken]] = [:]
    @Published private(set) var currentQuote: SilentSwapQuoteResponse?
    @Published private(set) var isLoadingQuote = false
    @Published private(set) var isExecutingSwap = false
    @Published private(set) var isAuthenticating = false

    // MARK: - Private Properties

    private let baseURL: String
    private let urlSession: URLSession

    // Cache entropy after authentication (in-memory only, cleared on app restart)
    private var entropyCache: String?

    // MARK: - Initialization

    private init() {
        self.baseURL = AppConfig.sappAPIURL

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.urlSession = URLSession(configuration: config)

        print("[SilentSwapService] Initialized with base URL: \(baseURL)")
    }

    // MARK: - Authentication Flow

    /// Complete authentication flow to derive entropy
    /// This must be called before requesting quotes or executing swaps
    func authenticateAndDeriveEntropy() async throws -> String {
        // Return cached entropy if available
        if let cached = entropyCache {
            print("[SilentSwapService] Using cached entropy")
            return cached
        }

        isAuthenticating = true
        defer { isAuthenticating = false }

        guard let evmAddress = PrivyAuthService.shared.ethereumWalletAddress else {
            throw SilentSwapError.authenticationFailed("No EVM wallet address")
        }

        print("[SilentSwapService] Starting authentication flow for \(evmAddress)")

        // Step 1: Get nonce
        let nonce = try await getNonce(evmAddress: evmAddress)
        print("[SilentSwapService] Received nonce")

        // Step 2: Create SIWE message
        let siweMessage = try await createSIWEMessage(evmAddress: evmAddress, nonce: nonce)
        print("[SilentSwapService] Created SIWE message")

        // Step 3: Sign SIWE message with Privy EVM wallet
        let siweSignature = try await PrivyAuthService.shared.signEthereumMessage(siweMessage)
        print("[SilentSwapService] Signed SIWE message")

        // Step 4: Authenticate to get secret token
        let secretToken = try await authenticate(message: siweMessage, signature: siweSignature)
        print("[SilentSwapService] Received secret token")

        // Step 5: Get EIP-712 document for wallet generation (as raw JSON string)
        let eip712JsonString = try await getWalletGenerationEip712Raw(secretToken: secretToken)
        print("[SilentSwapService] Received wallet generation EIP-712")
        print("[SilentSwapService] EIP-712 JSON: \(eip712JsonString.prefix(300))...")

        // Step 6: Sign EIP-712 to derive entropy
        let entropy = try await PrivyAuthService.shared.signEip712TypedData(eip712JsonString)
        print("[SilentSwapService] Derived entropy")

        // Cache entropy
        entropyCache = entropy

        return entropy
    }

    /// Clear cached entropy (call on logout or wallet change)
    func clearEntropy() {
        entropyCache = nil
        print("[SilentSwapService] Cleared entropy cache")
    }

    // MARK: - Private Authentication Methods

    private func getNonce(evmAddress: String) async throws -> String {
        let endpoint = "\(baseURL)/api/sapp/silentswap/auth/nonce"

        guard let url = URL(string: endpoint) else {
            throw SilentSwapError.networkError("Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["evmAddress": evmAddress])

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SilentSwapError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw SilentSwapError.networkError("HTTP \(httpResponse.statusCode)")
        }

        let nonceResponse = try JSONDecoder().decode(NonceResponse.self, from: data)
        return nonceResponse.nonce
    }

    private func createSIWEMessage(evmAddress: String, nonce: String) async throws -> String {
        let endpoint = "\(baseURL)/api/sapp/silentswap/auth/create-siwe-message"

        guard let url = URL(string: endpoint) else {
            throw SilentSwapError.networkError("Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode([
            "evmAddress": evmAddress,
            "nonce": nonce
        ])

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SilentSwapError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw SilentSwapError.networkError("HTTP \(httpResponse.statusCode)")
        }

        let messageResponse = try JSONDecoder().decode(SIWEMessageResponse.self, from: data)
        return messageResponse.message
    }

    private func authenticate(message: String, signature: String) async throws -> String {
        let endpoint = "\(baseURL)/api/sapp/silentswap/auth/authenticate"

        guard let url = URL(string: endpoint) else {
            throw SilentSwapError.networkError("Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode([
            "message": message,
            "signature": signature
        ])

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SilentSwapError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw SilentSwapError.networkError("HTTP \(httpResponse.statusCode)")
        }

        let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)
        return authResponse.secretToken
    }

    /// Get wallet generation EIP-712 as raw JSON string with proper EIP712Domain type
    private func getWalletGenerationEip712Raw(secretToken: String) async throws -> String {
        let endpoint = "\(baseURL)/api/sapp/silentswap/auth/wallet-generation-eip712"

        guard let url = URL(string: endpoint) else {
            throw SilentSwapError.networkError("Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["secretToken": secretToken])

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SilentSwapError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let responseString = String(data: data, encoding: .utf8) ?? "Unknown"
            print("[SilentSwapService] EIP-712 request failed: \(responseString)")
            throw SilentSwapError.networkError("HTTP \(httpResponse.statusCode)")
        }

        // Parse response to get eip712Doc
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              var eip712Dict = json["eip712Doc"] as? [String: Any] else {
            print("[SilentSwapService] Failed to parse eip712Doc from response")
            throw SilentSwapError.decodingError
        }

        // Debug: Print the raw structure
        print("[SilentSwapService] Raw EIP-712 structure keys: \(eip712Dict.keys)")

        // Ensure types includes EIP712Domain (required by eth_signTypedData_v4)
        if var types = eip712Dict["types"] as? [String: Any] {
            // Validate and normalize all type arrays
            var normalizedTypes: [String: [[String: String]]] = [:]

            for (typeName, typeValue) in types {
                if let typeArray = typeValue as? [[String: String]] {
                    // Already in correct format
                    normalizedTypes[typeName] = typeArray
                } else if let typeArray = typeValue as? [[String: Any]] {
                    // Convert to string values
                    let converted = typeArray.compactMap { dict -> [String: String]? in
                        guard let name = dict["name"] as? String,
                              let type = dict["type"] as? String else {
                            return nil
                        }
                        return ["name": name, "type": type]
                    }
                    normalizedTypes[typeName] = converted
                } else if let typeArray = typeValue as? [Any] {
                    // Try to handle mixed arrays
                    print("[SilentSwapService] Warning: Type '\(typeName)' has unexpected array format")
                    normalizedTypes[typeName] = []
                } else {
                    print("[SilentSwapService] Warning: Type '\(typeName)' is not an array: \(type(of: typeValue))")
                    normalizedTypes[typeName] = []
                }
            }

            // Check if EIP712Domain is missing
            if normalizedTypes["EIP712Domain"] == nil || normalizedTypes["EIP712Domain"]?.isEmpty == true {
                // Get domain fields to build EIP712Domain type
                var eip712DomainType: [[String: String]] = []

                if let domain = eip712Dict["domain"] as? [String: Any] {
                    if domain["name"] != nil {
                        eip712DomainType.append(["name": "name", "type": "string"])
                    }
                    if domain["version"] != nil {
                        eip712DomainType.append(["name": "version", "type": "string"])
                    }
                    if domain["chainId"] != nil {
                        eip712DomainType.append(["name": "chainId", "type": "uint256"])
                    }
                    if domain["verifyingContract"] != nil {
                        eip712DomainType.append(["name": "verifyingContract", "type": "address"])
                    }
                    if domain["salt"] != nil {
                        eip712DomainType.append(["name": "salt", "type": "bytes32"])
                    }
                }

                // Default EIP712Domain if we couldn't derive it
                if eip712DomainType.isEmpty {
                    eip712DomainType = [
                        ["name": "name", "type": "string"],
                        ["name": "version", "type": "string"],
                        ["name": "chainId", "type": "uint256"],
                        ["name": "verifyingContract", "type": "address"]
                    ]
                }

                normalizedTypes["EIP712Domain"] = eip712DomainType
                print("[SilentSwapService] Added EIP712Domain type to types")
            } else {
                print("[SilentSwapService] EIP712Domain already exists in types")
            }

            // Update eip712Dict with normalized types
            eip712Dict["types"] = normalizedTypes

            // Print all type keys for debugging
            print("[SilentSwapService] Types keys: \(normalizedTypes.keys)")
            for (typeName, typeFields) in normalizedTypes {
                print("[SilentSwapService] Type '\(typeName)' has \(typeFields.count) fields")
            }

            // Validate that primaryType exists in types
            if let primaryType = eip712Dict["primaryType"] as? String {
                if normalizedTypes[primaryType] == nil {
                    print("[SilentSwapService] Error: primaryType '\(primaryType)' not found in types!")
                    // Try to find it case-insensitively
                    for key in normalizedTypes.keys {
                        if key.lowercased() == primaryType.lowercased() {
                            print("[SilentSwapService] Found case-mismatch: '\(key)' vs '\(primaryType)'")
                        }
                    }
                } else {
                    print("[SilentSwapService] primaryType '\(primaryType)' exists in types with \(normalizedTypes[primaryType]?.count ?? 0) fields")
                }
            }
        } else {
            print("[SilentSwapService] Warning: No 'types' field in EIP-712 document")
            // Add a basic types structure if missing
            let defaultTypes: [String: [[String: String]]] = [
                "EIP712Domain": [
                    ["name": "name", "type": "string"],
                    ["name": "version", "type": "string"],
                    ["name": "chainId", "type": "uint256"],
                    ["name": "verifyingContract", "type": "address"]
                ]
            ]
            eip712Dict["types"] = defaultTypes
        }

        // Validate required EIP-712 fields
        guard eip712Dict["domain"] != nil else {
            print("[SilentSwapService] Error: Missing 'domain' field in EIP-712")
            throw SilentSwapError.decodingError
        }
        guard eip712Dict["primaryType"] != nil else {
            print("[SilentSwapService] Error: Missing 'primaryType' field in EIP-712")
            throw SilentSwapError.decodingError
        }
        guard eip712Dict["message"] != nil else {
            print("[SilentSwapService] Error: Missing 'message' field in EIP-712")
            throw SilentSwapError.decodingError
        }

        // Normalize domain - ensure chainId is an integer (some implementations require this)
        if var domain = eip712Dict["domain"] as? [String: Any] {
            // Convert chainId to Int if it's a string or other number type
            if let chainId = domain["chainId"] {
                if let chainIdString = chainId as? String, let chainIdInt = Int(chainIdString) {
                    domain["chainId"] = chainIdInt
                    print("[SilentSwapService] Converted chainId from string to int: \(chainIdInt)")
                } else if let chainIdDouble = chainId as? Double {
                    domain["chainId"] = Int(chainIdDouble)
                    print("[SilentSwapService] Converted chainId from double to int: \(Int(chainIdDouble))")
                } else if let chainIdNSNumber = chainId as? NSNumber {
                    domain["chainId"] = chainIdNSNumber.intValue
                    print("[SilentSwapService] Converted chainId from NSNumber to int: \(chainIdNSNumber.intValue)")
                }
            }
            eip712Dict["domain"] = domain
        }

        // Log the full structure for debugging
        print("[SilentSwapService] EIP-712 domain: \(eip712Dict["domain"] ?? "nil")")
        print("[SilentSwapService] EIP-712 primaryType: \(eip712Dict["primaryType"] ?? "nil")")
        print("[SilentSwapService] EIP-712 message: \(eip712Dict["message"] ?? "nil")")

        // Convert eip712Doc back to JSON string (use sortedKeys for consistent output)
        let eip712Data = try JSONSerialization.data(withJSONObject: eip712Dict, options: [.sortedKeys])
        guard let eip712String = String(data: eip712Data, encoding: .utf8) else {
            throw SilentSwapError.decodingError
        }

        // Debug: Print the full JSON
        print("[SilentSwapService] Final EIP-712 JSON: \(eip712String)")

        return eip712String
    }

    private func getWalletGenerationEip712(secretToken: String) async throws -> EIP712Document {
        let endpoint = "\(baseURL)/api/sapp/silentswap/auth/wallet-generation-eip712"

        guard let url = URL(string: endpoint) else {
            throw SilentSwapError.networkError("Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["secretToken": secretToken])

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SilentSwapError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw SilentSwapError.networkError("HTTP \(httpResponse.statusCode)")
        }

        // Parse JSON response manually to preserve [String: Any] structure
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let eip712Dict = json["eip712Doc"] as? [String: Any] else {
            throw SilentSwapError.decodingError
        }

        return try EIP712Document(from: eip712Dict)
    }

    // MARK: - Supported Tokens

    func loadSupportedTokens() async throws {
        let endpoint = "\(baseURL)/api/sapp/silentswap/supported-tokens"

        guard let url = URL(string: endpoint) else {
            throw SilentSwapError.networkError("Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SilentSwapError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw SilentSwapError.networkError("HTTP \(httpResponse.statusCode)")
        }

        let tokensResponse = try JSONDecoder().decode(SupportedTokensResponse.self, from: data)

        // Convert to SilentSwapToken models
        var tokens: [String: [SilentSwapToken]] = [:]

        for (chain, tokenInfos) in tokensResponse.tokens {
            guard let blockchain = BlockchainType(rawValue: chain) else { continue }

            tokens[chain] = tokenInfos.map { info in
                SilentSwapToken(
                    symbol: info.symbol,
                    name: info.name,
                    decimals: info.decimals,
                    chain: blockchain,
                    address: info.mint ?? info.address ?? "native"
                )
            }
        }

        self.supportedTokens = tokens
        print("[SilentSwapService] Loaded \(tokens.count) chains with tokens")
    }

    // MARK: - Quote

    func getQuote(
        fromToken: SilentSwapToken,
        toToken: SilentSwapToken,
        amount: Double,
        recipientAddress: String,
        senderAddress: String
    ) async throws -> SilentSwapQuoteResponse {
        isLoadingQuote = true
        defer { isLoadingQuote = false }

        // Ensure we have entropy
        let entropy = try await authenticateAndDeriveEntropy()

        guard let evmAddress = PrivyAuthService.shared.ethereumWalletAddress else {
            throw SilentSwapError.authenticationFailed("No EVM wallet address")
        }

        let endpoint = "\(baseURL)/api/sapp/silentswap/quote"

        guard let url = URL(string: endpoint) else {
            throw SilentSwapError.networkError("Invalid URL")
        }

        let requestBody = SilentSwapQuoteRequest(
            evmAddress: evmAddress,
            entropy: entropy,
            fromToken: fromToken.address,
            toToken: toToken.address,
            amount: String(amount),
            fromChain: fromToken.chain.rawValue,
            toChain: toToken.chain.rawValue,
            recipientAddress: recipientAddress,
            senderAddress: senderAddress
        )

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(requestBody)

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SilentSwapError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            // Try to decode error message
            if let errorResponse = try? JSONDecoder().decode(SilentSwapQuoteAPIResponse.self, from: data),
               let errorMessage = errorResponse.message {
                throw SilentSwapError.quoteFailed(errorMessage)
            }
            throw SilentSwapError.networkError("HTTP \(httpResponse.statusCode)")
        }

        let apiResponse = try JSONDecoder().decode(SilentSwapQuoteAPIResponse.self, from: data)

        guard let quote = apiResponse.quote else {
            throw SilentSwapError.quoteFailed(apiResponse.message ?? "Unknown error")
        }

        self.currentQuote = quote
        print("[SilentSwapService] Got quote: \(quote.estimatedOutput) (quoteId: \(quote.quoteId))")

        return quote
    }

    // MARK: - Execute Swap

    func executeSwap(quoteResponse: SilentSwapQuoteResponse) async throws -> SilentSwapExecuteResponse {
        isExecutingSwap = true
        defer { isExecutingSwap = false }

        // Ensure we have entropy
        let entropy = try await authenticateAndDeriveEntropy()

        guard let evmAddress = PrivyAuthService.shared.ethereumWalletAddress else {
            throw SilentSwapError.authenticationFailed("No EVM wallet address")
        }

        print("[SilentSwapService] Step 1: Get order EIP-712 document")

        // Step 1: Get order EIP-712 document from backend
        let orderEip712 = try await getOrderEip712(quoteResponse: quoteResponse.rawQuote)

        print("[SilentSwapService] Step 2: Sign authorizations")

        // Step 2: Sign all authorizations with Privy EVM wallet
        var signedAuthorizations: [[String: Any]] = []

        if let authorizations = quoteResponse.rawQuote["authorizations"] as? [[String: Any]] {
            for auth in authorizations {
                if let authType = auth["type"] as? String {
                    // Get signature based on auth type
                    var signedAuth = auth

                    if authType == "eip3009_deposit" {
                        // Sign EIP-712 for deposit authorization
                        if let eip712Data = auth["eip712"] as? [String: Any] {
                            let eip712Json = try JSONSerialization.data(withJSONObject: eip712Data)
                            let eip712String = String(data: eip712Json, encoding: .utf8)!
                            let signature = try await PrivyAuthService.shared.signEip712TypedData(eip712String)
                            signedAuth["signature"] = signature
                        }
                    }

                    signedAuthorizations.append(signedAuth)
                }
            }
        }

        print("[SilentSwapService] Step 3: Sign order EIP-712")

        // Step 3: Sign the order EIP-712
        let orderEip712String = try orderEip712.toJSONString()
        let orderSignature = try await PrivyAuthService.shared.signEip712TypedData(orderEip712String)

        print("[SilentSwapService] Step 4: Execute swap on backend")

        // Step 4: Execute swap with all signatures
        let endpoint = "\(baseURL)/api/sapp/silentswap/execute"

        guard let url = URL(string: endpoint) else {
            throw SilentSwapError.networkError("Invalid URL")
        }

        let requestBody: [String: Any] = [
            "quoteId": quoteResponse.quoteId,
            "evmAddress": evmAddress,
            "entropy": entropy,
            "signedAuthorizations": signedAuthorizations,
            "orderSignature": orderSignature,
            "eip712Domain": orderEip712.domain,
            "rawQuote": quoteResponse.rawQuote
        ]

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SilentSwapError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            if let errorResponse = try? JSONDecoder().decode(SilentSwapExecuteAPIResponse.self, from: data),
               let errorMessage = errorResponse.message {
                throw SilentSwapError.executeFailed(errorMessage)
            }
            throw SilentSwapError.networkError("HTTP \(httpResponse.statusCode)")
        }

        let apiResponse = try JSONDecoder().decode(SilentSwapExecuteAPIResponse.self, from: data)

        guard let swap = apiResponse.swap else {
            throw SilentSwapError.executeFailed(apiResponse.message ?? "Unknown error")
        }

        print("[SilentSwapService] Swap executed: \(swap.orderId)")

        return swap
    }

    private func getOrderEip712(quoteResponse: Any) async throws -> EIP712Document {
        let endpoint = "\(baseURL)/api/sapp/silentswap/order-eip712"

        guard let url = URL(string: endpoint) else {
            throw SilentSwapError.networkError("Invalid URL")
        }

        let requestBody: [String: Any] = [
            "quoteResponse": quoteResponse
        ]

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SilentSwapError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw SilentSwapError.networkError("HTTP \(httpResponse.statusCode)")
        }

        // Parse JSON response manually to preserve [String: Any] structure
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let eip712Dict = json["eip712Doc"] as? [String: Any] else {
            throw SilentSwapError.decodingError
        }

        return try EIP712Document(from: eip712Dict)
    }

    // MARK: - Swap Status

    func getSwapStatus(orderId: String) async throws -> SilentSwapStatusResponse {
        let endpoint = "\(baseURL)/api/sapp/silentswap/status/\(orderId)"

        guard let url = URL(string: endpoint) else {
            throw SilentSwapError.networkError("Invalid URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await urlSession.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SilentSwapError.networkError("Invalid response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            if let errorResponse = try? JSONDecoder().decode(SilentSwapStatusAPIResponse.self, from: data),
               let errorMessage = errorResponse.message {
                throw SilentSwapError.statusCheckFailed(errorMessage)
            }
            throw SilentSwapError.networkError("HTTP \(httpResponse.statusCode)")
        }

        let apiResponse = try JSONDecoder().decode(SilentSwapStatusAPIResponse.self, from: data)

        guard let status = apiResponse.status else {
            throw SilentSwapError.statusCheckFailed(apiResponse.message ?? "Unknown error")
        }

        return status
    }

    // MARK: - Helpers

    func clearQuote() {
        currentQuote = nil
    }

    func getTokens(for chain: BlockchainType) -> [SilentSwapToken] {
        supportedTokens[chain.rawValue] ?? []
    }
}

// MARK: - Helper Response Models

private struct NonceResponse: Codable {
    let success: Bool
    let nonce: String
}

private struct SIWEMessageResponse: Codable {
    let success: Bool
    let message: String
}

private struct AuthResponse: Codable {
    let success: Bool
    let secretToken: String
}
