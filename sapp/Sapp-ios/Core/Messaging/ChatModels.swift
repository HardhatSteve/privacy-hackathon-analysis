import Foundation

// MARK: - Chat Models

struct Conversation: Identifiable, Equatable, Hashable {
    let id: String
    var participants: [ChatParticipant]
    let createdAt: Date
    var lastMessage: ChatMessage?
    var unreadCount: Int
    var isPinned: Bool
    var isMuted: Bool
    var groupName: String?

    /// Whether this is a group chat (stored, not computed from participant count)
    /// This prevents incorrect display when participants are stored incorrectly
    private let _isGroup: Bool?

    /// Display name shows the handle(s) without @ prefix (cleaner UI)
    var displayName: String {
        // For 1:1 chats, show the other participant's handle
        if !isGroup {
            return participants.first?.handle ?? "Unknown"
        }
        // For group chats, use custom name if set, otherwise show combined handles
        if let customName = groupName, !customName.isEmpty {
            return customName
        }
        return participants.map { $0.handle }.joined(separator: ", ")
    }

    /// Whether this is a group chat
    /// Uses the stored value if available, otherwise falls back to participant count
    var isGroup: Bool {
        _isGroup ?? (participants.count > 1)
    }

    /// Standard initializer with explicit isGroup parameter
    init(id: String, participants: [ChatParticipant], createdAt: Date, lastMessage: ChatMessage? = nil,
         unreadCount: Int = 0, isPinned: Bool = false, isMuted: Bool = false, isGroup: Bool? = nil,
         groupName: String? = nil) {
        self.id = id
        self.participants = participants
        self.createdAt = createdAt
        self.lastMessage = lastMessage
        self.unreadCount = unreadCount
        self.isPinned = isPinned
        self.isMuted = isMuted
        self._isGroup = isGroup
        self.groupName = groupName
    }
}

struct ChatParticipant: Identifiable, Equatable, Hashable, Codable {
    let id: String  // Handle (e.g., "johndoe")
    var email: String?  // For internal P2P connection (resolved from handle)

    /// Returns the handle (id is the handle)
    var handle: String { id }

    /// Returns the handle with @ prefix for display
    var displayHandle: String { "@\(id)" }

    /// Returns the peer ID for P2P connection (email if available, otherwise handle)
    var peerId: String { email ?? id }
}

struct ChatMessage: Identifiable, Equatable, Hashable {
    let id: String
    let conversationId: String
    let senderId: String
    let content: MessageContent
    let timestamp: Date
    var status: MessageStatus
    var replyTo: String?  // ID of message being replied to
    
    enum MessageContent: Equatable, Hashable {
        case text(String)
        case image(url: String, width: Int?, height: Int?)
        case file(url: String, name: String, size: Int)
        case voice(url: String, duration: TimeInterval)
        case location(latitude: Double, longitude: Double, name: String?)
        case contact(name: String, address: String)
        case transaction(signature: String, amount: Double, token: String)
        case system(String)
        case paymentRequest(PaymentRequestData)

        var previewText: String {
            switch self {
            case .text(let text): return text
            case .image: return "📷 Photo"
            case .file(_, let name, _): return "📎 \(name)"
            case .voice(_, let duration): return "🎤 Voice (\(Int(duration))s)"
            case .location(_, _, let name): return "📍 \(name ?? "Location")"
            case .contact(let name, _): return "👤 \(name)"
            case .transaction(_, let amount, let token): return "💸 \(amount) \(token)"
            case .system(let text): return text
            case .paymentRequest(let data): return "💵 Payment request: \(String(format: "%.2f", data.amount)) \(data.token)"
            }
        }

        /// Returns true if this content is a payment request
        var isPaymentRequest: Bool {
            if case .paymentRequest = self { return true }
            return false
        }
    }
    
    enum MessageStatus: String, Equatable, Hashable {
        case sending
        case sent
        case delivered
        case read
        case failed
        
        var icon: String {
            switch self {
            case .sending: return "clock"
            case .sent: return "checkmark"
            case .delivered: return "checkmark.circle"
            case .read: return "checkmark.circle.fill"
            case .failed: return "exclamationmark.circle"
            }
        }
    }
    
    /// Checks if this message was sent by the specified user (typically the current user)
    func isOutgoing(for currentUserHandle: String) -> Bool {
        senderId == currentUserHandle
    }
}

// MARK: - Contact Models

struct Contact: Identifiable, Equatable, Codable {
    let id: String  // Handle (messaging identifier)
    var notes: String?
    var isFavorite: Bool
    var isBlocked: Bool
    let addedAt: Date
    var lastInteraction: Date?

    /// Returns the handle (id is the handle)
    var handle: String { id }

    /// Returns the handle with @ prefix for display
    var displayHandle: String { "@\(id)" }
}

// MARK: - Message Draft

struct MessageDraft {
    var text: String = ""
    var attachments: [DraftAttachment] = []
    var replyToMessageId: String?
    
    var isEmpty: Bool {
        text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && attachments.isEmpty
    }
    
    struct DraftAttachment: Identifiable {
        let id: String
        let type: AttachmentType
        let data: Data?
        let url: URL?
        
        enum AttachmentType {
            case image
            case file
            case voice
        }
    }
}

// MARK: - Typing Indicator

struct TypingIndicator: Equatable {
    let participantId: String
    let conversationId: String
    let timestamp: Date
    
    var isStale: Bool {
        Date().timeIntervalSince(timestamp) > 5  // 5 seconds timeout
    }
}

// MARK: - Chat Settings

struct ChatSettings: Codable {
    var notificationsEnabled: Bool = true
    var soundEnabled: Bool = true
    var vibrationEnabled: Bool = true
    var showPreviews: Bool = true
    var readReceipts: Bool = true
    var typingIndicators: Bool = true
    var autoDownloadMedia: AutoDownloadSetting = .wifiOnly
    var messageRetention: MessageRetention = .forever
    
    enum AutoDownloadSetting: String, Codable, CaseIterable {
        case always
        case wifiOnly
        case never
        
        var displayName: String {
            switch self {
            case .always: return "Always"
            case .wifiOnly: return "Wi-Fi Only"
            case .never: return "Never"
            }
        }
    }
    
    enum MessageRetention: String, Codable, CaseIterable {
        case oneWeek
        case oneMonth
        case threeMonths
        case oneYear
        case forever

        var displayName: String {
            switch self {
            case .oneWeek: return "1 Week"
            case .oneMonth: return "1 Month"
            case .threeMonths: return "3 Months"
            case .oneYear: return "1 Year"
            case .forever: return "Forever"
            }
        }
    }
}

// MARK: - Payment Request

/// Data for a payment request message (used in split bill feature)
struct PaymentRequestData: Identifiable, Equatable, Hashable, Codable {
    var id: String { requestId }    // Identifiable conformance
    let requestId: String           // Unique ID for this request
    let requesterId: String         // Handle of person requesting payment
    let payeeHandle: String         // Handle of person who should pay
    let amount: Double              // Amount owed
    let token: String               // Token requested (e.g., "USDC")
    let memo: String?               // Optional description (e.g., "Dinner")
    var status: PaymentRequestStatus
    let createdAt: Date

    enum PaymentRequestStatus: String, Codable, Equatable, Hashable {
        case pending    // Waiting for payment
        case paid       // Payment received
        case declined   // Recipient declined
        case expired    // Request expired (optional: after X days)
        case cancelled  // Requester cancelled the request

        var displayText: String {
            switch self {
            case .pending: return "Pending"
            case .paid: return "Paid"
            case .declined: return "Declined"
            case .expired: return "Expired"
            case .cancelled: return "Cancelled"
            }
        }

        var icon: String {
            switch self {
            case .pending: return "clock"
            case .paid: return "checkmark.circle.fill"
            case .declined: return "xmark.circle.fill"
            case .expired: return "clock.badge.xmark"
            case .cancelled: return "nosign"
            }
        }

        /// Whether this status allows the payee to take action
        var isActionable: Bool {
            self == .pending
        }
    }

    init(requestId: String = UUID().uuidString,
         requesterId: String,
         payeeHandle: String,
         amount: Double,
         token: String,
         memo: String? = nil,
         status: PaymentRequestStatus = .pending,
         createdAt: Date = Date()) {
        self.requestId = requestId
        self.requesterId = requesterId
        self.payeeHandle = payeeHandle
        self.amount = amount
        self.token = token
        self.memo = memo
        self.status = status
        self.createdAt = createdAt
    }
}
