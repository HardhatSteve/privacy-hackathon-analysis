import Foundation
import Combine

// MARK: - Hybrid Messaging Service
// Integrates Hypercore P2P with existing WebSocket messaging
// Phase 1: Dual-write to both WebSocket and Hypercore

@MainActor
final class HybridMessagingService: MessagingServicing {
    // Core services
    private let hypercoreService: HypercoreService
    private let webSocketService: WebSocketService
    private let encryptionService: EncryptionService
    private let conversationStore: ConversationStore

    // User info
    private(set) var currentHandle: String
    private var currentToken: String?

    // Publishers
    private let conversationsSubject = CurrentValueSubject<[Conversation], Never>([])
    private let activeConversationSubject = CurrentValueSubject<Conversation?, Never>(nil)
    private let messagesSubject = CurrentValueSubject<[ChatMessage], Never>([])
    private let typingSubject = CurrentValueSubject<[TypingIndicator], Never>([])

    private var cancellables = Set<AnyCancellable>()
    private var activeConversationId: String?

    // Prevents store subscription from double-sending when we update directly
    private var isUpdatingConversations = false

    // Feature flags
    var hypercoreEnabled: Bool = true
    var webSocketFallbackOnly: Bool = false  // If true, only use WebSocket when Hypercore fails

    // MARK: - Protocol Conformance

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

    // MARK: - Initialization

    init(
        currentHandle: String,
        webSocketService: WebSocketService = .shared,
        encryptionService: EncryptionService = .shared,
        conversationStore: ConversationStore = .shared
    ) {
        self.currentHandle = currentHandle
        self.webSocketService = webSocketService
        self.encryptionService = encryptionService
        self.conversationStore = conversationStore
        self.hypercoreService = HypercoreService()

        setupSubscriptions()
    }

    private func setupSubscriptions() {
        // Subscribe to Hypercore sync completions
        hypercoreService.entriesPublisher
            .sink { [weak self] (conversationId, entries) in
                self?.handleHypercoreEntries(conversationId: conversationId, entries: entries)
            }
            .store(in: &cancellables)

        // Subscribe to Hypercore conversation changes
        hypercoreService.conversationsPublisher
            .sink { [weak self] cores in
                self?.handleHypercoreCoreUpdates(cores)
            }
            .store(in: &cancellables)

        // Subscribe to WebSocket incoming messages (fallback/relay)
        webSocketService.incomingMessagePublisher
            .sink { [weak self] event in
                self?.handleWebSocketMessage(event)
            }
            .store(in: &cancellables)

        // Subscribe to WebSocket typing indicators
        webSocketService.typingPublisher
            .sink { [weak self] event in
                self?.handleTypingEvent(event)
            }
            .store(in: &cancellables)

        // Subscribe to WebSocket read receipts
        webSocketService.readReceiptPublisher
            .sink { [weak self] event in
                self?.handleReadReceipt(event)
            }
            .store(in: &cancellables)

        // Subscribe to WebSocket group name updates
        webSocketService.groupNameUpdatePublisher
            .sink { [weak self] event in
                self?.handleGroupNameUpdate(event)
            }
            .store(in: &cancellables)

        // Subscribe to participant left events (when another user leaves a group)
        webSocketService.participantLeftPublisher
            .sink { [weak self] event in
                Task { @MainActor in
                    self?.handleParticipantLeft(event)
                }
            }
            .store(in: &cancellables)

        // Subscribe to conversation deleted events (when conversation is removed server-side)
        webSocketService.conversationDeletedPublisher
            .sink { [weak self] event in
                Task { @MainActor in
                    self?.handleConversationDeleted(event)
                }
            }
            .store(in: &cancellables)

        // Subscribe to group added events (when current user is added to a group)
        webSocketService.groupAddedPublisher
            .sink { [weak self] event in
                Task { @MainActor in
                    self?.handleGroupAdded(event)
                }
            }
            .store(in: &cancellables)

        // Subscribe to group member added events (when someone is added to a group we're in)
        webSocketService.groupMemberAddedPublisher
            .sink { [weak self] event in
                Task { @MainActor in
                    self?.handleGroupMemberAdded(event)
                }
            }
            .store(in: &cancellables)

        // Subscribe to group created events (when a new group is created and we're a participant)
        webSocketService.groupCreatedPublisher
            .sink { [weak self] event in
                Task { @MainActor in
                    self?.handleGroupCreated(event)
                }
            }
            .store(in: &cancellables)

        // Subscribe to conversation store changes with debounce to prevent rapid-fire updates
        // that can cause collection view inconsistency crashes (NSInternalInconsistencyException)
        conversationStore.$conversations
            .debounce(for: .milliseconds(100), scheduler: RunLoop.main)
            .receive(on: RunLoop.main)
            .sink { [weak self] stored in
                self?.updateConversationsFromStore(stored)
            }
            .store(in: &cancellables)
    }

    // MARK: - Connection Management

    func connect(token: String) async throws {
        currentToken = token

        // Switch to this user's data store (isolates data between accounts)
        conversationStore.switchUser(handle: currentHandle)

        // Initialize Hypercore service (P2P layer - optional)
        if hypercoreEnabled {
            do {
                try await hypercoreService.initialize(handle: currentHandle)
                if hypercoreService.isInitialized {
                    print("[HybridMessaging] ✅ Hypercore P2P initialized")
                } else {
                    print("[HybridMessaging] ⚠️ Hypercore running in stub mode - using WebSocket relay only")
                }
            } catch {
                print("[HybridMessaging] Hypercore init failed: \(error) - using WebSocket relay only")
                // Continue with WebSocket only
            }
        }

        // Connect WebSocket (always required for now)
        webSocketService.connect(handle: currentHandle, token: token)

        // Load conversations from local store (now user-specific)
        try await loadConversations()
    }

    func disconnect() async {
        webSocketService.disconnect()
        await hypercoreService.shutdown()
        activeConversationId = nil
        activeConversationSubject.send(nil)

        // Clear current user's in-memory data (but NOT disk data - they need it when logging back in)
        conversationStore.clearCurrentUser()
        sendConversations([], sorted: false)
        messagesSubject.send([])
    }

    /// Updates user info after service creation (for lazy initialization)
    func updateUserInfo(userId: String, handle: String) {
        let previousHandle = self.currentHandle
        // Normalize handle to lowercase for consistent comparisons
        let normalizedHandle = handle.lowercased()
        self.currentHandle = normalizedHandle
        print("[HybridMessaging] User info updated: @\(normalizedHandle)")

        // If handle changed, switch to the new user's data store
        if normalizedHandle != previousHandle && !normalizedHandle.isEmpty {
            conversationStore.switchUser(handle: normalizedHandle)
        }
    }

    // MARK: - Conversation Management

    @MainActor
    func loadConversations() async throws {
        // Load from local store first (instant UI update)
        let stored = conversationStore.getAllConversations()
        let conversations = stored.map { convertToConversation($0) }
        sendConversations(conversations)

        // Then sync from Hypercore
        if hypercoreService.isInitialized {
            await hypercoreService.syncAll()
        }
    }

    @MainActor
    func createConversation(with participants: [String], groupName: String? = nil) async throws -> Conversation {
        // Defensive check: ensure currentHandle is set
        guard !currentHandle.isEmpty else {
            print("[HybridMessaging] ❌ Cannot create conversation: currentHandle is empty")
            throw MessagingError.notConnected
        }

        // Normalize participant handles to lowercase for consistent comparisons
        let normalizedParticipants = participants.map { $0.lowercased() }

        print("[HybridMessaging] Creating conversation with participants: \(normalizedParticipants)")
        let isGroup = normalizedParticipants.count > 1

        // Create in Hypercore (primary storage) - only if actually available (not stub mode)
        if hypercoreService.isInitialized {
            print("[HybridMessaging] Using Hypercore for conversation creation (P2P enabled)")
            do {
                let core = try await hypercoreService.createConversation(
                    participants: normalizedParticipants,
                    isGroup: isGroup,
                    groupName: groupName
                )

                // If user previously left this conversation, clear the left status
                if conversationStore.hasLeftConversation(core.id) {
                    conversationStore.clearLeftStatus(core.id)
                    print("[HybridMessaging] Cleared left status for re-joined conversation: \(core.id)")
                }

                // Store locally - only store other participants (not currentHandle)
                let otherParticipants = normalizedParticipants.filter { $0 != currentHandle }
                var stored = StoredConversation(
                    id: core.id,
                    hypercoreKey: core.hypercoreKey,
                    discoveryKey: core.discoveryKey,
                    participants: otherParticipants.map {
                        StoredParticipant(handle: $0, writerKey: nil, messagingPublicKey: nil)
                    },
                    createdAt: Date(),
                    isGroup: isGroup
                )
                stored.groupName = isGroup ? groupName : nil
                conversationStore.saveConversation(stored)

                let conversation = convertToConversation(stored)

                // Register group with backend for offline delivery and membership validation
                // All participants (including current user) need to be sent
                let allParticipantsForBackend = Array(Set(normalizedParticipants + [currentHandle]))
                if isGroup {
                    webSocketService.sendGroupCreate(
                        conversationId: core.id,
                        participants: allParticipantsForBackend,
                        groupName: groupName
                    )
                    print("[HybridMessaging] ✅ Group registered with backend: \(core.id)")
                }

                // Also broadcast group name to all participants via WebSocket (for immediate UI update)
                if isGroup, let name = groupName, !name.isEmpty {
                    for participant in otherParticipants {
                        webSocketService.sendGroupNameUpdate(
                            conversationId: core.id,
                            groupName: name,
                            toHandle: participant
                        )
                    }
                    print("[HybridMessaging] ✅ Group name '\(name)' broadcast to \(otherParticipants.count) participants")
                }

                print("[HybridMessaging] ✅ Conversation created via Hypercore: \(conversation.id)")
                return conversation
            } catch {
                print("[HybridMessaging] ❌ Hypercore creation failed: \(error), falling back to local")
                // Fall through to local fallback
            }
        } else {
            print("[HybridMessaging] Using WebSocket relay mode (Hypercore not available)")
        }

        // Fallback: Create deterministic ID and store locally
        let allParticipants = Array(Set(normalizedParticipants + [currentHandle]))
        let conversationId = ConversationCore.generateId(participants: allParticipants, isGroup: isGroup)

        // If user previously left this conversation, clear the left status
        // This handles the case where a new group is created with the same participants
        if conversationStore.hasLeftConversation(conversationId) {
            conversationStore.clearLeftStatus(conversationId)
            print("[HybridMessaging] Cleared left status for re-joined conversation: \(conversationId)")
        }

        // Store only other participants (not currentHandle) for consistent recipient lookup
        let otherParticipants = allParticipants.filter { $0 != currentHandle }
        var stored = StoredConversation(
            id: conversationId,
            hypercoreKey: "",
            discoveryKey: "",
            participants: otherParticipants.map {
                StoredParticipant(handle: $0, writerKey: nil, messagingPublicKey: nil)
            },
            createdAt: Date(),
            isGroup: isGroup
        )
        stored.groupName = isGroup ? groupName : nil
        conversationStore.saveConversation(stored)

        let conversation = convertToConversation(stored)
        var current = conversationsSubject.value
        current.append(conversation)
        sendConversations(current)

        // Register group with backend for offline delivery and membership validation
        if isGroup {
            webSocketService.sendGroupCreate(
                conversationId: conversationId,
                participants: allParticipants,
                groupName: groupName
            )
            print("[HybridMessaging] ✅ Group registered with backend: \(conversationId)")
        }

        // Also broadcast group name to all participants via WebSocket (for immediate UI update)
        if isGroup, let name = groupName, !name.isEmpty {
            for participant in otherParticipants {
                webSocketService.sendGroupNameUpdate(
                    conversationId: conversationId,
                    groupName: name,
                    toHandle: participant
                )
            }
            print("[HybridMessaging] ✅ Group name '\(name)' broadcast to \(otherParticipants.count) participants")
        }

        print("[HybridMessaging] ✅ Local conversation created: \(conversationId)")
        return conversation
    }

    @MainActor
    func deleteConversation(_ conversationId: String) async throws {
        // Get conversation before deleting to send leave notification if it's a group
        let isGroupConversation = conversationStore.getConversation(conversationId)?.isGroup ?? conversationId.hasPrefix("group_")

        if let conv = conversationStore.getConversation(conversationId), conv.isGroup {
            // CRITICAL: Send group:leave to backend FIRST to update the database
            // This ensures the participant is removed from the server-side conversation
            // and prevents the conversation from reappearing on resync
            webSocketService.sendGroupLeave(conversationId: conversationId)
            print("[HybridMessaging] Sent group:leave to backend for \(conversationId)")

            // Then notify other participants via a system message (existing behavior)
            let recipients = conv.participants.filter { $0.handle.lowercased() != currentHandle.lowercased() }
            for recipient in recipients {
                webSocketService.sendMessage(
                    id: UUID().uuidString,
                    conversationId: conversationId,
                    toHandle: recipient.handle,
                    content: ["type": "system", "text": "@\(currentHandle) left the group"],
                    replyTo: nil
                )
            }
            print("[HybridMessaging] Notified \(recipients.count) participants about group leave")
        }

        // CRITICAL FIX: Mark group conversation as "left" BEFORE removing it.
        // This prevents the conversation from being recreated when WebSocket messages arrive.
        // This is the key fix for the bug where leaving a group causes it to reappear
        // when another user also leaves or sends a message.
        if isGroupConversation {
            conversationStore.markConversationAsLeft(conversationId)
            print("[HybridMessaging] Marked group conversation as left: \(conversationId)")
        }

        // Leave the WebSocket room
        webSocketService.leaveConversation(conversationId)

        // Remove from Hypercore
        if hypercoreService.isInitialized {
            try await hypercoreService.leaveConversation(conversationId)
        }

        // Remove from local store
        conversationStore.removeConversation(conversationId)

        // Update published conversations
        var current = conversationsSubject.value
        current.removeAll { $0.id == conversationId }
        sendConversations(current, sorted: false)

        if activeConversationId == conversationId {
            activeConversationId = nil
            activeConversationSubject.send(nil)
            messagesSubject.send([])
        }

        print("[HybridMessaging] Conversation \(conversationId) deleted locally")
    }

    // MARK: - Message Operations

    @MainActor
    func loadMessages(for conversationId: String, limit: Int, before: Date?) async throws -> [ChatMessage] {
        activeConversationId = conversationId

        // Load from local store first
        let stored = conversationStore.getMessages(for: conversationId, limit: limit, before: before)
        let messages = stored.compactMap { convertToChatMessage($0) }
        messagesSubject.send(messages)

        // Update active conversation
        if let conv = conversationsSubject.value.first(where: { $0.id == conversationId }) {
            activeConversationSubject.send(conv)
        }

        // Sync from Hypercore in background
        if hypercoreService.isInitialized {
            await hypercoreService.sync(conversationId: conversationId)
        }

        // Join WebSocket room for real-time updates
        webSocketService.joinConversation(conversationId)

        return messages
    }

    @MainActor
    func sendMessage(_ content: ChatMessage.MessageContent, to conversationId: String, replyTo: String?) async throws -> ChatMessage {
        // Defensive check: ensure currentHandle is set
        guard !currentHandle.isEmpty else {
            print("[HybridMessaging] ❌ Cannot send message: currentHandle is empty")
            throw MessagingError.notConnected
        }

        let messageId = UUID().uuidString
        let timestamp = Date()

        // Create ChatMessage for immediate UI update
        let chatMessage = ChatMessage(
            id: messageId,
            conversationId: conversationId,
            senderId: currentHandle,
            content: content,
            timestamp: timestamp,
            status: .sending,
            replyTo: replyTo
        )

        // Add to UI immediately (optimistic update)
        var currentMessages = messagesSubject.value
        currentMessages.append(chatMessage)
        messagesSubject.send(currentMessages)

        // Dual-write: Local Store + Hypercore + WebSocket

        // 1. Always persist locally first (regardless of Hypercore status)
        let storedContent = convertToStoredContent(content)
        var stored = StoredMessage(
            id: messageId,
            conversationId: conversationId,
            senderId: currentHandle,
            content: storedContent,
            timestamp: timestamp,
            replyTo: replyTo,
            isOutgoing: true,
            syncStatus: .pending,
            signature: nil
        )
        conversationStore.saveMessage(stored)

        // 2. Write to Hypercore if available (for P2P sync)
        if hypercoreService.isInitialized && hypercoreEnabled {
            do {
                let coreMessage = try await createCoreMessage(
                    id: messageId,
                    content: content,
                    conversationId: conversationId,
                    replyTo: replyTo,
                    timestamp: timestamp
                )
                try await hypercoreService.appendMessage(coreMessage, to: conversationId)

                // Update local store with synced status and signature
                stored.syncStatus = .synced
                stored.signature = coreMessage.signature
                conversationStore.saveMessage(stored)

            } catch {
                print("[HybridMessaging] Hypercore write failed: \(error)")
                // Message is still saved locally, continue with WebSocket
            }
        }

        // 3. Send via WebSocket (for real-time delivery when P2P not available)
        // Ensure WebSocket is authenticated before sending
        if !webSocketService.isAuthenticated {
            print("[HybridMessaging] Waiting for WebSocket authentication...")
            let authenticated = await webSocketService.waitForAuthentication(timeout: 5.0)
            if !authenticated {
                print("[HybridMessaging] ⚠️ WebSocket not authenticated after timeout - message saved locally only")
                updateMessageStatus(messageId, status: .failed)
                return chatMessage
            }
        }

        // Send to ALL recipients in the conversation (fixes group chat delivery)
        if let conv = conversationStore.getConversation(conversationId) {
            // Filter out current user to get all OTHER participants
            let recipients = conv.participants.filter { $0.handle.lowercased() != currentHandle.lowercased() }

            guard !recipients.isEmpty else {
                print("[HybridMessaging] ❌ No recipients found in conversation \(conversationId)")
                print("[HybridMessaging] currentHandle: \(currentHandle)")
                print("[HybridMessaging] participants: \(conv.participants.map { $0.handle })")
                updateMessageStatus(messageId, status: .failed)
                return chatMessage
            }

            let contentDict = createWebSocketContentDict(content)
            var allSent = true
            var successCount = 0
            var failedRecipients: [String] = []

            // Send to EACH recipient (critical for group chats)
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
                    print("[HybridMessaging] ✅ Message sent to @\(recipient.handle) via WebSocket")
                } else {
                    allSent = false
                    failedRecipients.append(recipient.handle)
                    print("[HybridMessaging] ❌ Failed to send to @\(recipient.handle)")
                }
            }

            // Update status based on delivery results
            if allSent {
                updateMessageStatus(messageId, status: .sent)
                print("[HybridMessaging] ✅ Message delivered to all \(recipients.count) recipient(s)")
            } else if successCount > 0 {
                // Partial delivery - mark as sent but log the failures
                updateMessageStatus(messageId, status: .sent)
                print("[HybridMessaging] ⚠️ Partial delivery: \(successCount)/\(recipients.count) recipients. Failed: \(failedRecipients.joined(separator: ", "))")
            } else {
                updateMessageStatus(messageId, status: .failed)
                print("[HybridMessaging] ❌ WebSocket send failed to all recipients")
            }
        } else {
            print("[HybridMessaging] ❌ Conversation not found in store: \(conversationId)")
            updateMessageStatus(messageId, status: .failed)
        }

        return chatMessage
    }

    // MARK: - Read Receipts

    func markAsRead(_ conversationId: String) async throws {
        guard let conv = conversationStore.getConversation(conversationId) else { return }

        // Get unread message IDs
        let messages = conversationStore.getMessages(for: conversationId)
        let unreadIds = messages
            .filter { !$0.isOutgoing && !$0.readBy.contains(currentHandle) }
            .map { $0.id }

        guard !unreadIds.isEmpty else { return }

        // Write read receipts to Hypercore
        if hypercoreService.isInitialized {
            for messageId in unreadIds {
                let receipt = ReadReceipt(
                    messageId: messageId,
                    readBy: currentHandle,
                    timestamp: Date()
                )
                try? await hypercoreService.appendEntry(.readReceipt(receipt), to: conversationId)
            }
        }

        // Send via WebSocket for real-time notification
        for messageId in unreadIds {
            webSocketService.sendReadReceipt(messageId: messageId, conversationId: conversationId)
        }

        // Update local store
        for messageId in unreadIds {
            conversationStore.updateMessageStatus(messageId, in: conversationId, status: .synced)
        }
    }

    // MARK: - Typing Indicators

    func setTyping(_ isTyping: Bool, in conversationId: String) async {
        // Send via WebSocket (real-time)
        webSocketService.sendTyping(conversationId: conversationId, isTyping: isTyping)

        // Optionally write to Hypercore for persistence (usually not needed for typing)
        // Skip for now to reduce noise in the Hypercore
    }

    // MARK: - Conversation Settings

    @MainActor
    func pinConversation(_ conversationId: String, pinned: Bool) async throws {
        guard var conv = conversationStore.getConversation(conversationId) else { return }
        conv.isPinned = pinned
        conversationStore.saveConversation(conv)

        // Update published conversations
        var current = conversationsSubject.value
        if let index = current.firstIndex(where: { $0.id == conversationId }) {
            current[index].isPinned = pinned
            sendConversations(current)
        }
    }

    @MainActor
    func muteConversation(_ conversationId: String, muted: Bool) async throws {
        guard var conv = conversationStore.getConversation(conversationId) else { return }
        conv.isMuted = muted
        conversationStore.saveConversation(conv)

        // Update published conversations
        var current = conversationsSubject.value
        if let index = current.firstIndex(where: { $0.id == conversationId }) {
            current[index].isMuted = muted
            sendConversations(current, sorted: false)
        }
    }

    @MainActor
    func updateGroupName(_ conversationId: String, groupName: String?) async throws {
        guard var conv = conversationStore.getConversation(conversationId) else { return }
        conv.groupName = groupName
        conversationStore.saveConversation(conv)

        // Update published conversations
        var current = conversationsSubject.value
        if let index = current.firstIndex(where: { $0.id == conversationId }) {
            current[index].groupName = groupName
            sendConversations(current, sorted: false)
        }

        // Broadcast to all participants via WebSocket
        let recipients = conv.participants.filter { $0.handle.lowercased() != currentHandle.lowercased() }
        for recipient in recipients {
            webSocketService.sendGroupNameUpdate(
                conversationId: conversationId,
                groupName: groupName,
                toHandle: recipient.handle
            )
        }

        print("[HybridMessaging] Group name updated to: \(groupName ?? "nil") and broadcast to \(recipients.count) participants")
    }

    @MainActor
    func addParticipants(_ handles: [String], to conversationId: String) async throws {
        guard var conv = conversationStore.getConversation(conversationId) else { return }

        let normalizedHandles = handles.map { $0.lowercased() }
        var newParticipants: [StoredParticipant] = []

        for handle in normalizedHandles {
            guard !conv.participants.contains(where: { $0.handle == handle }) else { continue }
            newParticipants.append(StoredParticipant(handle: handle, writerKey: nil, messagingPublicKey: nil))
        }

        guard !newParticipants.isEmpty else { return }

        conv.participants.append(contentsOf: newParticipants)
        conversationStore.saveConversation(conv)

        // Update published conversations
        var current = conversationsSubject.value
        if let index = current.firstIndex(where: { $0.id == conversationId }) {
            current[index].participants.append(contentsOf: newParticipants.map { ChatParticipant(id: $0.handle, email: nil) })
            sendConversations(current, sorted: false)
        }

        // Notify via WebSocket for each new participant (backend updates DB and notifies others)
        for participant in newParticipants {
            webSocketService.sendGroupMemberAdd(conversationId: conversationId, handle: participant.handle)
        }

        print("[HybridMessaging] Added \(newParticipants.count) participants to \(conversationId)")
    }

    @MainActor
    func sendPaymentRequests(_ requests: [PaymentRequestData], in conversationId: String) async throws {
        guard let conv = conversationStore.getConversation(conversationId) else {
            print("[HybridMessaging] Conversation not found: \(conversationId)")
            return
        }

        // Ensure WebSocket is authenticated before sending
        if !webSocketService.isConnected || !webSocketService.isAuthenticated {
            let authenticated = await webSocketService.waitForAuthentication(timeout: 5.0)
            if !authenticated {
                print("[HybridMessaging] ⚠️ WebSocket not authenticated - payment requests saved locally only")
                // Still save locally but mark as failed
                for request in requests {
                    let messageId = UUID().uuidString
                    let message = ChatMessage(
                        id: messageId,
                        conversationId: conversationId,
                        senderId: currentHandle,
                        content: .paymentRequest(request),
                        timestamp: Date(),
                        status: .failed,
                        replyTo: nil
                    )

                    var messages = messagesSubject.value
                    messages.append(message)
                    messagesSubject.send(messages)

                    let storedContent = StoredMessageContent.text("paymentRequest:\(request.requestId):\(request.requesterId):\(request.payeeHandle):\(request.amount):\(request.token):\(request.status.rawValue)")
                    conversationStore.saveMessage(StoredMessage(
                        id: messageId,
                        conversationId: conversationId,
                        senderId: currentHandle,
                        content: storedContent,
                        timestamp: Date(),
                        replyTo: nil,
                        isOutgoing: true,
                        syncStatus: .failed,
                        signature: nil
                    ))
                }
                return
            }
        }

        for request in requests {
            let messageId = UUID().uuidString
            let message = ChatMessage(
                id: messageId,
                conversationId: conversationId,
                senderId: currentHandle,
                content: .paymentRequest(request),
                timestamp: Date(),
                status: .sending,
                replyTo: nil
            )

            // 1. Store locally first (optimistic UI update)
            var messages = messagesSubject.value
            messages.append(message)
            messagesSubject.send(messages)

            // 2. Save to persistent storage
            let storedContent = StoredMessageContent.text("paymentRequest:\(request.requestId):\(request.requesterId):\(request.payeeHandle):\(request.amount):\(request.token):\(request.status.rawValue)")
            conversationStore.saveMessage(StoredMessage(
                id: messageId,
                conversationId: conversationId,
                senderId: currentHandle,
                content: storedContent,
                timestamp: Date(),
                replyTo: nil,
                isOutgoing: true,
                syncStatus: .pending,
                signature: nil
            ))

            // 3. Send via WebSocket to the specific payee
            let contentDict = createWebSocketContentDict(.paymentRequest(request))
            let sendSuccess = webSocketService.sendMessage(
                id: messageId,
                conversationId: conversationId,
                toHandle: request.payeeHandle,
                content: contentDict,
                replyTo: nil
            )

            // 4. Update message status based on delivery result
            if sendSuccess {
                updateMessageStatus(messageId, status: .sent)
                print("[HybridMessaging] ✅ Payment request sent to @\(request.payeeHandle)")
            } else {
                updateMessageStatus(messageId, status: .failed)
                print("[HybridMessaging] ❌ Failed to send payment request to @\(request.payeeHandle)")
            }
        }

        print("[HybridMessaging] Processed \(requests.count) payment requests")
    }

    @MainActor
    func updatePaymentRequestStatus(_ requestId: String, status: PaymentRequestData.PaymentRequestStatus) async throws {
        // Find and update the message with this request ID
        var messages = messagesSubject.value
        if let index = messages.firstIndex(where: {
            if case .paymentRequest(let data) = $0.content {
                return data.requestId == requestId
            }
            return false
        }) {
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
            }
        }

        print("[HybridMessaging] Updated payment request \(requestId) to \(status.rawValue)")
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
            print("[HybridMessaging] Payment request not found for cancellation: \(requestId)")
            return
        }

        // Verify the current user is the requester (only requester can cancel)
        guard case .paymentRequest(var data) = messages[index].content else { return }
        guard data.requesterId.lowercased() == currentHandle.lowercased() else {
            print("[HybridMessaging] Cannot cancel payment request - not the requester")
            return
        }

        // Verify the request is still pending
        guard data.status == .pending else {
            print("[HybridMessaging] Cannot cancel payment request - status is \(data.status.rawValue)")
            return
        }

        // Update the status to cancelled
        data.status = .cancelled
        let updatedMessage = ChatMessage(
            id: messages[index].id,
            conversationId: messages[index].conversationId,
            senderId: messages[index].senderId,
            content: .paymentRequest(data),
            timestamp: messages[index].timestamp,
            status: messages[index].status,
            replyTo: messages[index].replyTo
        )
        messages[index] = updatedMessage
        messagesSubject.send(messages)

        // Broadcast cancellation to all participants in the conversation
        if let conv = conversationStore.getConversation(updatedMessage.conversationId) {
            let recipients = conv.participants.filter { $0.handle.lowercased() != currentHandle.lowercased() }
            for recipient in recipients {
                webSocketService.sendMessage(
                    id: UUID().uuidString,
                    conversationId: updatedMessage.conversationId,
                    toHandle: recipient.handle,
                    content: ["type": "paymentRequestUpdate", "requestId": requestId, "status": "cancelled"],
                    replyTo: nil
                )
            }
            print("[HybridMessaging] Cancelled payment request \(requestId) and notified \(recipients.count) participants")
        } else {
            // Fallback: at least notify the payee
            webSocketService.sendMessage(
                id: UUID().uuidString,
                conversationId: updatedMessage.conversationId,
                toHandle: data.payeeHandle,
                content: ["type": "paymentRequestUpdate", "requestId": requestId, "status": "cancelled"],
                replyTo: nil
            )
            print("[HybridMessaging] Cancelled payment request \(requestId) and notified payee")
        }
    }

    // MARK: - Private Methods

    /// Finds an existing DM conversation with the participant or creates a new one.
    /// This ensures conversations exist when receiving messages from new senders.
    private func findOrCreateDMConversation(with senderHandle: String) -> String {
        // Normalize handles to lowercase for consistent comparisons
        let normalizedSenderHandle = senderHandle.lowercased()
        let normalizedCurrentHandle = currentHandle.lowercased()

        // CRITICAL: Validate currentHandle is set to prevent incorrect participant storage
        // If currentHandle is empty, we can't properly filter participants, leading to
        // 1-on-1 chats being displayed as groups (all participants stored instead of just the other party)
        guard !normalizedCurrentHandle.isEmpty else {
            print("[HybridMessaging] ⚠️ currentHandle is empty in findOrCreateDMConversation - this may cause display issues")
            // Fall back to using just the sender handle to at least have a working conversation
            // This is a degraded state but better than storing wrong participants
            let conversationId = "dm_" + normalizedSenderHandle
            return conversationId
        }

        // Generate deterministic conversation ID from participant handles (sorted alphabetically)
        let participantHandles = [normalizedCurrentHandle, normalizedSenderHandle].sorted()
        let conversationId = "dm_" + participantHandles.joined(separator: "_")

        // Check if conversation already exists
        if let existing = conversationStore.getConversation(conversationId) {
            return existing.id
        }

        // Create new conversation - store only the other participant (not currentHandle)
        let otherParticipant = normalizedSenderHandle
        let stored = StoredConversation(
            id: conversationId,
            hypercoreKey: "",
            discoveryKey: "",
            participants: [StoredParticipant(
                handle: otherParticipant,
                writerKey: nil,
                messagingPublicKey: nil,
                displayName: nil,
                addedAt: Date(),
                addedBy: nil
            )],
            createdAt: Date(),
            isGroup: false
        )
        conversationStore.saveConversation(stored)

        // Join WebSocket room for real-time updates
        webSocketService.joinConversation(conversationId)

        // Update published conversations
        var current = conversationsSubject.value
        current.append(convertToConversation(stored))
        sendConversations(current)

        print("[HybridMessaging] Created new DM conversation with @\(normalizedSenderHandle)")

        return conversationId
    }

    /// Finds an existing group conversation or creates a new one from the conversation ID.
    /// Group IDs contain all participants: "group_alice_bob_charlie"
    private func findOrCreateGroupConversation(conversationId: String, senderHandle: String) -> String? {
        // Normalize sender handle
        let normalizedSenderHandle = senderHandle.lowercased()
        let normalizedCurrentHandle = currentHandle.lowercased()

        // CRITICAL: Check if user has left this conversation
        // If so, do NOT recreate it - return nil to indicate message should be ignored
        if conversationStore.hasLeftConversation(conversationId) {
            print("[HybridMessaging] ⚠️ Ignoring message for left conversation: \(conversationId)")
            return nil
        }

        // Check if conversation already exists
        if let existing = conversationStore.getConversation(conversationId) {
            return existing.id
        }

        // CRITICAL: Validate currentHandle is set to prevent incorrect participant storage
        // If currentHandle is empty, the filter below won't work correctly, causing ALL
        // participants from the ID to be stored. This makes the conversation display incorrectly
        guard !normalizedCurrentHandle.isEmpty else {
            print("[HybridMessaging] ⚠️ currentHandle is empty in findOrCreateGroupConversation - cannot properly filter participants")
            // Return the conversation ID as-is; the conversation will be properly created
            // when currentHandle is set and user reopens the conversation
            // This prevents incorrect participant storage while maintaining message delivery
            return conversationId
        }

        // Parse participants from the group conversation ID
        // Format: "group_handle1_handle2_handle3" (sorted alphabetically)
        var participantHandles: [String]
        if conversationId.hasPrefix("group_") {
            let withoutPrefix = String(conversationId.dropFirst("group_".count))
            participantHandles = withoutPrefix.components(separatedBy: "_").map { $0.lowercased() }
        } else {
            // Fallback: just use current user and sender
            participantHandles = [normalizedCurrentHandle, normalizedSenderHandle].sorted()
        }

        // Store only other participants (not currentHandle) for consistent recipient lookup
        // NOTE: If normalizedCurrentHandle is empty, this filter won't remove anything,
        // causing all participants to be stored - leading to incorrect display
        let otherParticipants = participantHandles.filter { $0 != normalizedCurrentHandle }

        // Create new group conversation
        let stored = StoredConversation(
            id: conversationId,
            hypercoreKey: "",
            discoveryKey: "",
            participants: otherParticipants.map { handle in
                StoredParticipant(
                    handle: handle,
                    writerKey: nil,
                    messagingPublicKey: nil,
                    displayName: nil,
                    addedAt: Date(),
                    addedBy: handle == normalizedSenderHandle ? normalizedSenderHandle : nil
                )
            },
            createdAt: Date(),
            isGroup: true
        )
        conversationStore.saveConversation(stored)

        // Join WebSocket room for real-time updates
        webSocketService.joinConversation(conversationId)

        // Update published conversations
        var current = conversationsSubject.value
        current.append(convertToConversation(stored))
        sendConversations(current)

        print("[HybridMessaging] Created new group conversation with \(otherParticipants.count) other participants")

        return conversationId
    }

    /// Resolves the correct conversation ID for an incoming message.
    /// Handles both DM and group conversations.
    /// Returns nil if the message should be ignored (e.g., from a left group).
    private func resolveConversationId(for event: IncomingMessageEvent) -> String? {
        let eventConversationId = event.conversationId

        // Check if it's a group conversation
        if eventConversationId.hasPrefix("group_") {
            // Returns nil if user has left this group
            return findOrCreateGroupConversation(conversationId: eventConversationId, senderHandle: event.senderId)
        }

        // For DMs, generate deterministic ID from participants
        return findOrCreateDMConversation(with: event.senderId)
    }

    private func createCoreMessage(
        id: String,
        content: ChatMessage.MessageContent,
        conversationId: String,
        replyTo: String?,
        timestamp: Date
    ) async throws -> CoreMessage {
        // Encrypt content
        let contentData = try encodeContent(content)

        // Get recipient public keys from conversation
        guard let conv = conversationStore.getConversation(conversationId) else {
            throw HypercoreError.conversationNotFound
        }

        // For now, use a simple encryption (in production, use per-participant encryption)
        let encrypted = try await encryptForConversation(contentData, conversation: conv)

        // Sign the message
        let signature = try encryptionService.sign(data: contentData)

        return CoreMessage(
            id: id,
            senderId: currentHandle,
            content: encrypted,
            timestamp: timestamp,
            replyTo: replyTo,
            signature: signature
        )
    }

    private func encodeContent(_ content: ChatMessage.MessageContent) throws -> Data {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601

        // Convert to DecryptedMessageContent for encoding
        let decrypted: DecryptedMessageContent
        switch content {
        case .text(let text):
            decrypted = .text(text)
        case .image(let url, let width, let height):
            decrypted = .image(url: url, width: width, height: height)
        case .file(let url, let name, let size):
            decrypted = .file(url: url, name: name, size: size)
        case .voice(let url, let duration):
            decrypted = .voice(url: url, duration: duration)
        case .location(let lat, let lon, let name):
            decrypted = .location(latitude: lat, longitude: lon, name: name)
        case .contact(let name, let address):
            decrypted = .contact(name: name, address: address)
        case .transaction(let sig, let amount, let token):
            decrypted = .transaction(signature: sig, amount: amount, token: token)
        case .system(let text):
            decrypted = .system(text)
        case .paymentRequest(let data):
            // Encode payment request as a special text format for storage
            decrypted = .text("paymentRequest:\(data.requestId):\(data.requesterId):\(data.payeeHandle):\(data.amount):\(data.token):\(data.status.rawValue)")
        }

        return try encoder.encode(decrypted)
    }

    private func encryptForConversation(_ data: Data, conversation: StoredConversation) async throws -> CoreMessage.EncryptedContent {
        // Get the first recipient's public key (simplified - in production, encrypt for each recipient)
        // Use case-insensitive comparison for handle matching
        let recipientKey = conversation.participants
            .first { $0.handle.lowercased() != currentHandle.lowercased() }?
            .messagingPublicKey ?? ""

        if recipientKey.isEmpty {
            // No recipient key - store as base64 (unencrypted for now)
            return CoreMessage.EncryptedContent(
                ciphertext: data.base64EncodedString(),
                nonce: "",
                senderPublicKey: ""
            )
        }

        let encrypted = try encryptionService.encryptForCore(data, recipientPublicKey: recipientKey)
        return CoreMessage.EncryptedContent(
            ciphertext: encrypted.ciphertext,
            nonce: encrypted.nonce,
            senderPublicKey: encrypted.senderPublicKey
        )
    }

    private func createWebSocketContentDict(_ content: ChatMessage.MessageContent) -> [String: Any] {
        var data: [String: Any] = [:]

        switch content {
        case .text(let text):
            data["type"] = "text"
            data["text"] = text
        case .image(let url, let width, let height):
            data["type"] = "image"
            data["url"] = url
            if let w = width { data["width"] = w }
            if let h = height { data["height"] = h }
        case .file(let url, let name, let size):
            data["type"] = "file"
            data["url"] = url
            data["name"] = name
            data["size"] = size
        case .voice(let url, let duration):
            data["type"] = "voice"
            data["url"] = url
            data["duration"] = duration
        case .location(let lat, let lon, let name):
            data["type"] = "location"
            data["latitude"] = lat
            data["longitude"] = lon
            if let n = name { data["name"] = n }
        case .contact(let name, let address):
            data["type"] = "contact"
            data["name"] = name
            data["address"] = address
        case .transaction(let sig, let amount, let token):
            data["type"] = "transaction"
            data["signature"] = sig
            data["amount"] = amount
            data["token"] = token
        case .system(let text):
            data["type"] = "system"
            data["text"] = text
        case .paymentRequest(let requestData):
            data["type"] = "paymentRequest"
            data["requestId"] = requestData.requestId
            data["requesterId"] = requestData.requesterId
            data["payeeHandle"] = requestData.payeeHandle
            data["amount"] = requestData.amount
            data["token"] = requestData.token
            data["status"] = requestData.status.rawValue
            data["createdAt"] = requestData.createdAt.timeIntervalSince1970
            if let memo = requestData.memo { data["memo"] = memo }
        }

        return data
    }

    private func updateMessageStatus(_ messageId: String, status: ChatMessage.MessageStatus) {
        var messages = messagesSubject.value
        if let index = messages.firstIndex(where: { $0.id == messageId }) {
            messages[index].status = status
            messagesSubject.send(messages)
        }
    }

    private func handleHypercoreEntries(conversationId: String, entries: [CoreEntry]) {
        // Process entries and update local store
        conversationStore.processEntries(entries, for: conversationId, currentHandle: currentHandle)

        // If this is the active conversation, update messages
        if conversationId == activeConversationId {
            let stored = conversationStore.getMessages(for: conversationId)
            let messages = stored.compactMap { convertToChatMessage($0) }
            messagesSubject.send(messages)
        }
    }

    private func handleHypercoreCoreUpdates(_ cores: [ConversationCore]) {
        for core in cores {
            conversationStore.updateConversationFromCore(core)
        }
    }

    private func handleWebSocketMessage(_ event: IncomingMessageEvent) {
        // Normalize sender handle for comparison
        let normalizedSenderId = event.senderId.lowercased()

        // Only process if not from self (case-insensitive comparison)
        guard normalizedSenderId != currentHandle.lowercased() else { return }

        // Check for payment request status updates (cancellation, completion, etc.)
        if let contentType = event.content["type"] as? String, contentType == "paymentRequestUpdate" {
            handlePaymentRequestUpdate(event)
            return
        }

        // CRITICAL: Check if this is a system message about the current user being re-added to a group
        // This MUST happen BEFORE the left conversation check, otherwise we'll miss the re-add notification
        if let contentType = event.content["type"] as? String, contentType == "system",
           let text = event.content["text"] as? String,
           event.conversationId.hasPrefix("group_") {
            // Pattern: "@someone added @currentUser to the group"
            let addedPattern = "added @\(currentHandle.lowercased()) to the group"
            if text.lowercased().contains(addedPattern) {
                // Current user is being re-added to a group they left!
                print("[HybridMessaging] 🔄 Detected re-add to group: \(event.conversationId)")
                conversationStore.clearLeftStatus(event.conversationId)
            }
        }

        // Resolve conversation ID (handles both DM and group chats)
        // Returns nil if user has left the group - in that case, ignore the message
        guard let conversationId = resolveConversationId(for: event) else {
            print("[HybridMessaging] Ignoring message from left group: \(event.conversationId)")
            return
        }

        // Check if we already have this message from Hypercore
        if conversationStore.getMessage(by: event.id, in: conversationId) != nil {
            return  // Already synced via Hypercore
        }

        // Store the WebSocket message (fallback path) with normalized sender ID
        let content = convertEventContent(event.content)
        let stored = StoredMessage(
            id: event.id,
            conversationId: conversationId,
            senderId: normalizedSenderId,
            content: content,
            timestamp: event.timestamp,
            replyTo: event.replyTo,
            isOutgoing: false,
            syncStatus: .synced,
            signature: nil
        )
        conversationStore.saveMessage(stored)

        // Update UI if active conversation
        if conversationId == activeConversationId {
            let allStored = conversationStore.getMessages(for: conversationId)
            let messages = allStored.compactMap { convertToChatMessage($0) }
            messagesSubject.send(messages)
        }

        // Update conversation list
        updateConversationsFromStore(conversationStore.conversations)

        let isGroup = conversationId.hasPrefix("group_")
        print("[HybridMessaging] Received \(isGroup ? "group" : "DM") message from @\(normalizedSenderId) via WebSocket relay")
    }

    /// Handle incoming payment request status updates (cancelled, paid, etc.)
    private func handlePaymentRequestUpdate(_ event: IncomingMessageEvent) {
        guard let requestId = event.content["requestId"] as? String,
              let statusRaw = event.content["status"] as? String else {
            print("[HybridMessaging] Invalid paymentRequestUpdate - missing requestId or status")
            return
        }

        // Parse the new status
        let newStatus: PaymentRequestData.PaymentRequestStatus
        switch statusRaw.lowercased() {
        case "cancelled": newStatus = .cancelled
        case "paid": newStatus = .paid
        case "declined": newStatus = .declined
        case "expired": newStatus = .expired
        default:
            print("[HybridMessaging] Unknown payment request status: \(statusRaw)")
            return
        }

        // Find and update the payment request in memory
        var messages = messagesSubject.value
        if let index = messages.firstIndex(where: {
            if case .paymentRequest(let data) = $0.content {
                return data.requestId == requestId
            }
            return false
        }) {
            guard case .paymentRequest(var data) = messages[index].content else { return }
            data.status = newStatus
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

            // Also update in persistent storage
            let conversationId = messages[index].conversationId
            if var storedMsg = conversationStore.getMessage(by: messages[index].id, in: conversationId) {
                storedMsg.content = .text("paymentRequest:\(data.requestId):\(data.requesterId):\(data.payeeHandle):\(data.amount):\(data.token):\(newStatus.rawValue)")
                conversationStore.saveMessage(storedMsg)
            }

            print("[HybridMessaging] ✅ Updated payment request \(requestId) to status: \(newStatus.rawValue)")
        } else {
            print("[HybridMessaging] Payment request \(requestId) not found for status update")
        }
    }

    private func handleTypingEvent(_ event: TypingEvent) {
        let indicator = TypingIndicator(
            participantId: event.fromHandle,
            conversationId: event.conversationId,
            timestamp: Date()
        )

        var indicators = typingSubject.value
        indicators.removeAll { $0.participantId == event.fromHandle && $0.conversationId == event.conversationId }

        if event.isTyping {
            indicators.append(indicator)
        }

        typingSubject.send(indicators)

        // Auto-remove after 5 seconds
        let handle = event.fromHandle
        let convId = event.conversationId
        Task {
            try? await Task.sleep(nanoseconds: 5_000_000_000)
            var current = typingSubject.value
            current.removeAll { $0.participantId == handle && $0.conversationId == convId }
            typingSubject.send(current)
        }
    }

    private func handleReadReceipt(_ event: ReadReceiptEvent) {
        // Update message in store
        if let convId = activeConversationId {
            conversationStore.updateMessageStatus(event.messageId, in: convId, status: .synced)

            // Update UI
            var messages = messagesSubject.value
            if let index = messages.firstIndex(where: { $0.id == event.messageId }) {
                messages[index].status = .read
                messagesSubject.send(messages)
            }
        }
    }

    private func handleGroupNameUpdate(_ event: GroupNameUpdateEvent) {
        // Update local store
        guard var conv = conversationStore.getConversation(event.conversationId) else {
            print("[HybridMessaging] Received group name update for unknown conversation: \(event.conversationId)")
            return
        }

        conv.groupName = event.groupName
        conversationStore.saveConversation(conv)

        // Update published conversations
        var current = conversationsSubject.value
        if let index = current.firstIndex(where: { $0.id == event.conversationId }) {
            current[index].groupName = event.groupName
            sendConversations(current, sorted: false)
        }

        // Update active conversation if it's the one being updated
        if activeConversationId == event.conversationId {
            if var activeConv = activeConversationSubject.value {
                activeConv.groupName = event.groupName
                activeConversationSubject.send(activeConv)
            }
        }

        print("[HybridMessaging] Received group name update from @\(event.updatedBy): \(event.groupName ?? "nil") for \(event.conversationId)")
    }

    /// Handles when another participant leaves a group chat
    @MainActor
    private func handleParticipantLeft(_ event: ParticipantLeftEvent) {
        guard var conv = conversationStore.getConversation(event.conversationId) else {
            print("[HybridMessaging] Received participant left for unknown conversation: \(event.conversationId)")
            return
        }

        // Update local participant list to match server state
        let updatedParticipants = event.remainingParticipants
            .filter { $0.lowercased() != currentHandle.lowercased() }  // Exclude self
            .map { handle in
                // Try to preserve existing participant data if available
                if let existing = conv.participants.first(where: { $0.handle.lowercased() == handle.lowercased() }) {
                    return existing
                }
                return StoredParticipant(
                    handle: handle,
                    writerKey: nil,
                    messagingPublicKey: nil,
                    displayName: nil,
                    addedAt: Date(),
                    addedBy: nil
                )
            }

        conv.participants = updatedParticipants
        conversationStore.saveConversation(conv)

        // Update published conversations
        var current = conversationsSubject.value
        if let index = current.firstIndex(where: { $0.id == event.conversationId }) {
            current[index].participants = updatedParticipants.map { ChatParticipant(id: $0.handle, email: nil) }
            sendConversations(current, sorted: false)
        }

        // Update active conversation if it's the one being updated
        if activeConversationId == event.conversationId {
            if var activeConv = activeConversationSubject.value {
                activeConv.participants = updatedParticipants.map { ChatParticipant(id: $0.handle, email: nil) }
                activeConversationSubject.send(activeConv)
            }
        }

        print("[HybridMessaging] Participant @\(event.handle) left conversation \(event.conversationId). Remaining: \(updatedParticipants.count) participants")
    }

    /// Handles when a conversation is deleted by the server (e.g., all other participants left)
    @MainActor
    private func handleConversationDeleted(_ event: ConversationDeletedEvent) {
        let conversationId = event.conversationId

        // Remove from local store
        conversationStore.removeConversation(conversationId)

        // Update published conversations
        var current = conversationsSubject.value
        current.removeAll { $0.id == conversationId }
        sendConversations(current, sorted: false)

        // Clear active conversation if it was the deleted one
        if activeConversationId == conversationId {
            activeConversationId = nil
            activeConversationSubject.send(nil)
            messagesSubject.send([])
        }

        // Leave the WebSocket room
        webSocketService.leaveConversation(conversationId)

        print("[HybridMessaging] Conversation deleted by server: \(conversationId) - Reason: \(event.reason)")
    }

    /// Handles when the current user is added to a group by another user
    @MainActor
    private func handleGroupAdded(_ event: GroupAddedEvent) {
        let conversationId = event.conversationId

        // Check if we already have this conversation locally
        if conversationStore.getConversation(conversationId) != nil {
            print("[HybridMessaging] Group already exists locally: \(conversationId)")
            return
        }

        // Create a new conversation locally
        let participants = event.participants.map { handle in
            StoredParticipant(
                handle: handle.lowercased(),
                writerKey: nil,
                messagingPublicKey: nil,
                displayName: nil,
                addedAt: event.timestamp,
                addedBy: handle == currentHandle ? event.addedBy : nil
            )
        }

        let newConversation = StoredConversation(
            id: conversationId,
            hypercoreKey: "",  // Will be populated when P2P syncs
            discoveryKey: "",  // Will be populated when P2P syncs
            participants: participants,
            createdAt: event.timestamp,
            isGroup: true,
            groupName: event.groupName,
            lastMessageAt: nil,
            lastMessagePreview: nil,
            lastMessageSenderId: nil,
            unreadCount: 0,
            isPinned: false,
            isMuted: false
        )

        conversationStore.saveConversation(newConversation)

        // Update published conversations
        var current = conversationsSubject.value
        current.append(convertToConversation(newConversation))
        sendConversations(current)

        // Join the WebSocket room for this conversation
        webSocketService.joinConversation(conversationId)

        print("[HybridMessaging] Added to group \(conversationId) by @\(event.addedBy)")
    }

    /// Handles when a new group is created and we're a participant (but didn't create it)
    @MainActor
    private func handleGroupCreated(_ event: GroupCreatedEvent) {
        let conversationId = event.conversationId

        // Check if we already have this conversation locally
        if conversationStore.getConversation(conversationId) != nil {
            print("[HybridMessaging] Group already exists locally: \(conversationId)")
            return
        }

        // Don't process if we're the creator (we already have the local conversation)
        if event.createdBy.lowercased() == currentHandle.lowercased() {
            print("[HybridMessaging] We created this group, skipping: \(conversationId)")
            return
        }

        // Create participants list (exclude current user for local storage)
        let otherParticipants = event.participants
            .map { $0.lowercased() }
            .filter { $0 != currentHandle.lowercased() }
            .map { handle in
                StoredParticipant(
                    handle: handle,
                    writerKey: nil,
                    messagingPublicKey: nil,
                    displayName: nil,
                    addedAt: event.timestamp,
                    addedBy: event.createdBy
                )
            }

        let newConversation = StoredConversation(
            id: conversationId,
            hypercoreKey: "",  // Will be populated when P2P syncs
            discoveryKey: "",  // Will be populated when P2P syncs
            participants: otherParticipants,
            createdAt: event.timestamp,
            isGroup: true,
            groupName: event.groupName,
            lastMessageAt: nil,
            lastMessagePreview: nil,
            lastMessageSenderId: nil,
            unreadCount: 0,
            isPinned: false,
            isMuted: false
        )

        conversationStore.saveConversation(newConversation)

        // Update published conversations
        var current = conversationsSubject.value
        current.append(convertToConversation(newConversation))
        sendConversations(current)

        // Join the WebSocket room for this conversation
        webSocketService.joinConversation(conversationId)

        print("[HybridMessaging] Group created by @\(event.createdBy), joined: \(conversationId)")
    }

    /// Handles when a new member is added to a group we're already in
    @MainActor
    private func handleGroupMemberAdded(_ event: GroupMemberAddedEvent) {
        guard var conv = conversationStore.getConversation(event.conversationId) else {
            print("[HybridMessaging] Received member added for unknown conversation: \(event.conversationId)")
            return
        }

        let normalizedHandle = event.handle.lowercased()

        // Check if already a participant
        if conv.participants.contains(where: { $0.handle == normalizedHandle }) {
            print("[HybridMessaging] Member @\(normalizedHandle) already in conversation \(event.conversationId)")
            return
        }

        // Add the new participant
        let newParticipant = StoredParticipant(
            handle: normalizedHandle,
            writerKey: nil,
            messagingPublicKey: nil,
            displayName: nil,
            addedAt: event.timestamp,
            addedBy: event.addedBy
        )

        conv.participants.append(newParticipant)
        conversationStore.saveConversation(conv)

        // Update published conversations
        var current = conversationsSubject.value
        if let index = current.firstIndex(where: { $0.id == event.conversationId }) {
            current[index].participants.append(ChatParticipant(id: normalizedHandle, email: nil))
            sendConversations(current, sorted: false)
        }

        // Update active conversation if it's the one being updated
        if activeConversationId == event.conversationId {
            if var activeConv = activeConversationSubject.value {
                activeConv.participants.append(ChatParticipant(id: normalizedHandle, email: nil))
                activeConversationSubject.send(activeConv)
            }
        }

        print("[HybridMessaging] Member @\(normalizedHandle) added to \(event.conversationId) by @\(event.addedBy)")
    }

    private func updateConversationsFromStore(_ stored: [String: StoredConversation]) {
        // Skip if we're already updating directly - prevents double-send crashes
        guard !isUpdatingConversations else { return }

        let conversations = stored.values.map { convertToConversation($0) }
        conversationsSubject.send(sortConversations(conversations))
    }

    /// Safely sends conversation updates, preventing double-sends from store subscription
    private func sendConversations(_ conversations: [Conversation], sorted: Bool = true) {
        isUpdatingConversations = true
        defer { isUpdatingConversations = false }

        let toSend = sorted ? sortConversations(conversations) : conversations
        conversationsSubject.send(toSend)
    }

    // MARK: - Conversion Helpers

    private func convertToConversation(_ stored: StoredConversation) -> Conversation {
        Conversation(
            id: stored.id,
            participants: stored.participants.map {
                ChatParticipant(id: $0.handle, email: nil)
            },
            createdAt: stored.createdAt,
            lastMessage: nil,  // Could populate from lastMessagePreview
            unreadCount: stored.unreadCount,
            isPinned: stored.isPinned,
            isMuted: stored.isMuted,
            isGroup: stored.isGroup,  // Use stored isGroup flag, not computed from participant count
            groupName: stored.groupName
        )
    }

    private func convertToChatMessage(_ stored: StoredMessage) -> ChatMessage? {
        let content: ChatMessage.MessageContent
        switch stored.content {
        case .text(let text):
            // Check if this is a payment request stored as text
            if text.hasPrefix("paymentRequest:") {
                let components = text.dropFirst("paymentRequest:".count).components(separatedBy: ":")
                if components.count >= 6 {
                    let requestId = components[0]
                    let requesterId = components[1]
                    let payeeHandle = components[2]
                    let amount = Double(components[3]) ?? 0
                    let token = components[4]
                    let statusRaw = components[5]
                    let memo = components.count > 6 ? components[6] : nil

                    let status: PaymentRequestData.PaymentRequestStatus
                    switch statusRaw.lowercased() {
                    case "pending": status = .pending
                    case "paid": status = .paid
                    case "cancelled": status = .cancelled
                    case "expired": status = .expired
                    default: status = .pending
                    }

                    let paymentRequest = PaymentRequestData(
                        requestId: requestId,
                        requesterId: requesterId,
                        payeeHandle: payeeHandle,
                        amount: amount,
                        token: token,
                        memo: memo,
                        status: status,
                        createdAt: stored.timestamp
                    )
                    content = .paymentRequest(paymentRequest)
                } else {
                    content = .text(text)
                }
            } else {
                content = .text(text)
            }
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
            content = .text("[Encrypted]")  // Would decrypt here
        }

        let status: ChatMessage.MessageStatus
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

        return ChatMessage(
            id: stored.id,
            conversationId: stored.conversationId,
            senderId: stored.senderId,
            content: content,
            timestamp: stored.timestamp,
            status: status,
            replyTo: stored.replyTo
        )
    }

    private func convertToStoredContent(_ content: ChatMessage.MessageContent) -> StoredMessageContent {
        switch content {
        case .text(let text):
            return .text(text)
        case .image(let url, let width, let height):
            return .image(url: url, width: width, height: height)
        case .file(let url, let name, let size):
            return .file(url: url, name: name, size: size)
        case .voice(let url, let duration):
            return .voice(url: url, duration: duration)
        case .location(let lat, let lon, let name):
            return .location(latitude: lat, longitude: lon, name: name)
        case .contact(let name, let address):
            return .contact(name: name, address: address)
        case .transaction(let sig, let amount, let token):
            return .transaction(signature: sig, amount: amount, token: token)
        case .system(let text):
            return .system(text)
        case .paymentRequest(let data):
            // Store as a special format that can be parsed back
            return .text("paymentRequest:\(data.requestId):\(data.requesterId):\(data.payeeHandle):\(data.amount):\(data.token):\(data.status.rawValue)")
        }
    }

    private func convertEventContent(_ content: [String: Any]) -> StoredMessageContent {
        let contentType = content["type"] as? String ?? "text"

        switch contentType {
        case "text":
            let text = content["text"] as? String ?? ""
            return .text(text)
        case "image":
            let url = content["url"] as? String ?? ""
            let width = content["width"] as? Int
            let height = content["height"] as? Int
            return .image(url: url, width: width, height: height)
        case "file":
            let url = content["url"] as? String ?? ""
            let name = content["name"] as? String ?? "file"
            let size = content["size"] as? Int ?? 0
            return .file(url: url, name: name, size: size)
        case "voice":
            let url = content["url"] as? String ?? ""
            let duration = content["duration"] as? TimeInterval ?? 0
            return .voice(url: url, duration: duration)
        case "location":
            let latitude = content["latitude"] as? Double ?? 0
            let longitude = content["longitude"] as? Double ?? 0
            let name = content["name"] as? String
            return .location(latitude: latitude, longitude: longitude, name: name)
        case "contact":
            let name = content["name"] as? String ?? ""
            let address = content["address"] as? String ?? ""
            return .contact(name: name, address: address)
        case "transaction":
            let signature = content["signature"] as? String ?? ""
            let amount = content["amount"] as? Double ?? 0
            let token = content["token"] as? String ?? ""
            return .transaction(signature: signature, amount: amount, token: token)
        case "system":
            let text = content["text"] as? String ?? ""
            return .system(text)
        case "paymentRequest":
            // Parse payment request from WebSocket content
            let requestId = content["requestId"] as? String ?? UUID().uuidString
            let requesterId = content["requesterId"] as? String ?? ""
            let payeeHandle = content["payeeHandle"] as? String ?? ""
            let amount = content["amount"] as? Double ?? 0
            let token = content["token"] as? String ?? ""
            let statusRaw = content["status"] as? String ?? "pending"
            let memo = content["memo"] as? String

            // Store as special format that can be parsed by convertToChatMessage
            return .text("paymentRequest:\(requestId):\(requesterId):\(payeeHandle):\(amount):\(token):\(statusRaw)\(memo != nil ? ":\(memo!)" : "")")
        default:
            let text = content["text"] as? String ?? ""
            return .text(text)
        }
    }

    private func sortConversations(_ conversations: [Conversation]) -> [Conversation] {
        conversations.sorted { conv1, conv2 in
            // Pinned first
            if conv1.isPinned != conv2.isPinned {
                return conv1.isPinned
            }
            // Then by last message time
            let time1 = conv1.lastMessage?.timestamp ?? conv1.createdAt
            let time2 = conv2.lastMessage?.timestamp ?? conv2.createdAt
            return time1 > time2
        }
    }
}
