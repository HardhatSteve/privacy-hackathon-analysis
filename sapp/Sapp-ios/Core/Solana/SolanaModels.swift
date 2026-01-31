import Foundation

// MARK: - Solana Wallet Models

struct SolanaWalletInfo: Equatable {
    let publicKey: String
    let balance: UInt64  // Lamports (1 SOL = 1_000_000_000 lamports)
    
    var solBalance: Double {
        Double(balance) / 1_000_000_000.0
    }
    
    var formattedBalance: String {
        String(format: "%.4f SOL", solBalance)
    }
    
    var shortAddress: String {
        guard publicKey.count > 12 else { return publicKey }
        return "\(publicKey.prefix(6))...\(publicKey.suffix(4))"
    }
}

struct SolanaTransaction: Identifiable, Equatable {
    let id: String  // Transaction signature
    let timestamp: Date?
    let amount: Int64  // Lamports (positive = received, negative = sent)
    let from: String
    let to: String
    let fee: UInt64
    let status: TransactionStatus
    let memo: String?
    
    enum TransactionStatus: String, Equatable {
        case confirmed
        case pending
        case failed
    }
    
    var isOutgoing: Bool {
        amount < 0
    }
    
    var formattedAmount: String {
        let sol = abs(Double(amount)) / 1_000_000_000.0
        let sign = amount >= 0 ? "+" : "-"
        return "\(sign)\(String(format: "%.4f", sol)) SOL"
    }
}

// MARK: - Wallet State

enum WalletConnectionState: Equatable {
    case disconnected
    case connecting
    case connected(SolanaWalletInfo)
    case error(String)

    var isConnected: Bool {
        if case .connected = self { return true }
        return false
    }
}

// MARK: - Network Configuration

enum SolanaNetwork: String, CaseIterable {
    case mainnet = "mainnet-beta"
    case devnet = "devnet"
    case testnet = "testnet"
    
    var rpcURL: String {
        switch self {
        case .mainnet:
            return "https://api.mainnet-beta.solana.com"
        case .devnet:
            return "https://api.devnet.solana.com"
        case .testnet:
            return "https://api.testnet.solana.com"
        }
    }
    
    var displayName: String {
        switch self {
        case .mainnet: return "Mainnet"
        case .devnet: return "Devnet"
        case .testnet: return "Testnet"
        }
    }
}
