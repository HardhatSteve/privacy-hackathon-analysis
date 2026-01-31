import Foundation

// MARK: - Wallet Info

/// Unified wallet information model
struct WalletInfo: Codable, Equatable, Identifiable {
    let id: String
    let address: String
    let publicKey: String
    let chainType: String
    let createdAt: Int?
    let ownerId: String?

    // MARK: - Computed Properties

    var chain: WalletChainType? {
        WalletChainType(rawValue: chainType)
    }

    var createdDate: Date? {
        guard let timestamp = createdAt else { return nil }
        return Date(timeIntervalSince1970: TimeInterval(timestamp) / 1000)
    }

    /// Shortened address for display (first 4 + last 4 characters)
    var shortAddress: String {
        guard address.count > 10 else { return address }
        return "\(address.prefix(4))...\(address.suffix(4))"
    }

    /// Medium length address for display (first 6 + last 6 characters)
    var mediumAddress: String {
        guard address.count > 14 else { return address }
        return "\(address.prefix(6))...\(address.suffix(6))"
    }
}

// MARK: - Chain Types

/// Supported blockchain types
enum WalletChainType: String, Codable, CaseIterable, Identifiable {
    case solana
    case ethereum

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .solana: return "Solana"
        case .ethereum: return "Ethereum"
        }
    }

    var nativeCurrency: String {
        switch self {
        case .solana: return "SOL"
        case .ethereum: return "ETH"
        }
    }

    var decimals: Int {
        switch self {
        case .solana: return 9   // Lamports
        case .ethereum: return 18 // Wei
        }
    }

    var iconName: String {
        switch self {
        case .solana: return "solana-icon"
        case .ethereum: return "ethereum-icon"
        }
    }
}

// MARK: - Wallet Creation Response

/// Response from wallet creation API
struct WalletCreateResponse: Codable {
    let walletId: String
    let address: String
    let chainType: String
    let publicKey: String

    /// Convert to WalletInfo
    func toWalletInfo() -> WalletInfo {
        WalletInfo(
            id: walletId,
            address: address,
            publicKey: publicKey,
            chainType: chainType,
            createdAt: Int(Date().timeIntervalSince1970 * 1000),
            ownerId: nil
        )
    }
}

// MARK: - Wallet List Response

/// Response from listing wallets
struct WalletListResponse: Codable {
    let wallets: [WalletInfo]
}

// MARK: - Signature Response

/// Response containing a signature
struct SignatureResponse: Codable {
    let signature: String
}

// MARK: - Signed Transaction Response

/// Response containing a signed transaction
struct SignedTransactionResponse: Codable {
    let signedTransaction: String
}

// MARK: - Transaction Hash Response

/// Response containing a transaction hash/signature
struct TransactionHashResponse: Codable {
    let transactionHash: String
}

// MARK: - Export Wallet Response

/// Response from wallet export
struct ExportWalletResponse: Codable {
    let privateKey: String
}

// MARK: - Generic API Response

/// Generic wrapper for wallet API responses
struct WalletAPIResponse<T: Decodable>: Decodable {
    let walletId: String?
    let address: String?
    let chainType: String?
    let publicKey: String?
    let signature: String?
    let signedTransaction: String?
    let transactionHash: String?
    let privateKey: String?
    let wallets: [T]?
    let error: String?
    let code: String?
}

// MARK: - Wallet Balance

/// Wallet balance information
struct WalletBalance: Equatable {
    let address: String
    let chainType: WalletChainType
    let balance: Decimal
    let balanceUSD: Decimal?
    let lastUpdated: Date

    /// Formatted balance string
    var formattedBalance: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 2
        formatter.maximumFractionDigits = chainType == .solana ? 9 : 18
        return formatter.string(from: balance as NSDecimalNumber) ?? "0"
    }

    /// Formatted USD value
    var formattedUSD: String? {
        guard let usd = balanceUSD else { return nil }
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: usd as NSDecimalNumber)
    }
}

// MARK: - Token Balance

/// SPL/ERC20 token balance
struct TokenBalance: Equatable, Identifiable {
    let id: String
    let mintAddress: String
    let symbol: String
    let name: String?
    let balance: Decimal
    let decimals: Int
    let logoURL: URL?

    /// UI amount with proper decimal places
    var uiAmount: Decimal {
        balance / pow(10, decimals)
    }

    /// Formatted balance for display
    var formattedBalance: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 2
        formatter.maximumFractionDigits = min(decimals, 6)
        return formatter.string(from: uiAmount as NSDecimalNumber) ?? "0"
    }
}

// MARK: - Transaction Request

/// Request to send a transaction
struct TransactionRequest {
    let from: String
    let to: String
    let amount: Decimal
    let chainType: WalletChainType
    let tokenMint: String?  // nil for native currency
    let memo: String?

    /// Whether this is a native currency transfer
    var isNativeTransfer: Bool {
        tokenMint == nil
    }
}

// MARK: - Transaction Result

/// Result of a transaction submission
struct TransactionResult: Equatable {
    let signature: String
    let status: TransactionStatus
    let confirmations: Int?
    let fee: Decimal?
    let timestamp: Date

    enum TransactionStatus: String, Equatable {
        case pending
        case confirmed
        case finalized
        case failed
    }
}

// MARK: - Wallet Type

/// Type of wallet (embedded vs server)
enum WalletType: String, Equatable {
    case embedded   // Client-side Privy embedded wallet
    case server     // Server-managed Privy wallet

    var displayName: String {
        switch self {
        case .embedded: return "Embedded"
        case .server: return "Server"
        }
    }

    var description: String {
        switch self {
        case .embedded:
            return "Wallet secured on your device"
        case .server:
            return "Wallet managed by the server"
        }
    }
}

// MARK: - Active Wallet

/// Represents the currently active wallet for a chain
struct ActiveWallet: Equatable {
    let info: WalletInfo
    let type: WalletType
    let chainType: WalletChainType

    var address: String { info.address }
    var walletId: String { info.id }
}
