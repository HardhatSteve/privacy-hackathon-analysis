import Foundation
import Combine

// MARK: - Swap And Pay Service

/// Service to orchestrate combined swap and payment operations
/// Used when user needs to swap tokens to fulfill a payment request
@MainActor
final class SwapAndPayService: ObservableObject {

    // MARK: - Singleton

    static let shared = SwapAndPayService()

    // MARK: - Published State

    @Published private(set) var state: AutoSwapPayState = .loadingBalances
    @Published private(set) var isExecuting = false

    // MARK: - Private Properties

    private let silentSwapService: SilentSwapService
    private let shadowWireService: ShadowWireService
    private let solanaService: SolanaWalletService
    private let baseURL: String
    private let urlSession: URLSession

    // MARK: - Initialization

    private init() {
        self.silentSwapService = SilentSwapService.shared
        self.shadowWireService = ShadowWireService.shared
        self.solanaService = SolanaWalletService()
        self.baseURL = AppConfig.sappAPIURL

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60
        config.timeoutIntervalForResource = 120
        self.urlSession = URLSession(configuration: config)

        print("[SwapAndPayService] Initialized")
    }

    // MARK: - Public Methods

    /// Check if user needs to swap to fulfill payment
    func checkNeedsSwap(targetToken: String, targetAmount: Double) async throws -> Bool {
        let balance = try await getUserBalance(token: targetToken)
        let feeInfo = shadowWireService.calculateFee(amount: targetAmount, token: targetToken)
        let totalNeeded = feeInfo.netAmount + feeInfo.fee
        return balance < totalNeeded
    }

    /// Get user's balance for a specific token
    func getUserBalance(token: String) async throws -> Double {
        guard let walletAddress = PrivyAuthService.shared.solanaWalletAddress else {
            throw AutoSwapPayError.walletNotConnected
        }

        if token == "SOL" {
            return try await fetchSOLBalance(for: walletAddress)
        } else {
            let tokenBalances = try await solanaService.getAllTokenBalances()
            return tokenBalances.first { $0.symbol == token }?.balance ?? 0
        }
    }

    /// Get swap suggestions for fulfilling a payment
    func getSwapSuggestions(targetToken: String, targetAmount: Double) async throws -> [SwapSuggestion] {
        state = .loadingBalances

        guard let walletAddress = PrivyAuthService.shared.solanaWalletAddress else {
            state = .failed(error: .walletNotConnected)
            throw AutoSwapPayError.walletNotConnected
        }

        // Get all user balances
        let solBalance = try await fetchSOLBalance(for: walletAddress)
        let splBalances = try await solanaService.getAllTokenBalances()

        // Calculate how much target token is needed (including fees)
        let feeInfo = shadowWireService.calculateFee(amount: targetAmount, token: targetToken)
        let totalNeeded = feeInfo.netAmount + feeInfo.fee

        // Check if user already has enough of target token
        let currentBalance: Double
        if targetToken == "SOL" {
            currentBalance = solBalance
        } else {
            currentBalance = splBalances.first { $0.symbol == targetToken }?.balance ?? 0
        }

        if currentBalance >= totalNeeded {
            // User has enough, no swap needed
            print("[SwapAndPayService] User has sufficient \(targetToken) balance")
            return []
        }

        // Build suggestions from available tokens
        var suggestions: [SwapSuggestion] = []
        var priority = 1

        // Add SOL as a suggestion if user has SOL and target is not SOL
        if targetToken != "SOL" && solBalance > 0.01 { // Keep some SOL for gas
            let estimatedFromAmount = await estimateSwapAmount(
                fromToken: "SOL",
                toToken: targetToken,
                toAmount: targetAmount
            )

            if estimatedFromAmount > 0 {
                suggestions.append(SwapSuggestion(
                    fromToken: "SOL",
                    fromAmount: estimatedFromAmount,
                    toToken: targetToken,
                    toAmount: targetAmount,
                    estimatedFee: 0.5, // Approximate swap fee in USD
                    userBalance: solBalance,
                    isRecommended: priority == 1,
                    priority: priority
                ))
                priority += 1
            }
        }

        // Add SPL tokens as suggestions
        for spl in splBalances where spl.balance > 0 && spl.symbol != targetToken {
            // Skip tokens with very low balances
            guard spl.balance > 0.0001 else { continue }

            // For stablecoins, prioritize them
            let isStablecoin = spl.symbol == "USDC" || spl.symbol == "USDT"

            let estimatedFromAmount = await estimateSwapAmount(
                fromToken: spl.symbol,
                toToken: targetToken,
                toAmount: targetAmount
            )

            if estimatedFromAmount > 0 && spl.balance >= estimatedFromAmount {
                let suggestionPriority = isStablecoin ? 1 : priority

                suggestions.append(SwapSuggestion(
                    fromToken: spl.symbol,
                    fromAmount: estimatedFromAmount,
                    toToken: targetToken,
                    toAmount: targetAmount,
                    estimatedFee: 0.5,
                    userBalance: spl.balance,
                    isRecommended: suggestionPriority == 1,
                    priority: suggestionPriority
                ))

                if !isStablecoin {
                    priority += 1
                }
            }
        }

        // Sort by priority
        suggestions.sort { $0.priority < $1.priority }

        // Update state
        if suggestions.isEmpty {
            state = .noTokensAvailable
        } else {
            // Mark the first one as recommended
            if var first = suggestions.first {
                suggestions[0] = SwapSuggestion(
                    fromToken: first.fromToken,
                    fromAmount: first.fromAmount,
                    toToken: first.toToken,
                    toAmount: first.toAmount,
                    estimatedFee: first.estimatedFee,
                    userBalance: first.userBalance,
                    isRecommended: true,
                    priority: first.priority
                )
            }
            state = .selectingSource(suggestions: suggestions)
        }

        return suggestions
    }

    /// Execute combined swap and payment
    func executeSwapAndPay(
        fromToken: String,
        fromAmount: Double,
        paymentRequest: PaymentRequestData
    ) async throws -> SwapAndPayResult {
        isExecuting = true
        defer { isExecuting = false }

        // Step 1: Execute swap
        state = .executingSwap(progress: 0.1, message: "Preparing swap...")

        var swapSignature: String?

        do {
            // Get swap quote
            state = .executingSwap(progress: 0.2, message: "Getting swap quote...")

            guard let solanaAddress = PrivyAuthService.shared.solanaWalletAddress else {
                throw AutoSwapPayError.walletNotConnected
            }

            // Load supported tokens if needed
            if silentSwapService.supportedTokens.isEmpty {
                try await silentSwapService.loadSupportedTokens()
            }

            // Find tokens
            guard let fromSwapToken = findToken(symbol: fromToken, chain: .solana),
                  let toSwapToken = findToken(symbol: paymentRequest.token, chain: .solana) else {
                throw AutoSwapPayError.swapQuoteFailed("Unsupported token pair")
            }

            // Get quote
            let quote = try await silentSwapService.getQuote(
                fromToken: fromSwapToken,
                toToken: toSwapToken,
                amount: fromAmount,
                recipientAddress: solanaAddress, // Swap to self first
                senderAddress: solanaAddress
            )

            state = .executingSwap(progress: 0.4, message: "Executing swap...")

            // Execute swap
            let swapResult = try await silentSwapService.executeSwap(quoteResponse: quote)
            swapSignature = swapResult.orderId

            state = .executingSwap(progress: 0.6, message: "Waiting for swap confirmation...")

            // Wait for swap to complete (poll status)
            try await waitForSwapCompletion(orderId: swapResult.orderId)

            state = .executingSwap(progress: 0.8, message: "Swap complete!")

        } catch {
            state = .failed(error: .swapExecutionFailed(error.localizedDescription))
            return .failed(error: error)
        }

        // Step 2: Execute payment
        state = .executingPayment(progress: 0.1, message: "Preparing payment...")

        do {
            state = .executingPayment(progress: 0.3, message: "Sending payment...")

            let transferDetails = try await shadowWireService.transferToHandle(
                handle: paymentRequest.requesterId,
                amount: paymentRequest.amount,
                token: paymentRequest.token,
                type: .internal // Use private transfer
            )

            state = .executingPayment(progress: 1.0, message: "Payment complete!")

            // Update state to completed
            state = .completed(result: AutoSwapPayState.CompletedResult(
                swapSignature: swapSignature,
                paymentSignature: transferDetails.signature,
                amountPaid: paymentRequest.amount,
                token: paymentRequest.token
            ))

            return .success(swapSignature: swapSignature, paymentSignature: transferDetails.signature)

        } catch {
            // Swap succeeded but payment failed
            state = .failed(error: .paymentFailed(error.localizedDescription, swapCompleted: true))
            return .swapSucceededPaymentFailed(swapSignature: swapSignature, error: error)
        }
    }

    /// Retry payment after a failed payment (when swap already succeeded)
    func retryPayment(paymentRequest: PaymentRequestData) async throws -> SwapAndPayResult {
        isExecuting = true
        defer { isExecuting = false }

        state = .executingPayment(progress: 0.3, message: "Retrying payment...")

        do {
            let transferDetails = try await shadowWireService.transferToHandle(
                handle: paymentRequest.requesterId,
                amount: paymentRequest.amount,
                token: paymentRequest.token,
                type: .internal
            )

            state = .completed(result: AutoSwapPayState.CompletedResult(
                swapSignature: nil,
                paymentSignature: transferDetails.signature,
                amountPaid: paymentRequest.amount,
                token: paymentRequest.token
            ))

            return .success(swapSignature: nil, paymentSignature: transferDetails.signature)

        } catch {
            state = .failed(error: .paymentFailed(error.localizedDescription, swapCompleted: true))
            throw error
        }
    }

    /// Reset service state
    func reset() {
        state = .loadingBalances
        isExecuting = false
    }

    // MARK: - Private Methods

    private func fetchSOLBalance(for publicKey: String) async throws -> Double {
        let rpcURL = PrivyConfiguration.currentCluster.rpcURL
        guard let url = URL(string: rpcURL) else {
            throw AutoSwapPayError.networkError("Invalid RPC URL")
        }

        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getBalance",
            "params": [publicKey]
        ]

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, _) = try await urlSession.data(for: request)

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let result = json["result"] as? [String: Any],
              let lamports = result["value"] as? UInt64 else {
            return 0
        }

        return Double(lamports) / 1_000_000_000.0
    }

    private func estimateSwapAmount(fromToken: String, toToken: String, toAmount: Double) async -> Double {
        // Try to get actual quote from swap service for accurate pricing
        do {
            guard let solanaAddress = PrivyAuthService.shared.solanaWalletAddress else {
                return fallbackEstimate(fromToken: fromToken, toToken: toToken, toAmount: toAmount)
            }

            // Load supported tokens if needed
            if silentSwapService.supportedTokens.isEmpty {
                try await silentSwapService.loadSupportedTokens()
            }

            guard let fromSwapToken = findToken(symbol: fromToken, chain: .solana),
                  let toSwapToken = findToken(symbol: toToken, chain: .solana) else {
                return fallbackEstimate(fromToken: fromToken, toToken: toToken, toAmount: toAmount)
            }

            // Use a small test amount to get the exchange rate, then scale
            let testAmount = 1.0
            let quote = try await silentSwapService.getQuote(
                fromToken: fromSwapToken,
                toToken: toSwapToken,
                amount: testAmount,
                recipientAddress: solanaAddress,
                senderAddress: solanaAddress
            )

            // Calculate exchange rate from quote
            if let outputAmount = Double(quote.estimatedOutput), outputAmount > 0 {
                let rate = outputAmount / testAmount
                let estimatedInput = (toAmount / rate) * 1.02 // Add 2% buffer for slippage
                print("[SwapAndPayService] Dynamic estimate: \(estimatedInput) \(fromToken) for \(toAmount) \(toToken) (rate: \(rate))")
                return estimatedInput
            }
        } catch {
            print("[SwapAndPayService] Failed to get dynamic quote, using fallback: \(error.localizedDescription)")
        }

        return fallbackEstimate(fromToken: fromToken, toToken: toToken, toAmount: toAmount)
    }

    /// Fallback estimation when quote API is unavailable
    private func fallbackEstimate(fromToken: String, toToken: String, toAmount: Double) -> Double {
        // Stablecoin swaps have minimal slippage
        if (fromToken == "USDC" || fromToken == "USDT") && (toToken == "USDC" || toToken == "USDT") {
            return toAmount * 1.001
        }

        // For other pairs, use a conservative 15% buffer
        // This is only a fallback - the quote API should be used for accuracy
        print("[SwapAndPayService] Using fallback estimate for \(fromToken) -> \(toToken)")
        return toAmount * 1.15
    }

    private func findToken(symbol: String, chain: BlockchainType) -> SilentSwapToken? {
        let tokens = silentSwapService.getTokens(for: chain)
        return tokens.first { $0.symbol == symbol }
    }

    private func waitForSwapCompletion(orderId: String, maxAttempts: Int = 60) async throws {
        for attempt in 1...maxAttempts {
            let status = try await silentSwapService.getSwapStatus(orderId: orderId)

            switch status.status {
            case .completed:
                print("[SwapAndPayService] Swap completed on attempt \(attempt)")
                return
            case .failed:
                throw AutoSwapPayError.swapExecutionFailed(status.error ?? "Swap failed")
            case .pending, .processing:
                // Update progress
                let progress = 0.6 + (Double(attempt) / Double(maxAttempts)) * 0.2
                state = .executingSwap(progress: progress, message: "Waiting for confirmation...")

                // Wait before next check
                try await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds
            }
        }

        // Timeout
        throw AutoSwapPayError.swapExecutionFailed("Swap timed out waiting for confirmation")
    }
}
