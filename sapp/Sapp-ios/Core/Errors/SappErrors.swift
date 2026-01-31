import Foundation

// MARK: - Privy Authentication Errors

/// Errors related to Privy authentication
enum PrivyAuthError: Error, LocalizedError, Equatable {
    // Initialization errors
    case notInitialized
    case configurationInvalid([String])

    // Authentication state errors
    case notAuthenticated
    case sessionExpired

    // OTP flow errors
    case noPhoneNumber
    case noEmail
    case sendCodeFailed(String)
    case loginFailed(String)
    case invalidOTP

    // Wallet errors
    case noWallet
    case walletCreationFailed(String)
    case walletNotFound
    case maxWalletsReached

    // Signing errors
    case signatureFailed(String)
    case transactionFailed(String)
    case invalidTransaction

    // MFA errors
    case mfaRequired([String])
    case mfaFailed(String)

    // MARK: - LocalizedError

    var errorDescription: String? {
        switch self {
        case .notInitialized:
            return "Privy SDK not initialized. Check PRIVY_APP_ID and PRIVY_APP_CLIENT_ID."
        case .configurationInvalid(let errors):
            return "Configuration invalid: \(errors.joined(separator: ", "))"
        case .notAuthenticated:
            return "User is not authenticated"
        case .sessionExpired:
            return "Session has expired. Please log in again."
        case .noPhoneNumber:
            return "No phone number provided"
        case .noEmail:
            return "No email address provided"
        case .sendCodeFailed(let message):
            return "Failed to send code: \(message)"
        case .loginFailed(let message):
            return "Login failed: \(message)"
        case .invalidOTP:
            return "Invalid verification code"
        case .noWallet:
            return "No embedded wallet available"
        case .walletCreationFailed(let message):
            return "Failed to create wallet: \(message)"
        case .walletNotFound:
            return "Wallet not found"
        case .maxWalletsReached:
            return "Maximum number of wallets reached"
        case .signatureFailed(let message):
            return "Failed to sign: \(message)"
        case .transactionFailed(let message):
            return "Transaction failed: \(message)"
        case .invalidTransaction:
            return "Invalid transaction format"
        case .mfaRequired(let methods):
            return "MFA required. Available methods: \(methods.joined(separator: ", "))"
        case .mfaFailed(let message):
            return "MFA verification failed: \(message)"
        }
    }

    // MARK: - Equatable

    static func == (lhs: PrivyAuthError, rhs: PrivyAuthError) -> Bool {
        lhs.localizedDescription == rhs.localizedDescription
    }
}

// MARK: - Wallet API Errors

/// Errors from the server-side wallet API
enum WalletAPIError: Error, LocalizedError, Equatable {
    // Configuration errors
    case notConfigured
    case invalidURL

    // Network errors
    case networkError(String)
    case timeout

    // Server errors
    case serverError(String)
    case serverUnavailable

    // Authorization errors
    case missingAccessToken
    case authorizationFailed
    case tokenExpired

    // Wallet errors
    case walletNotFound
    case walletCreationFailed(String)

    // Rate limiting
    case rateLimitExceeded

    // Parsing errors
    case decodingError(String)
    case invalidResponse

    // Unknown
    case unknown(String?)

    // MARK: - Factory Methods

    /// Create error from underlying error
    static func from(_ error: Error) -> WalletAPIError {
        if let walletError = error as? WalletAPIError {
            return walletError
        }
        return .networkError(error.localizedDescription)
    }

    /// Create error from decoding error
    static func from(_ error: DecodingError) -> WalletAPIError {
        switch error {
        case .keyNotFound(let key, _):
            return .decodingError("Missing key: \(key.stringValue)")
        case .typeMismatch(let type, let context):
            return .decodingError("Type mismatch: expected \(type) at \(context.codingPath.map { $0.stringValue }.joined(separator: "."))")
        case .valueNotFound(let type, let context):
            return .decodingError("Value not found: \(type) at \(context.codingPath.map { $0.stringValue }.joined(separator: "."))")
        case .dataCorrupted(let context):
            return .decodingError("Data corrupted: \(context.debugDescription)")
        @unknown default:
            return .decodingError(error.localizedDescription)
        }
    }

    // MARK: - LocalizedError

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "Wallet API not configured"
        case .invalidURL:
            return "Invalid API URL"
        case .networkError(let message):
            return "Network error: \(message)"
        case .timeout:
            return "Request timed out"
        case .serverError(let message):
            return message
        case .serverUnavailable:
            return "Server is temporarily unavailable"
        case .missingAccessToken:
            return "No access token available. Please login first."
        case .authorizationFailed:
            return "Authorization failed. Please login again."
        case .tokenExpired:
            return "Access token expired. Please login again."
        case .walletNotFound:
            return "Wallet not found"
        case .walletCreationFailed(let message):
            return "Failed to create wallet: \(message)"
        case .rateLimitExceeded:
            return "Too many requests. Please try again later."
        case .decodingError(let message):
            return "Failed to parse response: \(message)"
        case .invalidResponse:
            return "Invalid response from server"
        case .unknown(let message):
            return message ?? "An unknown error occurred"
        }
    }

    // MARK: - Equatable

    static func == (lhs: WalletAPIError, rhs: WalletAPIError) -> Bool {
        lhs.localizedDescription == rhs.localizedDescription
    }
}

// MARK: - Transaction Errors

/// Errors related to blockchain transactions
enum TransactionError: Error, LocalizedError {
    case insufficientFunds(required: Double, available: Double, currency: String)
    case invalidRecipient
    case invalidAmount
    case networkCongestion
    case simulationFailed(String)
    case broadcastFailed(String)
    case confirmationTimeout
    case dropped

    var errorDescription: String? {
        switch self {
        case .insufficientFunds(let required, let available, let currency):
            return "Insufficient \(currency). Required: \(required), Available: \(available)"
        case .invalidRecipient:
            return "Invalid recipient address"
        case .invalidAmount:
            return "Invalid amount"
        case .networkCongestion:
            return "Network is congested. Please try again later."
        case .simulationFailed(let message):
            return "Transaction simulation failed: \(message)"
        case .broadcastFailed(let message):
            return "Failed to broadcast transaction: \(message)"
        case .confirmationTimeout:
            return "Transaction confirmation timed out"
        case .dropped:
            return "Transaction was dropped from the network"
        }
    }
}

// MARK: - Biometric Errors

/// Errors related to biometric authentication
enum BiometricError: Error, LocalizedError {
    case notAvailable
    case notEnrolled
    case lockout
    case cancelled
    case failed(String)

    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "Biometric authentication is not available on this device"
        case .notEnrolled:
            return "No biometric data enrolled. Please set up Face ID or Touch ID in Settings."
        case .lockout:
            return "Biometric authentication is locked. Please use your passcode."
        case .cancelled:
            return "Authentication was cancelled"
        case .failed(let message):
            return "Authentication failed: \(message)"
        }
    }
}
