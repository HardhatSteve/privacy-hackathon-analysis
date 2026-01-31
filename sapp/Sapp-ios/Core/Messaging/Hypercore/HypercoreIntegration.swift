import Foundation
import Combine

// MARK: - Hypercore Integration
// Factory and extensions to integrate Hypercore with existing services

// MARK: - EncryptionService Extension

extension EncryptionService {
    /// Shared instance for convenience
    static let shared = EncryptionService()

    /// Encrypt data for a recipient, returning format compatible with CoreMessage
    func encryptForCore(_ data: Data, recipientPublicKey: String) throws -> (ciphertext: String, nonce: String, senderPublicKey: String) {
        let encrypted = try encrypt(data: data, for: recipientPublicKey)
        return (
            ciphertext: encrypted.ciphertext.base64EncodedString(),
            nonce: encrypted.nonce.base64EncodedString(),
            senderPublicKey: encrypted.senderPublicKey
        )
    }

    /// Decrypt CoreMessage encrypted content
    func decryptFromCore(ciphertext: String, nonce: String, senderPublicKey: String) throws -> Data {
        guard let ciphertextData = Data(base64Encoded: ciphertext),
              let nonceData = Data(base64Encoded: nonce) else {
            throw EncryptionError.invalidFormat
        }

        // ChaCha20-Poly1305: tag is last 16 bytes of ciphertext in our format
        guard ciphertextData.count > 16 else {
            throw EncryptionError.invalidFormat
        }

        let actualCiphertext = ciphertextData.dropLast(16)
        let tag = ciphertextData.suffix(16)

        let encrypted = EncryptedMessage(
            ciphertext: Data(actualCiphertext),
            nonce: nonceData,
            tag: Data(tag),
            senderPublicKey: senderPublicKey
        )

        return try decryptToData(encryptedMessage: encrypted)
    }
}

// MARK: - Messaging Service Factory

/// Factory for creating messaging services
@MainActor
final class MessagingServiceFactory {
    static let shared = MessagingServiceFactory()

    private init() {}

    /// Feature flags
    var useHybridMessaging: Bool = true  // Set to true to enable Hypercore

    /// Create the appropriate messaging service
    func createMessagingService(
        handle: String,
        userId: String
    ) -> MessagingServicing {
        if useHybridMessaging {
            return HybridMessagingService(currentHandle: handle)
        } else {
            // Fall back to existing WebSocket-only service
            let bareKitManager = BareKitManager()
            return MessagingService(
                bareKitManager: bareKitManager,
                currentUserId: userId,
                currentHandle: handle
            )
        }
    }
}

// MARK: - Hypercore App Extensions

/// Standalone Hypercore manager for use alongside existing MessagingService
/// This allows gradual adoption of Hypercore without modifying existing AppState
@MainActor
final class HypercoreManager: ObservableObject {
    static let shared = HypercoreManager()

    @Published private(set) var hybridService: HybridMessagingService?
    @Published private(set) var isEnabled: Bool = false

    private init() {}

    /// Initialize Hypercore messaging for a user
    func initialize(handle: String) async throws {
        let service = HybridMessagingService(currentHandle: handle)
        self.hybridService = service
        self.isEnabled = true
    }

    /// Connect the hybrid service
    func connect(token: String) async throws {
        try await hybridService?.connect(token: token)
    }

    /// Shutdown Hypercore messaging
    func shutdown() async {
        await hybridService?.disconnect()
        hybridService = nil
        isEnabled = false
    }

    /// Export conversation recovery data
    func exportRecoveryData() throws -> String {
        let recoveryService = ConversationRecoveryService(
            hypercoreService: HypercoreService()
        )
        return try recoveryService.exportRecoveryDataAsJSON()
    }

    /// Import conversation recovery data
    func importRecoveryData(_ json: String, handle: String) async throws -> RecoveryResult {
        let recoveryService = ConversationRecoveryService(
            hypercoreService: HypercoreService()
        )
        return try await recoveryService.importRecoveryDataFromJSON(json, handle: handle)
    }

    /// Recover from seed phrase
    func recoverFromSeedPhrase(_ seedPhrase: String, handle: String) async throws -> RecoveryResult {
        let recoveryService = ConversationRecoveryService(
            hypercoreService: HypercoreService()
        )
        return try await recoveryService.recoverFromSeedPhrase(seedPhrase, handle: handle)
    }
}

// MARK: - Conversation Extension

extension Conversation {
    /// Create from StoredConversation
    init(from stored: StoredConversation) {
        self.init(
            id: stored.id,
            participants: stored.participants.map {
                ChatParticipant(id: $0.handle, email: nil)
            },
            createdAt: stored.createdAt,
            lastMessage: nil,
            unreadCount: stored.unreadCount,
            isPinned: stored.isPinned,
            isMuted: stored.isMuted
        )
    }
}

// MARK: - ChatMessage Extension

extension ChatMessage {
    /// Create from StoredMessage
    init?(from stored: StoredMessage) {
        let content: MessageContent
        switch stored.content {
        case .text(let text):
            content = .text(text)
        case .image(let url, let width, let height):
            content = .image(url: url, width: width, height: height)
        case .file(let url, let name, let size):
            content = .file(url: url, name: name, size: size)
        case .voice(let url, let duration):
            content = .voice(url: url, duration: duration)
        case .location(let lat, let lon, let name):
            content = .location(latitude: lat, longitude: lon, name: name)
        case .contact(let name, let address):
            content = .contact(name: name, address: address)
        case .transaction(let sig, let amount, let token):
            content = .transaction(signature: sig, amount: amount, token: token)
        case .system(let text):
            content = .system(text)
        case .encrypted:
            return nil  // Cannot convert without decryption
        }

        let status: MessageStatus
        switch stored.syncStatus {
        case .pending:
            status = .sending
        case .syncing:
            status = .sending
        case .synced:
            status = stored.readBy.isEmpty ? .delivered : .read
        case .failed:
            status = .failed
        }

        self.init(
            id: stored.id,
            conversationId: stored.conversationId,
            senderId: stored.senderId,
            content: content,
            timestamp: stored.timestamp,
            status: status,
            replyTo: stored.replyTo
        )
    }
}

// MARK: - Sync Status View Model

@MainActor
final class ConversationSyncViewModel: ObservableObject {
    @Published var syncStates: [String: ConversationSyncState] = [:]
    @Published var isGlobalSyncing = false

    private var hypercoreService: HypercoreService?

    func configure(with service: HypercoreService) {
        self.hypercoreService = service

        service.syncStatePublisher
            .receive(on: RunLoop.main)
            .assign(to: &$syncStates)
    }

    func syncConversation(_ conversationId: String) async {
        await hypercoreService?.sync(conversationId: conversationId)
    }

    func syncAll() async {
        isGlobalSyncing = true
        await hypercoreService?.syncAll()
        isGlobalSyncing = false
    }

    func getSyncProgress(for conversationId: String) -> Double {
        return syncStates[conversationId]?.syncProgress ?? 1.0
    }

    func isSynced(_ conversationId: String) -> Bool {
        return syncStates[conversationId]?.isSynced ?? true
    }
}

// MARK: - SwiftUI Views for Sync Status

import SwiftUI

/// Small indicator showing sync status for a conversation
struct SyncStatusIndicator: View {
    let syncState: ConversationSyncState?

    var body: some View {
        if let state = syncState {
            switch state.syncStatus {
            case .synced:
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
                    .font(.caption2)
            case .syncing:
                ProgressView()
                    .scaleEffect(0.5)
            case .behind:
                Image(systemName: "arrow.down.circle")
                    .foregroundColor(.orange)
                    .font(.caption2)
            case .offline:
                Image(systemName: "wifi.slash")
                    .foregroundColor(.gray)
                    .font(.caption2)
            case .error:
                Image(systemName: "exclamationmark.triangle")
                    .foregroundColor(.red)
                    .font(.caption2)
            }
        }
    }
}

/// Recovery view for importing/exporting conversation data
struct ConversationRecoveryView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var seedPhrase = ""
    @State private var isRecovering = false
    @State private var recoveryResult: RecoveryResult?
    @State private var errorMessage: String?
    @State private var exportedJSON: String?

    let handle: String
    let onRecoveryComplete: (RecoveryResult) -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("Recover from Seed Phrase") {
                    SecureField("Enter your seed phrase", text: $seedPhrase)
                        .textContentType(.password)

                    Button {
                        Task { await recoverFromSeed() }
                    } label: {
                        if isRecovering {
                            ProgressView()
                        } else {
                            Text("Recover Conversations")
                        }
                    }
                    .disabled(seedPhrase.isEmpty || isRecovering)
                }

                Section("Export for Backup") {
                    Button("Export Recovery Data") {
                        exportData()
                    }

                    if let json = exportedJSON {
                        Text(json)
                            .font(.caption)
                            .textSelection(.enabled)
                    }
                }

                if let result = recoveryResult {
                    Section("Recovery Result") {
                        LabeledContent("Conversations Recovered", value: "\(result.conversationsRecovered)")
                        LabeledContent("Identity Restored", value: result.identityKeyRestored ? "Yes" : "No")
                    }
                }

                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Conversation Recovery")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func recoverFromSeed() async {
        isRecovering = true
        errorMessage = nil

        do {
            let recoveryService = ConversationRecoveryService(
                hypercoreService: HypercoreService()
            )
            let result = try await recoveryService.recoverFromSeedPhrase(seedPhrase, handle: handle)
            recoveryResult = result
            onRecoveryComplete(result)
        } catch {
            errorMessage = error.localizedDescription
        }

        isRecovering = false
    }

    private func exportData() {
        do {
            let recoveryService = ConversationRecoveryService(
                hypercoreService: HypercoreService()
            )
            exportedJSON = try recoveryService.exportRecoveryDataAsJSON()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Preview Helpers

#if DEBUG
extension ConversationSyncState {
    static var preview: ConversationSyncState {
        ConversationSyncState(
            conversationId: "dm_alice_bob",
            localLength: 42,
            remoteLength: 42,
            lastSyncTimestamp: Date(),
            syncStatus: .synced
        )
    }
}
#endif
