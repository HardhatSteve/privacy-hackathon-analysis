import Foundation

// MARK: - Swap Suggestion

/// Represents a token the user can swap to fulfill a payment
struct SwapSuggestion: Identifiable, Codable, Hashable {
    let fromToken: String           // Token to swap from (e.g., "SOL")
    let fromAmount: Double          // Amount needed to swap
    let toToken: String             // Token to receive (e.g., "USDC")
    let toAmount: Double            // Expected output amount
    let estimatedFee: Double        // Swap fee estimate
    let userBalance: Double         // User's balance of fromToken
    let isRecommended: Bool         // Whether this is the optimal choice
    let priority: Int               // 1 = highest priority

    var id: String {
        "\(fromToken)-\(toToken)-\(fromAmount)"
    }

    /// Check if user has enough balance to execute this swap
    var canExecute: Bool {
        userBalance >= fromAmount
    }

    /// Shortfall amount if user doesn't have enough
    var shortfall: Double {
        max(0, fromAmount - userBalance)
    }
}

// MARK: - Swap and Pay Request

/// Request to execute combined swap and payment
struct SwapAndPayRequest: Codable {
    // Swap parameters
    let fromToken: String
    let fromChain: String
    let swapAmount: String
    let evmAddress: String
    let entropy: String

    // Payment parameters
    let paymentToken: String
    let paymentAmount: Double
    let recipientHandle: String
    let paymentType: String         // "internal" or "external"
    let paymentRequestId: String?

    // Auth
    let senderWallet: String
    let walletId: String
}

// MARK: - Swap and Pay Response

struct SwapAndPayResponse: Codable {
    let success: Bool
    let swapResult: SwapResult?
    let paymentResult: PaymentResult?
    let error: SwapAndPayErrorInfo?

    struct SwapResult: Codable {
        let orderId: String
        let amountSwapped: String
        let amountReceived: String
        let signature: String?
    }

    struct PaymentResult: Codable {
        let signature: String
        let amount: Double
        let token: String
        let type: String
        let recipientHandle: String
    }

    struct SwapAndPayErrorInfo: Codable {
        let stage: String           // "swap" or "payment"
        let code: String
        let message: String
        let swapCompleted: Bool?    // True if swap succeeded but payment failed
    }
}

// MARK: - Swap and Pay Result (iOS)

/// Result type for iOS swap-and-pay operations
enum SwapAndPayResult {
    case success(swapSignature: String?, paymentSignature: String)
    case swapSucceededPaymentFailed(swapSignature: String?, error: Error)
    case failed(error: Error)

    var isSuccess: Bool {
        if case .success = self { return true }
        return false
    }

    var swapCompleted: Bool {
        switch self {
        case .success, .swapSucceededPaymentFailed:
            return true
        case .failed:
            return false
        }
    }
}

// MARK: - Auto Swap Pay State

/// State machine for the AutoSwapPayView
enum AutoSwapPayState: Equatable {
    case loadingBalances
    case noTokensAvailable
    case selectingSource(suggestions: [SwapSuggestion])
    case loadingQuote
    case confirmingSwap(quote: SwapQuoteDetails)
    case executingSwap(progress: Double, message: String)
    case executingPayment(progress: Double, message: String)
    case completed(result: CompletedResult)
    case failed(error: AutoSwapPayError)

    struct SwapQuoteDetails: Equatable {
        let fromToken: String
        let fromAmount: Double
        let toToken: String
        let toAmount: Double
        let swapFee: Double
        let paymentFee: Double
        let totalCost: Double
        let expiresAt: Date?
    }

    struct CompletedResult: Equatable {
        let swapSignature: String?
        let paymentSignature: String
        let amountPaid: Double
        let token: String
    }
}

// MARK: - Auto Swap Pay Error

enum AutoSwapPayError: Error, Equatable {
    case noTokensToSwap
    case insufficientBalance(token: String, needed: Double, available: Double)
    case swapQuoteFailed(String)
    case swapExecutionFailed(String)
    case paymentFailed(String, swapCompleted: Bool)
    case networkError(String)
    case walletNotConnected
    case recipientNotFound(String)
    case cancelled

    var localizedDescription: String {
        switch self {
        case .noTokensToSwap:
            return "You don't have any tokens available to swap. Please deposit funds first."
        case .insufficientBalance(let token, let needed, let available):
            return "Insufficient \(token) balance. Need \(String(format: "%.4f", needed)), have \(String(format: "%.4f", available))."
        case .swapQuoteFailed(let message):
            return "Failed to get swap quote: \(message)"
        case .swapExecutionFailed(let message):
            return "Swap failed: \(message)"
        case .paymentFailed(let message, let swapCompleted):
            if swapCompleted {
                return "Swap completed but payment failed: \(message). You can retry the payment."
            }
            return "Payment failed: \(message)"
        case .networkError(let message):
            return "Network error: \(message)"
        case .walletNotConnected:
            return "Wallet not connected. Please connect your wallet first."
        case .recipientNotFound(let handle):
            return "Could not find recipient @\(handle)"
        case .cancelled:
            return "Operation was cancelled."
        }
    }

    var canRetryPayment: Bool {
        if case .paymentFailed(_, let swapCompleted) = self {
            return swapCompleted
        }
        return false
    }
}

// MARK: - Payment Flow Result

/// Result passed back from PaymentFlowCoordinator
enum PaymentFlowResult {
    case directPayment(ShadowWireTransferResponse.TransferDetails)
    case swapAndPay(SwapAndPayResult)
    case cancelled
}

// MARK: - Swap Suggestions Response (from backend)

struct SwapSuggestionsResponse: Codable {
    let suggestions: [SwapSuggestion]
    let targetToken: String
    let targetAmount: Double
}
