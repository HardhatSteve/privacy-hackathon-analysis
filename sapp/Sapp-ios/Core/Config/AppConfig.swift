import Foundation

/// App configuration that reads from multiple sources:
/// 1. Info.plist (for build-time injected values)
/// 2. Config.plist bundle resource (for development)
/// 3. Environment variables (for Xcode scheme running)
enum AppConfig {

    // MARK: - Privy Configuration

    static var privyAppId: String {
        getValue(for: "PRIVY_APP_ID") ?? ""
    }

    static var privyAppClientId: String {
        getValue(for: "PRIVY_APP_CLIENT_ID") ?? ""
    }

    // MARK: - API Configuration

    static var sappAPIURL: String {
        getValue(for: "SAPP_API_URL") ?? "http://localhost:4002"
    }

    // MARK: - Private Helpers

    private static func getValue(for key: String) -> String? {
        // 1. Try Info.plist first (build-time injection)
        if let value = Bundle.main.object(forInfoDictionaryKey: key) as? String,
           !value.isEmpty,
           !value.hasPrefix("$(") { // Ensure it's not an unexpanded variable
            return value
        }

        // 2. Try bundled Config.plist
        if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let config = NSDictionary(contentsOfFile: configPath),
           let value = config[key] as? String,
           !value.isEmpty {
            return value
        }

        // 3. Fall back to environment variables (works when running from Xcode)
        if let value = ProcessInfo.processInfo.environment[key],
           !value.isEmpty {
            return value
        }

        return nil
    }

    // MARK: - Validation

    static var isPrivyConfigured: Bool {
        !privyAppId.isEmpty && !privyAppClientId.isEmpty
    }

    static func validateConfiguration() -> [String] {
        var errors: [String] = []

        if privyAppId.isEmpty {
            errors.append("PRIVY_APP_ID is not configured")
        }
        if privyAppClientId.isEmpty {
            errors.append("PRIVY_APP_CLIENT_ID is not configured")
        }

        return errors
    }
}
