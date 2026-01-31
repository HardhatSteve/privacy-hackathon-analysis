import Foundation
import Combine
import UIKit
import AVFoundation

// MARK: - Messaging Service Protocol

protocol MessagingServicing {
    var conversationsPublisher: AnyPublisher<[Conversation], Never> { get }
    var activeConversationPublisher: AnyPublisher<Conversation?, Never> { get }
    var messagesPublisher: AnyPublisher<[ChatMessage], Never> { get }
    var typingPublisher: AnyPublisher<[TypingIndicator], Never> { get }

    func connect(token: String) async throws
    func disconnect() async
    @MainActor func loadConversations() async throws
    @MainActor func loadMessages(for conversationId: String, limit: Int, before: Date?) async throws -> [ChatMessage]
    @MainActor func sendMessage(_ content: ChatMessage.MessageContent, to conversationId: String, replyTo: String?) async throws -> ChatMessage
    @MainActor func createConversation(with participants: [String], groupName: String?) async throws -> Conversation
    @MainActor func deleteConversation(_ conversationId: String) async throws
    func markAsRead(_ conversationId: String) async throws
    func setTyping(_ isTyping: Bool, in conversationId: String) async
    @MainActor func pinConversation(_ conversationId: String, pinned: Bool) async throws
    @MainActor func muteConversation(_ conversationId: String, muted: Bool) async throws
    @MainActor func updateGroupName(_ conversationId: String, groupName: String?) async throws
    @MainActor func addParticipants(_ handles: [String], to conversationId: String) async throws
    @MainActor func sendPaymentRequests(_ requests: [PaymentRequestData], in conversationId: String) async throws
    @MainActor func updatePaymentRequestStatus(_ requestId: String, status: PaymentRequestData.PaymentRequestStatus) async throws
    @MainActor func cancelPaymentRequest(_ requestId: String) async throws

    /// Updates user info after service creation (for lazy initialization)
    func updateUserInfo(userId: String, handle: String)
}

// MARK: - Messaging Service Implementation

final class MessagingService: MessagingServicing {
    private let bareKitManager: BareKitManaging
    private let webSocketService: WebSocketService
    private(set) var currentUserId: String
    private(set) var currentHandle: String
    private var _storage: MessageStorageProtocol?

    private let conversationsSubject = CurrentValueSubject<[Conversation], Never>([])
    private let activeConversationSubject = CurrentValueSubject<Conversation?, Never>(nil)
    private let messagesSubject = CurrentValueSubject<[ChatMessage], Never>([])
    private let typingSubject = CurrentValueSubject<[TypingIndicator], Never>([])

    private var cancellables = Set<AnyCancellable>()
    private var activeConversationId: String?

    var conversationsPublisher: AnyPublisher<[Conversation], Never> {
        conversationsSubject.eraseToAnyPublisher()
    }

    var activeConversationPublisher: AnyPublisher<Conversation?, Never> {
        activeConversationSubject.eraseToAnyPublisher()
    }

    var messagesPublisher: AnyPublisher<[ChatMessage], Never> {
        messagesSubject.eraseToAnyPublisher()
    }

    var typingPublisher: AnyPublisher<[TypingIndicator], Never> {
        typingSubject.eraseToAnyPublisher()
    }

    init(
        bareKitManager: BareKitManaging,
        webSocketService: WebSocketService = .shared,
        currentUserId: String,
        currentHandle: String,
        storage: MessageStorageProtocol? = nil
    ) {
        self.bareKitManager = bareKitManager
        self.webSocketService = webSocketService
        self.currentUserId = currentUserId
        self.currentHandle = currentHandle
        self._storage = storage

        setupMessageListener()
        setupWebSocketListeners()
    }

    /// Updates the user info (called when user info is loaded after service creation)
    func updateUserInfo(userId: String, handle: String) {
        self.currentUserId = userId
        // Normalize handle to lowercase for consistent comparisons
        self.currentHandle = handle.lowercased()
        print("[MessagingService] User info updated: @\(self.currentHandle)")
    }

    // MARK: - Connection Management

    /// Connect to messaging services (P2P and WebSocket)
    /// P2P initialization is optional - WebSocket is the primary messaging method
    func connect(token: String) async throws {
        // Try to initialize P2P via BareKit (optional, non-blocking for WebSocket)
        do {
            try await bareKitManager.initialize()
            print("[MessagingService] P2P initialized successfully")
        } catch {
            // P2P initialization failure is not critical - WebSocket relay will work
            print("[MessagingService] P2P initialization failed (WebSocket relay will work): \(error.localizedDescription)")
        }

        // Connect to WebSocket server for signaling and message relay (primary method)
        webSocketService.connect(handle: currentHandle, token: token)
    }

    /// Disconnect from messaging services
    func disconnect() async {
        // Leave active conversation room
        if let conversationId = activeConversationId {
            webSocketService.leaveConversation(conversationId)
            activeConversationId = nil
        }

        // Disconnect WebSocket
        webSocketService.disconnect()

        // Shutdown P2P
        await bareKitManager.shutdown()
    }

    /// Lazily gets the storage on the main actor
    @MainActor
    private var storage: MessageStorageProtocol {
        if let existing = _storage {
            return existing
        }
        let newStorage = MessageStorage()
        _storage = newStorage
        return newStorage
    }

    private func setupMessageListener() {
        bareKitManager.incomingMessagesPublisher
            .sink { [weak self] p2pMessage in
                self?.handleIncomingP2PMessage(p2pMessage)
            }
            .store(in: &cancellables)
    }

    private func setupWebSocketListeners() {
        // Listen for typing indicators from WebSocket
        webSocketService.typingPublisher
            .sink { [weak self] typingEvent in
                guard let self = self else { return }
                let indicator = TypingIndicator(
                    participantId: typingEvent.fromHandle,
                    conversationId: typingEvent.conversationId,
                    timestamp: Date()
                )
                if typingEvent.isTyping {
                    self.updateTypingIndicator(indicator)
                } else {
                    self.removeTypingIndicator(for: typingEvent.fromHandle, in: typingEvent.conversationId)
                }
            }
            .store(in: &cancellables)

        // Listen for read receipts from WebSocket
        webSocketService.readReceiptPublisher
            .sink { [weak self] readReceiptEvent in
                self?.markMessageAsRead(readReceiptEvent.messageId)
            }
            .store(in: &cancellables)

        // Listen for message signals (for P2P connection coordination)
        webSocketService.messageSignalPublisher
            .sink { [weak self] signalEvent in
                self?.handleMessageSignal(signalEvent)
            }
            .store(in: &cancellables)

        // Listen for P2P connection requests
        webSocketService.p2pRequestPublisher
            .sink { [weak self] requestEvent in
                self?.handleP2PRequest(requestEvent)
            }
            .store(in: &cancellables)

        // Listen for P2P connection accepts
        webSocketService.p2pAcceptPublisher
            .sink { [weak self] acceptEvent in
                self?.handleP2PAccept(acceptEvent)
            }
            .store(in: &cancellables)

        // Listen for incoming messages via WebSocket relay
        webSocketService.incomingMessagePublisher
            .sink { [weak self] messageEvent in
                self?.handleIncomingWebSocketMessage(messageEvent)
            }
            .store(in: &cancellables)

        // Listen for message delivery confirmations
        webSocketService.messageDeliveredPublisher
            .sink { [weak self] deliveredEvent in
                self?.updateMessageStatus(deliveredEvent.id, status: .delivered)
            }
            .store(in: &cancellables)

        // Listen for message pending/queued events (recipient offline)
        webSocketService.messagePendingPublisher
            .sink { [weak self] pendingEvent in
                print("[MessagingService] Message queued for offline recipient: \(pendingEvent.reason)")
                // Keep status as .sent - message is queued and will be delivered when recipient comes online
                self?.updateMessageStatus(pendingEvent.id, status: .sent)
            }
            .store(in: &cancellables)

        // Listen for transfer notifications
        webSocketService.transferReceivedPublisher
            .sink { [weak self] transferEvent in
                self?.handleTransferReceived(transferEvent)
            }
            .store(in: &cancellables)
    }

    private func removeTypingIndicator(for participantId: String, in conversationId: String) {
        var indicators = typingSubject.value
        indicators.removeAll { $0.participantId == participantId && $0.conversationId == conversationId }
        typingSubject.send(indicators)
    }

    private func handleMessageSignal(_ signalEvent: MessageSignalEvent) {
        // Message signals are used to coordinate P2P connections
        // When we receive a signal, it means the sender wants to establish a P2P connection
        // P2P is optional - failure doesn't affect WebSocket messaging
        Task {
            do {
                // Resolve the handle to email for P2P connection
                if let email = await resolveHandleToEmail(signalEvent.fromHandle) {
                    try await bareKitManager.connect(to: email)
                    print("[MessagingService] P2P connected via signal from @\(signalEvent.fromHandle)")
                }
            } catch {
                // P2P connection failure is not critical
                print("[MessagingService] P2P connection from signal failed (WebSocket relay will work): \(error.localizedDescription)")
            }
        }
    }

    private func handleP2PRequest(_ requestEvent: P2PRequestEvent) {
        // When we receive a P2P request, auto-accept and try to establish the connection
        // P2P is optional - failure doesn't affect WebSocket messaging
        print("[MessagingService] Received P2P request from @\(requestEvent.fromHandle)")

        Task {
            // Accept the request via WebSocket (always send this)
            webSocketService.sendP2PAccept(toHandle: requestEvent.fromHandle, conversationId: requestEvent.conversationId)

            // Try to establish P2P connection (optional)
            do {
                if let email = await resolveHandleToEmail(requestEvent.fromHandle) {
                    try await bareKitManager.connect(to: email)
                    print("[MessagingService] P2P connected to @\(requestEvent.fromHandle)")
                }
            } catch {
                // P2P connection failure is not critical
                print("[MessagingService] P2P connection to @\(requestEvent.fromHandle) failed (WebSocket relay will work): \(error.localizedDescription)")
            }
        }
    }

    private func handleP2PAccept(_ acceptEvent: P2PAcceptEvent) {
        // When our P2P request is accepted, try to establish the connection
        // P2P is optional - failure doesn't affect WebSocket messaging
        print("[MessagingService] P2P request accepted by @\(acceptEvent.fromHandle)")

        Task {
            do {
                // Resolve handle to email and connect via P2P
                if let email = await resolveHandleToEmail(acceptEvent.fromHandle) {
                    try await bareKitManager.connect(to: email)
                    print("[MessagingService] P2P connected to @\(acceptEvent.fromHandle)")
                }
            } catch {
                // P2P connection failure is not critical
                print("[MessagingService] P2P connection to @\(acceptEvent.fromHandle) failed (WebSocket relay will work): \(error.localizedDescription)")
            }
        }
    }
    
    private func handleIncomingP2PMessage(_ p2pMessage: P2PMessage) {
        Task { @MainActor in
            switch p2pMessage.content {
            case .text(let text):
                // Find or create conversation for this sender
                let conversationId = await findOrCreateConversation(with: p2pMessage.senderId)

                let chatMessage = ChatMessage(
                    id: p2pMessage.id,
                    conversationId: conversationId,
                    senderId: p2pMessage.senderId,
                    content: .text(text),
                    timestamp: p2pMessage.timestamp,
                    status: .delivered,
                    replyTo: nil
                )
                appendMessage(chatMessage)

                // Update conversation's last message and unread count
                updateConversationWithIncomingMessage(conversationId, message: chatMessage)

                // Persist the message
                try? await storage.saveMessage(chatMessage)

            case .typing:
                let conversationId = await findOrCreateConversation(with: p2pMessage.senderId)
                let indicator = TypingIndicator(
                    participantId: p2pMessage.senderId,
                    conversationId: conversationId,
                    timestamp: Date()
                )
                updateTypingIndicator(indicator)

            case .read(let messageId):
                markMessageAsRead(messageId)

            case .delivered(let messageId):
                markMessageAsDelivered(messageId)

            case .data:
                break  // Handle binary data if needed
            }
        }
    }

    /// Handles incoming messages received via WebSocket relay
    private func handleIncomingWebSocketMessage(_ messageEvent: IncomingMessageEvent) {
        Task { @MainActor in
            // Normalize sender handle for consistency
            let normalizedSenderId = messageEvent.senderId.lowercased()

            // Don't process messages from self (case-insensitive)
            guard normalizedSenderId != currentHandle.lowercased() else { return }

            // Parse content from dictionary
            let content = parseMessageContent(from: messageEvent.content)

            // Find or create conversation for this sender
            let conversationId = await findOrCreateConversation(with: normalizedSenderId)

            let chatMessage = ChatMessage(
                id: messageEvent.id,
                conversationId: conversationId,
                senderId: normalizedSenderId,
                content: content,
                timestamp: messageEvent.timestamp,
                status: .delivered,
                replyTo: messageEvent.replyTo
            )

            appendMessage(chatMessage)

            // Update conversation's last message and unread count
            updateConversationWithIncomingMessage(conversationId, message: chatMessage)

            // Persist the message
            try? await storage.saveMessage(chatMessage)

            // Trigger feedback if conversation is not active and not muted
            if activeConversationId != conversationId {
                if let conversation = conversationsSubject.value.first(where: { $0.id == conversationId }),
                   !conversation.isMuted {
                    DispatchQueue.main.async {
                        self.triggerMessageFeedback(isPaymentRequest: content.isPaymentRequest)
                    }
                }
            }

            print("[MessagingService] Received message from @\(normalizedSenderId) via WebSocket relay")
        }
    }

    /// Handles incoming transfer notifications
    private func handleTransferReceived(_ transferEvent: TransferReceivedEvent) {
        Task { @MainActor in
            // Normalize sender handle
            let normalizedSenderHandle = transferEvent.senderHandle.lowercased()

            // Determine the conversation ID
            let conversationId: String
            if let providedConversationId = transferEvent.conversationId {
                conversationId = providedConversationId
            } else {
                // Create or find conversation with the sender
                conversationId = await findOrCreateConversation(with: normalizedSenderHandle)
            }

            // Create transaction message
            let transactionContent = ChatMessage.MessageContent.transaction(
                signature: transferEvent.signature,
                amount: transferEvent.amount ?? 0.0,  // 0.0 for private transfers
                token: transferEvent.token
            )

            let chatMessage = ChatMessage(
                id: UUID().uuidString,
                conversationId: conversationId,
                senderId: normalizedSenderHandle,
                content: transactionContent,
                timestamp: transferEvent.timestamp,
                status: .delivered,
                replyTo: nil
            )

            appendMessage(chatMessage)

            // Update conversation's last message and unread count
            updateConversationWithIncomingMessage(conversationId, message: chatMessage)

            // Persist the message
            try? await storage.saveMessage(chatMessage)

            // Trigger payment received feedback if conversation is not active and not muted
            if activeConversationId != conversationId {
                if let conversation = conversationsSubject.value.first(where: { $0.id == conversationId }),
                   !conversation.isMuted {
                    DispatchQueue.main.async {
                        self.triggerPaymentFeedback()
                    }
                }
            }

            print("[MessagingService] Received crypto transfer from @\(normalizedSenderHandle): \(transferEvent.amount != nil ? String(format: "%.4f", transferEvent.amount!) : "PRIVATE") \(transferEvent.token)")
        }
    }

    /// Parses message content from a dictionary (received from WebSocket)
    private func parseMessageContent(from dict: [String: Any]) -> ChatMessage.MessageContent {
        // Check for text content
        if let text = dict["text"] as? String {
            return .text(text)
        }

        // Check for type-based content
        if let type = dict["type"] as? String {
            switch type {
            case "text":
                let text = dict["value"] as? String ?? ""
                return .text(text)
            case "image":
                let url = dict["url"] as? String ?? ""
                let width = dict["width"] as? Int
                let height = dict["height"] as? Int
                return .image(url: url, width: width, height: height)
            case "file":
                let url = dict["url"] as? String ?? ""
                let name = dict["name"] as? String ?? "File"
                let size = dict["size"] as? Int ?? 0
                return .file(url: url, name: name, size: size)
            case "voice":
                let url = dict["url"] as? String ?? ""
                let duration = dict["duration"] as? TimeInterval ?? 0
                return .voice(url: url, duration: duration)
            case "transaction":
                let signature = dict["signature"] as? String ?? ""
                let amount = dict["amount"] as? Double ?? 0
                let token = dict["token"] as? String ?? "SOL"
                return .transaction(signature: signature, amount: amount, token: token)
            default:
                return .text("[Unknown content type]")
            }
        }

        return .text("[Invalid content]")
    }

    /// Finds an existing conversation with the participant or creates a new one
    @MainActor
    private func findOrCreateConversation(with senderHandle: String) async -> String {
        // Normalize handles for consistent comparisons
        let normalizedSenderHandle = senderHandle.lowercased()
        let normalizedCurrentHandle = currentHandle.lowercased()

        // CRITICAL: Validate currentHandle is set to prevent incorrect conversation creation
        // If currentHandle is empty, the generated ID will be wrong and participants may be stored incorrectly
        guard !normalizedCurrentHandle.isEmpty else {
            print("[MessagingService] ⚠️ currentHandle is empty in findOrCreateConversation - using sender-only ID")
            // Fall back to using just the sender handle
            let conversationId = "dm_" + normalizedSenderHandle
            return conversationId
        }

        // Generate deterministic conversation ID from participant handles (sorted alphabetically)
        let participants = [normalizedCurrentHandle, normalizedSenderHandle].sorted()
        let conversationId = "dm_" + participants.joined(separator: "_")

        // Check if conversation already exists BY ID ONLY
        // IMPORTANT: DO NOT use participant-based fallback lookup as it can match wrong conversations
        // (e.g., a group containing the sender instead of the intended DM)
        if let existing = conversationsSubject.value.first(where: { $0.id == conversationId }) {
            return existing.id
        }

        // Create new conversation with deterministic ID

        // Resolve handle to email for P2P
        let email = await resolveHandleToEmail(normalizedSenderHandle)

        let participant = ChatParticipant(
            id: normalizedSenderHandle,
            email: email
        )

        // Create DM conversation - explicitly mark as NOT a group
        let conversation = Conversation(
            id: conversationId,
            participants: [participant],  // Only store the OTHER participant, not current user
            createdAt: Date(),
            lastMessage: nil,
            unreadCount: 0,
            isPinned: false,
            isMuted: false,
            isGroup: false  // Explicitly set - this is a 1-on-1 DM
        )

        // Save to storage
        try? await storage.saveConversation(conversation)

        // Join WebSocket room
        webSocketService.joinConversation(conversationId)

        // Update local state
        var conversations = conversationsSubject.value
        conversations.insert(conversation, at: 0)
        conversationsSubject.send(sortConversations(conversations))

        print("[MessagingService] Created new conversation with @\(normalizedSenderHandle)")

        return conversationId
    }

    /// Updates conversation with incoming message (last message and unread count)
    private func updateConversationWithIncomingMessage(_ conversationId: String, message: ChatMessage) {
        var conversations = conversationsSubject.value
        if let index = conversations.firstIndex(where: { $0.id == conversationId }) {
            conversations[index].lastMessage = message
            // Increment unread count if not the active conversation
            if activeConversationId != conversationId {
                conversations[index].unreadCount += 1
            }
            conversationsSubject.send(sortConversations(conversations))

            // CRITICAL: Persist the updated conversation immediately to prevent race conditions
            // This ensures that if loadConversations() is called, it gets the latest unread count
            let updatedConversation = conversations[index]
            Task {
                try? await storage.saveConversation(updatedConversation)
            }
        }
    }
    
    @MainActor
    func loadConversations() async throws {
        let loadedConversations = try await storage.loadConversations()

        // Merge with existing in-memory conversations to preserve live updates (like unread counts from incoming messages)
        let existingConversations = conversationsSubject.value
        var mergedConversations: [Conversation] = []

        for loaded in loadedConversations {
            if let existing = existingConversations.first(where: { $0.id == loaded.id }) {
                // Conversation exists in memory - use the in-memory version which has the latest unread count
                mergedConversations.append(existing)
            } else {
                // New conversation from storage - add it
                mergedConversations.append(loaded)
            }
        }

        // Add any conversations that are only in memory (newly created since last save)
        for existing in existingConversations {
            if !loadedConversations.contains(where: { $0.id == existing.id }) {
                mergedConversations.append(existing)
            }
        }

        conversationsSubject.send(sortConversations(mergedConversations))
    }

    @MainActor
    func loadMessages(for conversationId: String, limit: Int = 50, before: Date? = nil) async throws -> [ChatMessage] {
        // Leave previous conversation room if any
        if let previousConversationId = activeConversationId, previousConversationId != conversationId {
            webSocketService.leaveConversation(previousConversationId)
        }

        // Join new conversation room for real-time updates
        webSocketService.joinConversation(conversationId)
        activeConversationId = conversationId

        // Request online status for participants
        if let conversation = conversationsSubject.value.first(where: { $0.id == conversationId }) {
            let handles = conversation.participants.map { $0.id }
            webSocketService.requestStatus(for: handles)
        }

        let messages = try await storage.loadMessages(for: conversationId, limit: limit, before: before)
        messagesSubject.send(messages)

        // Update active conversation
        if let conversation = conversationsSubject.value.first(where: { $0.id == conversationId }) {
            activeConversationSubject.send(conversation)
        }

        return messages
    }
    
    @MainActor
    func sendMessage(_ content: ChatMessage.MessageContent, to conversationId: String, replyTo: String?) async throws -> ChatMessage {
        // Defensive check: ensure currentHandle is set
        guard !currentHandle.isEmpty else {
            print("[MessagingService] ❌ Cannot send message: currentHandle is empty")
            throw MessagingError.notConnected
        }

        let messageId = UUID().uuidString

        // Create local message with sending status
        var message = ChatMessage(
            id: messageId,
            conversationId: conversationId,
            senderId: currentHandle,  // Use handle as sender ID
            content: content,
            timestamp: Date(),
            status: .sending,
            replyTo: replyTo
        )

        // Add to local state immediately
        appendMessage(message)

        do {
            // Get conversation and ALL participants (fixes group chat delivery)
            guard let conversation = conversationsSubject.value.first(where: { $0.id == conversationId }) else {
                throw MessagingError.conversationNotFound
            }

            let recipients = conversation.participants
            guard !recipients.isEmpty else {
                print("[MessagingService] ❌ No participants found in conversation \(conversationId)")
                throw MessagingError.conversationNotFound
            }

            // Ensure WebSocket is authenticated before sending
            if !webSocketService.isAuthenticated {
                print("[MessagingService] Waiting for WebSocket authentication...")
                let authenticated = await webSocketService.waitForAuthentication(timeout: 5.0)
                if !authenticated {
                    print("[MessagingService] ⚠️ WebSocket not authenticated after timeout")
                    message.status = .failed
                    updateMessageStatus(messageId, status: .failed)
                    throw MessagingError.notConnected
                }
            }

            // Convert content to dictionary for WebSocket relay
            let contentDict = messageContentToDict(content)

            // Send to EACH recipient (critical for group chats)
            var allSent = true
            var successCount = 0
            var failedRecipients: [String] = []

            for recipient in recipients {
                let sendSuccess = webSocketService.sendMessage(
                    id: messageId,
                    conversationId: conversationId,
                    toHandle: recipient.handle,
                    content: contentDict,
                    replyTo: replyTo
                )

                if sendSuccess {
                    successCount += 1
                    print("[MessagingService] ✅ Message sent to @\(recipient.handle) via WebSocket relay")
                } else {
                    allSent = false
                    failedRecipients.append(recipient.handle)
                    print("[MessagingService] ❌ Failed to send to @\(recipient.handle)")
                }
            }

            // Update status based on delivery results
            if allSent {
                message.status = .sent
                updateMessageStatus(messageId, status: .sent)
                print("[MessagingService] ✅ Message delivered to all \(recipients.count) recipient(s)")
            } else if successCount > 0 {
                // Partial delivery - mark as sent but log the failures
                message.status = .sent
                updateMessageStatus(messageId, status: .sent)
                print("[MessagingService] ⚠️ Partial delivery: \(successCount)/\(recipients.count) recipients. Failed: \(failedRecipients.joined(separator: ", "))")
            } else {
                // All recipients failed
                print("[MessagingService] ❌ WebSocket send failed to all recipients")
                message.status = .failed
                updateMessageStatus(messageId, status: .failed)
                throw MessagingError.messageSendFailed
            }

            // Persist message
            try await storage.saveMessage(message)

            // Update conversation's last message
            updateConversationLastMessage(conversationId, message: message)

            return message
        } catch {
            // Update status to failed
            message.status = .failed
            updateMessageStatus(messageId, status: .failed)
            throw error
        }
    }
    
    @MainActor
    func createConversation(with participantHandles: [String], groupName: String? = nil) async throws -> Conversation {
        // Defensive check: ensure currentHandle is set
        guard !currentHandle.isEmpty else {
            print("[MessagingService] ❌ Cannot create conversation: currentHandle is empty")
            throw MessagingError.notConnected
        }

        // Normalize participant handles to lowercase for consistent comparisons
        let normalizedParticipants = participantHandles.map { $0.lowercased() }

        // Generate deterministic conversation ID based on participants
        let allParticipants = ([currentHandle] + normalizedParticipants).sorted()
        let conversationId: String

        if normalizedParticipants.count == 1 {
            // Direct message - use dm_ prefix
            conversationId = "dm_" + allParticipants.joined(separator: "_")
        } else {
            // Group chat - use group_ prefix
            conversationId = "group_" + allParticipants.joined(separator: "_")
        }

        print("[MessagingService] Creating conversation with deterministic ID: \(conversationId)")

        // Check if conversation already exists
        if let existing = conversationsSubject.value.first(where: { $0.id == conversationId }) {
            print("[MessagingService] Conversation already exists, returning existing: \(conversationId)")
            return existing
        }

        // Look up display names and resolve handles to emails for P2P connection
        var participants: [ChatParticipant] = []

        for handle in normalizedParticipants {
            // Resolve handle to email for P2P connection
            let email = await resolveHandleToEmail(handle)

            participants.append(ChatParticipant(
                id: handle,
                email: email
            ))
        }

        let isGroup = normalizedParticipants.count > 1
        let conversation = Conversation(
            id: conversationId,
            participants: participants,
            createdAt: Date(),
            lastMessage: nil,
            unreadCount: 0,
            isPinned: false,
            isMuted: false,
            isGroup: isGroup,
            groupName: isGroup ? groupName : nil
        )

        // Save to storage
        try await storage.saveConversation(conversation)

        // Join WebSocket room for this conversation
        webSocketService.joinConversation(conversationId)

        // Send P2P connection requests via WebSocket to each participant
        // This notifies them to prepare for potential P2P connection
        for handle in normalizedParticipants {
            webSocketService.sendP2PRequest(toHandle: handle, conversationId: conversationId)
        }

        // Try to establish P2P connections in the background (non-blocking)
        // P2P is optional - WebSocket relay is the primary messaging method
        Task {
            for participant in participants {
                if let email = participant.email {
                    do {
                        try await bareKitManager.connect(to: email)
                        print("[MessagingService] P2P connected to @\(participant.handle)")
                    } catch {
                        // P2P connection failure is not critical - WebSocket relay will work
                        print("[MessagingService] P2P connection to @\(participant.handle) failed (using WebSocket relay): \(error.localizedDescription)")
                    }
                }
            }
        }

        // Update local state
        var conversations = conversationsSubject.value
        conversations.insert(conversation, at: 0)
        conversationsSubject.send(conversations)

        return conversation
    }

    /// Resolves a handle to email for P2P connection
    @MainActor
    private func resolveHandleToEmail(_ handle: String) async -> String? {
        do {
            return try await SappAPIService.shared.resolveHandleToEmail(handle)
        } catch {
            return nil
        }
    }
    
    @MainActor
    func deleteConversation(_ conversationId: String) async throws {
        // Leave WebSocket room
        webSocketService.leaveConversation(conversationId)

        if activeConversationId == conversationId {
            activeConversationId = nil
        }

        try await storage.deleteConversation(conversationId)

        var conversations = conversationsSubject.value
        conversations.removeAll { $0.id == conversationId }
        conversationsSubject.send(conversations)

        if activeConversationSubject.value?.id == conversationId {
            activeConversationSubject.send(nil)
        }
    }
    
    func markAsRead(_ conversationId: String) async throws {
        guard var conversation = conversationsSubject.value.first(where: { $0.id == conversationId }) else {
            return
        }

        conversation.unreadCount = 0
        updateConversation(conversation)

        // Send read receipts for unread messages
        let unreadMessages = messagesSubject.value.filter {
            $0.conversationId == conversationId && $0.senderId != currentUserId && $0.status != .read
        }

        for message in unreadMessages {
            // Send via WebSocket for real-time delivery (primary method)
            webSocketService.sendReadReceipt(messageId: message.id, conversationId: conversationId)

            // Also try P2P for offline-capable delivery (optional, non-blocking)
            Task {
                let readReceipt = P2PMessage(
                    id: UUID().uuidString,
                    senderId: currentUserId,
                    recipientId: message.senderId,
                    content: .read(messageId: message.id),
                    timestamp: Date(),
                    signature: nil
                )
                // Silently fail if P2P is not available
                try? await bareKitManager.send(message: readReceipt, to: message.senderId)
            }
        }
    }
    
    func setTyping(_ isTyping: Bool, in conversationId: String) async {
        guard let conversation = conversationsSubject.value.first(where: { $0.id == conversationId }) else {
            return
        }

        let recipients = conversation.participants
        guard !recipients.isEmpty else {
            return
        }

        // Send typing indicator via WebSocket for real-time delivery (primary method)
        // Note: WebSocket broadcasts to conversation room, reaching all participants
        webSocketService.sendTyping(conversationId: conversationId, isTyping: isTyping)

        // Also try P2P for ALL participants (optional, non-blocking)
        if isTyping {
            for recipient in recipients {
                Task {
                    let typingMessage = P2PMessage(
                        id: UUID().uuidString,
                        senderId: currentUserId,
                        recipientId: recipient.id,
                        content: .typing,
                        timestamp: Date(),
                        signature: nil
                    )
                    // Silently fail if P2P is not available
                    try? await bareKitManager.send(message: typingMessage, to: recipient.id)
                }
            }
        }
    }
    
    @MainActor
    func pinConversation(_ conversationId: String, pinned: Bool) async throws {
        guard var conversation = conversationsSubject.value.first(where: { $0.id == conversationId }) else {
            throw MessagingError.conversationNotFound
        }

        conversation.isPinned = pinned
        updateConversation(conversation)
        try await storage.saveConversation(conversation)
    }

    @MainActor
    func muteConversation(_ conversationId: String, muted: Bool) async throws {
        guard var conversation = conversationsSubject.value.first(where: { $0.id == conversationId }) else {
            throw MessagingError.conversationNotFound
        }

        conversation.isMuted = muted
        updateConversation(conversation)
        try await storage.saveConversation(conversation)
    }

    @MainActor
    func updateGroupName(_ conversationId: String, groupName: String?) async throws {
        guard var conversation = conversationsSubject.value.first(where: { $0.id == conversationId }) else {
            throw MessagingError.conversationNotFound
        }

        // Update local state
        conversation.groupName = groupName
        updateConversation(conversation)

        // Persist to database
        try await DatabaseManager.shared.updateGroupName(conversationId, groupName: groupName)

        // Notify other participants via WebSocket (system message with attribution)
        let systemMessage = groupName != nil && !groupName!.isEmpty
            ? "@\(currentHandle) renamed group to \"\(groupName!)\""
            : "@\(currentHandle) removed the group name"

        // Send system message to all participants
        for participant in conversation.participants {
            webSocketService.sendMessage(
                id: UUID().uuidString,
                conversationId: conversationId,
                toHandle: participant.handle,
                content: ["type": "system", "text": systemMessage],
                replyTo: nil
            )
        }

        print("[MessagingService] Group name updated to: \(groupName ?? "nil")")
    }

    @MainActor
    func addParticipants(_ handles: [String], to conversationId: String) async throws {
        guard var conversation = conversationsSubject.value.first(where: { $0.id == conversationId }) else {
            throw MessagingError.conversationNotFound
        }

        let normalizedHandles = handles.map { $0.lowercased() }
        var newParticipants: [ChatParticipant] = []

        for handle in normalizedHandles {
            // Skip if already a participant
            guard !conversation.participants.contains(where: { $0.handle == handle }) else { continue }
            // Create new participant (email resolved later via handle lookup)
            newParticipants.append(ChatParticipant(id: handle, email: nil))
        }

        guard !newParticipants.isEmpty else { return }

        // Update local state
        conversation.participants.append(contentsOf: newParticipants)
        updateConversation(conversation)

        // Persist to database
        try await storage.saveConversation(conversation)

        // Send system messages for each new participant
        for participant in newParticipants {
            let systemMessage = "@\(currentHandle) added @\(participant.handle) to the group"

            let chatMessage = ChatMessage(
                id: UUID().uuidString,
                conversationId: conversationId,
                senderId: "system",
                content: .system(systemMessage),
                timestamp: Date(),
                status: .delivered,
                replyTo: nil
            )

            // Notify all participants via WebSocket
            for existingParticipant in conversation.participants {
                webSocketService.sendMessage(
                    id: chatMessage.id,
                    conversationId: conversationId,
                    toHandle: existingParticipant.handle,
                    content: ["type": "system", "text": systemMessage],
                    replyTo: nil
                )
            }

            // Store locally
            appendMessage(chatMessage)
            try await storage.saveMessage(chatMessage)
        }

        print("[MessagingService] Added \(newParticipants.count) participants to conversation \(conversationId)")
    }

    @MainActor
    func sendPaymentRequests(_ requests: [PaymentRequestData], in conversationId: String) async throws {
        guard conversationsSubject.value.contains(where: { $0.id == conversationId }) else {
            throw MessagingError.conversationNotFound
        }

        for request in requests {
            let message = ChatMessage(
                id: UUID().uuidString,
                conversationId: conversationId,
                senderId: currentHandle,
                content: .paymentRequest(request),
                timestamp: Date(),
                status: .sent,
                replyTo: nil
            )

            // Send via WebSocket to specific recipient
            webSocketService.sendMessage(
                id: message.id,
                conversationId: conversationId,
                toHandle: request.payeeHandle,
                content: paymentRequestToDict(request),
                replyTo: nil
            )

            // Store locally
            appendMessage(message)
            try await storage.saveMessage(message)
        }

        print("[MessagingService] Sent \(requests.count) payment requests in conversation \(conversationId)")
    }

    @MainActor
    func updatePaymentRequestStatus(_ requestId: String, status: PaymentRequestData.PaymentRequestStatus) async throws {
        // Find the message with this payment request
        var messages = messagesSubject.value
        guard let index = messages.firstIndex(where: {
            if case .paymentRequest(let data) = $0.content {
                return data.requestId == requestId
            }
            return false
        }) else {
            print("[MessagingService] Payment request not found: \(requestId)")
            return
        }

        // Update the status
        if case .paymentRequest(var data) = messages[index].content {
            data.status = status
            messages[index] = ChatMessage(
                id: messages[index].id,
                conversationId: messages[index].conversationId,
                senderId: messages[index].senderId,
                content: .paymentRequest(data),
                timestamp: messages[index].timestamp,
                status: messages[index].status,
                replyTo: messages[index].replyTo
            )
            messagesSubject.send(messages)

            // Persist update
            try await storage.saveMessage(messages[index])

            // Notify requester of status change
            webSocketService.sendMessage(
                id: UUID().uuidString,
                conversationId: messages[index].conversationId,
                toHandle: data.requesterId,
                content: ["type": "paymentRequestUpdate", "requestId": requestId, "status": status.rawValue],
                replyTo: nil
            )

            print("[MessagingService] Updated payment request \(requestId) to status: \(status.rawValue)")
        }
    }

    @MainActor
    func cancelPaymentRequest(_ requestId: String) async throws {
        // Find the message with this payment request
        var messages = messagesSubject.value
        guard let index = messages.firstIndex(where: {
            if case .paymentRequest(let data) = $0.content {
                return data.requestId == requestId
            }
            return false
        }) else {
            print("[MessagingService] Payment request not found for cancellation: \(requestId)")
            return
        }

        // Verify the current user is the requester (only requester can cancel)
        guard case .paymentRequest(var data) = messages[index].content else { return }
        guard data.requesterId.lowercased() == currentHandle.lowercased() else {
            print("[MessagingService] Cannot cancel payment request - not the requester")
            return
        }

        // Verify the request is still pending (can only cancel pending requests)
        guard data.status == .pending else {
            print("[MessagingService] Cannot cancel payment request - status is \(data.status.rawValue)")
            return
        }

        // Update the status to cancelled
        data.status = .cancelled
        messages[index] = ChatMessage(
            id: messages[index].id,
            conversationId: messages[index].conversationId,
            senderId: messages[index].senderId,
            content: .paymentRequest(data),
            timestamp: messages[index].timestamp,
            status: messages[index].status,
            replyTo: messages[index].replyTo
        )
        messagesSubject.send(messages)

        // Persist update
        try await storage.saveMessage(messages[index])

        // Notify the payee that the request was cancelled
        webSocketService.sendMessage(
            id: UUID().uuidString,
            conversationId: messages[index].conversationId,
            toHandle: data.payeeHandle,
            content: ["type": "paymentRequestUpdate", "requestId": requestId, "status": "cancelled"],
            replyTo: nil
        )

        print("[MessagingService] Cancelled payment request \(requestId)")
    }

    /// Converts PaymentRequestData to a dictionary for WebSocket transmission
    private func paymentRequestToDict(_ data: PaymentRequestData) -> [String: Any] {
        var dict: [String: Any] = [
            "type": "paymentRequest",
            "requestId": data.requestId,
            "requesterId": data.requesterId,
            "payeeHandle": data.payeeHandle,
            "amount": data.amount,
            "token": data.token,
            "status": data.status.rawValue,
            "createdAt": data.createdAt.timeIntervalSince1970
        ]
        if let memo = data.memo {
            dict["memo"] = memo
        }
        return dict
    }

    // MARK: - Feedback Helpers

    /// Triggers haptic/sound feedback for incoming messages
    private func triggerMessageFeedback(isPaymentRequest: Bool) {
        let settings = loadChatSettings()
        guard settings.vibrationEnabled else { return }

        if isPaymentRequest {
            // Double tap pattern for payment requests
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                generator.impactOccurred()
            }
        } else {
            // Single tap for regular messages
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()
        }

        if settings.soundEnabled {
            AudioServicesPlaySystemSound(isPaymentRequest ? 1016 : 1007)
        }
    }

    /// Triggers haptic/sound feedback for incoming payments
    private func triggerPaymentFeedback() {
        let settings = loadChatSettings()
        if settings.vibrationEnabled {
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)
        }
        if settings.soundEnabled {
            AudioServicesPlaySystemSound(1054)
        }
    }

    /// Loads chat settings from UserDefaults
    private func loadChatSettings() -> ChatSettings {
        if let data = UserDefaults.standard.data(forKey: "chatSettings"),
           let settings = try? JSONDecoder().decode(ChatSettings.self, from: data) {
            return settings
        }
        return ChatSettings()
    }

    // MARK: - Private Helpers

    /// Converts MessageContent to a dictionary for WebSocket transmission
    private func messageContentToDict(_ content: ChatMessage.MessageContent) -> [String: Any] {
        switch content {
        case .text(let text):
            return ["type": "text", "text": text]
        case .image(let url, let width, let height):
            var dict: [String: Any] = ["type": "image", "url": url]
            if let w = width { dict["width"] = w }
            if let h = height { dict["height"] = h }
            return dict
        case .file(let url, let name, let size):
            return ["type": "file", "url": url, "name": name, "size": size]
        case .voice(let url, let duration):
            return ["type": "voice", "url": url, "duration": duration]
        case .location(let lat, let lon, let name):
            var dict: [String: Any] = ["type": "location", "latitude": lat, "longitude": lon]
            if let n = name { dict["name"] = n }
            return dict
        case .contact(let name, let address):
            return ["type": "contact", "name": name, "address": address]
        case .transaction(let signature, let amount, let token):
            return ["type": "transaction", "signature": signature, "amount": amount, "token": token]
        case .system(let text):
            return ["type": "system", "text": text]
        case .paymentRequest(let data):
            return paymentRequestToDict(data)
        }
    }

    private func appendMessage(_ message: ChatMessage) {
        var messages = messagesSubject.value
        if !messages.contains(where: { $0.id == message.id }) {
            messages.append(message)
            messages.sort { $0.timestamp < $1.timestamp }
        }
        messagesSubject.send(messages)
    }
    
    private func updateMessageStatus(_ messageId: String, status: ChatMessage.MessageStatus) {
        var messages = messagesSubject.value
        if let index = messages.firstIndex(where: { $0.id == messageId }) {
            messages[index].status = status
            messagesSubject.send(messages)
        }
    }
    
    private func markMessageAsDelivered(_ messageId: String) {
        updateMessageStatus(messageId, status: .delivered)
    }
    
    private func markMessageAsRead(_ messageId: String) {
        updateMessageStatus(messageId, status: .read)
    }
    
    private func updateTypingIndicator(_ indicator: TypingIndicator) {
        var indicators = typingSubject.value.filter { !$0.isStale }
        indicators.removeAll { $0.participantId == indicator.participantId && $0.conversationId == indicator.conversationId }
        indicators.append(indicator)
        typingSubject.send(indicators)
        
        // Auto-remove after timeout
        Task {
            try? await Task.sleep(nanoseconds: 5_000_000_000)
            var current = typingSubject.value
            current.removeAll { $0.id == indicator.participantId && $0.isStale }
            typingSubject.send(current)
        }
    }
    
    private func updateConversation(_ conversation: Conversation) {
        var conversations = conversationsSubject.value
        if let index = conversations.firstIndex(where: { $0.id == conversation.id }) {
            conversations[index] = conversation
        }
        conversationsSubject.send(sortConversations(conversations))
    }
    
    private func updateConversationLastMessage(_ conversationId: String, message: ChatMessage) {
        var conversations = conversationsSubject.value
        if let index = conversations.firstIndex(where: { $0.id == conversationId }) {
            conversations[index].lastMessage = message
        }
        conversationsSubject.send(sortConversations(conversations))
    }
    
    private func sortConversations(_ conversations: [Conversation]) -> [Conversation] {
        conversations.sorted { lhs, rhs in
            if lhs.isPinned != rhs.isPinned {
                return lhs.isPinned
            }
            let lhsDate = lhs.lastMessage?.timestamp ?? lhs.createdAt
            let rhsDate = rhs.lastMessage?.timestamp ?? rhs.createdAt
            return lhsDate > rhsDate
        }
    }
    
}

// MARK: - Messaging Errors

enum MessagingError: Error, LocalizedError {
    case conversationNotFound
    case messageSendFailed
    case notConnected
    case storageError(String)
    
    var errorDescription: String? {
        switch self {
        case .conversationNotFound: return "Conversation not found"
        case .messageSendFailed: return "Failed to send message"
        case .notConnected: return "Not connected to peer"
        case .storageError(let msg): return "Storage error: \(msg)"
        }
    }
}

// MARK: - Message Storage Protocol

protocol MessageStorageProtocol {
    func loadConversations() async throws -> [Conversation]
    func saveConversation(_ conversation: Conversation) async throws
    func deleteConversation(_ conversationId: String) async throws
    func loadMessages(for conversationId: String, limit: Int, before: Date?) async throws -> [ChatMessage]
    func saveMessage(_ message: ChatMessage) async throws
    func deleteMessage(_ messageId: String) async throws
}

// MARK: - Message Storage Implementation (Core Data)

@MainActor
final class MessageStorage: MessageStorageProtocol {

    private let database = DatabaseManager.shared

    func loadConversations() async throws -> [Conversation] {
        let entities = try await database.fetchConversations()
        var conversations = entities.map { $0.toConversation() }

        // For each conversation without lastMessage, try to fetch the latest message
        for i in 0..<conversations.count {
            if conversations[i].lastMessage == nil {
                let messages = try await database.fetchMessages(for: conversations[i].id, limit: 1, before: nil)
                if let latestMessage = messages.last {
                    let chatMessage = latestMessage.toChatMessage()
                    conversations[i].lastMessage = chatMessage

                    // Also update the database so future loads are faster
                    try await database.updateConversation(conversations[i].id, lastMessage: chatMessage)
                }
            }
        }

        return conversations
    }

    func saveConversation(_ conversation: Conversation) async throws {
        // Check if conversation exists
        if let existing = try await database.fetchConversation(byId: conversation.id) {
            // Update existing conversation
            existing.isPinned = conversation.isPinned
            existing.isMuted = conversation.isMuted
            existing.unreadCount = Int32(conversation.unreadCount)
            existing.groupName = conversation.groupName
            existing.updatedAt = Date()

            if let lastMessage = conversation.lastMessage {
                existing.lastMessageId = lastMessage.id
                existing.lastMessageTimestamp = lastMessage.timestamp
                existing.lastMessagePreview = lastMessage.content.previewText
            }

            database.saveContext()
        } else {
            // Create new conversation
            _ = try await database.createConversation(
                id: conversation.id,
                participants: conversation.participants,
                isPinned: conversation.isPinned,
                isMuted: conversation.isMuted,
                groupName: conversation.groupName
            )
        }
    }

    func deleteConversation(_ conversationId: String) async throws {
        try await database.deleteConversation(conversationId)
    }

    func loadMessages(for conversationId: String, limit: Int, before: Date?) async throws -> [ChatMessage] {
        let entities = try await database.fetchMessages(for: conversationId, limit: limit, before: before)
        return entities.map { $0.toChatMessage() }
    }

    func saveMessage(_ message: ChatMessage) async throws {
        // Check if message already exists
        if try await database.fetchMessage(byId: message.id) != nil {
            // Update message status
            try await database.updateMessageStatus(message.id, status: message.status)
        } else {
            // Create new message
            _ = try await database.createMessage(message)
        }

        // Update conversation's last message
        try await database.updateConversation(message.conversationId, lastMessage: message)
    }

    func deleteMessage(_ messageId: String) async throws {
        try await database.deleteMessage(messageId)
    }
}

// MARK: - Typing Indicator Extension

extension TypingIndicator: Identifiable {
    var id: String { "\(participantId)-\(conversationId)" }
}
