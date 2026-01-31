import Foundation
import Combine

// MARK: - StarPay Service

@MainActor
final class StarPayService: ObservableObject {

    // MARK: - Singleton

    static let shared = StarPayService()

    // MARK: - Configuration

    private let baseURL: String
    private let session: URLSession

    // MARK: - Published State

    @Published private(set) var isServiceAvailable: Bool = false
    @Published private(set) var currentOrder: CardOrderResponse?
    @Published private(set) var orderStatus: OrderStatusResponse?

    // MARK: - Initialization

    private init() {
        self.baseURL = AppConfig.sappAPIURL

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)

        print("[StarPayService] Using API URL: \(baseURL)")
    }

    // MARK: - Service Status

    /// Check if card service is available
    func checkServiceStatus() async throws -> Bool {
        let endpoint = "/api/sapp/starpay/status"
        guard let url = URL(string: baseURL + endpoint) else {
            throw StarPayError.networkError(URLError(.badURL))
        }

        do {
            let (data, _) = try await session.data(from: url)
            let response = try JSONDecoder().decode(StarPayServiceStatusResponse.self, from: data)
            isServiceAvailable = response.available
            return response.available
        } catch {
            isServiceAvailable = false
            throw StarPayError.networkError(error)
        }
    }

    // MARK: - Create Order

    /// Create a new card order
    func createOrder(amount: Double, cardType: CardType, email: String) async throws -> CardOrderResponse {
        let endpoint = "/api/sapp/starpay/order"
        guard let url = URL(string: baseURL + endpoint) else {
            throw StarPayError.networkError(URLError(.badURL))
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "amount": amount,
            "cardType": cardType.rawValue,
            "email": email
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw StarPayError.unknown("Invalid response")
            }

            let decoded = try JSONDecoder().decode(StarPayOrderAPIResponse.self, from: data)

            if httpResponse.statusCode == 503 {
                throw StarPayError.serviceUnavailable
            }

            if httpResponse.statusCode == 400 {
                switch decoded.error {
                case "INVALID_AMOUNT":
                    throw StarPayError.invalidAmount
                case "INVALID_EMAIL":
                    throw StarPayError.invalidEmail
                case "INVALID_CARD_TYPE":
                    throw StarPayError.invalidCardType
                default:
                    throw StarPayError.unknown(decoded.message ?? "Invalid request")
                }
            }

            if httpResponse.statusCode == 401 {
                throw StarPayError.unauthorized
            }

            if httpResponse.statusCode == 403 {
                throw StarPayError.accountSuspended
            }

            guard decoded.success, let order = decoded.order else {
                throw StarPayError.unknown(decoded.message ?? "Failed to create order")
            }

            currentOrder = order
            return order
        } catch let error as StarPayError {
            throw error
        } catch let error as DecodingError {
            throw StarPayError.decodingError(error)
        } catch {
            throw StarPayError.networkError(error)
        }
    }

    // MARK: - Get Order Status

    /// Check the status of an existing order
    func getOrderStatus(orderId: String) async throws -> OrderStatusResponse {
        let endpoint = "/api/sapp/starpay/order/status"
        guard var urlComponents = URLComponents(string: baseURL + endpoint) else {
            throw StarPayError.networkError(URLError(.badURL))
        }

        urlComponents.queryItems = [URLQueryItem(name: "orderId", value: orderId)]

        guard let url = urlComponents.url else {
            throw StarPayError.networkError(URLError(.badURL))
        }

        do {
            let (data, response) = try await session.data(from: url)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw StarPayError.unknown("Invalid response")
            }

            let decoded = try JSONDecoder().decode(StarPayStatusAPIResponse.self, from: data)

            if httpResponse.statusCode == 404 {
                throw StarPayError.orderNotFound
            }

            if httpResponse.statusCode == 401 {
                throw StarPayError.unauthorized
            }

            if httpResponse.statusCode == 503 {
                throw StarPayError.serviceUnavailable
            }

            guard decoded.success,
                  let orderId = decoded.orderId,
                  let status = decoded.status else {
                throw StarPayError.unknown(decoded.message ?? "Failed to get order status")
            }

            let statusResponse = OrderStatusResponse(
                orderId: orderId,
                status: status,
                payment: decoded.payment,
                pricing: decoded.pricing,
                card: decoded.card,
                expiresAt: decoded.expiresAt,
                completedAt: decoded.completedAt,
                failureReason: decoded.failureReason
            )

            orderStatus = statusResponse
            return statusResponse
        } catch let error as StarPayError {
            throw error
        } catch let error as DecodingError {
            throw StarPayError.decodingError(error)
        } catch {
            throw StarPayError.networkError(error)
        }
    }

    // MARK: - Get Pricing

    /// Get pricing breakdown for an amount (without creating order)
    func getPrice(amount: Double) async throws -> PriceResponse {
        let endpoint = "/api/sapp/starpay/price"
        guard var urlComponents = URLComponents(string: baseURL + endpoint) else {
            throw StarPayError.networkError(URLError(.badURL))
        }

        urlComponents.queryItems = [URLQueryItem(name: "amount", value: String(amount))]

        guard let url = urlComponents.url else {
            throw StarPayError.networkError(URLError(.badURL))
        }

        do {
            let (data, response) = try await session.data(from: url)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw StarPayError.unknown("Invalid response")
            }

            let decoded = try JSONDecoder().decode(StarPayPriceAPIResponse.self, from: data)

            if httpResponse.statusCode == 400 {
                throw StarPayError.invalidAmount
            }

            if httpResponse.statusCode == 503 {
                throw StarPayError.serviceUnavailable
            }

            guard decoded.success,
                  let pricing = decoded.pricing,
                  let solPrice = decoded.solPrice,
                  let amountSol = decoded.amountSol else {
                throw StarPayError.unknown(decoded.message ?? "Failed to get pricing")
            }

            return PriceResponse(pricing: pricing, solPrice: solPrice, amountSol: amountSol)
        } catch let error as StarPayError {
            throw error
        } catch let error as DecodingError {
            throw StarPayError.decodingError(error)
        } catch {
            throw StarPayError.networkError(error)
        }
    }

    // MARK: - Clear State

    func clearState() {
        currentOrder = nil
        orderStatus = nil
    }
}
