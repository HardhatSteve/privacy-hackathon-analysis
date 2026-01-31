import Foundation
import CoreData

// MARK: - Message Entity

@objc(MessageEntity)
public class MessageEntity: NSManagedObject {

    @nonobjc public class func fetchRequest() -> NSFetchRequest<MessageEntity> {
        return NSFetchRequest<MessageEntity>(entityName: "MessageEntity")
    }

    // Core properties
    @NSManaged public var id: String
    @NSManaged public var conversationId: String
    @NSManaged public var senderHandle: String
    @NSManaged public var timestamp: Date
    @NSManaged public var status: String
    @NSManaged public var replyToId: String?
    @NSManaged public var isRead: Bool

    // Content type discriminator
    @NSManaged public var contentType: String

    // Text content
    @NSManaged public var textContent: String?

    // Media content (image, file, voice)
    @NSManaged public var mediaUrl: String?
    @NSManaged public var mediaWidth: Int32
    @NSManaged public var mediaHeight: Int32
    @NSManaged public var mediaDuration: Double
    @NSManaged public var fileName: String?
    @NSManaged public var fileSize: Int64

    // Location content
    @NSManaged public var locationLatitude: Double
    @NSManaged public var locationLongitude: Double
    @NSManaged public var locationName: String?

    // Contact content
    @NSManaged public var contactName: String?
    @NSManaged public var contactAddress: String?

    // Transaction content
    @NSManaged public var transactionSignature: String?
    @NSManaged public var transactionAmount: Double
    @NSManaged public var transactionToken: String?
}

// MARK: - Conversion to Domain Model

extension MessageEntity {

    /// Converts Core Data entity to domain model
    func toChatMessage() -> ChatMessage {
        let content: ChatMessage.MessageContent

        switch contentType {
        case "text":
            content = .text(textContent ?? "")
        case "image":
            content = .image(
                url: mediaUrl ?? "",
                width: mediaWidth > 0 ? Int(mediaWidth) : nil,
                height: mediaHeight > 0 ? Int(mediaHeight) : nil
            )
        case "file":
            content = .file(
                url: mediaUrl ?? "",
                name: fileName ?? "Unknown",
                size: Int(fileSize)
            )
        case "voice":
            content = .voice(
                url: mediaUrl ?? "",
                duration: mediaDuration
            )
        case "location":
            content = .location(
                latitude: locationLatitude,
                longitude: locationLongitude,
                name: locationName
            )
        case "contact":
            content = .contact(
                name: contactName ?? "Unknown",
                address: contactAddress ?? ""
            )
        case "transaction":
            content = .transaction(
                signature: transactionSignature ?? "",
                amount: transactionAmount,
                token: transactionToken ?? "SOL"
            )
        case "system":
            content = .system(textContent ?? "")
        default:
            content = .text(textContent ?? "")
        }

        let messageStatus = ChatMessage.MessageStatus(rawValue: status) ?? .sent

        return ChatMessage(
            id: id,
            conversationId: conversationId,
            senderId: senderHandle,
            content: content,
            timestamp: timestamp,
            status: messageStatus,
            replyTo: replyToId
        )
    }
}

extension MessageEntity: Identifiable {}
