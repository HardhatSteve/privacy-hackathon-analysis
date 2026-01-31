import Foundation

// MARK: - Solana Price Service

/// Fetches real-time SOL price from CoinGecko API
final class SolanaPriceService {

    static let shared = SolanaPriceService()

    private let baseURL = "https://api.coingecko.com/api/v3"
    private var cachedPrice: CachedPrice?
    private let cacheTimeout: TimeInterval = 60  // 1 minute cache

    private init() {}

    // MARK: - Public Methods

    /// Get current SOL price in USD
    func getSOLPrice() async throws -> Double {
        // Check cache first
        if let cached = cachedPrice, !cached.isExpired {
            return cached.price
        }

        // Fetch from API
        let price = try await fetchSOLPrice()

        // Cache the result
        cachedPrice = CachedPrice(price: price, timestamp: Date())

        return price
    }

    /// Convert SOL amount to USD
    func solToUSD(_ solAmount: Double) async throws -> Double {
        let price = try await getSOLPrice()
        return solAmount * price
    }

    /// Convert lamports to USD
    func lamportsToUSD(_ lamports: UInt64) async throws -> Double {
        let solAmount = Double(lamports) / 1_000_000_000
        return try await solToUSD(solAmount)
    }

    // MARK: - Private Methods

    private func fetchSOLPrice() async throws -> Double {
        let endpoint = "\(baseURL)/simple/price?ids=solana&vs_currencies=usd"

        guard let url = URL(string: endpoint) else {
            throw PriceServiceError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.timeoutInterval = 10

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw PriceServiceError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw PriceServiceError.httpError(httpResponse.statusCode)
        }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let solana = json["solana"] as? [String: Any],
              let usdPrice = solana["usd"] as? Double else {
            throw PriceServiceError.parseError
        }

        return usdPrice
    }
}

// MARK: - Cached Price

private struct CachedPrice {
    let price: Double
    let timestamp: Date

    var isExpired: Bool {
        Date().timeIntervalSince(timestamp) > 60  // 1 minute expiry
    }
}

// MARK: - Price Service Errors

enum PriceServiceError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(Int)
    case parseError

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL"
        case .invalidResponse:
            return "Invalid response from price API"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .parseError:
            return "Failed to parse price data"
        }
    }
}
