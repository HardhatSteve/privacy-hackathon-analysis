import Foundation

// MARK: - Pool Models

struct LuloPool: Codable, Identifiable, Hashable {
    let mintAddress: String
    let tokenSymbol: String
    let tokenName: String
    let decimals: Int
    let tvl: String
    let isActive: Bool

    var id: String { mintAddress }

    var formattedTVL: String {
        guard let value = Double(tvl) else { return "$0" }

        if value >= 1_000_000_000 {
            return String(format: "$%.2fB", value / 1_000_000_000)
        } else if value >= 1_000_000 {
            return String(format: "$%.2fM", value / 1_000_000)
        } else if value >= 1_000 {
            return String(format: "$%.2fK", value / 1_000)
        }
        return String(format: "$%.2f", value)
    }
}

struct LuloRate: Codable, Hashable {
    let mintAddress: String
    let apy: Double
    let apyProtected: Double

    var formattedAPY: String {
        String(format: "%.2f%%", apy)
    }

    var formattedProtectedAPY: String {
        String(format: "%.2f%%", apyProtected)
    }
}

struct LuloPoolWithRate: Codable, Identifiable, Hashable {
    let pool: LuloPool
    let rate: LuloRate

    var id: String { pool.mintAddress }

    static func == (lhs: LuloPoolWithRate, rhs: LuloPoolWithRate) -> Bool {
        lhs.id == rhs.id
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

// MARK: - Position Models

struct LuloPosition: Codable, Identifiable, Hashable {
    let mintAddress: String
    let tokenSymbol: String
    let regularBalance: String
    let protectedBalance: String
    let totalBalance: String
    let earnings: String

    var id: String { mintAddress }

    var regularBalanceDouble: Double {
        Double(regularBalance) ?? 0
    }

    var protectedBalanceDouble: Double {
        Double(protectedBalance) ?? 0
    }

    var totalBalanceDouble: Double {
        Double(totalBalance) ?? 0
    }

    var earningsDouble: Double {
        Double(earnings) ?? 0
    }

    var formattedTotalBalance: String {
        String(format: "%.4f %@", totalBalanceDouble, tokenSymbol)
    }

    var formattedEarnings: String {
        String(format: "+%.4f %@", earningsDouble, tokenSymbol)
    }

    var hasRegularDeposit: Bool {
        regularBalanceDouble > 0
    }

    var hasProtectedDeposit: Bool {
        protectedBalanceDouble > 0
    }
}

struct LuloAccount: Codable {
    let owner: String
    let positions: [LuloPosition]
    let totalValueUsd: String

    var totalValueDouble: Double {
        Double(totalValueUsd) ?? 0
    }

    var formattedTotalValue: String {
        String(format: "$%.2f", totalValueDouble)
    }

    var totalEarnings: Double {
        positions.reduce(0) { $0 + $1.earningsDouble }
    }
}

// MARK: - Pending Withdrawal Models

struct LuloPendingWithdrawal: Codable, Identifiable, Hashable {
    let id: String
    let mintAddress: String
    let amount: String
    let requestedAt: String
    let estimatedCompletionAt: String

    var amountDouble: Double {
        Double(amount) ?? 0
    }

    var requestedDate: Date? {
        ISO8601DateFormatter().date(from: requestedAt)
    }

    var estimatedCompletionDate: Date? {
        ISO8601DateFormatter().date(from: estimatedCompletionAt)
    }

    var formattedAmount: String {
        String(format: "%.4f", amountDouble)
    }
}

// MARK: - Deposit Mode

enum LuloDepositMode: String, CaseIterable, Identifiable {
    case regular
    case protected

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .regular: return "Regular"
        case .protected: return "Protected"
        }
    }

    var description: String {
        switch self {
        case .regular:
            return "Higher yield, standard risk"
        case .protected:
            return "Lower yield, principal protected"
        }
    }

    var icon: String {
        switch self {
        case .regular: return "chart.line.uptrend.xyaxis"
        case .protected: return "shield.fill"
        }
    }
}

// MARK: - Transaction Responses

struct LuloTransactionResponse: Codable {
    let transaction: String
    let message: String?
}

// MARK: - API Response Wrappers

struct LuloPoolsAPIResponse: Codable {
    let success: Bool
    let data: [LuloPoolWithRate]
    let count: Int?
}

struct LuloPoolAPIResponse: Codable {
    let success: Bool
    let data: LuloPoolWithRate?
    let error: String?
}

struct LuloAccountAPIResponse: Codable {
    let success: Bool
    let data: LuloAccount?
    let error: String?
}

struct LuloPendingWithdrawalsAPIResponse: Codable {
    let success: Bool
    let data: [LuloPendingWithdrawal]
    let count: Int?
}

struct LuloTransactionAPIResponse: Codable {
    let success: Bool
    let data: LuloTransactionResponse?
    let error: String?
}

struct LuloRatesAPIResponse: Codable {
    let success: Bool
    let data: [LuloRate]
}

// MARK: - Errors

enum LuloError: Error, LocalizedError {
    case networkError(String)
    case insufficientBalance
    case invalidAmount
    case poolNotFound
    case walletNotConnected
    case transactionFailed(String)
    case decodingError
    case apiError(String)
    case minimumDepositNotMet

    var errorDescription: String? {
        switch self {
        case .networkError(let message):
            return "Network error: \(message)"
        case .insufficientBalance:
            return "Insufficient balance for this operation"
        case .invalidAmount:
            return "Please enter a valid amount"
        case .poolNotFound:
            return "Pool not found"
        case .walletNotConnected:
            return "Please connect your wallet first"
        case .transactionFailed(let message):
            return "Transaction failed: \(message)"
        case .decodingError:
            return "Failed to decode server response"
        case .apiError(let message):
            return message
        case .minimumDepositNotMet:
            return "Amount below minimum deposit requirement"
        }
    }
}

// MARK: - Request Bodies

struct LuloDepositRequestBody: Codable {
    let owner: String
    let mintAddress: String
    let regularAmount: Double?
    let protectedAmount: Double?
    let referrer: String?
}

struct LuloWithdrawRequestBody: Codable {
    let owner: String
    let mintAddress: String
    let amount: Double
}
