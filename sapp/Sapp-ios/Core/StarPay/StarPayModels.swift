import Foundation

// MARK: - Card Types

enum CardType: String, Codable, CaseIterable {
    case mastercard = "mastercard"

    var displayName: String {
        switch self {
        case .mastercard: return "Mastercard"
        }
    }

    var iconName: String {
        switch self {
        case .mastercard: return "creditcard.fill"
        }
    }
}

// MARK: - Order Status

enum CardOrderStatus: String, Codable {
    case pending = "pending"
    case processing = "processing"
    case completed = "completed"
    case failed = "failed"
    case expired = "expired"

    var displayName: String {
        switch self {
        case .pending: return "Waiting for Payment"
        case .processing: return "Processing"
        case .completed: return "Completed"
        case .failed: return "Failed"
        case .expired: return "Expired"
        }
    }

    var isTerminal: Bool {
        switch self {
        case .completed, .failed, .expired:
            return true
        case .pending, .processing:
            return false
        }
    }
}

// MARK: - Payment Info

struct PaymentInfo: Codable, Equatable {
    let address: String
    let amountSol: Double
    let solPrice: Double

    var formattedSolAmount: String {
        String(format: "%.4f SOL", amountSol)
    }
}

// MARK: - Pricing Info

struct PricingInfo: Codable, Equatable {
    let cardValue: Double
    let starpayFeePercent: Double
    let starpayFee: Double
    let resellerMarkup: Double
    let total: Double

    var formattedCardValue: String {
        String(format: "$%.2f", cardValue)
    }

    var formattedTotal: String {
        String(format: "$%.2f", total)
    }

    var formattedFee: String {
        String(format: "$%.2f", starpayFee + resellerMarkup)
    }
}

// MARK: - Card Details (for completed orders)

struct CardDetails: Codable, Equatable {
    let cardNumber: String
    let expiryMonth: String
    let expiryYear: String
    let cvv: String
    let cardholderName: String

    var maskedCardNumber: String {
        let last4 = String(cardNumber.suffix(4))
        return "**** **** **** \(last4)"
    }

    var formattedExpiry: String {
        "\(expiryMonth)/\(expiryYear)"
    }
}

// MARK: - API Request/Response Models

struct CardOrderRequest: Encodable {
    let amount: Double
    let cardType: CardType
    let email: String

    enum CodingKeys: String, CodingKey {
        case amount, cardType, email
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(amount, forKey: .amount)
        try container.encode(cardType.rawValue, forKey: .cardType)
        try container.encode(email, forKey: .email)
    }
}

struct CardOrderResponse: Codable, Equatable {
    let orderId: String
    let status: CardOrderStatus
    let payment: PaymentInfo
    let pricing: PricingInfo
    let feeTier: String
    let expiresAt: String
    let checkStatusUrl: String

    var expirationDate: Date? {
        ISO8601DateFormatter().date(from: expiresAt)
    }
}

struct OrderStatusResponse: Codable, Equatable {
    let orderId: String
    let status: CardOrderStatus
    let payment: PaymentInfo?
    let pricing: PricingInfo?
    let card: CardDetails?
    let expiresAt: String?
    let completedAt: String?
    let failureReason: String?
}

struct PriceResponse: Codable {
    let pricing: PricingInfo
    let solPrice: Double
    let amountSol: Double
}

// MARK: - API Wrapper Responses

struct StarPayOrderAPIResponse: Codable {
    let success: Bool
    let order: CardOrderResponse?
    let error: String?
    let message: String?
}

struct StarPayStatusAPIResponse: Codable {
    let success: Bool
    let orderId: String?
    let status: CardOrderStatus?
    let payment: PaymentInfo?
    let pricing: PricingInfo?
    let card: CardDetails?
    let expiresAt: String?
    let completedAt: String?
    let failureReason: String?
    let error: String?
    let message: String?
}

struct StarPayPriceAPIResponse: Codable {
    let success: Bool
    let pricing: PricingInfo?
    let solPrice: Double?
    let amountSol: Double?
    let error: String?
    let message: String?
}

struct StarPayServiceStatusResponse: Codable {
    let success: Bool
    let available: Bool
    let message: String?
}

// MARK: - Errors

enum StarPayError: Error, LocalizedError {
    case serviceUnavailable
    case invalidAmount
    case invalidEmail
    case invalidCardType
    case orderNotFound
    case unauthorized
    case accountSuspended
    case networkError(Error)
    case decodingError(Error)
    case unknown(String)

    var errorDescription: String? {
        switch self {
        case .serviceUnavailable:
            return "Card ordering service is currently unavailable"
        case .invalidAmount:
            return "Amount must be between $5 and $10,000"
        case .invalidEmail:
            return "Please enter a valid email address"
        case .invalidCardType:
            return "Please select a valid card type"
        case .orderNotFound:
            return "Order not found"
        case .unauthorized:
            return "Service authentication failed"
        case .accountSuspended:
            return "Service account is suspended"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError(let error):
            return "Failed to process response: \(error.localizedDescription)"
        case .unknown(let message):
            return message
        }
    }
}
