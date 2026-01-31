import Foundation

// MARK: - Token Configuration

struct ShadowWireToken {
    let symbol: String
    let name: String
    let decimals: Int
    let feePercentage: Double
    let minimumAmount: Double
}

// MARK: - Supported Tokens

enum ShadowWireTokens {
    // MARK: - Token Definitions

    static let SOL = ShadowWireToken(
        symbol: "SOL",
        name: "Solana",
        decimals: 9,
        feePercentage: 0.5,
        minimumAmount: 0.001
    )

    static let RADR = ShadowWireToken(
        symbol: "RADR",
        name: "RADR",
        decimals: 9,
        feePercentage: 0.3,
        minimumAmount: 1.0
    )

    static let USDC = ShadowWireToken(
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        feePercentage: 1.0,
        minimumAmount: 0.1
    )

    static let ORE = ShadowWireToken(
        symbol: "ORE",
        name: "ORE",
        decimals: 11,
        feePercentage: 0.3,
        minimumAmount: 1.0
    )

    static let BONK = ShadowWireToken(
        symbol: "BONK",
        name: "BONK",
        decimals: 5,
        feePercentage: 1.0,
        minimumAmount: 1000
    )

    static let JIM = ShadowWireToken(
        symbol: "JIM",
        name: "JIM",
        decimals: 9,
        feePercentage: 1.0,
        minimumAmount: 1.0
    )

    static let GODL = ShadowWireToken(
        symbol: "GODL",
        name: "GODL",
        decimals: 11,
        feePercentage: 1.0,
        minimumAmount: 1.0
    )

    static let HUSTLE = ShadowWireToken(
        symbol: "HUSTLE",
        name: "HUSTLE",
        decimals: 9,
        feePercentage: 0.3,
        minimumAmount: 1.0
    )

    // MARK: - All Supported Tokens

    static let all: [String] = [
        "SOL", "RADR", "USDC", "ORE", "BONK", "JIM", "GODL", "HUSTLE",
        "CRT", "BLACKCOIN", "GIL", "ANON", "WLFI", "USD1", "AOL",
        "IQLABS", "SANA", "POKI", "RAIN", "HOSICO", "SKR"
    ]

    // MARK: - Token Lookup

    static func token(for symbol: String) -> ShadowWireToken? {
        switch symbol.uppercased() {
        case "SOL": return SOL
        case "RADR": return RADR
        case "USDC": return USDC
        case "ORE": return ORE
        case "BONK": return BONK
        case "JIM": return JIM
        case "GODL": return GODL
        case "HUSTLE": return HUSTLE
        default:
            // For tokens not explicitly defined, return basic info
            return ShadowWireToken(
                symbol: symbol.uppercased(),
                name: symbol.uppercased(),
                decimals: 9,  // Default to 9 decimals
                feePercentage: 1.0,  // Default to 1% fee
                minimumAmount: 0.001
            )
        }
    }

    // MARK: - Utility Methods

    /// Convert to smallest unit (lamports for SOL, etc.)
    static func toSmallestUnit(_ amount: Double, token: String) -> UInt64 {
        guard let tokenInfo = self.token(for: token) else {
            return UInt64(amount * pow(10.0, 9.0))  // Default to 9 decimals
        }
        let multiplier = pow(10.0, Double(tokenInfo.decimals))
        return UInt64(amount * multiplier)
    }

    /// Convert from smallest unit to decimal
    static func fromSmallestUnit(_ amount: UInt64, token: String) -> Double {
        guard let tokenInfo = self.token(for: token) else {
            return Double(amount) / pow(10.0, 9.0)  // Default to 9 decimals
        }
        let divisor = pow(10.0, Double(tokenInfo.decimals))
        return Double(amount) / divisor
    }

    /// Calculate fee for a transfer
    static func calculateFee(_ amount: Double, token: String) -> (fee: Double, netAmount: Double) {
        guard let tokenInfo = self.token(for: token) else {
            let fee = amount * 0.01  // Default 1% fee
            return (fee: fee, netAmount: amount - fee)
        }

        let feeDecimal = tokenInfo.feePercentage / 100.0
        let fee = amount * feeDecimal
        let netAmount = amount - fee

        return (fee: fee, netAmount: netAmount)
    }

    /// Validate minimum amount
    static func isValidAmount(_ amount: Double, token: String) -> Bool {
        guard let tokenInfo = self.token(for: token) else {
            return amount > 0
        }
        return amount >= tokenInfo.minimumAmount
    }

    /// Get minimum amount for token
    static func minimumAmount(for token: String) -> Double {
        return self.token(for: token)?.minimumAmount ?? 0.001
    }

    /// Format amount for display
    static func formatAmount(_ amount: Double, token: String) -> String {
        guard let tokenInfo = self.token(for: token) else {
            return String(format: "%.6f", amount)
        }

        // Determine decimal places for display
        let decimalPlaces: Int
        if amount < 1 {
            decimalPlaces = min(8, tokenInfo.decimals)
        } else if amount < 100 {
            decimalPlaces = min(4, tokenInfo.decimals)
        } else {
            decimalPlaces = 2
        }

        return String(format: "%.\(decimalPlaces)f", amount)
    }
}
