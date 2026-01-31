import Foundation
import Combine

// MARK: - API Response Models

struct APIResponse<T: Decodable>: Decodable {
    let success: Bool
    let error: String?
    let message: String?
    let user: T?
    let available: Bool?
    let exists: Bool?
    let email: String?
    let users: [T]?
}

struct SappUserInfo: Codable, Equatable {
    let handle: String
    let solanaAddress: String?
}

// MARK: - API Errors

enum SappAPIError: Error, LocalizedError {
    case notConfigured
    case invalidURL
    case networkError(Error)
    case serverError(String)
    case decodingError(Error)
    case userNotFound
    case handleTaken
    case emailAlreadyRegistered
    case invalidHandle
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "API not configured. Set SAPP_API_URL in environment."
        case .invalidURL:
            return "Invalid API URL"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .serverError(let message):
            return message
        case .decodingError(let error):
            return "Failed to parse response: \(error.localizedDescription)"
        case .userNotFound:
            return "User not found"
        case .handleTaken:
            return "This handle is already taken"
        case .emailAlreadyRegistered:
            return "This email is already registered"
        case .invalidHandle:
            return "Handle must be 3-20 characters, lowercase letters, numbers, and underscores only"
        case .unknown:
            return "An unknown error occurred"
        }
    }
}

// MARK: - Sapp API Service

@MainActor
final class SappAPIService: ObservableObject {
    
    // MARK: - Singleton
    
    static let shared = SappAPIService()
    
    // MARK: - Configuration
    
    private let baseURL: String
    private let session: URLSession
    
    // MARK: - Published State
    
    @Published private(set) var currentUserInfo: SappUserInfo?
    @Published private(set) var isRegistered: Bool = false
    
    // MARK: - Initialization
    
    private init() {
        self.baseURL = AppConfig.sappAPIURL

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)

        print("[SappAPIService] Using API URL: \(baseURL)")
    }
    
    // MARK: - Registration
    
    /// Check if user is registered (after Privy auth)
    func checkRegistration(email: String) async throws -> SappUserInfo? {
        let endpoint = "/api/sapp/auth/me"
        guard var urlComponents = URLComponents(string: baseURL + endpoint) else {
            throw SappAPIError.invalidURL
        }
        urlComponents.queryItems = [URLQueryItem(name: "email", value: email)]
        
        guard let url = urlComponents.url else {
            throw SappAPIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        // Add Authorization header with Privy access token
        if let accessToken = await PrivyAuthService.shared.getAccessToken() {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw SappAPIError.unknown
            }
            
            if httpResponse.statusCode == 404 {
                isRegistered = false
                currentUserInfo = nil
                return nil
            }
            
            let decoded = try JSONDecoder().decode(APIResponse<SappUserInfo>.self, from: data)
            
            if decoded.success, let user = decoded.user {
                isRegistered = true
                currentUserInfo = user
                return user
            } else {
                throw SappAPIError.serverError(decoded.message ?? "Unknown error")
            }
        } catch let error as SappAPIError {
            throw error
        } catch let error as DecodingError {
            throw SappAPIError.decodingError(error)
        } catch {
            throw SappAPIError.networkError(error)
        }
    }
    
    /// Register a new user with handle (after Privy auth)
    func register(email: String, handle: String, privyUserId: String?) async throws -> SappUserInfo {
        let endpoint = "/api/sapp/auth/register"
        guard let url = URL(string: baseURL + endpoint) else {
            throw SappAPIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        var body: [String: Any] = [
            "email": email,
            "handle": handle
        ]
        if let privyUserId = privyUserId {
            body["privyUserId"] = privyUserId
        }
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw SappAPIError.unknown
            }
            
            let decoded = try JSONDecoder().decode(APIResponse<SappUserInfo>.self, from: data)
            
            if httpResponse.statusCode == 409 {
                if decoded.message?.contains("Handle") == true {
                    throw SappAPIError.handleTaken
                } else {
                    throw SappAPIError.emailAlreadyRegistered
                }
            }
            
            if httpResponse.statusCode == 400 {
                if decoded.message?.contains("Handle must be") == true {
                    throw SappAPIError.invalidHandle
                }
                throw SappAPIError.serverError(decoded.message ?? "Bad request")
            }
            
            if decoded.success, let user = decoded.user {
                isRegistered = true
                currentUserInfo = user
                return user
            } else {
                throw SappAPIError.serverError(decoded.message ?? "Registration failed")
            }
        } catch let error as SappAPIError {
            throw error
        } catch let error as DecodingError {
            throw SappAPIError.decodingError(error)
        } catch {
            throw SappAPIError.networkError(error)
        }
    }
    
    /// Update wallet address for existing user
    func updateWalletAddress(email: String, solanaAddress: String) async throws -> SappUserInfo {
        let endpoint = "/api/sapp/auth/wallet"
        guard let url = URL(string: baseURL + endpoint) else {
            throw SappAPIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Authorization header with Privy access token
        if let accessToken = await PrivyAuthService.shared.getAccessToken() {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }

        let body: [String: Any] = [
            "email": email,
            "solanaAddress": solanaAddress
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw SappAPIError.unknown
            }

            let decoded = try JSONDecoder().decode(APIResponse<SappUserInfo>.self, from: data)

            if httpResponse.statusCode == 404 {
                throw SappAPIError.userNotFound
            }

            if decoded.success, let user = decoded.user {
                currentUserInfo = user
                return user
            } else {
                throw SappAPIError.serverError(decoded.message ?? "Failed to update wallet")
            }
        } catch let error as SappAPIError {
            throw error
        } catch let error as DecodingError {
            throw SappAPIError.decodingError(error)
        } catch {
            throw SappAPIError.networkError(error)
        }
    }

    /// Check if a handle is available
    func isHandleAvailable(_ handle: String) async throws -> Bool {
        let endpoint = "/api/sapp/auth/handle-available"
        guard var urlComponents = URLComponents(string: baseURL + endpoint) else {
            throw SappAPIError.invalidURL
        }
        urlComponents.queryItems = [URLQueryItem(name: "handle", value: handle)]
        
        guard let url = urlComponents.url else {
            throw SappAPIError.invalidURL
        }
        
        do {
            let (data, _) = try await session.data(from: url)
            let decoded = try JSONDecoder().decode(APIResponse<SappUserInfo>.self, from: data)
            return decoded.available ?? false
        } catch let error as DecodingError {
            throw SappAPIError.decodingError(error)
        } catch {
            throw SappAPIError.networkError(error)
        }
    }
    
    // MARK: - User Lookup
    
    /// Look up a user by handle
    func lookupUser(handle: String) async throws -> SappUserInfo {
        print("[SappAPIService] lookupUser called for handle: \(handle), baseURL: \(baseURL)")
        let endpoint = "/api/sapp/users/lookup"
        guard var urlComponents = URLComponents(string: baseURL + endpoint) else {
            print("[SappAPIService] lookupUser FAILED: invalid URL components for \(baseURL + endpoint)")
            throw SappAPIError.invalidURL
        }
        urlComponents.queryItems = [URLQueryItem(name: "handle", value: handle)]

        guard let url = urlComponents.url else {
            print("[SappAPIService] lookupUser FAILED: could not construct URL")
            throw SappAPIError.invalidURL
        }

        print("[SappAPIService] lookupUser requesting: \(url.absoluteString)")

        do {
            let (data, response) = try await session.data(from: url)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw SappAPIError.unknown
            }

            print("[SappAPIService] lookupUser response status: \(httpResponse.statusCode)")
            if let responseStr = String(data: data, encoding: .utf8) {
                print("[SappAPIService] lookupUser response body: \(responseStr)")
            }

            if httpResponse.statusCode == 404 {
                throw SappAPIError.userNotFound
            }

            let decoded = try JSONDecoder().decode(APIResponse<SappUserInfo>.self, from: data)

            if decoded.success, let user = decoded.user {
                return user
            } else {
                throw SappAPIError.serverError(decoded.message ?? "Lookup failed")
            }
        } catch let error as SappAPIError {
            print("[SappAPIService] lookupUser SappAPIError: \(error)")
            throw error
        } catch let error as DecodingError {
            print("[SappAPIService] lookupUser DecodingError: \(error)")
            throw SappAPIError.decodingError(error)
        } catch {
            print("[SappAPIService] lookupUser NetworkError: \(error)")
            throw SappAPIError.networkError(error)
        }
    }
    
    /// Check if a handle exists (for messaging validation)
    func handleExists(_ handle: String) async throws -> Bool {
        let endpoint = "/api/sapp/users/exists"
        guard var urlComponents = URLComponents(string: baseURL + endpoint) else {
            throw SappAPIError.invalidURL
        }
        urlComponents.queryItems = [URLQueryItem(name: "handle", value: handle)]
        
        guard let url = urlComponents.url else {
            throw SappAPIError.invalidURL
        }
        
        do {
            let (data, _) = try await session.data(from: url)
            let decoded = try JSONDecoder().decode(APIResponse<SappUserInfo>.self, from: data)
            return decoded.exists ?? false
        } catch let error as DecodingError {
            throw SappAPIError.decodingError(error)
        } catch {
            throw SappAPIError.networkError(error)
        }
    }
    
    /// Search users by handle or display name
    func searchUsers(query: String, limit: Int = 10) async throws -> [SappUserInfo] {
        let endpoint = "/api/sapp/users/search"
        guard var urlComponents = URLComponents(string: baseURL + endpoint) else {
            throw SappAPIError.invalidURL
        }
        urlComponents.queryItems = [
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "limit", value: String(limit))
        ]
        
        guard let url = urlComponents.url else {
            throw SappAPIError.invalidURL
        }
        
        do {
            let (data, _) = try await session.data(from: url)
            
            struct SearchResponse: Decodable {
                let success: Bool
                let users: [SappUserInfo]?
            }
            
            let decoded = try JSONDecoder().decode(SearchResponse.self, from: data)
            return decoded.users ?? []
        } catch let error as DecodingError {
            throw SappAPIError.decodingError(error)
        } catch {
            throw SappAPIError.networkError(error)
        }
    }
    
    /// Resolve handle to email (for P2P connection)
    func resolveHandleToEmail(_ handle: String) async throws -> String {
        let endpoint = "/api/sapp/users/resolve"
        guard var urlComponents = URLComponents(string: baseURL + endpoint) else {
            throw SappAPIError.invalidURL
        }
        urlComponents.queryItems = [URLQueryItem(name: "handle", value: handle)]
        
        guard let url = urlComponents.url else {
            throw SappAPIError.invalidURL
        }
        
        do {
            let (data, response) = try await session.data(from: url)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw SappAPIError.unknown
            }
            
            if httpResponse.statusCode == 404 {
                throw SappAPIError.userNotFound
            }
            
            let decoded = try JSONDecoder().decode(APIResponse<SappUserInfo>.self, from: data)
            
            if decoded.success, let email = decoded.email {
                return email
            } else {
                throw SappAPIError.serverError(decoded.message ?? "Resolve failed")
            }
        } catch let error as SappAPIError {
            throw error
        } catch let error as DecodingError {
            throw SappAPIError.decodingError(error)
        } catch {
            throw SappAPIError.networkError(error)
        }
    }
    
    
    // MARK: - State Management
    
    /// Clear local state (on logout)
    func clearState() {
        currentUserInfo = nil
        isRegistered = false
    }
}
