import Foundation
import CryptoKit

// MARK: - Conversation Recovery Service
// Handles recovery of conversations from seed phrase

@MainActor
final class ConversationRecoveryService {
    private let hypercoreService: HypercoreService
    private let conversationStore: ConversationStore
    private let keyDerivation: KeyDerivationService

    init(
        hypercoreService: HypercoreService,
        conversationStore: ConversationStore = .shared,
        keyDerivation: KeyDerivationService = .shared
    ) {
        self.hypercoreService = hypercoreService
        self.conversationStore = conversationStore
        self.keyDerivation = keyDerivation
    }

    // MARK: - Recovery from Seed Phrase

    /// Recover all conversations from a seed phrase
    /// - Parameters:
    ///   - seedPhrase: The user's BIP39 seed phrase
    ///   - handle: The user's handle
    /// - Returns: Number of conversations recovered
    func recoverFromSeedPhrase(_ seedPhrase: String, handle: String) async throws -> RecoveryResult {
        // 1. Derive the identity key from seed phrase
        let identityKey = try keyDerivation.deriveIdentityKey(from: seedPhrase)

        // 2. Derive the messaging keys
        let messagingKeys = try keyDerivation.deriveMessagingKeys(from: seedPhrase)

        // 3. Store keys securely
        try await storeRecoveredKeys(identityKey: identityKey, messagingKeys: messagingKeys, handle: handle)

        // 4. Initialize Hypercore service with recovered identity
        try await hypercoreService.initialize(handle: handle)

        // 5. Attempt to recover conversations from the identity Hypercore
        let recoveredCount = try await recoverConversationsFromIdentity(identityKey: identityKey.publicKeyHex)

        return RecoveryResult(
            conversationsRecovered: recoveredCount,
            identityKeyRestored: true,
            messagingKeysRestored: true
        )
    }

    /// Recover conversations using known conversation keys (e.g., from backup)
    func recoverFromBackup(_ backup: RecoveryBackup, handle: String) async throws -> RecoveryResult {
        // Initialize Hypercore service
        if !hypercoreService.isInitialized {
            try await hypercoreService.initialize(handle: handle)
        }

        // Recover each conversation
        var recoveredCount = 0
        for convKey in backup.conversationKeys {
            do {
                try await hypercoreService.joinConversation(
                    conversationId: convKey.conversationId,
                    hypercoreKey: convKey.hypercoreKey
                )
                recoveredCount += 1
            } catch {
                print("[Recovery] Failed to recover conversation \(convKey.conversationId): \(error)")
            }
        }

        // Sync all recovered conversations
        await hypercoreService.syncAll()

        return RecoveryResult(
            conversationsRecovered: recoveredCount,
            identityKeyRestored: backup.identityKey != nil,
            messagingKeysRestored: backup.messagingPublicKey != nil
        )
    }

    // MARK: - Export for Backup

    /// Export recovery data for backup
    func exportRecoveryData() -> RecoveryBackup {
        let storeData = conversationStore.exportRecoveryData()

        return RecoveryBackup(
            version: 1,
            exportedAt: Date(),
            identityKey: nil,  // Don't export private key
            messagingPublicKey: nil,  // Could include for verification
            conversationKeys: storeData.conversationKeys.map {
                RecoveryBackup.ConversationKey(
                    conversationId: $0.conversationId,
                    hypercoreKey: $0.hypercoreKey,
                    discoveryKey: $0.discoveryKey
                )
            }
        )
    }

    /// Export recovery data as JSON string
    func exportRecoveryDataAsJSON() throws -> String {
        let backup = exportRecoveryData()
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]

        let data = try encoder.encode(backup)
        guard let json = String(data: data, encoding: .utf8) else {
            throw RecoveryError.exportFailed
        }
        return json
    }

    /// Import recovery data from JSON string
    func importRecoveryDataFromJSON(_ json: String, handle: String) async throws -> RecoveryResult {
        guard let data = json.data(using: .utf8) else {
            throw RecoveryError.invalidBackupFormat
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        let backup = try decoder.decode(RecoveryBackup.self, from: data)
        return try await recoverFromBackup(backup, handle: handle)
    }

    // MARK: - Private Methods

    private func recoverConversationsFromIdentity(identityKey: String) async throws -> Int {
        // The Hypercore service will automatically load conversations
        // from the identity core when it syncs

        // Wait for initial sync
        try? await Task.sleep(nanoseconds: 2_000_000_000)  // 2 seconds

        // Return count of recovered conversations
        return conversationStore.getAllConversations().count
    }

    private func storeRecoveredKeys(
        identityKey: DerivedIdentityKey,
        messagingKeys: DerivedMessagingKeys,
        handle: String
    ) async throws {
        // Store in Keychain
        let keychain = KeychainService.shared

        try keychain.store(
            identityKey.privateKeyData,
            forKey: "identity-private-\(handle)",
            accessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        )

        try keychain.store(
            messagingKeys.encryptionPrivateKey,
            forKey: "messaging-encryption-\(handle)",
            accessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        )

        try keychain.store(
            messagingKeys.signingPrivateKey,
            forKey: "messaging-signing-\(handle)",
            accessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        )
    }
}

// MARK: - Key Derivation Service

final class KeyDerivationService {
    static let shared = KeyDerivationService()

    private init() {}

    /// Derive identity key from seed phrase using BIP32-like derivation
    func deriveIdentityKey(from seedPhrase: String) throws -> DerivedIdentityKey {
        // Convert seed phrase to seed bytes
        let seedData = deriveSeed(from: seedPhrase)

        // Derive identity key using HKDF
        // Path: m/44'/501'/0'/0' (Solana-compatible)
        let info = "sapp-identity-key".data(using: .utf8)!
        let derivedKey = deriveKey(from: seedData, info: info, outputLength: 32)

        // Create Curve25519 key pair
        let privateKey = try Curve25519.KeyAgreement.PrivateKey(rawRepresentation: derivedKey)
        let publicKey = privateKey.publicKey

        return DerivedIdentityKey(
            privateKeyData: privateKey.rawRepresentation,
            publicKeyData: publicKey.rawRepresentation,
            publicKeyHex: publicKey.rawRepresentation.hexEncodedString()
        )
    }

    /// Derive messaging keys (encryption + signing) from seed phrase
    func deriveMessagingKeys(from seedPhrase: String) throws -> DerivedMessagingKeys {
        let seedData = deriveSeed(from: seedPhrase)

        // Derive encryption key
        let encryptionInfo = "sapp-messaging-encryption".data(using: .utf8)!
        let encryptionKey = deriveKey(from: seedData, info: encryptionInfo, outputLength: 32)

        // Derive signing key
        let signingInfo = "sapp-messaging-signing".data(using: .utf8)!
        let signingKey = deriveKey(from: seedData, info: signingInfo, outputLength: 32)

        // Create key pairs
        let encPrivate = try Curve25519.KeyAgreement.PrivateKey(rawRepresentation: encryptionKey)
        let sigPrivate = try Curve25519.Signing.PrivateKey(rawRepresentation: signingKey)

        return DerivedMessagingKeys(
            encryptionPrivateKey: encPrivate.rawRepresentation,
            encryptionPublicKey: encPrivate.publicKey.rawRepresentation,
            signingPrivateKey: sigPrivate.rawRepresentation,
            signingPublicKey: sigPrivate.publicKey.rawRepresentation
        )
    }

    /// Derive a deterministic conversation key from seed + conversation ID
    func deriveConversationKey(from seedPhrase: String, conversationId: String) throws -> Data {
        let seedData = deriveSeed(from: seedPhrase)
        let info = "sapp-conversation-\(conversationId)".data(using: .utf8)!
        return deriveKey(from: seedData, info: info, outputLength: 32)
    }

    // MARK: - Private

    private func deriveSeed(from seedPhrase: String) -> Data {
        // Simple derivation: SHA256 of seed phrase
        // In production, use proper BIP39 mnemonic to seed conversion
        let normalized = seedPhrase.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        let hash = SHA256.hash(data: normalized.data(using: .utf8)!)
        return Data(hash)
    }

    private func deriveKey(from seed: Data, info: Data, outputLength: Int) -> Data {
        // Use HKDF for key derivation
        let salt = "sapp-key-derivation-v1".data(using: .utf8)!
        let key = HKDF<SHA256>.deriveKey(
            inputKeyMaterial: SymmetricKey(data: seed),
            salt: salt,
            info: info,
            outputByteCount: outputLength
        )
        return key.withUnsafeBytes { Data($0) }
    }
}

// MARK: - Keychain Service

final class KeychainService {
    static let shared = KeychainService()

    private init() {}

    func store(_ data: Data, forKey key: String, accessible: CFString) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: "com.sapp.messaging",
            kSecValueData as String: data,
            kSecAttrAccessible as String: accessible
        ]

        // Delete existing item if present
        SecItemDelete(query as CFDictionary)

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw RecoveryError.keychainError(status)
        }
    }

    func retrieve(forKey key: String) throws -> Data {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: "com.sapp.messaging",
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess, let data = result as? Data else {
            throw RecoveryError.keychainError(status)
        }

        return data
    }

    func delete(forKey key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: "com.sapp.messaging"
        ]

        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw RecoveryError.keychainError(status)
        }
    }
}

// MARK: - Models

struct DerivedIdentityKey {
    let privateKeyData: Data
    let publicKeyData: Data
    let publicKeyHex: String
}

struct DerivedMessagingKeys {
    let encryptionPrivateKey: Data
    let encryptionPublicKey: Data
    let signingPrivateKey: Data
    let signingPublicKey: Data
}

struct RecoveryResult {
    let conversationsRecovered: Int
    let identityKeyRestored: Bool
    let messagingKeysRestored: Bool

    var isSuccessful: Bool {
        conversationsRecovered > 0 || identityKeyRestored
    }
}

struct RecoveryBackup: Codable {
    let version: Int
    let exportedAt: Date
    let identityKey: String?
    let messagingPublicKey: String?
    let conversationKeys: [ConversationKey]

    struct ConversationKey: Codable {
        let conversationId: String
        let hypercoreKey: String
        let discoveryKey: String
    }
}

enum RecoveryError: Error, LocalizedError {
    case invalidSeedPhrase
    case invalidBackupFormat
    case exportFailed
    case keychainError(OSStatus)
    case recoveryFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidSeedPhrase:
            return "Invalid seed phrase"
        case .invalidBackupFormat:
            return "Invalid backup format"
        case .exportFailed:
            return "Failed to export recovery data"
        case .keychainError(let status):
            return "Keychain error: \(status)"
        case .recoveryFailed(let reason):
            return "Recovery failed: \(reason)"
        }
    }
}

// MARK: - Data Extension

extension Data {
    func hexEncodedString() -> String {
        return map { String(format: "%02hhx", $0) }.joined()
    }

    init?(hexString: String) {
        let len = hexString.count / 2
        var data = Data(capacity: len)
        var index = hexString.startIndex

        for _ in 0..<len {
            let nextIndex = hexString.index(index, offsetBy: 2)
            guard let byte = UInt8(hexString[index..<nextIndex], radix: 16) else {
                return nil
            }
            data.append(byte)
            index = nextIndex
        }

        self = data
    }
}
