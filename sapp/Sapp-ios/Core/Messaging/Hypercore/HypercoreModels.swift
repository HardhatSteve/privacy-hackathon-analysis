import Foundation

// MARK: - Hypercore Models for P2P Messaging
// These models represent the data structures stored in Hypercores

/// Represents a conversation stored as a Hypercore
struct ConversationCore: Identifiable, Codable, Equatable {
    let id: String                          // Deterministic: "dm_alice_bob" or "group_xyz"
    let hypercoreKey: String                // Public key of the Hypercore (hex)
    let discoveryKey: String                // Discovery key for Hyperswarm (hex)
    var participants: [CoreParticipant]     // All members who can write
    let createdAt: Date
    var lastSyncedAt: Date?
    var localLength: Int                    // Number of entries synced locally
    var remoteLength: Int?                  // Known remote length (for sync progress)

    /// Whether this is a group chat (>2 participants including self)
    var isGroup: Bool { participants.count > 2 }

    /// Generate deterministic conversation ID from participants
    static func generateId(participants: [String], isGroup: Bool) -> String {
        let sorted = participants.sorted()
        if isGroup {
            return "group_" + sorted.joined(separator: "_")
        } else {
            return "dm_" + sorted.joined(separator: "_")
        }
    }
}

/// A participant in a Hypercore conversation
struct CoreParticipant: Identifiable, Codable, Equatable {
    let id: String                          // Handle (e.g., "alice")
    let writerKey: String                   // Their Hypercore writer key (for Autobase)
    let messagingPublicKey: String          // Curve25519 public key for E2E encryption
    var displayName: String?
    var addedAt: Date
    var addedBy: String?                    // Handle of who added them (for groups)

    var handle: String { id }
}

/// An entry in the conversation Hypercore
enum CoreEntry: Codable, Equatable {
    case initialization(ConversationInit)
    case message(CoreMessage)
    case memberAdd(MemberChange)
    case memberRemove(MemberChange)
    case readReceipt(ReadReceipt)
    case typing(CoreTypingEvent)
    case metadata(MetadataUpdate)

    private enum CodingKeys: String, CodingKey {
        case type
        case data
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "init":
            let data = try container.decode(ConversationInit.self, forKey: .data)
            self = .initialization(data)
        case "message":
            let data = try container.decode(CoreMessage.self, forKey: .data)
            self = .message(data)
        case "member_add":
            let data = try container.decode(MemberChange.self, forKey: .data)
            self = .memberAdd(data)
        case "member_remove":
            let data = try container.decode(MemberChange.self, forKey: .data)
            self = .memberRemove(data)
        case "read_receipt":
            let data = try container.decode(ReadReceipt.self, forKey: .data)
            self = .readReceipt(data)
        case "typing":
            let data = try container.decode(CoreTypingEvent.self, forKey: .data)
            self = .typing(data)
        case "metadata":
            let data = try container.decode(MetadataUpdate.self, forKey: .data)
            self = .metadata(data)
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .type,
                in: container,
                debugDescription: "Unknown entry type: \(type)"
            )
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        switch self {
        case .initialization(let data):
            try container.encode("init", forKey: .type)
            try container.encode(data, forKey: .data)
        case .message(let data):
            try container.encode("message", forKey: .type)
            try container.encode(data, forKey: .data)
        case .memberAdd(let data):
            try container.encode("member_add", forKey: .type)
            try container.encode(data, forKey: .data)
        case .memberRemove(let data):
            try container.encode("member_remove", forKey: .type)
            try container.encode(data, forKey: .data)
        case .readReceipt(let data):
            try container.encode("read_receipt", forKey: .type)
            try container.encode(data, forKey: .data)
        case .typing(let data):
            try container.encode("typing", forKey: .type)
            try container.encode(data, forKey: .data)
        case .metadata(let data):
            try container.encode("metadata", forKey: .type)
            try container.encode(data, forKey: .data)
        }
    }
}

/// Initial entry when conversation is created
struct ConversationInit: Codable, Equatable {
    let conversationId: String
    let participants: [String]              // Initial participant handles
    let createdBy: String                   // Handle of creator
    let createdAt: Date
    let isGroup: Bool
    let groupName: String?                  // Optional group name
}

/// A message stored in the Hypercore
struct CoreMessage: Identifiable, Codable, Equatable {
    let id: String                          // UUID
    let senderId: String                    // Handle of sender
    let content: EncryptedContent           // E2E encrypted content
    let timestamp: Date
    let replyTo: String?                    // ID of message being replied to
    let signature: String                   // Ed25519 signature for authenticity

    /// Encrypted message content
    struct EncryptedContent: Codable, Equatable {
        let ciphertext: String              // Base64-encoded encrypted data
        let nonce: String                   // Base64-encoded nonce
        let senderPublicKey: String         // Sender's ephemeral public key
    }
}

/// Decrypted message content (after E2E decryption)
enum DecryptedMessageContent: Codable, Equatable {
    case text(String)
    case image(url: String, width: Int?, height: Int?)
    case file(url: String, name: String, size: Int)
    case voice(url: String, duration: TimeInterval)
    case location(latitude: Double, longitude: Double, name: String?)
    case contact(name: String, address: String)
    case transaction(signature: String, amount: Double, token: String)
    case system(String)

    private enum CodingKeys: String, CodingKey {
        case type
        case text, url, width, height, name, size, duration
        case latitude, longitude, address
        case signature, amount, token
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "text":
            let text = try container.decode(String.self, forKey: .text)
            self = .text(text)
        case "image":
            let url = try container.decode(String.self, forKey: .url)
            let width = try container.decodeIfPresent(Int.self, forKey: .width)
            let height = try container.decodeIfPresent(Int.self, forKey: .height)
            self = .image(url: url, width: width, height: height)
        case "file":
            let url = try container.decode(String.self, forKey: .url)
            let name = try container.decode(String.self, forKey: .name)
            let size = try container.decode(Int.self, forKey: .size)
            self = .file(url: url, name: name, size: size)
        case "voice":
            let url = try container.decode(String.self, forKey: .url)
            let duration = try container.decode(TimeInterval.self, forKey: .duration)
            self = .voice(url: url, duration: duration)
        case "location":
            let lat = try container.decode(Double.self, forKey: .latitude)
            let lon = try container.decode(Double.self, forKey: .longitude)
            let name = try container.decodeIfPresent(String.self, forKey: .name)
            self = .location(latitude: lat, longitude: lon, name: name)
        case "contact":
            let name = try container.decode(String.self, forKey: .name)
            let address = try container.decode(String.self, forKey: .address)
            self = .contact(name: name, address: address)
        case "transaction":
            let sig = try container.decode(String.self, forKey: .signature)
            let amount = try container.decode(Double.self, forKey: .amount)
            let token = try container.decode(String.self, forKey: .token)
            self = .transaction(signature: sig, amount: amount, token: token)
        case "system":
            let text = try container.decode(String.self, forKey: .text)
            self = .system(text)
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .type,
                in: container,
                debugDescription: "Unknown content type: \(type)"
            )
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        switch self {
        case .text(let text):
            try container.encode("text", forKey: .type)
            try container.encode(text, forKey: .text)
        case .image(let url, let width, let height):
            try container.encode("image", forKey: .type)
            try container.encode(url, forKey: .url)
            try container.encodeIfPresent(width, forKey: .width)
            try container.encodeIfPresent(height, forKey: .height)
        case .file(let url, let name, let size):
            try container.encode("file", forKey: .type)
            try container.encode(url, forKey: .url)
            try container.encode(name, forKey: .name)
            try container.encode(size, forKey: .size)
        case .voice(let url, let duration):
            try container.encode("voice", forKey: .type)
            try container.encode(url, forKey: .url)
            try container.encode(duration, forKey: .duration)
        case .location(let lat, let lon, let name):
            try container.encode("location", forKey: .type)
            try container.encode(lat, forKey: .latitude)
            try container.encode(lon, forKey: .longitude)
            try container.encodeIfPresent(name, forKey: .name)
        case .contact(let name, let address):
            try container.encode("contact", forKey: .type)
            try container.encode(name, forKey: .name)
            try container.encode(address, forKey: .address)
        case .transaction(let sig, let amount, let token):
            try container.encode("transaction", forKey: .type)
            try container.encode(sig, forKey: .signature)
            try container.encode(amount, forKey: .amount)
            try container.encode(token, forKey: .token)
        case .system(let text):
            try container.encode("system", forKey: .type)
            try container.encode(text, forKey: .text)
        }
    }
}

/// Member added or removed from group
struct MemberChange: Codable, Equatable {
    let handle: String                      // Handle of member being added/removed
    let writerKey: String?                  // Their writer key (for adds)
    let messagingPublicKey: String?         // Their E2E public key (for adds)
    let changedBy: String                   // Handle of who made the change
    let timestamp: Date
    let reason: String?                     // Optional reason for removal
}

/// Read receipt for a message
struct ReadReceipt: Codable, Equatable {
    let messageId: String                   // ID of message that was read
    let readBy: String                      // Handle of who read it
    let timestamp: Date
}

/// Typing indicator event stored in Hypercore
struct CoreTypingEvent: Codable, Equatable {
    let participantId: String               // Handle of who is typing
    let isTyping: Bool
    let timestamp: Date
}

/// Metadata update (group name, settings, etc.)
struct MetadataUpdate: Codable, Equatable {
    let key: String                         // e.g., "groupName", "avatar"
    let value: String                       // New value
    let updatedBy: String                   // Handle of who updated
    let timestamp: Date
}

// MARK: - Sync State

/// Tracks sync state for a conversation Hypercore
struct ConversationSyncState: Codable, Equatable {
    let conversationId: String
    var localLength: Int                    // Entries we have locally
    var remoteLength: Int?                  // Known remote length
    var lastSyncTimestamp: Date?
    var syncStatus: SyncStatus

    enum SyncStatus: String, Codable {
        case synced                         // Fully synced with peers
        case syncing                        // Currently syncing
        case behind                         // Known to be behind
        case offline                        // No peers available
        case error                          // Sync error
    }

    var isSynced: Bool {
        guard let remote = remoteLength else { return false }
        return localLength >= remote
    }

    var syncProgress: Double {
        guard let remote = remoteLength, remote > 0 else { return 1.0 }
        return Double(localLength) / Double(remote)
    }
}

// MARK: - Identity

/// User's messaging identity stored in their identity Hypercore
struct MessagingIdentity: Codable, Equatable {
    let handle: String                      // User's handle
    let messagingPublicKey: String          // Curve25519 public key (base64)
    let signingPublicKey: String            // Ed25519 public key (base64)
    let identityCoreKey: String             // Public key of identity Hypercore
    var conversations: [String]             // List of conversation IDs user is part of
    let createdAt: Date
    var updatedAt: Date

    /// Solana address (optional, for on-chain identity)
    var solanaAddress: String?
}

// MARK: - Errors

enum HypercoreError: Error, LocalizedError {
    case notInitialized
    case conversationNotFound
    case participantNotFound
    case encryptionFailed(String)
    case decryptionFailed(String)
    case signatureFailed(String)
    case signatureInvalid
    case syncFailed(String)
    case workletError(String)
    case storageError(String)
    case invalidConversationId
    case notAuthorized

    var errorDescription: String? {
        switch self {
        case .notInitialized:
            return "Hypercore service not initialized"
        case .conversationNotFound:
            return "Conversation not found"
        case .participantNotFound:
            return "Participant not found"
        case .encryptionFailed(let reason):
            return "Encryption failed: \(reason)"
        case .decryptionFailed(let reason):
            return "Decryption failed: \(reason)"
        case .signatureFailed(let reason):
            return "Signature failed: \(reason)"
        case .signatureInvalid:
            return "Message signature is invalid"
        case .syncFailed(let reason):
            return "Sync failed: \(reason)"
        case .workletError(let reason):
            return "Worklet error: \(reason)"
        case .storageError(let reason):
            return "Storage error: \(reason)"
        case .invalidConversationId:
            return "Invalid conversation ID format"
        case .notAuthorized:
            return "Not authorized to perform this action"
        }
    }
}
