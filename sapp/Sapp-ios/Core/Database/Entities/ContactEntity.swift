import Foundation
import CoreData

// MARK: - Contact Entity

@objc(ContactEntity)
public class ContactEntity: NSManagedObject {

    @nonobjc public class func fetchRequest() -> NSFetchRequest<ContactEntity> {
        return NSFetchRequest<ContactEntity>(entityName: "ContactEntity")
    }

    @NSManaged public var handle: String
    @NSManaged public var notes: String?
    @NSManaged public var isFavorite: Bool
    @NSManaged public var isBlocked: Bool
    @NSManaged public var addedAt: Date
    @NSManaged public var lastInteraction: Date?
}

// MARK: - Conversion to Domain Model

extension ContactEntity {

    /// Converts Core Data entity to domain model
    func toContact() -> Contact {
        Contact(
            id: handle,
            notes: notes,
            isFavorite: isFavorite,
            isBlocked: isBlocked,
            addedAt: addedAt,
            lastInteraction: lastInteraction
        )
    }
}

extension ContactEntity: Identifiable {
    public var id: String { handle }
}
