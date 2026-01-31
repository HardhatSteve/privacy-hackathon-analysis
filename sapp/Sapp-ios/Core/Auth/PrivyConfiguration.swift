import Foundation

// MARK: - Privy Configuration

/// Configuration for Privy SDK initialization
/// Mirrors the React Native PrivyClientConfig pattern from PRIVY_REF.md
struct PrivyConfiguration {

    // MARK: - Core Properties

    /// Privy application ID
    let appId: String

    /// Privy client ID for this platform
    let clientId: String

    /// API base URL for server wallet operations
    let apiBaseURL: String

    // MARK: - Embedded Wallet Configuration

    /// Configuration for embedded wallet behavior
    let embeddedWallets: EmbeddedWalletConfig

    // MARK: - Login Configuration

    /// Allowed login methods
    let loginMethods: [LoginMethod]

    // MARK: - Network Configuration

    /// Solana cluster for transactions
    let solanaCluster: AppSolanaCluster

    // MARK: - Initialization

    init(
        appId: String,
        clientId: String,
        apiBaseURL: String,
        embeddedWallets: EmbeddedWalletConfig = .default,
        loginMethods: [LoginMethod] = [.email, .sms],
        solanaCluster: AppSolanaCluster = .devnet
    ) {
        self.appId = appId
        self.clientId = clientId
        self.apiBaseURL = apiBaseURL
        self.embeddedWallets = embeddedWallets
        self.loginMethods = loginMethods
        self.solanaCluster = solanaCluster
    }

    // MARK: - Factory Methods

    /// Create configuration from AppConfig
    static func fromAppConfig() -> PrivyConfiguration {
        PrivyConfiguration(
            appId: AppConfig.privyAppId,
            clientId: AppConfig.privyAppClientId,
            apiBaseURL: AppConfig.sappAPIURL,
            embeddedWallets: .default,
            loginMethods: [.email, .sms],
            solanaCluster: Self.currentCluster
        )
    }

    /// Current Solana cluster based on build configuration
    static var currentCluster: AppSolanaCluster {
        #if DEBUG
        return .devnet
        #else
        return .mainnetBeta
        #endif
    }

    // MARK: - Validation

    /// Validate the configuration
    var validationErrors: [String] {
        var errors: [String] = []

        if appId.isEmpty {
            errors.append("PRIVY_APP_ID is not configured")
        }
        if clientId.isEmpty {
            errors.append("PRIVY_APP_CLIENT_ID is not configured")
        }
        if apiBaseURL.isEmpty {
            errors.append("SAPP_API_URL is not configured")
        }
        if loginMethods.isEmpty {
            errors.append("At least one login method must be configured")
        }

        return errors
    }

    var isValid: Bool {
        validationErrors.isEmpty
    }
}

// MARK: - Embedded Wallet Configuration

/// Configuration for embedded wallet creation
/// Based on PRIVY_REF.md embeddedWallets config
struct EmbeddedWalletConfig: Equatable {

    /// When to create wallets for users
    let createOnLogin: WalletCreationPolicy

    /// Whether users need to set a password when creating wallets
    let requireUserPasswordOnCreate: Bool

    /// Whether to show wallet UI components
    let showWalletUIs: Bool

    /// Whether to prefer server-side wallets over embedded
    let preferServerWallets: Bool

    /// Default configuration
    static let `default` = EmbeddedWalletConfig(
        createOnLogin: .usersWithoutWallets,
        requireUserPasswordOnCreate: false,
        showWalletUIs: true,
        preferServerWallets: false
    )

    /// Server-first configuration
    static let serverFirst = EmbeddedWalletConfig(
        createOnLogin: .never,
        requireUserPasswordOnCreate: false,
        showWalletUIs: false,
        preferServerWallets: true
    )
}

/// Policy for automatic wallet creation on login
enum WalletCreationPolicy: String, Equatable {
    /// Create wallets only for users who don't have one
    case usersWithoutWallets = "users-without-wallets"

    /// Always create wallets on login
    case allUsers = "all-users"

    /// Never auto-create wallets
    case never = "off"
}

// MARK: - Solana Cluster

/// Solana network cluster
enum AppSolanaCluster: String, Equatable {
    case mainnetBeta = "mainnet-beta"
    case devnet = "devnet"
    case testnet = "testnet"

    var rpcURL: String {
        switch self {
        case .mainnetBeta:
            return "https://api.mainnet-beta.solana.com"
        case .devnet:
            return "https://api.devnet.solana.com"
        case .testnet:
            return "https://api.testnet.solana.com"
        }
    }

    var displayName: String {
        switch self {
        case .mainnetBeta: return "Mainnet"
        case .devnet: return "Devnet"
        case .testnet: return "Testnet"
        }
    }

    var isProduction: Bool {
        self == .mainnetBeta
    }
}

// MARK: - Ethereum Chain

/// Ethereum chain configuration
enum EthereumChain: Int, Equatable {
    case mainnet = 1
    case sepolia = 11155111
    case base = 8453
    case baseSepolia = 84532

    var chainId: Int { rawValue }

    var name: String {
        switch self {
        case .mainnet: return "Ethereum Mainnet"
        case .sepolia: return "Sepolia Testnet"
        case .base: return "Base"
        case .baseSepolia: return "Base Sepolia"
        }
    }

    var rpcURL: String {
        switch self {
        case .mainnet:
            return "https://eth.llamarpc.com"
        case .sepolia:
            return "https://rpc.sepolia.org"
        case .base:
            return "https://mainnet.base.org"
        case .baseSepolia:
            return "https://sepolia.base.org"
        }
    }

    var isTestnet: Bool {
        switch self {
        case .mainnet, .base:
            return false
        case .sepolia, .baseSepolia:
            return true
        }
    }

    /// CAIP-2 chain identifier
    var caip2: String {
        "eip155:\(chainId)"
    }

    /// Current chain based on build configuration
    static var current: EthereumChain {
        #if DEBUG
        return .sepolia
        #else
        return .mainnet
        #endif
    }
}
