import Foundation
import Combine

// MARK: - Conversation Store
// Local cache and persistence layer for Hypercore-synced conversations

@MainActor
final class ConversationStore: ObservableObject {
    static let shared = ConversationStore()

    // Published state
    @Published private(set) var conversations: [String: StoredConversation] = [:]
    @Published private(set) var messages: [String: [StoredMessage]] = [:]  // conversationId -> messages
    @Published private(set) var syncStates: [String: ConversationSyncState] = [:]

    // MARK: - Left Conversations Tracking
    // Tracks conversation IDs that the user has explicitly left.
    // This prevents conversations from being recreated when messages arrive from groups the user left.
    private(set) var leftConversations: Set<String> = []

    // Current user - storage is per-user to isolate data between accounts
    private(set) var currentUserHandle: String?

    private let fileManager = FileManager.default
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private var cancellables = Set<AnyCancellable>()

    private init() {
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = .prettyPrinted
        decoder.dateDecodingStrategy = .iso8601

        // Don't load data here - wait until we know the user via switchUser()
    }

    // MARK: - User Management

    /// Switch to a different user's data store. Call this when user logs in.
    /// Each user has their own isolated storage directory.
    func switchUser(handle: String) {
        guard handle != currentUserHandle, !handle.isEmpty else { return }

        print("[ConversationStore] Switching user from '\(currentUserHandle ?? "none")' to '\(handle)'")

        // Clear in-memory data from previous user
        conversations.removeAll()
        messages.removeAll()
        syncStates.removeAll()

        // Set new user and load their data
        currentUserHandle = handle
        loadFromDisk()

        print("[ConversationStore] Loaded \(conversations.count) conversations for @\(handle)")
    }

    /// Clear current user session (call on logout)
    func clearCurrentUser() {
        print("[ConversationStore] Clearing current user session")
        conversations.removeAll()
        messages.removeAll()
        syncStates.removeAll()
        leftConversations.removeAll()
        currentUserHandle = nil
    }

    // MARK: - Conversation Operations

    func getConversation(_ id: String) -> StoredConversation? {
        return conversations[id]
    }

    func getAllConversations() -> [StoredConversation] {
        return Array(conversations.values).sorted { $0.lastMessageAt ?? $0.createdAt > $1.lastMessageAt ?? $1.createdAt }
    }

    func saveConversation(_ conversation: StoredConversation) {
        conversations[conversation.id] = conversation
        persistConversations()
    }

    func removeConversation(_ id: String) {
        conversations.removeValue(forKey: id)
        messages.removeValue(forKey: id)
        syncStates.removeValue(forKey: id)
        persistConversations()
        persistMessages(for: id)
    }

    // MARK: - Left Conversations Management

    /// Marks a conversation as "left" to prevent it from being recreated when messages arrive.
    /// This is called when a user explicitly leaves a group chat.
    func markConversationAsLeft(_ conversationId: String) {
        leftConversations.insert(conversationId)
        persistLeftConversations()
        print("[ConversationStore] Marked conversation as left: \(conversationId)")
    }

    /// Checks if the user has left a specific conversation.
    /// Used by HybridMessagingService to prevent recreating left conversations.
    func hasLeftConversation(_ conversationId: String) -> Bool {
        return leftConversations.contains(conversationId)
    }

    /// Clears the "left" status for a conversation.
    /// This is called when a user is re-added to a group they previously left.
    func clearLeftStatus(_ conversationId: String) {
        if leftConversations.remove(conversationId) != nil {
            persistLeftConversations()
            print("[ConversationStore] Cleared left status for conversation: \(conversationId)")
        }
    }

    /// Clears all left conversation tracking (called on logout/user switch)
    private func clearAllLeftConversations() {
        leftConversations.removeAll()
    }

    func updateConversationFromCore(_ core: ConversationCore) {
        var conv = conversations[core.id] ?? StoredConversation(
            id: core.id,
            hypercoreKey: core.hypercoreKey,
            discoveryKey: core.discoveryKey,
            participants: [],
            createdAt: core.createdAt,
            isGroup: core.isGroup
        )

        conv.hypercoreKey = core.hypercoreKey
        conv.discoveryKey = core.discoveryKey
        conv.participants = core.participants.map { StoredParticipant(from: $0) }
        conv.localLength = core.localLength
        conv.remoteLength = core.remoteLength
        conv.lastSyncedAt = core.lastSyncedAt

        conversations[core.id] = conv
        persistConversations()
    }

    // MARK: - Message Operations

    func getMessages(for conversationId: String, limit: Int = 50, before: Date? = nil) -> [StoredMessage] {
        guard var msgs = messages[conversationId] else { return [] }

        if let before = before {
            msgs = msgs.filter { $0.timestamp < before }
        }

        return Array(msgs.sorted { $0.timestamp > $1.timestamp }.prefix(limit).reversed())
    }

    func getMessage(by id: String, in conversationId: String) -> StoredMessage? {
        return messages[conversationId]?.first { $0.id == id }
    }

    func saveMessage(_ message: StoredMessage) {
        var conversationMessages = messages[message.conversationId] ?? []

        // Update existing or append new
        if let index = conversationMessages.firstIndex(where: { $0.id == message.id }) {
            conversationMessages[index] = message
        } else {
            conversationMessages.append(message)
        }

        // Sort by timestamp
        conversationMessages.sort { $0.timestamp < $1.timestamp }

        messages[message.conversationId] = conversationMessages

        // Update conversation's last message
        if var conv = conversations[message.conversationId] {
            if conv.lastMessageAt == nil || message.timestamp > conv.lastMessageAt! {
                conv.lastMessageAt = message.timestamp
                conv.lastMessagePreview = message.previewText
                conv.lastMessageSenderId = message.senderId
                conversations[message.conversationId] = conv
            }
        }

        persistMessages(for: message.conversationId)
        persistConversations()
    }

    func saveMessages(_ newMessages: [StoredMessage], for conversationId: String) {
        var conversationMessages = messages[conversationId] ?? []

        for message in newMessages {
            if let index = conversationMessages.firstIndex(where: { $0.id == message.id }) {
                conversationMessages[index] = message
            } else {
                conversationMessages.append(message)
            }
        }

        conversationMessages.sort { $0.timestamp < $1.timestamp }
        messages[conversationId] = conversationMessages

        // Update conversation metadata
        if let lastMessage = conversationMessages.last,
           var conv = conversations[conversationId] {
            conv.lastMessageAt = lastMessage.timestamp
            conv.lastMessagePreview = lastMessage.previewText
            conv.lastMessageSenderId = lastMessage.senderId
            conversations[conversationId] = conv
        }

        persistMessages(for: conversationId)
        persistConversations()
    }

    func updateMessageStatus(_ messageId: String, in conversationId: String, status: MessageSyncStatus) {
        guard var conversationMessages = messages[conversationId],
              let index = conversationMessages.firstIndex(where: { $0.id == messageId }) else {
            return
        }

        conversationMessages[index].syncStatus = status
        messages[conversationId] = conversationMessages
        persistMessages(for: conversationId)
    }

    func deleteMessage(_ messageId: String, in conversationId: String) {
        guard var conversationMessages = messages[conversationId] else { return }

        conversationMessages.removeAll { $0.id == messageId }
        messages[conversationId] = conversationMessages
        persistMessages(for: conversationId)
    }

    // MARK: - Sync State Operations

    func updateSyncState(_ state: ConversationSyncState) {
        syncStates[state.conversationId] = state
    }

    func getSyncState(for conversationId: String) -> ConversationSyncState? {
        return syncStates[conversationId]
    }

    // MARK: - Conversion from CoreEntries

    func processEntries(_ entries: [CoreEntry], for conversationId: String, currentHandle: String) {
        var newMessages: [StoredMessage] = []

        for entry in entries {
            switch entry {
            case .initialization(let init_):
                // Update conversation metadata if needed
                if var conv = conversations[conversationId] {
                    conv.isGroup = init_.isGroup
                    conv.groupName = init_.groupName
                    conversations[conversationId] = conv
                }

            case .message(let coreMessage):
                // Convert CoreMessage to StoredMessage
                // Note: Decryption should happen before this
                let stored = StoredMessage(
                    id: coreMessage.id,
                    conversationId: conversationId,
                    senderId: coreMessage.senderId,
                    content: .encrypted(coreMessage.content),  // Still encrypted
                    timestamp: coreMessage.timestamp,
                    replyTo: coreMessage.replyTo,
                    isOutgoing: coreMessage.senderId == currentHandle,
                    syncStatus: .synced,
                    signature: coreMessage.signature
                )
                newMessages.append(stored)

            case .memberAdd(let change):
                // Add participant to conversation
                if var conv = conversations[conversationId] {
                    let participant = StoredParticipant(
                        handle: change.handle,
                        writerKey: change.writerKey,
                        messagingPublicKey: change.messagingPublicKey,
                        addedAt: change.timestamp,
                        addedBy: change.changedBy
                    )
                    if !conv.participants.contains(where: { $0.handle == change.handle }) {
                        conv.participants.append(participant)
                        conversations[conversationId] = conv
                    }
                }

            case .memberRemove(let change):
                if var conv = conversations[conversationId] {
                    conv.participants.removeAll { $0.handle == change.handle }
                    conversations[conversationId] = conv
                }

            case .readReceipt(let receipt):
                // Mark message as read
                if var conversationMessages = messages[conversationId],
                   let index = conversationMessages.firstIndex(where: { $0.id == receipt.messageId }) {
                    var msg = conversationMessages[index]
                    if !msg.readBy.contains(receipt.readBy) {
                        msg.readBy.append(receipt.readBy)
                        conversationMessages[index] = msg
                        messages[conversationId] = conversationMessages
                    }
                }

            case .typing, .metadata:
                // Handle separately (not persisted as messages)
                break
            }
        }

        if !newMessages.isEmpty {
            saveMessages(newMessages, for: conversationId)
        }

        persistConversations()
    }

    // MARK: - Persistence

    private var storageURL: URL {
        let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let basePath = documentsPath.appendingPathComponent("conversation-store")

        // User-specific storage to isolate data between accounts
        if let handle = currentUserHandle, !handle.isEmpty {
            return basePath.appendingPathComponent(handle)
        }

        // Fallback (shouldn't happen in normal use - switchUser should be called first)
        return basePath.appendingPathComponent("_anonymous")
    }

    private func loadFromDisk() {
        // Ensure directory exists
        try? fileManager.createDirectory(at: storageURL, withIntermediateDirectories: true)

        // Load conversations
        let conversationsURL = storageURL.appendingPathComponent("conversations.json")
        if let data = try? Data(contentsOf: conversationsURL),
           let loaded = try? decoder.decode([String: StoredConversation].self, from: data) {
            conversations = loaded
        }

        // Load left conversations (to prevent recreation of left group chats)
        let leftConversationsURL = storageURL.appendingPathComponent("left-conversations.json")
        if let data = try? Data(contentsOf: leftConversationsURL),
           let loaded = try? decoder.decode(Set<String>.self, from: data) {
            leftConversations = loaded
            print("[ConversationStore] Loaded \(leftConversations.count) left conversation IDs")
        }

        // Load messages for each conversation
        for conversationId in conversations.keys {
            loadMessages(for: conversationId)
        }

        print("[ConversationStore] Loaded \(conversations.count) conversations")
    }

    private func loadMessages(for conversationId: String) {
        let messagesURL = storageURL.appendingPathComponent("messages-\(conversationId).json")
        if let data = try? Data(contentsOf: messagesURL),
           let loaded = try? decoder.decode([StoredMessage].self, from: data) {
            messages[conversationId] = loaded
        }
    }

    private func persistConversations() {
        let url = storageURL.appendingPathComponent("conversations.json")
        if let data = try? encoder.encode(conversations) {
            try? data.write(to: url)
        }
    }

    private func persistMessages(for conversationId: String) {
        let url = storageURL.appendingPathComponent("messages-\(conversationId).json")
        if let msgs = messages[conversationId],
           let data = try? encoder.encode(msgs) {
            try? data.write(to: url)
        } else {
            // Remove file if no messages
            try? fileManager.removeItem(at: url)
        }
    }

    private func persistLeftConversations() {
        let url = storageURL.appendingPathComponent("left-conversations.json")
        if let data = try? encoder.encode(leftConversations) {
            try? data.write(to: url)
        }
    }

    // MARK: - Clear All Data

    func clearAllData() {
        conversations.removeAll()
        messages.removeAll()
        syncStates.removeAll()

        try? fileManager.removeItem(at: storageURL)
        try? fileManager.createDirectory(at: storageURL, withIntermediateDirectories: true)

        print("[ConversationStore] All data cleared")
    }

    // MARK: - Export for Recovery

    func exportRecoveryData() -> RecoveryData {
        let convKeys = conversations.values.map {
            RecoveryData.ConversationKey(
                conversationId: $0.id,
                hypercoreKey: $0.hypercoreKey,
                discoveryKey: $0.discoveryKey
            )
        }

        return RecoveryData(conversationKeys: Array(convKeys))
    }
}

// MARK: - Stored Models

struct StoredConversation: Codable, Identifiable, Equatable {
    let id: String
    var hypercoreKey: String
    var discoveryKey: String
    var participants: [StoredParticipant]
    let createdAt: Date
    var isGroup: Bool
    var groupName: String?

    var lastMessageAt: Date?
    var lastMessagePreview: String?
    var lastMessageSenderId: String?
    var unreadCount: Int = 0
    var isPinned: Bool = false
    var isMuted: Bool = false

    var localLength: Int = 0
    var remoteLength: Int?
    var lastSyncedAt: Date?

    var displayName: String {
        if let name = groupName, !name.isEmpty {
            return name
        }
        if participants.count == 1 {
            return "@\(participants[0].handle)"
        }
        return participants.map { "@\($0.handle)" }.joined(separator: ", ")
    }
}

struct StoredParticipant: Codable, Identifiable, Equatable {
    var id: String { handle }
    let handle: String
    var writerKey: String?
    var messagingPublicKey: String?
    var displayName: String?
    var addedAt: Date
    var addedBy: String?

    init(handle: String, writerKey: String?, messagingPublicKey: String?, displayName: String? = nil, addedAt: Date = Date(), addedBy: String? = nil) {
        self.handle = handle
        self.writerKey = writerKey
        self.messagingPublicKey = messagingPublicKey
        self.displayName = displayName
        self.addedAt = addedAt
        self.addedBy = addedBy
    }

    init(from core: CoreParticipant) {
        self.handle = core.handle
        self.writerKey = core.writerKey
        self.messagingPublicKey = core.messagingPublicKey
        self.displayName = core.displayName
        self.addedAt = core.addedAt
        self.addedBy = core.addedBy
    }
}

struct StoredMessage: Codable, Identifiable, Equatable {
    let id: String
    let conversationId: String
    let senderId: String
    var content: StoredMessageContent
    let timestamp: Date
    var replyTo: String?
    var isOutgoing: Bool
    var syncStatus: MessageSyncStatus
    var signature: String?
    var readBy: [String] = []

    var previewText: String {
        switch content {
        case .text(let text):
            return text
        case .image:
            return "Photo"
        case .file(_, let name, _):
            return "File: \(name)"
        case .voice(_, let duration):
            return "Voice (\(Int(duration))s)"
        case .location:
            return "Location"
        case .contact(let name, _):
            return "Contact: \(name)"
        case .transaction(_, let amount, let token):
            return "\(String(format: "%.4f", amount)) \(token)"
        case .system(let text):
            return text
        case .encrypted:
            return "Encrypted message"
        }
    }
}

enum StoredMessageContent: Codable, Equatable {
    case text(String)
    case image(url: String, width: Int?, height: Int?)
    case file(url: String, name: String, size: Int)
    case voice(url: String, duration: TimeInterval)
    case location(latitude: Double, longitude: Double, name: String?)
    case contact(name: String, address: String)
    case transaction(signature: String, amount: Double, token: String)
    case system(String)
    case encrypted(CoreMessage.EncryptedContent)

    private enum CodingKeys: String, CodingKey {
        case type
        case text, url, width, height, name, size, duration
        case latitude, longitude, address
        case signature, amount, token
        case ciphertext, nonce, senderPublicKey
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
        case "encrypted":
            let ciphertext = try container.decode(String.self, forKey: .ciphertext)
            let nonce = try container.decode(String.self, forKey: .nonce)
            let senderPubKey = try container.decode(String.self, forKey: .senderPublicKey)
            self = .encrypted(CoreMessage.EncryptedContent(ciphertext: ciphertext, nonce: nonce, senderPublicKey: senderPubKey))
        default:
            throw DecodingError.dataCorruptedError(forKey: .type, in: container, debugDescription: "Unknown type: \(type)")
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
        case .encrypted(let encrypted):
            try container.encode("encrypted", forKey: .type)
            try container.encode(encrypted.ciphertext, forKey: .ciphertext)
            try container.encode(encrypted.nonce, forKey: .nonce)
            try container.encode(encrypted.senderPublicKey, forKey: .senderPublicKey)
        }
    }
}

enum MessageSyncStatus: String, Codable {
    case pending        // Not yet synced to Hypercore
    case syncing        // Being written to Hypercore
    case synced         // Written to Hypercore
    case failed         // Failed to sync
}

// MARK: - Recovery Data

struct RecoveryData: Codable {
    let conversationKeys: [ConversationKey]

    struct ConversationKey: Codable {
        let conversationId: String
        let hypercoreKey: String
        let discoveryKey: String
    }
}
