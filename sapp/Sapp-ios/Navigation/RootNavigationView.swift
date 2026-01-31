import SwiftUI
import Combine

struct RootNavigationView: View {
    private let biometricService = BiometricAuthService.shared
    private let biometricSettings = BiometricSettingsStore.shared
    
    @State private var isOnboarded: Bool = UserDefaults.standard.bool(forKey: "sapp.isOnboarded")
    @State private var showBiometricSetup: Bool = false
    
    // App-wide services
    @StateObject private var appState = AppState()

    var body: some View {
        Group {
            if showBiometricSetup {
                BiometricSetupPromptView {
                    showBiometricSetup = false
                }
            } else if isOnboarded {
                MainTabView(onSignOut: {
                    Task {
                        await appState.signOut()
                    }
                    biometricSettings.reset()
                    UserDefaults.standard.set(false, forKey: "sapp.isOnboarded")
                    isOnboarded = false
                })
                .environmentObject(appState)
            } else {
                OnboardingView {
                    UserDefaults.standard.set(true, forKey: "sapp.isOnboarded")
                    isOnboarded = true
                    checkBiometricSetup()
                }
            }
        }
        .preferredColorScheme(.light)  // Force light mode for the minimal design
    }
    
    private func checkBiometricSetup() {
        if !biometricSettings.hasPromptedForBiometric && biometricService.isBiometricAvailable() {
            showBiometricSetup = true
        }
    }
}

// MARK: - App State

struct TimeoutError: Error {
    var localizedDescription: String {
        "Operation timed out"
    }
}

@MainActor
final class AppState: ObservableObject {
    @Published var currentUserId: String = ""
    @Published var currentHandle: String = ""
    @Published var isP2PReady: Bool = false
    @Published var isMessagingConnected: Bool = false

    let privyService = PrivyAuthService.shared
    let apiService = SappAPIService.shared
    let solanaService = SolanaWalletService()
    let bareKitManager = BareKitManager()
    let webSocketService = WebSocketService.shared

    private var _messagingService: MessagingServicing?
    private var isConnectingMessaging: Bool = false  // Flag to prevent duplicate connection attempts

    /// Feature flag to enable Hypercore-based messaging
    var useHybridMessaging: Bool = true

    var messagingService: MessagingServicing {
        if let existing = _messagingService {
            return existing
        }

        let service: MessagingServicing
        if useHybridMessaging {
            // Use HybridMessagingService with Hypercore support
            service = HybridMessagingService(currentHandle: currentHandle)
            print("[AppState] Using HybridMessagingService with Hypercore support")
        } else {
            // Fall back to original WebSocket-only service
            service = MessagingService(
                bareKitManager: bareKitManager,
                webSocketService: webSocketService,
                currentUserId: currentUserId,
                currentHandle: currentHandle
            )
            print("[AppState] Using original MessagingService (WebSocket only)")
        }
        _messagingService = service
        return service
    }

    private var cancellables = Set<AnyCancellable>()

    init() {
        // Load cached handle from UserDefaults for immediate use
        // Normalize to lowercase for consistent comparisons
        currentHandle = (UserDefaults.standard.string(forKey: "user.handle") ?? "").lowercased()

        // Observe auth state changes from Privy service
        privyService.$authState
            .receive(on: RunLoop.main)
            .sink { [weak self] state in
                guard let self else { return }
                if case .authenticated(let user) = state {
                    self.currentUserId = user.id
                    Task {
                        await self.loadUserHandle()
                        await self.connectMessaging()
                    }
                } else {
                    self.currentUserId = ""
                    self.currentHandle = ""
                }
            }
            .store(in: &cancellables)

        Task {
            await initializeServices()
        }
    }

    private func initializeServices() async {
        // Check Privy auth state on startup
        await privyService.checkAuthState()

        // Load user ID and handle from Privy session if already authenticated
        if case .authenticated(let user) = privyService.authState {
            currentUserId = user.id
            await loadUserHandle()
            await connectMessaging()
        }
    }

    private func loadUserHandle() async {
        // Get user's handle from Sapp API based on their Privy email
        if let email = privyService.currentUser?.email {
            if let userInfo = try? await apiService.checkRegistration(email: email) {
                // Normalize handle to lowercase for consistent comparisons
                let normalizedHandle = userInfo.handle.lowercased()
                currentHandle = normalizedHandle
                // Cache normalized handle for faster startup
                UserDefaults.standard.set(normalizedHandle, forKey: "user.handle")

                // Update messaging service with the new user info if it was already created
                if let service = _messagingService {
                    service.updateUserInfo(userId: currentUserId, handle: normalizedHandle)
                }
            }
        }
    }

    private func connectMessaging() async {
        // Prevent duplicate connection attempts more carefully
        // Only skip if we're already fully connected (not just connecting)
        guard !isMessagingConnected else {
            print("[AppState] ⚠️ Already connected - skipping duplicate connectMessaging() call")
            return
        }

        // BLOCK if connection already in progress to prevent duplicate WebSocket connections
        // This fixes the race condition where both auth observer and initializeServices()
        // can call connectMessaging() nearly simultaneously on app startup
        guard !isConnectingMessaging else {
            print("[AppState] ⚠️ Connection already in progress - skipping duplicate attempt")
            return
        }

        guard !currentHandle.isEmpty else {
            print("[AppState] Cannot connect messaging: no handle")
            return
        }

        print("[AppState] 🔌 Starting messaging connection for @\(currentHandle)")
        isConnectingMessaging = true

        // Ensure messaging service has correct user info before connecting
        if let service = _messagingService {
            service.updateUserInfo(userId: currentUserId, handle: currentHandle)
        }

        do {
            // Initialize P2P (optional) and WebSocket (primary) with timeout
            // connect() no longer throws for P2P failures - it logs and continues
            try await withTimeout(seconds: 10) {
                try await self.messagingService.connect(token: "")
            }

            // WebSocket is the primary messaging method, so we're connected
            isMessagingConnected = true

            // P2P readiness is optional - check the actual state
            // For now, set to true since we attempted initialization
            // The actual P2P state is tracked internally by BareKitManager
            isP2PReady = bareKitManager.connectionState.isReady

            print("[AppState] ✅ Messaging connected for @\(currentHandle) (P2P ready: \(isP2PReady))")
        } catch {
            print("[AppState] ❌ Failed to connect messaging: \(error)")
            isP2PReady = false
            isMessagingConnected = false
        }
        
        // Always reset the connecting flag, even if there was an error
        isConnectingMessaging = false
    }
    
    /// Helper to add timeout to async operations
    private func withTimeout<T>(seconds: TimeInterval, operation: @escaping () async throws -> T) async throws -> T {
        try await withThrowingTaskGroup(of: T.self) { group in
            group.addTask {
                try await operation()
            }
            
            group.addTask {
                try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
                throw TimeoutError()
            }
            
            let result = try await group.next()!
            group.cancelAll()
            return result
        }
    }

    func signOut() async {
        // Disconnect messaging services
        await messagingService.disconnect()
        isMessagingConnected = false
        isP2PReady = false
        isConnectingMessaging = false

        // Logout from Privy
        await privyService.logout()
        currentUserId = ""
        currentHandle = ""

        // Clear API state
        apiService.clearState()

        // Clear cached handle
        UserDefaults.standard.removeObject(forKey: "user.handle")

        // Reset messaging service
        _messagingService = nil
    }
}
