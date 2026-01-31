import Foundation
import Combine

// MARK: - BareKit Manager for P2P Messaging
// Integrates with BareKit worklets for peer-to-peer communication

protocol BareKitManaging {
    var connectionStatePublisher: AnyPublisher<P2PConnectionState, Never> { get }
    var incomingMessagesPublisher: AnyPublisher<P2PMessage, Never> { get }
    
    func initialize() async throws
    func connect(to peerId: String) async throws
    func disconnect(from peerId: String) async
    func send(message: P2PMessage, to peerId: String) async throws
    func broadcast(message: P2PMessage) async throws
    func shutdown() async
}

// MARK: - P2P Models

enum P2PConnectionState: Equatable {
    case disconnected
    case initializing
    case ready
    case connecting(peerId: String)
    case connected(peerIds: Set<String>)
    case error(String)
    
    var isReady: Bool {
        switch self {
        case .ready, .connected: return true
        default: return false
        }
    }
}

struct P2PMessage: Identifiable, Equatable, Codable {
    let id: String
    let senderId: String
    let recipientId: String?  // nil for broadcast
    let content: MessageContent
    let timestamp: Date
    let signature: String?  // For message authentication
    
    enum MessageContent: Equatable, Codable {
        case text(String)
        case data(Data)
        case typing
        case read(messageId: String)
        case delivered(messageId: String)
    }
}

struct P2PPeer: Identifiable, Equatable {
    let id: String  // Email address (messaging identifier)
    let displayName: String?
    let lastSeen: Date?
    let isOnline: Bool
    
    /// Returns the email address (id is the email)
    var email: String { id }
}

// MARK: - BareKit Manager Implementation

final class BareKitManager: BareKitManaging {
    private let connectionStateSubject = CurrentValueSubject<P2PConnectionState, Never>(.disconnected)
    private let incomingMessagesSubject = PassthroughSubject<P2PMessage, Never>()

    private var worklet: WorkletWrapper?
    private var connectedPeers: Set<String> = []
    private let topic: String

    var connectionStatePublisher: AnyPublisher<P2PConnectionState, Never> {
        connectionStateSubject.eraseToAnyPublisher()
    }

    /// Current connection state (for immediate access without subscription)
    var connectionState: P2PConnectionState {
        connectionStateSubject.value
    }

    var incomingMessagesPublisher: AnyPublisher<P2PMessage, Never> {
        incomingMessagesSubject.eraseToAnyPublisher()
    }

    init(topic: String = "sapp-p2p-messaging") {
        self.topic = topic
    }

    func initialize() async throws {
        connectionStateSubject.send(.initializing)

        do {
            // Create worklet with message handler
            worklet = WorkletWrapper { [weak self] data in
                self?.handleIncomingData(data)
            }

            // Start the P2P worklet
            try worklet?.start(filename: "/p2p.js", source: p2pWorkletSource, arguments: nil)

            // Initialize the swarm with our topic
            let initCommand: [String: Any] = [
                "type": "init",
                "topic": topic
            ]

            if let data = try? JSONSerialization.data(withJSONObject: initCommand) {
                worklet?.send(data)
            }

            connectionStateSubject.send(.ready)
        } catch {
            connectionStateSubject.send(.error(error.localizedDescription))
            throw error
        }
    }

    func connect(to peerId: String) async throws {
        guard connectionStateSubject.value.isReady else {
            throw P2PError.notInitialized
        }

        connectionStateSubject.send(.connecting(peerId: peerId))

        // The actual connection happens via Hyperswarm discovery
        // We just track the peer we want to communicate with
        connectedPeers.insert(peerId)
        connectionStateSubject.send(.connected(peerIds: connectedPeers))
    }

    func disconnect(from peerId: String) async {
        connectedPeers.remove(peerId)

        // Send disconnect command to worklet
        let command: [String: Any] = [
            "type": "disconnect",
            "peerId": peerId
        ]

        if let data = try? JSONSerialization.data(withJSONObject: command) {
            worklet?.send(data)
        }

        if connectedPeers.isEmpty {
            connectionStateSubject.send(.ready)
        } else {
            connectionStateSubject.send(.connected(peerIds: connectedPeers))
        }
    }

    func send(message: P2PMessage, to peerId: String) async throws {
        guard connectedPeers.contains(peerId) else {
            throw P2PError.peerNotConnected
        }

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601

        let messageData = try encoder.encode(message)
        let messageJSON = try JSONSerialization.jsonObject(with: messageData)

        let command: [String: Any] = [
            "type": "send",
            "peerId": peerId,
            "messageId": message.id,
            "message": messageJSON
        ]

        guard let data = try? JSONSerialization.data(withJSONObject: command) else {
            throw P2PError.messageFailed("Failed to serialize message")
        }

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            worklet?.send(data) { error in
                if let error = error {
                    continuation.resume(throwing: P2PError.messageFailed(error.localizedDescription))
                } else {
                    continuation.resume()
                }
            }
        }
    }

    func broadcast(message: P2PMessage) async throws {
        guard !connectedPeers.isEmpty else {
            throw P2PError.noConnectedPeers
        }

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601

        let messageData = try encoder.encode(message)
        let messageJSON = try JSONSerialization.jsonObject(with: messageData)

        let command: [String: Any] = [
            "type": "broadcast",
            "message": messageJSON
        ]

        guard let data = try? JSONSerialization.data(withJSONObject: command) else {
            throw P2PError.messageFailed("Failed to serialize broadcast")
        }

        worklet?.send(data)
    }

    func shutdown() async {
        // Send shutdown command
        let command: [String: Any] = ["type": "shutdown"]
        if let data = try? JSONSerialization.data(withJSONObject: command) {
            worklet?.send(data)
        }

        // Terminate worklet
        worklet?.terminate()
        worklet = nil
        connectedPeers.removeAll()

        connectionStateSubject.send(.disconnected)
    }

    /// Suspend worklet when app goes to background
    func suspend() {
        worklet?.suspend()
    }

    /// Resume worklet when app becomes active
    func resume() {
        worklet?.resume()
    }

    // MARK: - Private Methods

    private func handleIncomingData(_ data: Data) {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else {
            return
        }

        switch type {
        case "ready":
            print("[BareKit] Swarm ready")

        case "peer-connected":
            if let peerId = json["peerId"] as? String {
                DispatchQueue.main.async { [weak self] in
                    self?.connectedPeers.insert(peerId)
                    if let peers = self?.connectedPeers {
                        self?.connectionStateSubject.send(.connected(peerIds: peers))
                    }
                }
            }

        case "peer-disconnected":
            if let peerId = json["peerId"] as? String {
                DispatchQueue.main.async { [weak self] in
                    self?.connectedPeers.remove(peerId)
                    if let peers = self?.connectedPeers, !peers.isEmpty {
                        self?.connectionStateSubject.send(.connected(peerIds: peers))
                    } else {
                        self?.connectionStateSubject.send(.ready)
                    }
                }
            }

        case "message":
            if let messageData = json["message"] as? [String: Any] {
                decodeAndPublishMessage(messageData)
            }

        case "error":
            if let error = json["error"] as? String {
                print("[BareKit] Error: \(error)")
            }

        default:
            break
        }
    }

    private func decodeAndPublishMessage(_ dict: [String: Any]) {
        do {
            let data = try JSONSerialization.data(withJSONObject: dict)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601

            let message = try decoder.decode(P2PMessage.self, from: data)

            DispatchQueue.main.async { [weak self] in
                self?.incomingMessagesSubject.send(message)
            }
        } catch {
            print("[BareKit] Failed to decode message: \(error)")
        }
    }
}

// MARK: - IPC Commands

private enum IPCCommand: Codable {
    case connect(peerId: String)
    case disconnect(peerId: String)
    case sendMessage(message: P2PMessage, to: String)
    case broadcast(message: P2PMessage)
    case shutdown
}

// MARK: - P2P Errors

enum P2PError: Error, LocalizedError {
    case notInitialized
    case peerNotConnected
    case noConnectedPeers
    case connectionFailed(String)
    case messageFailed(String)
    case workletError(String)
    
    var errorDescription: String? {
        switch self {
        case .notInitialized:
            return "P2P system not initialized"
        case .peerNotConnected:
            return "Peer is not connected"
        case .noConnectedPeers:
            return "No peers connected"
        case .connectionFailed(let reason):
            return "Connection failed: \(reason)"
        case .messageFailed(let reason):
            return "Message failed: \(reason)"
        case .workletError(let reason):
            return "Worklet error: \(reason)"
        }
    }
}
