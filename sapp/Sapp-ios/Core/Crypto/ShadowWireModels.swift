import Foundation

// MARK: - Transfer Types

enum ShadowWireTransferType: String, Codable {
    case `internal`  // Private transfer (amount hidden with zero-knowledge proofs)
    case external    // Public transfer (amount visible, sender anonymous)
}

// MARK: - Transfer Request

struct ShadowWireTransferRequest: Codable {
    let senderWallet: String
    let recipientWallet: String
    let amount: Double
    let token: String
    let type: ShadowWireTransferType
    let signature: String?
}

// MARK: - Transfer Response

struct ShadowWireTransferResponse: Codable {
    let success: Bool
    let transfer: TransferDetails

    struct TransferDetails: Codable {
        let success: Bool
        let signature: String
        let amount: Double?  // nil for internal transfers (private)
        let token: String
        let type: ShadowWireTransferType
        let fee: Double
        let timestamp: Date
    }
}

// MARK: - Transfer to Handle Request

struct ShadowWireTransferToHandleRequest: Codable {
    let senderWallet: String
    let recipientHandle: String
    let amount: Double
    let token: String
    let type: ShadowWireTransferType
    let signature: String?
}

// MARK: - Transfer to Handle Response

struct ShadowWireTransferToHandleResponse: Codable {
    let success: Bool
    let transfer: TransferDetails
    let recipientHandle: String
    let recipientWallet: String

    struct TransferDetails: Codable {
        let success: Bool
        let signature: String
        let amount: Double?  // nil for internal transfers
        let token: String
        let type: ShadowWireTransferType
        let fee: Double
        let timestamp: Date
    }
}

// MARK: - Balance Response

struct ShadowWireBalanceResponse: Codable {
    let walletAddress: String
    let token: String
    let balance: Double
    let timestamp: String
}

// MARK: - Fee Response

struct ShadowWireFeeResponse: Codable {
    let token: String
    let feePercentage: Double
    let minimumAmount: Double
    let breakdown: FeeBreakdown?

    struct FeeBreakdown: Codable {
        let amount: Double
        let feePercentage: Double
        let feeAmount: Double
        let netAmount: Double
        let minimumAmount: Double
    }
}

// MARK: - Supported Tokens Response

struct ShadowWireTokensResponse: Codable {
    let tokens: [TokenInfo]
    let count: Int

    struct TokenInfo: Codable {
        let symbol: String
        let decimals: Int
        let fee: Double
    }
}

// MARK: - Deposit Request

struct ShadowWireDepositRequest: Codable {
    let wallet: String
    let amount: Int  // In lamports
}

// MARK: - Deposit Response

struct ShadowWireDepositResponse: Codable {
    let success: Bool
    let txHash: String
    let wallet: String
    let amount: Int
    let timestamp: String
}

// MARK: - Withdraw Request

struct ShadowWireWithdrawRequest: Codable {
    let wallet: String
    let amount: Int  // In lamports
}

// MARK: - Withdraw Response

struct ShadowWireWithdrawResponse: Codable {
    let success: Bool
    let txHash: String
    let wallet: String
    let amount: Int
    let timestamp: String
}

// MARK: - Error Response

struct ShadowWireErrorResponse: Codable {
    let error: String
    let message: String
}

// MARK: - ShadowWire Errors

enum ShadowWireError: LocalizedError {
    case invalidAddress
    case recipientNotFound
    case insufficientBalance
    case transferFailed(String)
    case networkError(Error)
    case decodingError
    case missingWallet
    case invalidAmount
    case apiError(String)

    var errorDescription: String? {
        switch self {
        case .invalidAddress:
            return "Invalid Solana wallet address"
        case .recipientNotFound:
            return "Recipient wallet not found in ShadowWire network"
        case .insufficientBalance:
            return "Insufficient balance for transfer including fees"
        case .transferFailed(let message):
            return "Transfer failed: \(message)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError:
            return "Failed to decode response from server"
        case .missingWallet:
            return "No wallet connected"
        case .invalidAmount:
            return "Invalid transfer amount"
        case .apiError(let message):
            return "API error: \(message)"
        }
    }
}
