import Foundation
import Combine

// MARK: - Hypercore Service Protocol

protocol HypercoreServicing {
    var isInitialized: Bool { get }
    var conversationsPublisher: AnyPublisher<[ConversationCore], Never> { get }
    var syncStatePublisher: AnyPublisher<[String: ConversationSyncState], Never> { get }
    var entriesPublisher: AnyPublisher<(String, [CoreEntry]), Never> { get }

    func initialize(handle: String) async throws
    func shutdown() async

    func createConversation(participants: [String], isGroup: Bool, groupName: String?) async throws -> ConversationCore
    func joinConversation(conversationId: String, hypercoreKey: String?) async throws
    func leaveConversation(_ conversationId: String) async throws

    func appendMessage(_ message: CoreMessage, to conversationId: String) async throws
    func appendEntry(_ entry: CoreEntry, to conversationId: String) async throws
    func getEntries(for conversationId: String, start: Int?, end: Int?) async throws -> [CoreEntry]

    func sync(conversationId: String) async
    func syncAll() async

    func recoverFromKeys(identityKey: String, conversationKeys: [(conversationId: String, hypercoreKey: String)]) async throws
}

// MARK: - Hypercore Service Implementation

@MainActor
final class HypercoreService: HypercoreServicing {
    private var worklet: WorkletWrapper?
    private var currentHandle: String?

    /// Flag to track if the worklet's P2P modules failed to load (e.g., hyperswarm not bundled)
    private var moduleLoadFailed: Bool = false

    private let conversationsSubject = CurrentValueSubject<[ConversationCore], Never>([])
    private let syncStateSubject = CurrentValueSubject<[String: ConversationSyncState], Never>([:])
    private let entriesSubject = PassthroughSubject<(String, [CoreEntry]), Never>()

    private var pendingCallbacks: [String: (Result<Any, Error>) -> Void] = [:]
    private var conversationCores: [String: ConversationCore] = [:]

    /// Returns true only if the worklet is running, not in stub mode, and P2P modules loaded successfully
    /// - Stub mode means BareKit is not linked, so Hypercore operations won't work
    /// - Module load failure means the P2P npm modules (hyperswarm, corestore, etc.) aren't bundled
    var isInitialized: Bool {
        guard let worklet = worklet else { return false }
        guard !moduleLoadFailed else { return false }
        // Don't consider initialized if running in stub mode - Hypercore won't actually work
        return worklet.running && !worklet.isStubMode
    }

    var conversationsPublisher: AnyPublisher<[ConversationCore], Never> {
        conversationsSubject.eraseToAnyPublisher()
    }

    var syncStatePublisher: AnyPublisher<[String: ConversationSyncState], Never> {
        syncStateSubject.eraseToAnyPublisher()
    }

    var entriesPublisher: AnyPublisher<(String, [CoreEntry]), Never> {
        entriesSubject.eraseToAnyPublisher()
    }

    // MARK: - Initialization

    func initialize(handle: String) async throws {
        currentHandle = handle

        // Create worklet with message handler
        worklet = WorkletWrapper { [weak self] data in
            Task { @MainActor in
                self?.handleWorkletMessage(data)
            }
        }

        // Try loading the bundled worklet first (has all P2P npm modules)
        do {
            if let bundlePath = Bundle.main.path(forResource: "hypercore", ofType: "bundle") {
                print("[HypercoreService] Found bundle at: \(bundlePath)")
                try worklet?.start(bundleName: "hypercore", bundleType: "bundle")
                print("[HypercoreService] ✅ Loaded hypercore.bundle with full P2P modules")
            } else {
                throw HypercoreError.workletError("hypercore.bundle not found in app bundle")
            }
        } catch {
            // Fallback to inline source (will gracefully degrade to WebSocket-only)
            print("[HypercoreService] ⚠️ Bundle loading failed: \(error)")
            print("[HypercoreService] Falling back to inline source (P2P may be disabled)")
            try worklet?.start(filename: "/hypercore.js", source: hypercoreWorkletSource, arguments: nil)
        }

        // Check if running in stub mode - if so, don't wait for initialization
        // that will never complete
        if worklet?.isStubMode == true {
            print("[HypercoreService] Running in stub mode - Hypercore features disabled")
            return
        }

        // Brief delay to allow module loading errors to propagate from JavaScript
        // This catches the case where require('hyperswarm') fails immediately
        try await Task.sleep(nanoseconds: 100_000_000) // 100ms

        // Check if module loading failed before attempting to initialize
        if moduleLoadFailed {
            print("[HypercoreService] P2P modules not available - Hypercore features disabled")
            throw HypercoreError.workletError("P2P modules not bundled")
        }

        // Get storage path for Corestore
        let storagePath = getStoragePath(for: handle)

        // Send initialize command
        let command: [String: Any] = [
            "type": "initialize",
            "config": [
                "storagePath": storagePath,
                "handle": handle
            ]
        ]

        try await sendCommand(command, expectingResponse: "initialized")
        print("[HypercoreService] Initialized for @\(handle)")
    }

    func shutdown() async {
        let command: [String: Any] = ["type": "shutdown"]

        do {
            try await sendCommand(command, expectingResponse: "shutdown-complete")
        } catch {
            print("[HypercoreService] Shutdown error: \(error)")
        }

        worklet?.terminate()
        worklet = nil
        moduleLoadFailed = false
        conversationCores.removeAll()
        conversationsSubject.send([])
        syncStateSubject.send([:])
    }

    // MARK: - Conversation Management

    func createConversation(participants: [String], isGroup: Bool, groupName: String?) async throws -> ConversationCore {
        guard let handle = currentHandle else {
            throw HypercoreError.notInitialized
        }

        let allParticipants = Array(Set(participants + [handle]))
        let conversationId = ConversationCore.generateId(participants: allParticipants, isGroup: isGroup)

        let command: [String: Any] = [
            "type": "create-conversation",
            "config": [
                "conversationId": conversationId,
                "participants": allParticipants,
                "isGroup": isGroup,
                "groupName": groupName as Any
            ]
        ]

        let response = try await sendCommand(command, expectingResponse: "conversation-created")

        guard let hypercoreKey = response["hypercoreKey"] as? String,
              let discoveryKey = response["discoveryKey"] as? String else {
            throw HypercoreError.workletError("Missing keys in response")
        }

        let conv = ConversationCore(
            id: conversationId,
            hypercoreKey: hypercoreKey,
            discoveryKey: discoveryKey,
            participants: allParticipants.map { h in
                CoreParticipant(
                    id: h,
                    writerKey: "",  // Will be populated on sync
                    messagingPublicKey: "",
                    displayName: nil,
                    addedAt: Date(),
                    addedBy: handle
                )
            },
            createdAt: Date(),
            lastSyncedAt: Date(),
            localLength: 1,
            remoteLength: 1
        )

        conversationCores[conversationId] = conv
        conversationsSubject.send(Array(conversationCores.values))

        return conv
    }

    func joinConversation(conversationId: String, hypercoreKey: String?) async throws {
        let command: [String: Any] = [
            "type": "join-conversation",
            "config": [
                "conversationId": conversationId,
                "hypercoreKey": hypercoreKey as Any
            ]
        ]

        let response = try await sendCommand(command, expectingResponse: "conversation-joined")

        let key = response["hypercoreKey"] as? String ?? hypercoreKey ?? ""
        let localLength = response["localLength"] as? Int ?? 0

        // Create or update conversation core
        if conversationCores[conversationId] == nil {
            conversationCores[conversationId] = ConversationCore(
                id: conversationId,
                hypercoreKey: key,
                discoveryKey: "",
                participants: [],
                createdAt: Date(),
                lastSyncedAt: nil,
                localLength: localLength,
                remoteLength: nil
            )
        }

        conversationsSubject.send(Array(conversationCores.values))

        // Update sync state
        var syncStates = syncStateSubject.value
        syncStates[conversationId] = ConversationSyncState(
            conversationId: conversationId,
            localLength: localLength,
            remoteLength: nil,
            lastSyncTimestamp: nil,
            syncStatus: .syncing
        )
        syncStateSubject.send(syncStates)
    }

    func leaveConversation(_ conversationId: String) async throws {
        let command: [String: Any] = [
            "type": "leave-conversation",
            "conversationId": conversationId
        ]

        try await sendCommand(command, expectingResponse: "conversation-left")

        conversationCores.removeValue(forKey: conversationId)
        conversationsSubject.send(Array(conversationCores.values))

        var syncStates = syncStateSubject.value
        syncStates.removeValue(forKey: conversationId)
        syncStateSubject.send(syncStates)
    }

    // MARK: - Message Operations

    func appendMessage(_ message: CoreMessage, to conversationId: String) async throws {
        let entry = CoreEntry.message(message)
        try await appendEntry(entry, to: conversationId)
    }

    func appendEntry(_ entry: CoreEntry, to conversationId: String) async throws {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601

        let entryData = try encoder.encode(entry)
        guard let entryDict = try JSONSerialization.jsonObject(with: entryData) as? [String: Any] else {
            throw HypercoreError.workletError("Failed to serialize entry")
        }

        let command: [String: Any] = [
            "type": "append-entry",
            "conversationId": conversationId,
            "entry": entryDict
        ]

        try await sendCommand(command, expectingResponse: "entry-appended")

        // Update local length
        if var conv = conversationCores[conversationId] {
            conv.localLength += 1
            conversationCores[conversationId] = conv
        }
    }

    func getEntries(for conversationId: String, start: Int? = nil, end: Int? = nil) async throws -> [CoreEntry] {
        let command: [String: Any] = [
            "type": "get-entries",
            "conversationId": conversationId,
            "start": start as Any,
            "end": end as Any
        ]

        let response = try await sendCommand(command, expectingResponse: "entries")

        guard let entriesData = response["entries"] as? [[String: Any]] else {
            return []
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        var entries: [CoreEntry] = []
        for entryDict in entriesData {
            if let data = entryDict["data"] as? [String: Any] {
                let jsonData = try JSONSerialization.data(withJSONObject: data)
                let entry = try decoder.decode(CoreEntry.self, from: jsonData)
                entries.append(entry)
            }
        }

        return entries
    }

    // MARK: - Sync Operations

    func sync(conversationId: String) async {
        let command: [String: Any] = [
            "type": "sync",
            "conversationId": conversationId
        ]

        if let data = try? JSONSerialization.data(withJSONObject: command) {
            worklet?.send(data)
        }
    }

    func syncAll() async {
        let command: [String: Any] = ["type": "sync-all"]

        if let data = try? JSONSerialization.data(withJSONObject: command) {
            worklet?.send(data)
        }
    }

    // MARK: - Recovery

    func recoverFromKeys(
        identityKey: String,
        conversationKeys: [(conversationId: String, hypercoreKey: String)]
    ) async throws {
        let convKeysArray = conversationKeys.map { [
            "conversationId": $0.conversationId,
            "hypercoreKey": $0.hypercoreKey
        ] }

        let command: [String: Any] = [
            "type": "recover",
            "config": [
                "identityKey": identityKey,
                "conversationKeys": convKeysArray
            ]
        ]

        try await sendCommand(command, expectingResponse: "recovery-complete")
    }

    // MARK: - Background Support

    func suspend() {
        worklet?.suspend()
    }

    func resume() {
        worklet?.resume()
    }

    // MARK: - Private Methods

    private func getStoragePath(for handle: String) -> String {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let hyperPath = documentsPath.appendingPathComponent("hypercore/\(handle)")

        // Ensure directory exists
        try? FileManager.default.createDirectory(at: hyperPath, withIntermediateDirectories: true)

        return hyperPath.path
    }

    @discardableResult
    private func sendCommand(_ command: [String: Any], expectingResponse responseType: String) async throws -> [String: Any] {
        guard let data = try? JSONSerialization.data(withJSONObject: command) else {
            throw HypercoreError.workletError("Failed to serialize command")
        }

        // Use a class to safely track continuation state across async boundaries
        final class ContinuationBox: @unchecked Sendable {
            private var continuation: CheckedContinuation<[String: Any], Error>?
            private let lock = NSLock()

            init(_ continuation: CheckedContinuation<[String: Any], Error>) {
                self.continuation = continuation
            }

            /// Attempts to resume the continuation. Returns true if successful, false if already resumed.
            func resume(returning value: [String: Any]) -> Bool {
                lock.lock()
                defer { lock.unlock() }
                guard let cont = continuation else { return false }
                continuation = nil
                cont.resume(returning: value)
                return true
            }

            /// Attempts to resume the continuation with an error. Returns true if successful, false if already resumed.
            func resume(throwing error: Error) -> Bool {
                lock.lock()
                defer { lock.unlock() }
                guard let cont = continuation else { return false }
                continuation = nil
                cont.resume(throwing: error)
                return true
            }

            var isResumed: Bool {
                lock.lock()
                defer { lock.unlock() }
                return continuation == nil
            }
        }

        return try await withCheckedThrowingContinuation { continuation in
            let box = ContinuationBox(continuation)

            pendingCallbacks[responseType] = { [weak self] result in
                // Ensure we're on MainActor for consistent state access
                Task { @MainActor in
                    self?.pendingCallbacks.removeValue(forKey: responseType)
                    switch result {
                    case .success(let value):
                        _ = box.resume(returning: value as? [String: Any] ?? [:])
                    case .failure(let error):
                        _ = box.resume(throwing: error)
                    }
                }
            }

            worklet?.send(data) { [weak self] error in
                if let error = error {
                    Task { @MainActor in
                        self?.pendingCallbacks.removeValue(forKey: responseType)
                        _ = box.resume(throwing: HypercoreError.workletError(error.localizedDescription))
                    }
                }
            }

            // Timeout after 30 seconds
            Task { @MainActor [weak self] in
                try? await Task.sleep(nanoseconds: 30_000_000_000)
                guard !box.isResumed else { return }
                self?.pendingCallbacks.removeValue(forKey: responseType)
                _ = box.resume(throwing: HypercoreError.workletError("Command timed out"))
            }
        }
    }

    private func handleWorkletMessage(_ data: Data) {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else {
            print("[HypercoreService] Invalid message from worklet")
            return
        }

        // Check for pending callback
        if let callback = pendingCallbacks[type] {
            pendingCallbacks.removeValue(forKey: type)
            callback(.success(json))
            return
        }

        // Handle async events
        switch type {
        case "module-error":
            // P2P modules (hyperswarm, corestore, etc.) failed to load - likely not bundled
            let errorMessage = json["error"] as? String ?? "Unknown module error"
            let context = json["context"] as? String ?? ""
            print("[HypercoreService] ⚠️ P2P modules not available (\(context)): \(errorMessage)")
            print("[HypercoreService] Hypercore features disabled - using WebSocket relay only")
            moduleLoadFailed = true

            // Fail any pending initialization callback
            if let callback = pendingCallbacks["initialized"] {
                pendingCallbacks.removeValue(forKey: "initialized")
                callback(.failure(HypercoreError.workletError("P2P modules not available: \(errorMessage)")))
            }

        case "error":
            let errorMessage = json["error"] as? String ?? "Unknown error"
            let context = json["context"] as? String ?? ""
            let isFatal = json["fatal"] as? Bool ?? false
            print("[HypercoreService] Error (\(context)): \(errorMessage)")

            // If it's a fatal error (like modules not available), mark as failed
            if isFatal {
                moduleLoadFailed = true
                // Fail any pending callbacks
                if let callback = pendingCallbacks["initialized"] {
                    pendingCallbacks.removeValue(forKey: "initialized")
                    callback(.failure(HypercoreError.workletError(errorMessage)))
                }
            }

        case "conversation-list":
            if let convIds = json["conversations"] as? [String] {
                print("[HypercoreService] Loaded \(convIds.count) conversations")
            }

        case "peer-connected":
            handlePeerConnected(json)

        case "peer-disconnected":
            handlePeerDisconnected(json)

        case "sync-started":
            handleSyncStarted(json)

        case "sync-completed":
            handleSyncCompleted(json)

        case "entries":
            handleEntries(json)

        default:
            print("[HypercoreService] Unhandled message type: \(type)")
        }
    }

    private func handlePeerConnected(_ json: [String: Any]) {
        guard let conversationId = json["conversationId"] as? String,
              let peerCount = json["peerCount"] as? Int else { return }

        var syncStates = syncStateSubject.value
        if var state = syncStates[conversationId] {
            state.syncStatus = peerCount > 0 ? .syncing : .offline
            syncStates[conversationId] = state
            syncStateSubject.send(syncStates)
        }

        print("[HypercoreService] Peer connected to \(conversationId), total: \(peerCount)")
    }

    private func handlePeerDisconnected(_ json: [String: Any]) {
        guard let conversationId = json["conversationId"] as? String,
              let peerCount = json["peerCount"] as? Int else { return }

        var syncStates = syncStateSubject.value
        if var state = syncStates[conversationId] {
            state.syncStatus = peerCount > 0 ? .syncing : .offline
            syncStates[conversationId] = state
            syncStateSubject.send(syncStates)
        }
    }

    private func handleSyncStarted(_ json: [String: Any]) {
        guard let conversationId = json["conversationId"] as? String else { return }

        var syncStates = syncStateSubject.value
        if var state = syncStates[conversationId] {
            state.syncStatus = .syncing
            syncStates[conversationId] = state
        } else {
            syncStates[conversationId] = ConversationSyncState(
                conversationId: conversationId,
                localLength: 0,
                remoteLength: nil,
                lastSyncTimestamp: nil,
                syncStatus: .syncing
            )
        }
        syncStateSubject.send(syncStates)
    }

    private func handleSyncCompleted(_ json: [String: Any]) {
        guard let conversationId = json["conversationId"] as? String,
              let localLength = json["localLength"] as? Int else { return }

        // Update sync state
        var syncStates = syncStateSubject.value
        syncStates[conversationId] = ConversationSyncState(
            conversationId: conversationId,
            localLength: localLength,
            remoteLength: localLength,
            lastSyncTimestamp: Date(),
            syncStatus: .synced
        )
        syncStateSubject.send(syncStates)

        // Update conversation core
        if var conv = conversationCores[conversationId] {
            conv.localLength = localLength
            conv.lastSyncedAt = Date()
            conversationCores[conversationId] = conv
            conversationsSubject.send(Array(conversationCores.values))
        }

        // Parse and emit entries
        if let entriesData = json["entries"] as? [[String: Any]] {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601

            var entries: [CoreEntry] = []
            for entryDict in entriesData {
                if let data = entryDict["data"] as? [String: Any],
                   let jsonData = try? JSONSerialization.data(withJSONObject: data),
                   let entry = try? decoder.decode(CoreEntry.self, from: jsonData) {
                    entries.append(entry)
                }
            }

            if !entries.isEmpty {
                entriesSubject.send((conversationId, entries))
            }
        }

        print("[HypercoreService] Sync completed for \(conversationId), length: \(localLength)")
    }

    private func handleEntries(_ json: [String: Any]) {
        guard let conversationId = json["conversationId"] as? String,
              let entriesData = json["entries"] as? [[String: Any]] else { return }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        var entries: [CoreEntry] = []
        for entryDict in entriesData {
            if let data = entryDict["data"] as? [String: Any],
               let jsonData = try? JSONSerialization.data(withJSONObject: data),
               let entry = try? decoder.decode(CoreEntry.self, from: jsonData) {
                entries.append(entry)
            }
        }

        entriesSubject.send((conversationId, entries))
    }
}
