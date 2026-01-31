import Foundation
import CoreData

// MARK: - Participant Entity

@objc(ParticipantEntity)
public class ParticipantEntity: NSManagedObject {

    @nonobjc public class func fetchRequest() -> NSFetchRequest<ParticipantEntity> {
        return NSFetchRequest<ParticipantEntity>(entityName: "ParticipantEntity")
    }

    @NSManaged public var handle: String
    @NSManaged public var email: String?
    @NSManaged public var conversation: ConversationEntity?
}

// MARK: - Conversion to Domain Model

extension ParticipantEntity {

    /// Converts Core Data entity to domain model
    func toChatParticipant() -> ChatParticipant {
        ChatParticipant(
            id: handle,
            email: email
        )
    }
}

extension ParticipantEntity: Identifiable {
    public var id: String { handle }
}
