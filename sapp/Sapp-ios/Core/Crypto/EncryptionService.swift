import Foundation
import CryptoKit

// MARK: - Encryption Service

/// Provides end-to-end encryption for messages using modern cryptography
/// Uses CryptoKit for Curve25519 key exchange and ChaCha20-Poly1305 encryption
final class EncryptionService {

    private let keyManager: KeyPairManager

    init(keyManager: KeyPairManager = KeyPairManager()) {
        self.keyManager = keyManager
    }

    // MARK: - Key Management

    /// Generate or retrieve our key pair
    func getOrCreateKeyPair() throws -> EncryptionKeyPair {
        if let existing = try? keyManager.loadKeyPair() {
            return existing
        }

        let keyPair = try generateKeyPair()
        try keyManager.saveKeyPair(keyPair)
        return keyPair
    }

    /// Generate a new key pair
    func generateKeyPair() throws -> EncryptionKeyPair {
        let privateKey = Curve25519.KeyAgreement.PrivateKey()
        let publicKey = privateKey.publicKey

        return EncryptionKeyPair(
            privateKey: privateKey.rawRepresentation,
            publicKey: publicKey.rawRepresentation
        )
    }

    /// Get public key as base64 string for sharing
    func getPublicKeyString() throws -> String {
        let keyPair = try getOrCreateKeyPair()
        return keyPair.publicKey.base64EncodedString()
    }

    // MARK: - Message Encryption

    /// Encrypt a message for a recipient
    /// - Parameters:
    ///   - message: The plaintext message to encrypt
    ///   - recipientPublicKey: Recipient's public key (base64 encoded)
    /// - Returns: Encrypted message with nonce
    func encrypt(message: String, for recipientPublicKey: String) throws -> EncryptedMessage {
        guard let messageData = message.data(using: .utf8) else {
            throw EncryptionError.encodingFailed
        }

        return try encrypt(data: messageData, for: recipientPublicKey)
    }

    /// Encrypt binary data for a recipient
    func encrypt(data: Data, for recipientPublicKey: String) throws -> EncryptedMessage {
        guard let recipientKeyData = Data(base64Encoded: recipientPublicKey) else {
            throw EncryptionError.invalidPublicKey
        }

        // Get our key pair
        let ourKeyPair = try getOrCreateKeyPair()

        // Create CryptoKit keys
        guard let ourPrivateKey = try? Curve25519.KeyAgreement.PrivateKey(rawRepresentation: ourKeyPair.privateKey),
              let theirPublicKey = try? Curve25519.KeyAgreement.PublicKey(rawRepresentation: recipientKeyData) else {
            throw EncryptionError.invalidKey
        }

        // Derive shared secret using ECDH
        let sharedSecret = try ourPrivateKey.sharedSecretFromKeyAgreement(with: theirPublicKey)

        // Derive symmetric key using HKDF
        let symmetricKey = sharedSecret.hkdfDerivedSymmetricKey(
            using: SHA256.self,
            salt: "sapp-e2e".data(using: .utf8)!,
            sharedInfo: Data(),
            outputByteCount: 32
        )

        // Encrypt using ChaCha20-Poly1305
        let nonce = ChaChaPoly.Nonce()
        let sealedBox = try ChaChaPoly.seal(data, using: symmetricKey, nonce: nonce)

        return EncryptedMessage(
            ciphertext: sealedBox.ciphertext,
            nonce: Data(nonce),
            tag: sealedBox.tag,
            senderPublicKey: ourKeyPair.publicKey.base64EncodedString()
        )
    }

    // MARK: - Message Decryption

    /// Decrypt a message from a sender
    /// - Parameters:
    ///   - encryptedMessage: The encrypted message
    /// - Returns: Decrypted plaintext string
    func decrypt(encryptedMessage: EncryptedMessage) throws -> String {
        let decryptedData = try decryptToData(encryptedMessage: encryptedMessage)

        guard let plaintext = String(data: decryptedData, encoding: .utf8) else {
            throw EncryptionError.decodingFailed
        }

        return plaintext
    }

    /// Decrypt to binary data
    func decryptToData(encryptedMessage: EncryptedMessage) throws -> Data {
        guard let senderKeyData = Data(base64Encoded: encryptedMessage.senderPublicKey) else {
            throw EncryptionError.invalidPublicKey
        }

        // Get our key pair
        let ourKeyPair = try getOrCreateKeyPair()

        // Create CryptoKit keys
        guard let ourPrivateKey = try? Curve25519.KeyAgreement.PrivateKey(rawRepresentation: ourKeyPair.privateKey),
              let theirPublicKey = try? Curve25519.KeyAgreement.PublicKey(rawRepresentation: senderKeyData) else {
            throw EncryptionError.invalidKey
        }

        // Derive shared secret using ECDH
        let sharedSecret = try ourPrivateKey.sharedSecretFromKeyAgreement(with: theirPublicKey)

        // Derive symmetric key using HKDF
        let symmetricKey = sharedSecret.hkdfDerivedSymmetricKey(
            using: SHA256.self,
            salt: "sapp-e2e".data(using: .utf8)!,
            sharedInfo: Data(),
            outputByteCount: 32
        )

        // Reconstruct nonce
        guard let nonce = try? ChaChaPoly.Nonce(data: encryptedMessage.nonce) else {
            throw EncryptionError.invalidNonce
        }

        // Reconstruct sealed box
        let sealedBox = try ChaChaPoly.SealedBox(
            nonce: nonce,
            ciphertext: encryptedMessage.ciphertext,
            tag: encryptedMessage.tag
        )

        // Decrypt
        let decryptedData = try ChaChaPoly.open(sealedBox, using: symmetricKey)

        return decryptedData
    }

    // MARK: - Message Signing

    /// Sign a message for authenticity
    func sign(message: String) throws -> String {
        guard let messageData = message.data(using: .utf8) else {
            throw EncryptionError.encodingFailed
        }

        return try sign(data: messageData)
    }

    /// Sign binary data
    func sign(data: Data) throws -> String {
        let keyPair = try getOrCreateKeyPair()

        // Create Ed25519 signing key from private key
        guard let signingKey = try? Curve25519.Signing.PrivateKey(rawRepresentation: keyPair.privateKey) else {
            throw EncryptionError.invalidKey
        }

        let signature = try signingKey.signature(for: data)
        return signature.base64EncodedString()
    }

    /// Verify a message signature
    func verify(message: String, signature: String, senderPublicKey: String) throws -> Bool {
        guard let messageData = message.data(using: .utf8),
              let signatureData = Data(base64Encoded: signature),
              let publicKeyData = Data(base64Encoded: senderPublicKey) else {
            throw EncryptionError.invalidSignature
        }

        // Note: We're using Curve25519.KeyAgreement keys, so we'd need Ed25519 keys for signing
        // This is a simplified version - in production, maintain separate signing keys
        guard let verifyingKey = try? Curve25519.Signing.PublicKey(rawRepresentation: publicKeyData) else {
            throw EncryptionError.invalidPublicKey
        }

        return verifyingKey.isValidSignature(signatureData, for: messageData)
    }
}

// MARK: - Key Pair Models

struct EncryptionKeyPair: Codable {
    let privateKey: Data
    let publicKey: Data

    /// Get public key as base64 for sharing
    var publicKeyBase64: String {
        publicKey.base64EncodedString()
    }
}

// MARK: - Encrypted Message Model

struct EncryptedMessage: Codable {
    let ciphertext: Data
    let nonce: Data
    let tag: Data
    let senderPublicKey: String

    /// Serialize for transmission
    func serialize() -> String {
        let combined = nonce + tag + ciphertext
        return combined.base64EncodedString() + ":" + senderPublicKey
    }

    /// Deserialize from transmission format
    static func deserialize(_ string: String) throws -> EncryptedMessage {
        let parts = string.split(separator: ":")
        guard parts.count == 2,
              let combinedData = Data(base64Encoded: String(parts[0])) else {
            throw EncryptionError.invalidFormat
        }

        let senderPublicKey = String(parts[1])

        // ChaCha20-Poly1305: 12 byte nonce, 16 byte tag
        guard combinedData.count > 28 else {
            throw EncryptionError.invalidFormat
        }

        let nonce = combinedData.prefix(12)
        let tag = combinedData.dropFirst(12).prefix(16)
        let ciphertext = combinedData.dropFirst(28)

        return EncryptedMessage(
            ciphertext: Data(ciphertext),
            nonce: Data(nonce),
            tag: Data(tag),
            senderPublicKey: senderPublicKey
        )
    }
}

// MARK: - Key Pair Manager

/// Manages storage of encryption key pairs in Keychain
final class KeyPairManager {

    private let privateKeyTag = "com.sapp.encryption.privateKey"
    private let publicKeyTag = "com.sapp.encryption.publicKey"

    func loadKeyPair() throws -> EncryptionKeyPair? {
        guard let privateKey = loadFromKeychain(tag: privateKeyTag),
              let publicKey = loadFromKeychain(tag: publicKeyTag) else {
            return nil
        }

        return EncryptionKeyPair(privateKey: privateKey, publicKey: publicKey)
    }

    func saveKeyPair(_ keyPair: EncryptionKeyPair) throws {
        try saveToKeychain(data: keyPair.privateKey, tag: privateKeyTag)
        try saveToKeychain(data: keyPair.publicKey, tag: publicKeyTag)
    }

    func deleteKeyPair() throws {
        deleteFromKeychain(tag: privateKeyTag)
        deleteFromKeychain(tag: publicKeyTag)
    }

    // MARK: - Keychain Operations

    private func saveToKeychain(data: Data, tag: String) throws {
        // Delete existing
        deleteFromKeychain(tag: tag)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: tag,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            kSecValueData as String: data
        ]

        let status = SecItemAdd(query as CFDictionary, nil)

        guard status == errSecSuccess else {
            throw EncryptionError.keychainError("Failed to save key: \(status)")
        }
    }

    private func loadFromKeychain(tag: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: tag,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess else {
            return nil
        }

        return result as? Data
    }

    private func deleteFromKeychain(tag: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: tag
        ]

        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Encryption Errors

enum EncryptionError: Error, LocalizedError {
    case encodingFailed
    case decodingFailed
    case invalidPublicKey
    case invalidKey
    case invalidNonce
    case invalidSignature
    case invalidFormat
    case keychainError(String)
    case encryptionFailed(String)
    case decryptionFailed(String)

    var errorDescription: String? {
        switch self {
        case .encodingFailed:
            return "Failed to encode message"
        case .decodingFailed:
            return "Failed to decode message"
        case .invalidPublicKey:
            return "Invalid public key"
        case .invalidKey:
            return "Invalid encryption key"
        case .invalidNonce:
            return "Invalid nonce"
        case .invalidSignature:
            return "Invalid signature"
        case .invalidFormat:
            return "Invalid message format"
        case .keychainError(let message):
            return "Keychain error: \(message)"
        case .encryptionFailed(let message):
            return "Encryption failed: \(message)"
        case .decryptionFailed(let message):
            return "Decryption failed: \(message)"
        }
    }
}

// MARK: - Public Key Exchange

/// Model for exchanging public keys between users
struct PublicKeyExchange: Codable {
    let handle: String
    let publicKey: String
    let timestamp: Date
    let signature: String?  // Optional signature for verification

    func toJSON() -> Data? {
        try? JSONEncoder().encode(self)
    }

    static func fromJSON(_ data: Data) -> PublicKeyExchange? {
        try? JSONDecoder().decode(PublicKeyExchange.self, from: data)
    }
}
