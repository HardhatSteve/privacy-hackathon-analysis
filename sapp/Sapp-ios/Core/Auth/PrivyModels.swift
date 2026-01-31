import Foundation

// MARK: - Linked Account Type

/// Types of linked accounts supported by Privy
enum LinkedAccountType: String, Equatable {
    case phone
    case email
    case wallet
    case apple
    case google
    case twitter
    case discord
    case github
    case farcaster
    case unknown

    var displayName: String {
        switch self {
        case .phone: return "Phone"
        case .email: return "Email"
        case .wallet: return "Wallet"
        case .apple: return "Apple"
        case .google: return "Google"
        case .twitter: return "Twitter"
        case .discord: return "Discord"
        case .github: return "GitHub"
        case .farcaster: return "Farcaster"
        case .unknown: return "Unknown"
        }
    }
}

// MARK: - Linked Account

/// Represents a linked account (email, phone, wallet, social)
struct LinkedAccount: Equatable, Identifiable {
    let id: String
    let type: LinkedAccountType
    let identifier: String
    let verifiedAt: Date?

    init(type: LinkedAccountType, identifier: String, verifiedAt: Date? = nil) {
        self.id = "\(type.rawValue):\(identifier)"
        self.type = type
        self.identifier = identifier
        self.verifiedAt = verifiedAt
    }
}

// MARK: - Sapp User

/// Application-level user model
struct SappUser: Equatable, Identifiable {
    let id: String
    let createdAt: Date
    let linkedAccounts: [LinkedAccount]

    /// User's email from linked accounts
    var email: String? {
        linkedAccounts.first { $0.type == .email }?.identifier
    }

    /// User's phone number from linked accounts
    var phone: String? {
        linkedAccounts.first { $0.type == .phone }?.identifier
    }

    /// User's primary wallet address from linked accounts
    var walletAddress: String? {
        linkedAccounts.first { $0.type == .wallet }?.identifier
    }

    /// All wallet addresses from linked accounts
    var walletAddresses: [String] {
        linkedAccounts.filter { $0.type == .wallet }.compactMap { $0.identifier }
    }
}

// MARK: - Sapp Authentication State

/// Application-level authentication state
enum SappAuthState: Equatable {
    case notReady
    case unauthenticated
    case authenticated(SappUser)
    case error(String)

    var isAuthenticated: Bool {
        if case .authenticated = self { return true }
        return false
    }

    var isReady: Bool {
        switch self {
        case .notReady:
            return false
        default:
            return true
        }
    }
}

// MARK: - OTP State

/// Tracks the state of OTP verification flow
enum OTPState: Equatable {
    case idle
    case sending
    case sent(to: String, expiresAt: Date?)
    case verifying
    case verified
    case failed(String)

    var isSending: Bool {
        if case .sending = self { return true }
        return false
    }

    var isVerifying: Bool {
        if case .verifying = self { return true }
        return false
    }

    var isLoading: Bool {
        isSending || isVerifying
    }

    var destination: String? {
        if case .sent(let to, _) = self { return to }
        return nil
    }
}

// MARK: - Login Method

/// Supported login methods
enum LoginMethod: String, CaseIterable, Identifiable {
    case email
    case sms
    case apple
    case google

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .email: return "Email"
        case .sms: return "Phone"
        case .apple: return "Apple"
        case .google: return "Google"
        }
    }

    var iconName: String {
        switch self {
        case .email: return "envelope.fill"
        case .sms: return "phone.fill"
        case .apple: return "apple.logo"
        case .google: return "g.circle.fill"
        }
    }
}

// MARK: - MFA Configuration

/// Multi-factor authentication configuration
struct MFAConfiguration {
    let isEnabled: Bool
    let requiredMethods: [MFAMethod]
    let availableMethods: [MFAMethod]

    static let disabled = MFAConfiguration(
        isEnabled: false,
        requiredMethods: [],
        availableMethods: []
    )
}

/// MFA method types
enum MFAMethod: String, Equatable {
    case totp        // Time-based OTP (authenticator app)
    case sms         // SMS verification
    case passkey     // WebAuthn/Passkey
    case recoveryCode // Recovery codes

    var displayName: String {
        switch self {
        case .totp: return "Authenticator App"
        case .sms: return "SMS"
        case .passkey: return "Passkey"
        case .recoveryCode: return "Recovery Code"
        }
    }
}

// MARK: - Session Info

/// Information about the current session
struct SessionInfo: Equatable {
    let userId: String
    let isActive: Bool
    let createdAt: Date
    let expiresAt: Date?

    var isExpired: Bool {
        guard let expiresAt else { return false }
        return Date() > expiresAt
    }

    var timeUntilExpiration: TimeInterval? {
        guard let expiresAt else { return nil }
        return expiresAt.timeIntervalSinceNow
    }
}
