import Foundation
import Combine

/// ShadowWire Service - High-level business logic for private transfers
/// This service orchestrates the ShadowWire API with wallet management
@MainActor
final class ShadowWireService: ObservableObject {
    // MARK: - Shared Instance

    static let shared = ShadowWireService()

    // MARK: - Published Properties

    @Published var isLoading = false
    @Published var lastError: ShadowWireError?

    // MARK: - Private Properties

    private let api: ShadowWireAPI
    private let privyAuthService: PrivyAuthService

    // MARK: - Initialization

    private init() {
        self.api = ShadowWireAPI()
        self.privyAuthService = PrivyAuthService.shared
    }

    // MARK: - Balance Operations

    /// Get ShadowWire balance for current user's wallet
    func getBalance(token: String = "SOL") async throws -> Double {
        guard let walletAddress = try await getCurrentWalletAddress() else {
            throw ShadowWireError.missingWallet
        }

        return try await getBalance(walletAddress: walletAddress, token: token)
    }

    /// Get ShadowWire balance for a specific wallet address
    func getBalance(walletAddress: String, token: String = "SOL") async throws -> Double {
        isLoading = true
        defer { isLoading = false }

        do {
            let response = try await api.getBalance(walletAddress: walletAddress, token: token)
            return response.balance
        } catch {
            lastError = error as? ShadowWireError ?? .networkError(error)
            throw lastError!
        }
    }

    // MARK: - Transfer Operations

    /// Execute a ShadowWire transfer to a wallet address
    func transfer(
        to recipientWallet: String,
        amount: Double,
        token: String = "SOL",
        type: ShadowWireTransferType = .internal
    ) async throws -> ShadowWireTransferResponse.TransferDetails {
        guard let senderWallet = try await getCurrentWalletAddress() else {
            throw ShadowWireError.missingWallet
        }

        // Validate amount
        guard ShadowWireTokens.isValidAmount(amount, token: token) else {
            throw ShadowWireError.invalidAmount
        }

        isLoading = true
        defer { isLoading = false }

        // Create transfer request
        let request = ShadowWireTransferRequest(
            senderWallet: senderWallet,
            recipientWallet: recipientWallet,
            amount: amount,
            token: token,
            type: type,
            signature: nil  // Signature handled by ShadowWire SDK on backend
        )

        do {
            let response = try await api.transfer(request: request)
            return response.transfer
        } catch {
            lastError = error as? ShadowWireError ?? .networkError(error)
            throw lastError!
        }
    }

    /// Execute a ShadowWire transfer to a Sapp user by handle
    func transferToHandle(
        handle: String,
        amount: Double,
        token: String = "SOL",
        type: ShadowWireTransferType = .internal
    ) async throws -> ShadowWireTransferToHandleResponse.TransferDetails {
        guard let senderWallet = try await getCurrentWalletAddress() else {
            throw ShadowWireError.missingWallet
        }

        // Validate amount
        guard ShadowWireTokens.isValidAmount(amount, token: token) else {
            throw ShadowWireError.invalidAmount
        }

        isLoading = true
        defer { isLoading = false }

        // Create transfer request
        let request = ShadowWireTransferToHandleRequest(
            senderWallet: senderWallet,
            recipientHandle: handle,
            amount: amount,
            token: token,
            type: type,
            signature: nil
        )

        do {
            let response = try await api.transferToHandle(request: request)
            return response.transfer
        } catch {
            lastError = error as? ShadowWireError ?? .networkError(error)
            throw lastError!
        }
    }

    // MARK: - Fee Calculations

    /// Get fee information for a token
    func getFeeInfo(token: String, amount: Double? = nil) async throws -> ShadowWireFeeResponse {
        do {
            return try await api.getFeeInfo(token: token, amount: amount)
        } catch {
            lastError = error as? ShadowWireError ?? .networkError(error)
            throw lastError!
        }
    }

    /// Calculate fee breakdown locally (faster, no network call)
    func calculateFee(amount: Double, token: String) -> (fee: Double, netAmount: Double, feePercentage: Double) {
        let (fee, netAmount) = ShadowWireTokens.calculateFee(amount, token: token)
        let tokenInfo = ShadowWireTokens.token(for: token)
        return (fee: fee, netAmount: netAmount, feePercentage: tokenInfo?.feePercentage ?? 1.0)
    }

    /// Get minimum amount for a token
    func minimumAmount(for token: String) -> Double {
        return ShadowWireTokens.minimumAmount(for: token)
    }

    // MARK: - Token Information

    /// Get list of all supported tokens
    func getSupportedTokens() async throws -> [ShadowWireTokensResponse.TokenInfo] {
        do {
            let response = try await api.getSupportedTokens()
            return response.tokens
        } catch {
            lastError = error as? ShadowWireError ?? .networkError(error)
            throw lastError!
        }
    }

    /// Get list of popular tokens (for UI picker)
    func getPopularTokens() -> [String] {
        return ["SOL", "USDC", "BONK", "RADR"]
    }

    // MARK: - Deposit/Withdraw

    /// Deposit funds into ShadowWire pool
    func deposit(amount: UInt64) async throws -> ShadowWireDepositResponse {
        guard let walletAddress = try await getCurrentWalletAddress() else {
            throw ShadowWireError.missingWallet
        }

        isLoading = true
        defer { isLoading = false }

        let request = ShadowWireDepositRequest(wallet: walletAddress, amount: Int(amount))

        do {
            return try await api.deposit(request: request)
        } catch {
            lastError = error as? ShadowWireError ?? .networkError(error)
            throw lastError!
        }
    }

    /// Withdraw funds from ShadowWire pool
    func withdraw(amount: UInt64) async throws -> ShadowWireWithdrawResponse {
        guard let walletAddress = try await getCurrentWalletAddress() else {
            throw ShadowWireError.missingWallet
        }

        isLoading = true
        defer { isLoading = false }

        let request = ShadowWireWithdrawRequest(wallet: walletAddress, amount: Int(amount))

        do {
            return try await api.withdraw(request: request)
        } catch {
            lastError = error as? ShadowWireError ?? .networkError(error)
            throw lastError!
        }
    }

    // MARK: - Validation

    /// Validate Solana wallet address
    func isValidAddress(_ address: String) -> Bool {
        // Base58 encoded, 32-44 characters
        let base58Regex = try? NSRegularExpression(pattern: "^[1-9A-HJ-NP-Za-km-z]{32,44}$")
        let range = NSRange(location: 0, length: address.utf16.count)
        return base58Regex?.firstMatch(in: address, range: range) != nil
    }

    /// Validate transfer amount
    func validateTransferAmount(_ amount: Double, token: String) -> Result<Void, ShadowWireError> {
        // Check if amount is positive
        guard amount > 0 else {
            return .failure(.invalidAmount)
        }

        // Check minimum amount
        let minimum = minimumAmount(for: token)
        guard amount >= minimum else {
            return .failure(.invalidAmount)
        }

        return .success(())
    }

    // MARK: - Helpers

    private func getCurrentWalletAddress() async throws -> String? {
        // Get wallet address from Privy auth service
        return privyAuthService.solanaWalletAddress
    }

    /// Format amount for display
    func formatAmount(_ amount: Double, token: String) -> String {
        return ShadowWireTokens.formatAmount(amount, token: token)
    }

    /// Format token symbol with amount
    func formatTokenAmount(_ amount: Double, token: String) -> String {
        return "\(formatAmount(amount, token: token)) \(token)"
    }

    /// Clear last error
    func clearError() {
        lastError = nil
    }
}

// MARK: - Transfer Result Extensions

extension ShadowWireTransferResponse.TransferDetails {
    /// Check if transfer was successful
    var isSuccessful: Bool {
        return success && !signature.isEmpty
    }

    /// Get display amount (handles nil for private transfers)
    var displayAmount: String {
        if let amt = amount {
            return String(format: "%.6f", amt)
        }
        return "PRIVATE"
    }

    /// Check if transfer was private
    var isPrivate: Bool {
        return type == .internal
    }
}

extension ShadowWireTransferToHandleResponse.TransferDetails {
    /// Check if transfer was successful
    var isSuccessful: Bool {
        return success && !signature.isEmpty
    }

    /// Get display amount (handles nil for private transfers)
    var displayAmount: String {
        if let amt = amount {
            return String(format: "%.6f", amt)
        }
        return "PRIVATE"
    }

    /// Check if transfer was private
    var isPrivate: Bool {
        return type == .internal
    }
}
