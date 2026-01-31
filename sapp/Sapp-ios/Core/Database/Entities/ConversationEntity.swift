import Foundation
import CoreData

// MARK: - Conversation Entity

@objc(ConversationEntity)
public class ConversationEntity: NSManagedObject {

    @nonobjc public class func fetchRequest() -> NSFetchRequest<ConversationEntity> {
        return NSFetchRequest<ConversationEntity>(entityName: "ConversationEntity")
    }

    @NSManaged public var id: String
    @NSManaged public var createdAt: Date
    @NSManaged public var updatedAt: Date
    @NSManaged public var lastMessageId: String?
    @NSManaged public var lastMessageTimestamp: Date?
    @NSManaged public var lastMessagePreview: String?
    @NSManaged public var unreadCount: Int32
    @NSManaged public var isPinned: Bool
    @NSManaged public var isMuted: Bool
    @NSManaged public var groupName: String?
    @NSManaged public var participants: NSSet?
}

// MARK: - Participants Relationship

extension ConversationEntity {

    @objc(addParticipantsObject:)
    @NSManaged public func addToParticipants(_ value: ParticipantEntity)

    @objc(removeParticipantsObject:)
    @NSManaged public func removeFromParticipants(_ value: ParticipantEntity)

    @objc(addParticipants:)
    @NSManaged public func addToParticipants(_ values: NSSet)

    @objc(removeParticipants:)
    @NSManaged public func removeFromParticipants(_ values: NSSet)
}

// MARK: - Conversion to Domain Model

extension ConversationEntity {

    /// Converts Core Data entity to domain model
    func toConversation() -> Conversation {
        let participantArray = (participants?.allObjects as? [ParticipantEntity]) ?? []
        let chatParticipants = participantArray.map { $0.toChatParticipant() }

        var lastMessage: ChatMessage?
        // Create last message if we have at least the timestamp (preview can be empty)
        if let timestamp = lastMessageTimestamp {
            let messageId = lastMessageId ?? UUID().uuidString
            let preview = lastMessagePreview ?? ""

            // Create a minimal last message for display
            lastMessage = ChatMessage(
                id: messageId,
                conversationId: id,
                senderId: chatParticipants.first?.handle ?? "",
                content: .text(preview),
                timestamp: timestamp,
                status: .read,
                replyTo: nil
            )
        }

        return Conversation(
            id: id,
            participants: chatParticipants,
            createdAt: createdAt,
            lastMessage: lastMessage,
            unreadCount: Int(unreadCount),
            isPinned: isPinned,
            isMuted: isMuted,
            groupName: groupName
        )
    }
}

extension ConversationEntity: Identifiable {}
