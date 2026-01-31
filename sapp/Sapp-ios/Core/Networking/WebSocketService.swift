import Foundation
import Combine

// MARK: - WebSocket Service

/// Manages real-time WebSocket connections for presence, typing indicators, and signaling
final class WebSocketService: ObservableObject {

    static let shared = WebSocketService()

    // MARK: - Published State

    @Published private(set) var isConnected = false
    @Published private(set) var isAuthenticated = false
    @Published private(set) var onlineUsers: Set<String> = []

    // MARK: - Publishers

    private let typingSubject = PassthroughSubject<TypingEvent, Never>()
    private let messageSignalSubject = PassthroughSubject<MessageSignalEvent, Never>()
    private let readReceiptSubject = PassthroughSubject<ReadReceiptEvent, Never>()
    private let userStatusSubject = PassthroughSubject<UserStatusEvent, Never>()
    private let p2pRequestSubject = PassthroughSubject<P2PRequestEvent, Never>()
    private let p2pAcceptSubject = PassthroughSubject<P2PAcceptEvent, Never>()
    private let p2pSignalSubject = PassthroughSubject<P2PSignalEvent, Never>()

    var typingPublisher: AnyPublisher<TypingEvent, Never> {
        typingSubject.eraseToAnyPublisher()
    }

    var messageSignalPublisher: AnyPublisher<MessageSignalEvent, Never> {
        messageSignalSubject.eraseToAnyPublisher()
    }

    var readReceiptPublisher: AnyPublisher<ReadReceiptEvent, Never> {
        readReceiptSubject.eraseToAnyPublisher()
    }

    var userStatusPublisher: AnyPublisher<UserStatusEvent, Never> {
        userStatusSubject.eraseToAnyPublisher()
    }

    var p2pRequestPublisher: AnyPublisher<P2PRequestEvent, Never> {
        p2pRequestSubject.eraseToAnyPublisher()
    }

    var p2pAcceptPublisher: AnyPublisher<P2PAcceptEvent, Never> {
        p2pAcceptSubject.eraseToAnyPublisher()
    }

    var p2pSignalPublisher: AnyPublisher<P2PSignalEvent, Never> {
        p2pSignalSubject.eraseToAnyPublisher()
    }

    // Publisher for group name updates
    private let groupNameUpdateSubject = PassthroughSubject<GroupNameUpdateEvent, Never>()

    var groupNameUpdatePublisher: AnyPublisher<GroupNameUpdateEvent, Never> {
        groupNameUpdateSubject.eraseToAnyPublisher()
    }

    // Publisher for when a participant leaves a group
    private let participantLeftSubject = PassthroughSubject<ParticipantLeftEvent, Never>()

    var participantLeftPublisher: AnyPublisher<ParticipantLeftEvent, Never> {
        participantLeftSubject.eraseToAnyPublisher()
    }

    // Publisher for when a conversation is deleted (e.g., all other participants left)
    private let conversationDeletedSubject = PassthroughSubject<ConversationDeletedEvent, Never>()

    var conversationDeletedPublisher: AnyPublisher<ConversationDeletedEvent, Never> {
        conversationDeletedSubject.eraseToAnyPublisher()
    }

    // Publisher for when the current user is added to a group
    private let groupAddedSubject = PassthroughSubject<GroupAddedEvent, Never>()

    var groupAddedPublisher: AnyPublisher<GroupAddedEvent, Never> {
        groupAddedSubject.eraseToAnyPublisher()
    }

    // Publisher for when a new member is added to a group we're in
    private let groupMemberAddedSubject = PassthroughSubject<GroupMemberAddedEvent, Never>()

    var groupMemberAddedPublisher: AnyPublisher<GroupMemberAddedEvent, Never> {
        groupMemberAddedSubject.eraseToAnyPublisher()
    }

    // Publisher for when a new group is created (current user is a participant)
    private let groupCreatedSubject = PassthroughSubject<GroupCreatedEvent, Never>()

    var groupCreatedPublisher: AnyPublisher<GroupCreatedEvent, Never> {
        groupCreatedSubject.eraseToAnyPublisher()
    }

    // Publishers for message relay (WebSocket-based messaging)
    private let incomingMessageSubject = PassthroughSubject<IncomingMessageEvent, Never>()
    private let messageDeliveredSubject = PassthroughSubject<MessageDeliveredEvent, Never>()
    private let messagePendingSubject = PassthroughSubject<MessagePendingEvent, Never>()
    private let transferReceivedSubject = PassthroughSubject<TransferReceivedEvent, Never>()

    var incomingMessagePublisher: AnyPublisher<IncomingMessageEvent, Never> {
        incomingMessageSubject.eraseToAnyPublisher()
    }

    var messageDeliveredPublisher: AnyPublisher<MessageDeliveredEvent, Never> {
        messageDeliveredSubject.eraseToAnyPublisher()
    }

    var messagePendingPublisher: AnyPublisher<MessagePendingEvent, Never> {
        messagePendingSubject.eraseToAnyPublisher()
    }

    var transferReceivedPublisher: AnyPublisher<TransferReceivedEvent, Never> {
        transferReceivedSubject.eraseToAnyPublisher()
    }

    // MARK: - Private Properties

    private var webSocketTask: URLSessionWebSocketTask?
    private var pingTimer: Timer?
    private var reconnectAttempts = 0
    private let maxReconnectAttempts = 5
    private var currentHandle: String?
    private var isReconnecting = false  // Prevents multiple simultaneous reconnect attempts

    private let baseURL: String

    private init() {
        #if DEBUG
        // IMPORTANT: Update this IP to your Mac's current local IP address
        // Find it with: ifconfig | grep "inet " | grep -v 127.0.0.1
        // For simulator: use "localhost" or "127.0.0.1"
        // For physical device: use your Mac's local IP (e.g., "192.168.1.xxx")
        #if targetEnvironment(simulator)
        baseURL = "ws://localhost:4002"
        #else
        // Physical device - update this to your Mac's IP
        baseURL = "ws://192.168.1.149:4002"
        #endif
        #else
        baseURL = "wss://sapp-backend.onrender.com"
        #endif
    }

    // MARK: - Public Methods

    /// Connect to WebSocket server
    func connect(handle: String, token: String) {
        // Prevent duplicate connections
        guard !isConnected else {
            print("[WS] ⚠️ Already connected (isConnected=true), skipping connection attempt for @\(handle)")
            print("[WS] Current handle: @\(currentHandle ?? "none"), New handle: @\(handle)")
            print("[WS] Call stack: \(Thread.callStackSymbols.prefix(3).joined(separator: " → "))")
            return
        }

        // Prevent connecting if websocket task already exists
        guard webSocketTask == nil else {
            print("[WS] ⚠️ WebSocket task already exists, skipping connection attempt for @\(handle)")
            print("[WS] Call stack: \(Thread.callStackSymbols.prefix(3).joined(separator: " → "))")
            return
        }

        print("[WS] 🔌 INITIATING CONNECTION for @\(handle)")
        currentHandle = handle

        let urlString = "\(baseURL)/socket.io/?EIO=4&transport=websocket"
        guard let url = URL(string: urlString) else {
            print("[WS] Invalid URL: \(urlString)")
            return
        }

        print("[WS] ========================================")
        print("[WS] Connecting to: \(urlString)")
        print("[WS] Handle: @\(handle)")
        print("[WS] Base URL: \(baseURL)")
        #if targetEnvironment(simulator)
        print("[WS] Running on: SIMULATOR")
        #else
        print("[WS] Running on: PHYSICAL DEVICE")
        #endif
        print("[WS] ========================================")

        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60

        let session = URLSession(configuration: configuration)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()

        // Don't mark as connected yet - wait for Socket.IO namespace connect (40 packet)
        // isConnected will be set to true when we receive the 40 packet
        isAuthenticated = false

        print("[WS] WebSocket task started, waiting for Socket.IO handshake...")

        // Start listening for messages FIRST (to catch the handshake)
        receiveMessage()

        // Start ping timer
        startPingTimer()
    }

    /// Disconnect from WebSocket server
    func disconnect() {
        print("[WS] 🔌 MANUAL DISCONNECT CALLED")
        print("[WS] Current handle: @\(currentHandle ?? "none")")
        print("[WS] Stack trace: \(Thread.callStackSymbols.prefix(5).joined(separator: "\n"))")

        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        pingTimer?.invalidate()
        pingTimer = nil
        isConnected = false
        isAuthenticated = false
        isReconnecting = false
        reconnectAttempts = 0
        onlineUsers.removeAll()
        currentHandle = nil

        print("[WS] Disconnected from server")
    }

    /// Send typing indicator
    func sendTyping(conversationId: String, isTyping: Bool) {
        let event = SocketEvent(
            event: "typing",
            data: [
                "conversationId": conversationId,
                "isTyping": isTyping
            ]
        )
        send(event)
    }

    /// Join a conversation room
    func joinConversation(_ conversationId: String) {
        let event = SocketEvent(
            event: "conversation:join",
            data: conversationId
        )
        send(event)
    }

    /// Leave a conversation room
    func leaveConversation(_ conversationId: String) {
        let event = SocketEvent(
            event: "conversation:leave",
            data: conversationId
        )
        send(event)
    }

    /// Send read receipt
    func sendReadReceipt(messageId: String, conversationId: String) {
        let event = SocketEvent(
            event: "message:read",
            data: [
                "messageId": messageId,
                "conversationId": conversationId
            ]
        )
        send(event)
    }

    /// Request status for handles
    func requestStatus(for handles: [String]) {
        let event = SocketEvent(
            event: "status:request",
            data: handles
        )
        send(event)
    }

    /// Check if a user is online
    func isOnline(_ handle: String) -> Bool {
        onlineUsers.contains(handle)
    }

    // MARK: - P2P Signaling

    /// Send a P2P connection request to another user
    func sendP2PRequest(toHandle: String, conversationId: String?) {
        var data: [String: Any] = ["toHandle": toHandle]
        if let conversationId = conversationId {
            data["conversationId"] = conversationId
        }
        let event = SocketEvent(event: "p2p:request", data: data)
        send(event)
    }

    /// Accept a P2P connection request
    func sendP2PAccept(toHandle: String, conversationId: String?) {
        var data: [String: Any] = ["toHandle": toHandle]
        if let conversationId = conversationId {
            data["conversationId"] = conversationId
        }
        let event = SocketEvent(event: "p2p:accept", data: data)
        send(event)
    }

    /// Send P2P signaling data (for WebRTC-style signaling if needed)
    func sendP2PSignal(toHandle: String, signalData: [String: Any]) {
        let event = SocketEvent(
            event: "p2p:signal",
            data: [
                "toHandle": toHandle,
                "signalData": signalData
            ]
        )
        send(event)
    }

    // MARK: - Message Relay (WebSocket-based messaging)

    /// Send a message via WebSocket relay
    /// - Returns: `true` if the message was successfully queued for sending (connected and authenticated), `false` otherwise
    @discardableResult
    func sendMessage(
        id: String,
        conversationId: String,
        toHandle: String,
        content: [String: Any],
        replyTo: String? = nil
    ) -> Bool {
        // Check authentication state before sending
        guard isAuthenticated else {
            print("[WS] Cannot send message: not authenticated")
            return false
        }

        var data: [String: Any] = [
            "id": id,
            "conversationId": conversationId,
            "toHandle": toHandle,
            "content": content
        ]
        if let replyTo = replyTo {
            data["replyTo"] = replyTo
        }

        let event = SocketEvent(event: "message:send", data: data)
        return send(event)
    }

    // MARK: - Group Name Updates

    /// Send a group name update to a specific participant
    func sendGroupNameUpdate(conversationId: String, groupName: String?, toHandle: String) {
        let event = SocketEvent(
            event: "group:nameUpdate",
            data: [
                "conversationId": conversationId,
                "groupName": groupName ?? "",
                "toHandle": toHandle
            ]
        )
        send(event)
    }

    // MARK: - Group Leave

    /// Permanently leave a group chat (updates backend database)
    func sendGroupLeave(conversationId: String) {
        let event = SocketEvent(
            event: "group:leave",
            data: [
                "conversationId": conversationId
            ]
        )
        send(event)
        print("[WS] Sent group:leave for conversation: \(conversationId)")
    }

    /// Notify when a new member is added to a group
    func sendGroupMemberAdd(conversationId: String, handle: String) {
        guard isAuthenticated else { return }
        let event = SocketEvent(
            event: "group:memberAdd",
            data: [
                "conversationId": conversationId,
                "handle": handle,
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ]
        )
        send(event)
        print("[WS] Sent group:memberAdd for @\(handle) to conversation: \(conversationId)")
    }

    /// Create a group on the backend - registers in MongoDB for offline delivery and membership validation
    /// This should be called after creating the group locally (and in Hypercore if available)
    func sendGroupCreate(conversationId: String, participants: [String], groupName: String?) {
        guard isAuthenticated else {
            print("[WS] Cannot send group:create - not authenticated")
            return
        }

        var data: [String: Any] = [
            "conversationId": conversationId,
            "participants": participants
        ]
        if let name = groupName, !name.isEmpty {
            data["groupName"] = name
        }

        let event = SocketEvent(
            event: "group:create",
            data: data
        )
        send(event)
        print("[WS] Sent group:create for \(conversationId) with \(participants.count) participants")
    }

    /// Notify recipient of a crypto transfer
    func notifyTransfer(
        recipientHandle: String,
        conversationId: String?,
        signature: String,
        amount: Double?,
        token: String,
        type: String
    ) {
        var data: [String: Any] = [
            "recipientHandle": recipientHandle,
            "signature": signature,
            "token": token,
            "type": type
        ]

        if let conversationId = conversationId {
            data["conversationId"] = conversationId
        }

        if let amount = amount {
            data["amount"] = amount
        }

        let event = SocketEvent(event: "transfer:notify", data: data)
        send(event)
    }

    // MARK: - Authentication Helpers

    /// Wait for WebSocket to be authenticated (with timeout)
    /// - Parameter timeout: Maximum time to wait for authentication (default: 5 seconds)
    /// - Returns: `true` if authenticated within timeout, `false` otherwise
    func waitForAuthentication(timeout: TimeInterval = 5.0) async -> Bool {
        // Already authenticated
        if isAuthenticated {
            return true
        }

        let startTime = Date()
        while !isAuthenticated {
            // Check timeout
            if Date().timeIntervalSince(startTime) > timeout {
                print("[WS] Authentication timeout after \(timeout) seconds")
                return false
            }
            // Sleep briefly before checking again
            try? await Task.sleep(nanoseconds: 100_000_000) // 100ms
        }
        return true
    }

    // MARK: - Private Methods

    private func authenticate(handle: String, token: String) {
        let event = SocketEvent(
            event: "authenticate",
            data: [
                "handle": handle,
                "token": token
            ]
        )
        send(event)
    }

    /// Sends an event to the WebSocket server
    /// - Returns: `true` if the message was queued for sending, `false` if sending failed (not connected or not authenticated)
    @discardableResult
    private func send(_ event: SocketEvent) -> Bool {
        // Verify WebSocket is connected
        guard webSocketTask != nil else {
            print("[WS] Cannot send \(event.event): WebSocket not connected")
            return false
        }

        // Verify authentication for all events except "authenticate"
        guard isAuthenticated || event.event == "authenticate" else {
            print("[WS] Cannot send \(event.event): not authenticated")
            return false
        }

        // Build the Socket.IO message format: 42["eventName", data]
        // The data should be the raw JSON, not the entire SocketEvent struct
        let dataJSON: String

        if let stringData = event.data as? String {
            // String data needs to be quoted
            dataJSON = "\"\(stringData)\""
        } else if let dictData = event.data as? [String: Any] {
            // Dictionary data - serialize to JSON
            guard let jsonData = try? JSONSerialization.data(withJSONObject: dictData),
                  let jsonString = String(data: jsonData, encoding: .utf8) else {
                print("[WS] Failed to serialize message data")
                return false
            }
            dataJSON = jsonString
        } else if let arrayData = event.data as? [Any] {
            // Array data - serialize to JSON
            guard let jsonData = try? JSONSerialization.data(withJSONObject: arrayData),
                  let jsonString = String(data: jsonData, encoding: .utf8) else {
                print("[WS] Failed to serialize message data")
                return false
            }
            dataJSON = jsonString
        } else if let boolData = event.data as? Bool {
            dataJSON = boolData ? "true" : "false"
        } else {
            print("[WS] Unsupported data type for event: \(event.event)")
            return false
        }

        // Socket.IO message format: 42["event", data]
        let message = "42[\"\(event.event)\",\(dataJSON)]"

        print("[WS] Sending: \(event.event)")

        webSocketTask?.send(.string(message)) { [weak self] error in
            if let error = error {
                print("[WS] Send error for \(event.event): \(error.localizedDescription)")
                // Send failure means socket is dead - trigger reconnection
                self?.handleDisconnect()
            }
        }

        return true
    }

    private func receiveMessage() {
        guard let task = webSocketTask else {
            print("[WS] receiveMessage called but webSocketTask is nil")
            return
        }

        task.receive { [weak self] result in
            switch result {
            case .success(let message):
                self?.handleMessage(message)
                // Continue receiving
                self?.receiveMessage()

            case .failure(let error):
                let nsError = error as NSError
                print("[WS] ========================================")
                print("[WS] ❌ WEBSOCKET RECEIVE ERROR")
                print("[WS] Handle: @\(self?.currentHandle ?? "unknown")")
                print("[WS] Error: \(error.localizedDescription)")
                print("[WS] Error domain: \(nsError.domain)")
                print("[WS] Error code: \(nsError.code)")
                if let underlyingError = nsError.userInfo[NSUnderlyingErrorKey] as? Error {
                    print("[WS] Underlying error: \(underlyingError)")
                }
                print("[WS] Is authenticated: \(self?.isAuthenticated ?? false)")
                print("[WS] Is connected: \(self?.isConnected ?? false)")
                print("[WS] ========================================")
                self?.handleDisconnect()
            }
        }
    }

    private func handleMessage(_ message: URLSessionWebSocketTask.Message) {
        switch message {
        case .string(let text):
            parseSocketIOMessage(text)
        case .data(let data):
            if let text = String(data: data, encoding: .utf8) {
                parseSocketIOMessage(text)
            }
        @unknown default:
            break
        }
    }

    private func parseSocketIOMessage(_ text: String) {
        // Log all incoming messages for debugging
        print("[WS] Received raw: \(text.prefix(200))")

        // Socket.IO message format: 42["event", data]
        guard text.hasPrefix("42") else {
            // Handle other Socket.IO packets (open, ping, pong, etc.)
            if text.hasPrefix("0") {
                // Socket.IO Engine.IO open packet - contains session info
                // Format: 0{"sid":"...","upgrades":[],"pingInterval":25000,"pingTimeout":60000}
                print("[WS] Socket.IO Engine.IO handshake received")
                // Now send the Socket.IO connect packet (40) to join default namespace
                print("[WS] Sending Socket.IO namespace connect (40)...")
                webSocketTask?.send(.string("40")) { error in
                    if let error = error {
                        print("[WS] Failed to send namespace connect: \(error)")
                    } else {
                        print("[WS] Namespace connect sent successfully")
                    }
                }
            } else if text == "2" {
                // Engine.IO Ping - respond with pong
                print("[WS] Ping received, sending pong")
                webSocketTask?.send(.string("3")) { _ in }
            } else if text == "3" {
                // Engine.IO Pong response
                print("[WS] Pong received")
            } else if text.hasPrefix("40") {
                // Socket.IO connect acknowledgment - connection is now established
                print("[WS] ✅ Connected to Socket.IO namespace")
                DispatchQueue.main.async { [weak self] in
                    self?.isConnected = true
                    self?.reconnectAttempts = 0
                }
                // NOW we can authenticate
                print("[WS] NOW authenticating...")
                if let handle = currentHandle {
                    authenticate(handle: handle, token: "")
                }
            }
            return
        }

        let jsonString = String(text.dropFirst(2))
        guard let data = jsonString.data(using: .utf8),
              let array = try? JSONSerialization.jsonObject(with: data) as? [Any],
              let eventName = array.first as? String else {
            print("[WS] Failed to parse Socket.IO message: \(jsonString.prefix(100))")
            return
        }

        print("[WS] Received event: \(eventName)")

        let eventData = array.count > 1 ? array[1] : nil

        DispatchQueue.main.async { [weak self] in
            self?.handleEvent(eventName, data: eventData)
        }
    }

    private func handleEvent(_ event: String, data: Any?) {
        switch event {
        case "authenticated":
            isAuthenticated = true
            reconnectAttempts = 0  // Reset reconnect counter on successful auth
            print("[WS] ✅ Authenticated successfully as @\(currentHandle ?? "unknown")")

        case "typing":
            if let dict = data as? [String: Any],
               let conversationId = dict["conversationId"] as? String,
               let fromHandle = dict["fromHandle"] as? String,
               let isTyping = dict["isTyping"] as? Bool {
                typingSubject.send(TypingEvent(
                    conversationId: conversationId,
                    fromHandle: fromHandle,
                    isTyping: isTyping
                ))
            }

        case "message:signal":
            if let dict = data as? [String: Any],
               let id = dict["id"] as? String,
               let fromHandle = dict["fromHandle"] as? String,
               let content = dict["content"] as? String {
                messageSignalSubject.send(MessageSignalEvent(
                    id: id,
                    fromHandle: fromHandle,
                    content: content,
                    timestamp: Date()
                ))
            }

        case "message:read":
            if let dict = data as? [String: Any],
               let messageId = dict["messageId"] as? String,
               let readBy = dict["readBy"] as? String {
                readReceiptSubject.send(ReadReceiptEvent(
                    messageId: messageId,
                    readBy: readBy,
                    readAt: Date()
                ))
            }

        case "user:status":
            if let dict = data as? [String: Any],
               let handle = dict["handle"] as? String,
               let isOnline = dict["isOnline"] as? Bool {
                userStatusSubject.send(UserStatusEvent(
                    handle: handle,
                    isOnline: isOnline
                ))

                if isOnline {
                    onlineUsers.insert(handle)
                } else {
                    onlineUsers.remove(handle)
                }
            }

        case "status:response":
            if let array = data as? [[String: Any]] {
                for dict in array {
                    if let handle = dict["handle"] as? String,
                       let isOnline = dict["isOnline"] as? Bool {
                        if isOnline {
                            onlineUsers.insert(handle)
                        } else {
                            onlineUsers.remove(handle)
                        }
                    }
                }
            }

        case "error":
            if let dict = data as? [String: Any],
               let message = dict["message"] as? String {
                print("[WS] Server error: \(message)")
            }

        case "p2p:request":
            if let dict = data as? [String: Any],
               let fromHandle = dict["fromHandle"] as? String {
                let conversationId = dict["conversationId"] as? String
                p2pRequestSubject.send(P2PRequestEvent(
                    fromHandle: fromHandle,
                    conversationId: conversationId
                ))
            }

        case "p2p:accept":
            if let dict = data as? [String: Any],
               let fromHandle = dict["fromHandle"] as? String {
                let conversationId = dict["conversationId"] as? String
                p2pAcceptSubject.send(P2PAcceptEvent(
                    fromHandle: fromHandle,
                    conversationId: conversationId
                ))
            }

        case "p2p:signal":
            if let dict = data as? [String: Any],
               let fromHandle = dict["fromHandle"] as? String,
               let signalData = dict["signalData"] as? [String: Any] {
                p2pSignalSubject.send(P2PSignalEvent(
                    fromHandle: fromHandle,
                    signalData: signalData
                ))
            }

        // MARK: - Message Relay Events

        case "message:received":
            if let dict = data as? [String: Any],
               let id = dict["id"] as? String,
               let conversationId = dict["conversationId"] as? String,
               let senderId = dict["senderId"] as? String,
               let content = dict["content"] as? [String: Any],
               let timestampStr = dict["timestamp"] as? String {
                let timestamp = ISO8601DateFormatter().date(from: timestampStr) ?? Date()
                let replyTo = dict["replyTo"] as? String
                incomingMessageSubject.send(IncomingMessageEvent(
                    id: id,
                    conversationId: conversationId,
                    senderId: senderId,
                    content: content,
                    timestamp: timestamp,
                    replyTo: replyTo
                ))
                print("[WS] Received message from @\(senderId)")
            }

        case "message:delivered":
            if let dict = data as? [String: Any],
               let id = dict["id"] as? String,
               let deliveredAtStr = dict["deliveredAt"] as? String {
                let deliveredAt = ISO8601DateFormatter().date(from: deliveredAtStr) ?? Date()
                messageDeliveredSubject.send(MessageDeliveredEvent(
                    id: id,
                    deliveredAt: deliveredAt
                ))
            }

        case "message:pending":
            if let dict = data as? [String: Any],
               let id = dict["id"] as? String {
                let reason = dict["reason"] as? String ?? "Unknown"
                messagePendingSubject.send(MessagePendingEvent(
                    id: id,
                    reason: reason
                ))
            }

        case "message:queued":
            if let dict = data as? [String: Any],
               let id = dict["id"] as? String {
                let reason = dict["reason"] as? String ?? "Unknown"
                let queuedAtStr = dict["queuedAt"] as? String
                print("[WS] Message queued - will be delivered when recipient comes online: \(id)")
                // Treat queued messages as pending (will be delivered later)
                messagePendingSubject.send(MessagePendingEvent(
                    id: id,
                    reason: reason
                ))
            }

        case "transfer:received":
            if let dict = data as? [String: Any],
               let senderHandle = dict["senderHandle"] as? String,
               let recipientHandle = dict["recipientHandle"] as? String,
               let signature = dict["signature"] as? String,
               let token = dict["token"] as? String,
               let typeStr = dict["type"] as? String,
               let timestampStr = dict["timestamp"] as? String {
                let conversationId = dict["conversationId"] as? String
                let amount = dict["amount"] as? Double  // nil for internal (private) transfers
                let timestamp = ISO8601DateFormatter().date(from: timestampStr) ?? Date()

                transferReceivedSubject.send(TransferReceivedEvent(
                    conversationId: conversationId,
                    senderHandle: senderHandle,
                    recipientHandle: recipientHandle,
                    amount: amount,
                    token: token,
                    signature: signature,
                    type: typeStr,
                    timestamp: timestamp
                ))
                print("[WS] Received transfer from @\(senderHandle): \(amount != nil ? String(format: "%.4f", amount!) : "PRIVATE") \(token)")
            }

        case "group:nameUpdate":
            if let dict = data as? [String: Any],
               let conversationId = dict["conversationId"] as? String {
                let groupName = dict["groupName"] as? String
                let updatedBy = dict["updatedBy"] as? String ?? ""
                let timestampStr = dict["timestamp"] as? String
                let timestamp = timestampStr.flatMap { ISO8601DateFormatter().date(from: $0) } ?? Date()

                groupNameUpdateSubject.send(GroupNameUpdateEvent(
                    conversationId: conversationId,
                    groupName: groupName?.isEmpty == true ? nil : groupName,
                    updatedBy: updatedBy,
                    timestamp: timestamp
                ))
                print("[WS] Received group name update for \(conversationId): \(groupName ?? "nil")")
            }

        case "group:participantLeft":
            if let dict = data as? [String: Any],
               let conversationId = dict["conversationId"] as? String,
               let handle = dict["handle"] as? String {
                let remainingParticipants = dict["remainingParticipants"] as? [String] ?? []
                let timestampStr = dict["timestamp"] as? String
                let timestamp = timestampStr.flatMap { ISO8601DateFormatter().date(from: $0) } ?? Date()

                participantLeftSubject.send(ParticipantLeftEvent(
                    conversationId: conversationId,
                    handle: handle,
                    remainingParticipants: remainingParticipants,
                    timestamp: timestamp
                ))
                print("[WS] Received participant left event: @\(handle) left \(conversationId)")
            }

        case "conversation:deleted":
            if let dict = data as? [String: Any],
               let conversationId = dict["conversationId"] as? String {
                let reason = dict["reason"] as? String ?? "Unknown"
                let timestampStr = dict["timestamp"] as? String
                let timestamp = timestampStr.flatMap { ISO8601DateFormatter().date(from: $0) } ?? Date()

                conversationDeletedSubject.send(ConversationDeletedEvent(
                    conversationId: conversationId,
                    reason: reason,
                    timestamp: timestamp
                ))
                print("[WS] Received conversation deleted event: \(conversationId) - \(reason)")
            }

        case "group:added":
            // Current user was added to a group
            if let dict = data as? [String: Any],
               let conversationId = dict["conversationId"] as? String,
               let participants = dict["participants"] as? [String],
               let addedBy = dict["addedBy"] as? String {
                let groupName = dict["groupName"] as? String
                let timestampStr = dict["timestamp"] as? String
                let timestamp = timestampStr.flatMap { ISO8601DateFormatter().date(from: $0) } ?? Date()

                groupAddedSubject.send(GroupAddedEvent(
                    conversationId: conversationId,
                    participants: participants,
                    groupName: groupName,
                    addedBy: addedBy,
                    timestamp: timestamp
                ))
                print("[WS] Added to group: \(conversationId) by @\(addedBy)")
            }

        case "group:memberAdded":
            // A new member was added to a group we're in
            if let dict = data as? [String: Any],
               let conversationId = dict["conversationId"] as? String,
               let handle = dict["handle"] as? String,
               let addedBy = dict["addedBy"] as? String {
                let timestampStr = dict["timestamp"] as? String
                let timestamp = timestampStr.flatMap { ISO8601DateFormatter().date(from: $0) } ?? Date()

                groupMemberAddedSubject.send(GroupMemberAddedEvent(
                    conversationId: conversationId,
                    handle: handle,
                    addedBy: addedBy,
                    timestamp: timestamp
                ))
                print("[WS] New member @\(handle) added to \(conversationId) by @\(addedBy)")
            }

        case "group:created":
            // A new group was created and we're a participant
            if let dict = data as? [String: Any],
               let conversationId = dict["conversationId"] as? String,
               let participants = dict["participants"] as? [String],
               let createdBy = dict["createdBy"] as? String {
                let groupName = dict["groupName"] as? String
                let timestampStr = dict["timestamp"] as? String
                let timestamp = timestampStr.flatMap { ISO8601DateFormatter().date(from: $0) } ?? Date()

                groupCreatedSubject.send(GroupCreatedEvent(
                    conversationId: conversationId,
                    participants: participants,
                    groupName: groupName,
                    createdBy: createdBy,
                    timestamp: timestamp
                ))
                print("[WS] Group created: \(conversationId) by @\(createdBy)")
            }

        default:
            print("[WS] Unknown event: \(event)")
        }
    }

    private func handleDisconnect() {
        // Prevent multiple simultaneous disconnect handlers
        guard !isReconnecting else {
            print("[WS] Already handling disconnect - skipping duplicate")
            return
        }

        print("[WS] ========================================")
        print("[WS] DISCONNECT DETECTED")
        print("[WS] Handle: @\(currentHandle ?? "unknown")")
        print("[WS] Was authenticated: \(isAuthenticated)")
        print("[WS] Was connected: \(isConnected)")
        print("[WS] Will attempt reconnect")
        print("[WS] ========================================")

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            // Double-check we're not already reconnecting
            guard !self.isReconnecting else { return }
            self.isReconnecting = true

            // Clean up the dead socket
            self.webSocketTask?.cancel(with: .abnormalClosure, reason: nil)
            self.webSocketTask = nil
            self.pingTimer?.invalidate()
            self.pingTimer = nil

            // Reset state
            self.isConnected = false
            self.isAuthenticated = false

            // Attempt reconnect
            self.attemptReconnect()
        }
    }

    private func attemptReconnect() {
        // Prevent reconnect if already connected
        guard !isConnected else {
            print("[WS] Already connected - canceling reconnect attempt")
            isReconnecting = false
            return
        }

        guard reconnectAttempts < maxReconnectAttempts,
              let handle = currentHandle else {
            print("[WS] Cannot reconnect: attempts=\(reconnectAttempts), handle=\(currentHandle ?? "nil")")
            isReconnecting = false
            return
        }

        reconnectAttempts += 1
        let delay = Double(reconnectAttempts) * 2.0  // Exponential backoff

        print("[WS] Scheduling reconnect in \(delay) seconds (attempt \(reconnectAttempts)/\(maxReconnectAttempts))")

        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            guard let self = self else { return }

            // Final check before reconnecting
            guard !self.isConnected else {
                print("[WS] Already reconnected - skipping scheduled reconnect")
                self.reconnectAttempts = 0  // Reset counter since we're connected
                self.isReconnecting = false
                return
            }

            print("[WS] Executing scheduled reconnect for @\(handle)")
            // Reset flag before connect (connect will start fresh)
            self.isReconnecting = false
            self.connect(handle: handle, token: "")
        }
    }

    private func startPingTimer() {
        pingTimer?.invalidate()
        pingTimer = Timer.scheduledTimer(withTimeInterval: 25, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            self.webSocketTask?.sendPing { [weak self] error in
                if let error = error {
                    print("[WS] Ping failed: \(error.localizedDescription)")
                    // Ping failure means socket is dead - trigger reconnection
                    self?.handleDisconnect()
                }
            }
        }
    }
}

// MARK: - Event Types

struct TypingEvent {
    let conversationId: String
    let fromHandle: String
    let isTyping: Bool
}

struct MessageSignalEvent {
    let id: String
    let fromHandle: String
    let content: String
    let timestamp: Date
}

struct ReadReceiptEvent {
    let messageId: String
    let readBy: String
    let readAt: Date
}

struct UserStatusEvent {
    let handle: String
    let isOnline: Bool
}

struct P2PRequestEvent {
    let fromHandle: String
    let conversationId: String?
}

struct P2PAcceptEvent {
    let fromHandle: String
    let conversationId: String?
}

struct P2PSignalEvent {
    let fromHandle: String
    let signalData: [String: Any]
}

// MARK: - Message Relay Event Types

struct IncomingMessageEvent {
    let id: String
    let conversationId: String
    let senderId: String
    let content: [String: Any]
    let timestamp: Date
    let replyTo: String?
}

struct MessageDeliveredEvent {
    let id: String
    let deliveredAt: Date
}

struct MessagePendingEvent {
    let id: String
    let reason: String
}

struct TransferReceivedEvent {
    let conversationId: String?
    let senderHandle: String
    let recipientHandle: String
    let amount: Double?  // nil for internal (private) transfers
    let token: String
    let signature: String
    let type: String
    let timestamp: Date
}

struct GroupNameUpdateEvent {
    let conversationId: String
    let groupName: String?
    let updatedBy: String
    let timestamp: Date
}

struct ParticipantLeftEvent {
    let conversationId: String
    let handle: String
    let remainingParticipants: [String]
    let timestamp: Date
}

struct ConversationDeletedEvent {
    let conversationId: String
    let reason: String
    let timestamp: Date
}

struct GroupAddedEvent {
    let conversationId: String
    let participants: [String]
    let groupName: String?
    let addedBy: String
    let timestamp: Date
}

struct GroupMemberAddedEvent {
    let conversationId: String
    let handle: String
    let addedBy: String
    let timestamp: Date
}

struct GroupCreatedEvent {
    let conversationId: String
    let participants: [String]
    let groupName: String?
    let createdBy: String
    let timestamp: Date
}

// MARK: - Socket Event Model

private struct SocketEvent: Encodable {
    let event: String
    let data: Any

    enum CodingKeys: String, CodingKey {
        case event
        case data
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(event, forKey: .event)

        // Encode data based on its type
        if let stringData = data as? String {
            try container.encode(stringData, forKey: .data)
        } else if let dictData = data as? [String: Any] {
            let jsonData = try JSONSerialization.data(withJSONObject: dictData)
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                try container.encode(jsonString, forKey: .data)
            }
        } else if let arrayData = data as? [Any] {
            let jsonData = try JSONSerialization.data(withJSONObject: arrayData)
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                try container.encode(jsonString, forKey: .data)
            }
        }
    }
}
