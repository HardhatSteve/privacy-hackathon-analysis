import Foundation
import CoreData

// MARK: - Database Manager

/// Manages Core Data stack and provides access to persistent storage
@MainActor
final class DatabaseManager {

    // MARK: - Singleton

    static let shared = DatabaseManager()

    // MARK: - Core Data Stack

    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "Sapp")

        // Configure for lightweight migration
        let description = NSPersistentStoreDescription()
        description.shouldMigrateStoreAutomatically = true
        description.shouldInferMappingModelAutomatically = true
        container.persistentStoreDescriptions = [description]

        container.loadPersistentStores { storeDescription, error in
            if let error = error as NSError? {
                // In production, handle this gracefully
                fatalError("Core Data failed to load: \(error), \(error.userInfo)")
            }
        }

        // Merge policy for handling conflicts
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        container.viewContext.automaticallyMergesChangesFromParent = true

        return container
    }()

    var viewContext: NSManagedObjectContext {
        persistentContainer.viewContext
    }

    /// Background context for heavy operations
    func newBackgroundContext() -> NSManagedObjectContext {
        let context = persistentContainer.newBackgroundContext()
        context.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        return context
    }

    private init() {}

    // MARK: - Save Operations

    func saveContext() {
        guard viewContext.hasChanges else { return }

        do {
            try viewContext.save()
        } catch {
            let nsError = error as NSError
            print("Core Data save error: \(nsError), \(nsError.userInfo)")
        }
    }

    func saveBackgroundContext(_ context: NSManagedObjectContext) async throws {
        guard context.hasChanges else { return }

        try await context.perform {
            try context.save()
        }
    }

    // MARK: - Conversation Operations

    func fetchConversations() async throws -> [ConversationEntity] {
        let request = ConversationEntity.fetchRequest()
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \ConversationEntity.isPinned, ascending: false),
            NSSortDescriptor(keyPath: \ConversationEntity.lastMessageTimestamp, ascending: false)
        ]

        return try viewContext.fetch(request)
    }

    func fetchConversation(byId id: String) async throws -> ConversationEntity? {
        let request = ConversationEntity.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", id)
        request.fetchLimit = 1

        return try viewContext.fetch(request).first
    }

    func fetchConversation(withParticipant handle: String) async throws -> ConversationEntity? {
        let request = ConversationEntity.fetchRequest()
        request.predicate = NSPredicate(format: "ANY participants.handle == %@", handle)
        request.fetchLimit = 1

        return try viewContext.fetch(request).first
    }

    func createConversation(
        id: String,
        participants: [ChatParticipant],
        isPinned: Bool = false,
        isMuted: Bool = false,
        groupName: String? = nil
    ) async throws -> ConversationEntity {
        let conversation = ConversationEntity(context: viewContext)
        conversation.id = id
        conversation.createdAt = Date()
        conversation.updatedAt = Date()
        conversation.isPinned = isPinned
        conversation.isMuted = isMuted
        conversation.unreadCount = 0
        conversation.groupName = groupName

        // Create participant entities
        for participant in participants {
            let participantEntity = ParticipantEntity(context: viewContext)
            participantEntity.handle = participant.handle
            participantEntity.email = participant.email
            participantEntity.conversation = conversation
        }

        saveContext()
        return conversation
    }

    func updateGroupName(_ conversationId: String, groupName: String?) async throws {
        guard let conversation = try await fetchConversation(byId: conversationId) else { return }
        conversation.groupName = groupName
        conversation.updatedAt = Date()
        saveContext()
    }

    func updateConversation(_ conversationId: String, lastMessage: ChatMessage) async throws {
        guard let conversation = try await fetchConversation(byId: conversationId) else { return }

        conversation.lastMessageId = lastMessage.id
        conversation.lastMessageTimestamp = lastMessage.timestamp
        conversation.lastMessagePreview = lastMessage.content.previewText
        conversation.updatedAt = Date()

        saveContext()
    }

    func updateConversationSettings(_ conversationId: String, isPinned: Bool? = nil, isMuted: Bool? = nil) async throws {
        guard let conversation = try await fetchConversation(byId: conversationId) else { return }

        if let isPinned = isPinned {
            conversation.isPinned = isPinned
        }
        if let isMuted = isMuted {
            conversation.isMuted = isMuted
        }
        conversation.updatedAt = Date()

        saveContext()
    }

    func incrementUnreadCount(_ conversationId: String) async throws {
        guard let conversation = try await fetchConversation(byId: conversationId) else { return }
        conversation.unreadCount += 1
        saveContext()
    }

    func resetUnreadCount(_ conversationId: String) async throws {
        guard let conversation = try await fetchConversation(byId: conversationId) else { return }
        conversation.unreadCount = 0
        saveContext()
    }

    func deleteConversation(_ conversationId: String) async throws {
        guard let conversation = try await fetchConversation(byId: conversationId) else { return }

        // Delete all messages in the conversation
        let messageRequest = MessageEntity.fetchRequest()
        messageRequest.predicate = NSPredicate(format: "conversationId == %@", conversationId)
        let messages = try viewContext.fetch(messageRequest)
        messages.forEach { viewContext.delete($0) }

        // Delete conversation
        viewContext.delete(conversation)
        saveContext()
    }

    // MARK: - Message Operations

    func fetchMessages(
        for conversationId: String,
        limit: Int = 50,
        before: Date? = nil
    ) async throws -> [MessageEntity] {
        let request = MessageEntity.fetchRequest()

        var predicates = [NSPredicate(format: "conversationId == %@", conversationId)]
        if let before = before {
            predicates.append(NSPredicate(format: "timestamp < %@", before as NSDate))
        }
        request.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: predicates)
        request.sortDescriptors = [NSSortDescriptor(keyPath: \MessageEntity.timestamp, ascending: true)]
        request.fetchLimit = limit

        return try viewContext.fetch(request)
    }

    func fetchMessage(byId id: String) async throws -> MessageEntity? {
        let request = MessageEntity.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", id)
        request.fetchLimit = 1

        return try viewContext.fetch(request).first
    }

    func createMessage(_ message: ChatMessage) async throws -> MessageEntity {
        let entity = MessageEntity(context: viewContext)
        entity.id = message.id
        entity.conversationId = message.conversationId
        entity.senderHandle = message.senderId
        entity.timestamp = message.timestamp
        entity.status = message.status.rawValue
        entity.replyToId = message.replyTo
        entity.isRead = message.status == .read

        // Serialize content
        switch message.content {
        case .text(let text):
            entity.contentType = "text"
            entity.textContent = text
        case .image(let url, let width, let height):
            entity.contentType = "image"
            entity.mediaUrl = url
            entity.mediaWidth = Int32(width ?? 0)
            entity.mediaHeight = Int32(height ?? 0)
        case .file(let url, let name, let size):
            entity.contentType = "file"
            entity.mediaUrl = url
            entity.fileName = name
            entity.fileSize = Int64(size)
        case .voice(let url, let duration):
            entity.contentType = "voice"
            entity.mediaUrl = url
            entity.mediaDuration = duration
        case .location(let lat, let lon, let name):
            entity.contentType = "location"
            entity.locationLatitude = lat
            entity.locationLongitude = lon
            entity.locationName = name
        case .contact(let name, let address):
            entity.contentType = "contact"
            entity.contactName = name
            entity.contactAddress = address
        case .transaction(let sig, let amount, let token):
            entity.contentType = "transaction"
            entity.transactionSignature = sig
            entity.transactionAmount = amount
            entity.transactionToken = token
        case .system(let text):
            entity.contentType = "system"
            entity.textContent = text
        case .paymentRequest(let data):
            entity.contentType = "paymentRequest"
            // Store payment request as JSON in textContent
            if let jsonData = try? JSONEncoder().encode(data),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                entity.textContent = jsonString
            }
        }

        saveContext()
        return entity
    }

    func updateMessageStatus(_ messageId: String, status: ChatMessage.MessageStatus) async throws {
        guard let message = try await fetchMessage(byId: messageId) else { return }
        message.status = status.rawValue
        message.isRead = status == .read
        saveContext()
    }

    func deleteMessage(_ messageId: String) async throws {
        guard let message = try await fetchMessage(byId: messageId) else { return }
        viewContext.delete(message)
        saveContext()
    }

    // MARK: - Contact Operations

    func fetchContacts() async throws -> [ContactEntity] {
        let request = ContactEntity.fetchRequest()
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \ContactEntity.isFavorite, ascending: false),
            NSSortDescriptor(keyPath: \ContactEntity.handle, ascending: true)
        ]

        return try viewContext.fetch(request)
    }

    func fetchContact(byHandle handle: String) async throws -> ContactEntity? {
        let request = ContactEntity.fetchRequest()
        request.predicate = NSPredicate(format: "handle == %@", handle)
        request.fetchLimit = 1

        return try viewContext.fetch(request).first
    }

    func createOrUpdateContact(handle: String, isFavorite: Bool = false) async throws -> ContactEntity {
        if let existing = try await fetchContact(byHandle: handle) {
            existing.lastInteraction = Date()
            saveContext()
            return existing
        }

        let contact = ContactEntity(context: viewContext)
        contact.handle = handle
        contact.isFavorite = isFavorite
        contact.isBlocked = false
        contact.addedAt = Date()
        contact.lastInteraction = Date()

        saveContext()
        return contact
    }

    func updateContactFavorite(_ handle: String, isFavorite: Bool) async throws {
        guard let contact = try await fetchContact(byHandle: handle) else { return }
        contact.isFavorite = isFavorite
        saveContext()
    }

    func updateContactBlocked(_ handle: String, isBlocked: Bool) async throws {
        guard let contact = try await fetchContact(byHandle: handle) else { return }
        contact.isBlocked = isBlocked
        saveContext()
    }

    func fetchBlockedContacts() async throws -> [ContactEntity] {
        let request = ContactEntity.fetchRequest()
        request.predicate = NSPredicate(format: "isBlocked == YES")
        return try viewContext.fetch(request)
    }

    func fetchRecentContacts(limit: Int = 10) async throws -> [ContactEntity] {
        let request = ContactEntity.fetchRequest()
        request.predicate = NSPredicate(format: "isBlocked == NO")
        request.sortDescriptors = [NSSortDescriptor(keyPath: \ContactEntity.lastInteraction, ascending: false)]
        request.fetchLimit = limit

        return try viewContext.fetch(request)
    }

    // MARK: - Cleanup

    func deleteAllData() async throws {
        let entities = ["ConversationEntity", "MessageEntity", "ContactEntity", "ParticipantEntity"]

        for entityName in entities {
            let fetchRequest = NSFetchRequest<NSFetchRequestResult>(entityName: entityName)
            let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)

            try viewContext.execute(deleteRequest)
        }

        saveContext()
    }
}
