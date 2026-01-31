import Foundation

// MARK: - Blockchain Types

enum BlockchainType: String, Codable, CaseIterable {
    case solana
    case ethereum
    case avalanche

    var displayName: String {
        switch self {
        case .solana: return "Solana"
        case .ethereum: return "Ethereum"
        case .avalanche: return "Avalanche"
        }
    }

    var symbol: String {
        switch self {
        case .solana: return "SOL"
        case .ethereum: return "ETH"
        case .avalanche: return "AVAX"
        }
    }
}

// MARK: - Token Models

struct SilentSwapToken: Codable, Identifiable, Hashable {
    let symbol: String
    let name: String
    let decimals: Int
    let chain: BlockchainType

    // Solana tokens use mint address, EVM tokens use contract address
    let address: String // "native" for native tokens, otherwise contract/mint address

    var id: String {
        "\(chain.rawValue)_\(symbol)"
    }

    var isNative: Bool {
        address == "native" || address == "0x0000000000000000000000000000000000000000"
    }

    var displayName: String {
        "\(symbol) (\(chain.displayName))"
    }
}

struct SupportedTokensResponse: Codable {
    let chains: [String]
    let tokens: [String: [TokenInfo]]

    struct TokenInfo: Codable {
        let symbol: String
        let name: String
        let decimals: Int
        let mint: String? // For Solana tokens
        let address: String? // For EVM tokens
    }
}

// MARK: - Quote Models

struct SilentSwapQuoteRequest: Codable {
    let evmAddress: String // User's EVM wallet address
    let entropy: String // Derived from authentication flow
    let fromToken: String
    let toToken: String
    let amount: String
    let fromChain: String
    let toChain: String
    let recipientAddress: String
    let senderAddress: String
}

struct SilentSwapQuoteResponse: Codable {
    let quoteId: String
    let estimatedOutput: String
    let estimatedFee: String
    let bridgeProvider: String
    let route: RouteInfo
    let rawQuote: [String: Any] // Full quote data from SilentSwap API

    struct RouteInfo: Codable {
        let sourceChain: String
        let destinationChain: String
        let bridgeViaUsdc: Bool
    }

    // Computed properties for display
    var estimatedOutputDouble: Double {
        Double(estimatedOutput) ?? 0
    }

    var estimatedFeeDouble: Double {
        Double(estimatedFee) ?? 0
    }

    var netOutput: Double {
        estimatedOutputDouble - estimatedFeeDouble
    }

    // Custom Codable implementation to handle rawQuote
    enum CodingKeys: String, CodingKey {
        case quoteId, estimatedOutput, estimatedFee, bridgeProvider, route, rawQuote
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        quoteId = try container.decode(String.self, forKey: .quoteId)
        estimatedOutput = try container.decode(String.self, forKey: .estimatedOutput)
        estimatedFee = try container.decode(String.self, forKey: .estimatedFee)
        bridgeProvider = try container.decode(String.self, forKey: .bridgeProvider)
        route = try container.decode(RouteInfo.self, forKey: .route)

        // Decode rawQuote as JSON dictionary
        if let rawQuoteData = try? container.decode(Data.self, forKey: .rawQuote),
           let json = try? JSONSerialization.jsonObject(with: rawQuoteData) as? [String: Any] {
            rawQuote = json
        } else {
            rawQuote = [:]
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(quoteId, forKey: .quoteId)
        try container.encode(estimatedOutput, forKey: .estimatedOutput)
        try container.encode(estimatedFee, forKey: .estimatedFee)
        try container.encode(bridgeProvider, forKey: .bridgeProvider)
        try container.encode(route, forKey: .route)

        // Encode rawQuote as JSON data
        let rawQuoteData = try JSONSerialization.data(withJSONObject: rawQuote)
        try container.encode(rawQuoteData, forKey: .rawQuote)
    }
}

struct SilentSwapQuoteAPIResponse: Codable {
    let success: Bool
    let quote: SilentSwapQuoteResponse?
    let error: String?
    let message: String?
}

// MARK: - Execute Models

struct SilentSwapExecuteRequest: Codable {
    let quoteId: String
    let senderSolanaAddress: String?
}

struct SilentSwapExecuteResponse: Codable {
    let orderId: String
    let status: SwapStatus
    let depositTxHash: String?
    let estimatedCompletionTime: Int // seconds
}

struct SilentSwapExecuteAPIResponse: Codable {
    let success: Bool
    let swap: SilentSwapExecuteResponse?
    let error: String?
    let message: String?
}

// MARK: - Status Models

enum SwapStatus: String, Codable {
    case pending
    case processing
    case completed
    case failed

    var displayText: String {
        switch self {
        case .pending: return "Pending"
        case .processing: return "Processing"
        case .completed: return "Completed"
        case .failed: return "Failed"
        }
    }

    var isInProgress: Bool {
        self == .pending || self == .processing
    }
}

struct SilentSwapStatusResponse: Codable {
    let orderId: String
    let status: SwapStatus
    let depositTxHash: String?
    let completionTxHash: String?
    let error: String?
}

struct SilentSwapStatusAPIResponse: Codable {
    let success: Bool
    let status: SilentSwapStatusResponse?
    let error: String?
    let message: String?
}

// MARK: - Swap Transaction

struct SilentSwapTransaction: Identifiable {
    let id: String // orderId
    let fromToken: SilentSwapToken
    let toToken: SilentSwapToken
    let amount: Double
    let estimatedOutput: Double
    let status: SwapStatus
    let timestamp: Date
    let depositTxHash: String?
    let completionTxHash: String?

    var displayFromAmount: String {
        String(format: "%.4f %@", amount, fromToken.symbol)
    }

    var displayToAmount: String {
        String(format: "%.4f %@", estimatedOutput, toToken.symbol)
    }

    var explorerUrl: String? {
        guard let txHash = completionTxHash ?? depositTxHash else { return nil }

        switch toToken.chain {
        case .solana:
            let cluster = PrivyConfiguration.currentCluster
            let clusterParam = cluster == .mainnetBeta ? "" : "?cluster=\(cluster.rawValue)"
            return "https://explorer.solana.com/tx/\(txHash)\(clusterParam)"
        case .ethereum:
            // Use testnet explorer for non-production
            let isTestnet = EthereumChain.current.isTestnet
            return isTestnet
                ? "https://sepolia.etherscan.io/tx/\(txHash)"
                : "https://etherscan.io/tx/\(txHash)"
        case .avalanche:
            // Use testnet explorer for non-production
            let isTestnet = EthereumChain.current.isTestnet
            return isTestnet
                ? "https://testnet.snowtrace.io/tx/\(txHash)"
                : "https://snowtrace.io/tx/\(txHash)"
        }
    }
}

// MARK: - EIP-712 Models

struct EIP712Document {
    let domain: EIP712Domain
    let types: [String: [EIP712Type]]
    let primaryType: String
    let message: [String: Any]

    struct EIP712Domain: Codable {
        let name: String?
        let version: String?
        let chainId: Int?
        let verifyingContract: String?

        /// Convert to dictionary for JSON serialization
        func toDictionary() -> [String: Any] {
            var dict: [String: Any] = [:]
            if let name = name { dict["name"] = name }
            if let version = version { dict["version"] = version }
            if let chainId = chainId { dict["chainId"] = chainId }
            if let verifyingContract = verifyingContract { dict["verifyingContract"] = verifyingContract }
            return dict
        }
    }

    struct EIP712Type: Codable {
        let name: String
        let type: String

        /// Convert to dictionary for JSON serialization
        func toDictionary() -> [String: String] {
            return ["name": name, "type": type]
        }
    }

    /// Initialize from a JSON dictionary (from API response)
    init(from dictionary: [String: Any]) throws {
        // Parse domain
        guard let domainDict = dictionary["domain"] as? [String: Any] else {
            throw SilentSwapError.decodingError
        }
        self.domain = EIP712Domain(
            name: domainDict["name"] as? String,
            version: domainDict["version"] as? String,
            chainId: domainDict["chainId"] as? Int,
            verifyingContract: domainDict["verifyingContract"] as? String
        )

        // Parse types
        guard let typesDict = dictionary["types"] as? [String: [[String: String]]] else {
            throw SilentSwapError.decodingError
        }
        var parsedTypes: [String: [EIP712Type]] = [:]
        for (typeName, typeArray) in typesDict {
            parsedTypes[typeName] = typeArray.compactMap { typeDict in
                guard let name = typeDict["name"], let type = typeDict["type"] else { return nil }
                return EIP712Type(name: name, type: type)
            }
        }
        self.types = parsedTypes

        // Parse primaryType
        guard let primaryType = dictionary["primaryType"] as? String else {
            throw SilentSwapError.decodingError
        }
        self.primaryType = primaryType

        // Parse message (keep as dictionary)
        guard let message = dictionary["message"] as? [String: Any] else {
            throw SilentSwapError.decodingError
        }
        self.message = message
    }

    /// Convert to JSON string for EIP-712 signing
    /// This produces a properly formatted JSON string that Privy SDK expects
    func toJSONString() throws -> String {
        // Build types dictionary
        var typesDict: [String: [[String: String]]] = [:]
        for (typeName, typeArray) in types {
            typesDict[typeName] = typeArray.map { $0.toDictionary() }
        }

        // Build full EIP-712 document
        let document: [String: Any] = [
            "domain": domain.toDictionary(),
            "types": typesDict,
            "primaryType": primaryType,
            "message": message
        ]

        let jsonData = try JSONSerialization.data(withJSONObject: document, options: [.sortedKeys])
        guard let jsonString = String(data: jsonData, encoding: .utf8) else {
            throw SilentSwapError.decodingError
        }
        return jsonString
    }
}

// MARK: - Errors

enum SilentSwapError: Error, LocalizedError {
    case invalidAmount
    case invalidAddress
    case authenticationFailed(String)
    case quoteFailed(String)
    case executeFailed(String)
    case statusCheckFailed(String)
    case unsupportedToken
    case unsupportedChain
    case networkError(String)
    case walletNotConnected
    case evmWalletRequired
    case solanaWalletRequired
    case decodingError

    var errorDescription: String? {
        switch self {
        case .invalidAmount:
            return "Invalid swap amount"
        case .invalidAddress:
            return "Invalid wallet address"
        case .authenticationFailed(let message):
            return "Authentication failed: \(message)"
        case .quoteFailed(let message):
            return "Failed to get quote: \(message)"
        case .executeFailed(let message):
            return "Failed to execute swap: \(message)"
        case .statusCheckFailed(let message):
            return "Failed to check swap status: \(message)"
        case .unsupportedToken:
            return "Token not supported for swapping"
        case .unsupportedChain:
            return "Blockchain not supported"
        case .networkError(let message):
            return "Network error: \(message)"
        case .walletNotConnected:
            return "Please connect your wallet first"
        case .evmWalletRequired:
            return "Ethereum wallet required for this swap"
        case .solanaWalletRequired:
            return "Solana wallet required for this swap"
        case .decodingError:
            return "Failed to decode server response"
        }
    }
}
