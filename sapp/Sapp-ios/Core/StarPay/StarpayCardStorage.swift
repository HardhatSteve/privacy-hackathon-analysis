import Foundation
import Combine

// MARK: - Saved Card Model

struct SavedCard: Codable, Identifiable, Equatable {
    let id: UUID
    let cardDetails: CardDetails
    let cardType: CardType
    let email: String
    let orderedAt: Date
    let cardValue: Double

    var displayName: String {
        "\(cardType.displayName) ****\(String(cardDetails.cardNumber.suffix(4)))"
    }

    var formattedOrderDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        return formatter.string(from: orderedAt)
    }

    var formattedCardValue: String {
        String(format: "$%.0f", cardValue)
    }
}

// MARK: - Starpay Card Storage

@MainActor
final class StarpayCardStorage: ObservableObject {

    // MARK: - Singleton

    static let shared = StarpayCardStorage()

    // MARK: - Published State

    @Published private(set) var savedCards: [SavedCard] = []

    // MARK: - Private Properties

    private let storageKey = "starpay_saved_cards"
    private let userDefaults = UserDefaults.standard

    // MARK: - Initialization

    private init() {
        loadCards()
    }

    // MARK: - Public Methods

    /// Save a completed card order
    func saveCard(
        cardDetails: CardDetails,
        cardType: CardType,
        email: String,
        cardValue: Double
    ) {
        let card = SavedCard(
            id: UUID(),
            cardDetails: cardDetails,
            cardType: cardType,
            email: email,
            orderedAt: Date(),
            cardValue: cardValue
        )

        savedCards.insert(card, at: 0) // Add to beginning (newest first)
        persistCards()

        print("[StarpayCardStorage] Saved new card: \(card.displayName)")
    }

    /// Delete a saved card
    func deleteCard(id: UUID) {
        savedCards.removeAll { $0.id == id }
        persistCards()

        print("[StarpayCardStorage] Deleted card: \(id)")
    }

    /// Clear all saved cards
    func clearAllCards() {
        savedCards.removeAll()
        persistCards()

        print("[StarpayCardStorage] Cleared all cards")
    }

    /// Reload cards from storage
    func loadCards() {
        guard let data = userDefaults.data(forKey: storageKey) else {
            savedCards = []
            return
        }

        do {
            let decoder = JSONDecoder()
            savedCards = try decoder.decode([SavedCard].self, from: data)
            print("[StarpayCardStorage] Loaded \(savedCards.count) cards")
        } catch {
            print("[StarpayCardStorage] Failed to decode cards: \(error)")
            savedCards = []
        }
    }

    // MARK: - Private Methods

    private func persistCards() {
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(savedCards)
            userDefaults.set(data, forKey: storageKey)
            print("[StarpayCardStorage] Persisted \(savedCards.count) cards")
        } catch {
            print("[StarpayCardStorage] Failed to encode cards: \(error)")
        }
    }
}
