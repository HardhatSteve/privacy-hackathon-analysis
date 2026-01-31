import SwiftUI
import Combine
import PrivySDK

// MARK: - Main Onboarding View

struct OnboardingView: View {
    @StateObject private var viewModel = OnboardingViewModel()
    let onComplete: () -> Void
    
    var body: some View {
        ZStack {
            SappColors.background.ignoresSafeArea()
            
            switch viewModel.currentStep {
            case .welcome:
                WelcomeStepView(onContinue: {
                    withAnimation { viewModel.nextStep() }
                })
                .transition(.asymmetric(insertion: .move(edge: .trailing), removal: .move(edge: .leading)))
                
            case .authentication:
                AuthenticationStepView(viewModel: viewModel)
                    .transition(.asymmetric(insertion: .move(edge: .trailing), removal: .move(edge: .leading)))
                
            case .verification:
                VerificationStepView(viewModel: viewModel)
                    .transition(.asymmetric(insertion: .move(edge: .trailing), removal: .move(edge: .leading)))
                
            case .handleSetup:
                HandleSetupStepView(viewModel: viewModel)
                    .transition(.asymmetric(insertion: .move(edge: .trailing), removal: .move(edge: .leading)))
                
            case .walletSetup:
                WalletSetupStepView(viewModel: viewModel)
                    .transition(.asymmetric(insertion: .move(edge: .trailing), removal: .move(edge: .leading)))
                
            case .complete:
                OnboardingCompleteView(onFinish: onComplete)
                    .transition(.asymmetric(insertion: .move(edge: .trailing), removal: .move(edge: .leading)))
            }
        }
        .animation(.easeInOut(duration: 0.3), value: viewModel.currentStep)
        .onAppear {
            viewModel.configure()
        }
    }
}

// MARK: - Onboarding ViewModel

@MainActor
final class OnboardingViewModel: ObservableObject {
    @Published var currentStep: OnboardingStep = .welcome
    @Published var authMethod: AuthMethod = .email
    @Published var email = ""
    @Published var verificationCode = ""
    @Published var handle = ""
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    // User status tracking
    @Published var existingUserInfo: SappUserInfo?
    @Published var hasExistingWallet: Bool = false
    @Published var walletMismatch: Bool = false
    @Published var backendWalletAddress: String?
    @Published var privyWalletAddress: String?
    
    // Handle validation
    @Published var handleError = ""
    @Published var isCheckingHandle = false
    @Published var isHandleValid = false

    // Registration state - prevents duplicate registration calls
    private var isRegistrationInProgress = false

    private var privyService: PrivyAuthService!
    private let sappAPIService = SappAPIService.shared
    private var handleCheckTask: Task<Void, Never>?
    
    nonisolated init() {}
    
    func configure() {
        privyService = PrivyAuthService.shared
    }
    
    enum OnboardingStep: Int, CaseIterable {
        case welcome
        case authentication
        case verification
        case handleSetup
        case walletSetup
        case complete
        
        var progress: Double {
            Double(rawValue) / Double(Self.allCases.count - 1)
        }
    }
    
    enum AuthMethod {
        case email
    }
    
    func nextStep() {
        guard let nextIndex = OnboardingStep.allCases.firstIndex(where: { $0.rawValue == currentStep.rawValue + 1 }) else {
            return
        }
        currentStep = OnboardingStep.allCases[nextIndex]
    }
    
    func previousStep() {
        guard let prevIndex = OnboardingStep.allCases.firstIndex(where: { $0.rawValue == currentStep.rawValue - 1 }) else {
            return
        }
        currentStep = OnboardingStep.allCases[prevIndex]
    }
    
    func initiateAuth(method: AuthMethod) async {
        authMethod = method
        isLoading = true
        errorMessage = nil
        
        defer { isLoading = false }
        
        do {
            guard !email.isEmpty else {
                errorMessage = "Please enter your email address"
                return
            }
            try await privyService.sendEmailCode(to: email)
            nextStep()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    func verifyCode() async {
        guard !verificationCode.isEmpty else {
            errorMessage = "Please enter the verification code"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        defer { isLoading = false }
        
        do {
            // Step 1: Verify OTP with Privy
            _ = try await privyService.loginWithEmailCode(verificationCode, email: email)
            
            // Step 2: Check user status in our backend
            await checkUserStatusAndNavigate()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    /// Check if user is registered and has a wallet, then navigate to appropriate step
    private func checkUserStatusAndNavigate() async {
        do {
            // Check if user is registered in our backend
            if let userInfo = try await sappAPIService.checkRegistration(email: email) {
                existingUserInfo = userInfo
                backendWalletAddress = userInfo.solanaAddress
            } else {
                existingUserInfo = nil
                backendWalletAddress = nil
            }
        } catch {
            // User not found - this is expected for new users
            existingUserInfo = nil
            backendWalletAddress = nil
        }

        // Check if user already has both Solana and Ethereum wallets via Privy
        let hasSolanaWallet = privyService.embeddedSolanaWallet != nil
        let hasEthereumWallet = privyService.embeddedEthereumWallet != nil
        hasExistingWallet = hasSolanaWallet && hasEthereumWallet
        privyWalletAddress = privyService.embeddedSolanaWallet?.address

        // Detect wallet mismatch
        if let backend = backendWalletAddress, let privy = privyWalletAddress {
            if backend != privy {
                walletMismatch = true
                print("[Onboarding] ⚠️ Wallet mismatch detected!")
                print("[Onboarding]   Backend wallet: \(backend)")
                print("[Onboarding]   Privy wallet:   \(privy)")
            }
        }

        // Navigate based on user status
        if existingUserInfo != nil {
            // Returning user - skip handle setup
            if hasExistingWallet {
                // Has both wallets - go straight to complete (mismatch will be shown in Settings)
                currentStep = .complete
            } else if hasSolanaWallet || hasEthereumWallet {
                // Has one wallet but not the other - go to wallet setup to create missing wallet
                print("[Onboarding] User has partial wallet setup. Creating missing wallet(s).")
                currentStep = .walletSetup
            } else if backendWalletAddress != nil {
                // Backend has wallet but Privy doesn't - user needs to be warned
                print("[Onboarding] ⚠️ Backend has wallet but Privy doesn't. New wallets will be created.")
                currentStep = .walletSetup
            } else {
                // No wallet anywhere - go to wallet setup
                currentStep = .walletSetup
            }
        } else {
            // New user - go to handle setup
            currentStep = .handleSetup
        }
    }
    
    func resendCode() async {
        isLoading = true
        errorMessage = nil
        
        defer { isLoading = false }
        
        do {
            try await privyService.sendEmailCode(to: email)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    // MARK: - Handle Validation
    
    func validateHandle(_ input: String) {
        handleCheckTask?.cancel()
        
        let normalized = input.lowercased().trimmingCharacters(in: .whitespaces)
        handle = normalized
        
        if normalized.isEmpty {
            handleError = ""
            isHandleValid = false
            return
        }
        
        // Regex check for valid characters
        let regex = try? NSRegularExpression(pattern: "^[a-z0-9_]+$")
        let range = NSRange(normalized.startIndex..., in: normalized)
        let isValidFormat = regex?.firstMatch(in: normalized, range: range) != nil
        
        if !isValidFormat {
            handleError = "Only lowercase letters, numbers, and underscores"
            isHandleValid = false
            return
        }
        
        if normalized.count < 3 {
            handleError = "Must be at least 3 characters"
            isHandleValid = false
            return
        }
        
        if normalized.count > 20 {
            handleError = "Must be at most 20 characters"
            isHandleValid = false
            return
        }
        
        handleError = ""
        isCheckingHandle = true
        
        // Debounce the API call
        handleCheckTask = Task {
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5s debounce
            
            guard !Task.isCancelled else { return }
            
            do {
                let available = try await sappAPIService.isHandleAvailable(normalized)
                
                guard !Task.isCancelled else { return }
                
                if available {
                    isHandleValid = true
                    handleError = ""
                } else {
                    isHandleValid = false
                    handleError = "This handle is already taken"
                }
            } catch {
                guard !Task.isCancelled else { return }
                isHandleValid = false
                handleError = "Could not check availability"
            }
            
            isCheckingHandle = false
        }
    }
    
    var canRegisterHandle: Bool {
        isHandleValid && !isCheckingHandle && !isLoading
    }
    
    func registerHandle() async {
        // Prevent duplicate calls (race condition protection)
        guard !isRegistrationInProgress else {
            print("[Onboarding] Registration already in progress, ignoring duplicate call")
            return
        }
        guard canRegisterHandle else { return }

        isRegistrationInProgress = true
        isLoading = true
        errorMessage = nil

        defer {
            isLoading = false
            isRegistrationInProgress = false
        }

        do {
            // Step 1: Register the handle in backend
            let userInfo = try await sappAPIService.register(
                email: email,
                handle: handle,
                privyUserId: privyService.currentUser?.id
            )
            existingUserInfo = userInfo
            UserDefaults.standard.set(handle, forKey: "user.handle")

            // Step 2: Automatically create SERVER wallets for new users
            // Server wallets are required for seed phrase export functionality
            print("[Onboarding] Auto-creating server wallets for new user @\(handle)")

            // Check if user already has server wallets
            if !privyService.useServerWallets {
                print("[Onboarding] Creating server wallets...")
                try await privyService.createServerWallets()
                print("[Onboarding] Server wallets created successfully")

                // Save wallet address to backend
                if let solanaAddress = WalletAPIService.shared.solanaAddress {
                    print("[Onboarding] Saving server wallet address: \(solanaAddress)")
                    _ = try? await sappAPIService.updateWalletAddress(
                        email: email,
                        solanaAddress: solanaAddress
                    )
                }
            } else {
                print("[Onboarding] User already has server wallets")
            }

            hasExistingWallet = true
            print("[Onboarding] Wallet setup complete, proceeding to finish")

            // Go directly to complete - no wallet setup screen needed
            currentStep = .complete
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    func setupWallet() async {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        do {
            // MARK: - Server Wallet Setup
            // Create server wallets for seed phrase export functionality

            if !privyService.useServerWallets {
                print("[Onboarding] Creating server wallets...")
                try await privyService.createServerWallets()
                print("[Onboarding] Server wallets created successfully")

                // Save wallet address to backend
                if let solanaAddress = WalletAPIService.shared.solanaAddress {
                    print("[Onboarding] Saving server wallet address: \(solanaAddress)")
                    _ = try? await sappAPIService.updateWalletAddress(
                        email: email,
                        solanaAddress: solanaAddress
                    )
                }
            } else {
                print("[Onboarding] User already has server wallets")
            }

            hasExistingWallet = true
            currentStep = .complete
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Welcome Step

struct WelcomeStepView: View {
    let onContinue: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            
            // Logo and title
            VStack(spacing: SappSpacing.xl) {
                Image(systemName: "bubble.left.and.bubble.right.fill")
                    .font(.system(size: 72, weight: .thin))
                    .foregroundColor(SappColors.textPrimary)
                
                VStack(spacing: SappSpacing.sm) {
                    Text("Sapp")
                        .font(SappTypography.displayLarge)
                        .foregroundColor(SappColors.textPrimary)
                    
                    Text("Private messaging\npowered by Solana")
                        .font(SappTypography.bodyLarge)
                        .foregroundColor(SappColors.textSecondary)
                        .multilineTextAlignment(.center)
                }
            }
            
            Spacer()
            
            // Features
            VStack(spacing: SappSpacing.lg) {
                FeatureRow(
                    icon: "lock.shield",
                    title: "End-to-End Encrypted",
                    description: "Your messages are private by default"
                )
                
                FeatureRow(
                    icon: "point.3.connected.trianglepath.dotted",
                    title: "Peer-to-Peer",
                    description: "Direct connection, no middlemen"
                )
                
                FeatureRow(
                    icon: "dollarsign.circle",
                    title: "Send Crypto",
                    description: "Transfer SOL and tokens in chat"
                )
            }
            .padding(.horizontal, SappSpacing.xl)
            
            Spacer()
            
            // Continue button
            Button("Get Started", action: onContinue)
                .buttonStyle(SappPrimaryButtonStyle())
                .padding(.horizontal, SappSpacing.xl)
                .padding(.bottom, SappSpacing.xxl)
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(spacing: SappSpacing.md) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(SappColors.accent)
                .frame(width: 48, height: 48)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(SappTypography.labelLarge)
                    .foregroundColor(SappColors.textPrimary)
                
                Text(description)
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
            }
            
            Spacer()
        }
    }
}

// MARK: - Authentication Step (Email OTP)

struct AuthenticationStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    @FocusState private var isEmailFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            // Progress indicator
            ProgressBar(progress: viewModel.currentStep.progress)
                .padding(.horizontal, SappSpacing.xl)
                .padding(.top, SappSpacing.lg)
            
            // Header
            VStack(spacing: SappSpacing.sm) {
                Text("Sign In")
                    .font(SappTypography.displaySmall)
                    .foregroundColor(SappColors.textPrimary)
                
                Text("Enter your email to continue")
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textSecondary)
            }
            .padding(.top, SappSpacing.xxl)
            
            Spacer()
            
            // Email input
            VStack(spacing: SappSpacing.lg) {
                VStack(alignment: .leading, spacing: SappSpacing.sm) {
                    Text("Email Address")
                        .font(SappTypography.labelMedium)
                        .foregroundColor(SappColors.textSecondary)
                    
                    TextField("you@example.com", text: $viewModel.email)
                        .font(SappTypography.bodyLarge)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .focused($isEmailFocused)
                        .padding(SappSpacing.md)
                        .background(
                            RoundedRectangle(cornerRadius: SappRadius.medium)
                                .stroke(SappColors.border, lineWidth: 1)
                        )
                }
                
                Button("Continue") {
                    Task { await viewModel.initiateAuth(method: .email) }
                }
                .buttonStyle(SappPrimaryButtonStyle(isEnabled: !viewModel.email.isEmpty && !viewModel.isLoading))
                .disabled(viewModel.email.isEmpty || viewModel.isLoading)
                
                if viewModel.isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                }
            }
            .padding(.horizontal, SappSpacing.xl)
            
            Spacer()
            
            // Error message
            if let error = viewModel.errorMessage {
                Text(error)
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.error)
                    .padding(.horizontal, SappSpacing.xl)
                    .padding(.bottom, SappSpacing.lg)
            }
            
            // Back button
            Button("Back") {
                viewModel.previousStep()
            }
            .buttonStyle(SappTextButtonStyle())
            .padding(.bottom, SappSpacing.xxl)
        }
        .onAppear {
            viewModel.authMethod = .email
            isEmailFocused = true
        }
    }
}

// Legacy auth option button (kept for potential future use)
struct AuthOptionButton: View {
    let icon: String
    let title: String
    let style: ButtonVariant
    let action: () -> Void
    
    enum ButtonVariant {
        case primary
        case secondary
    }
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: SappSpacing.md) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                Text(title)
                    .font(SappTypography.labelLarge)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, SappSpacing.md)
            .foregroundColor(style == .primary ? .white : SappColors.textPrimary)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.medium)
                    .fill(style == .primary ? SappColors.accent : SappColors.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: SappRadius.medium)
                            .stroke(style == .primary ? Color.clear : SappColors.border, lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Verification Step

struct VerificationStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    @FocusState private var isCodeFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            ProgressBar(progress: viewModel.currentStep.progress)
                .padding(.horizontal, SappSpacing.xl)
                .padding(.top, SappSpacing.lg)
            
            VStack(spacing: SappSpacing.sm) {
                Text("Verify")
                    .font(SappTypography.displaySmall)
                    .foregroundColor(SappColors.textPrimary)
                
                Text("Enter the code we sent to\n\(viewModel.email)")
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, SappSpacing.xxl)
            
            Spacer()
            
            // Code input
            VStack(spacing: SappSpacing.lg) {
                TextField("000000", text: $viewModel.verificationCode)
                    .font(SappTypography.displayMedium)
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.center)
                    .focused($isCodeFocused)
                    .padding(SappSpacing.lg)
                    .background(
                        RoundedRectangle(cornerRadius: SappRadius.medium)
                            .stroke(SappColors.border, lineWidth: 1)
                    )
                    .frame(maxWidth: 200)
                
                Button("Verify") {
                    Task { await viewModel.verifyCode() }
                }
                .buttonStyle(SappPrimaryButtonStyle(isEnabled: viewModel.verificationCode.count >= 6))
                .disabled(viewModel.verificationCode.count < 6 || viewModel.isLoading)
                
                Button("Resend Code") {
                    Task { await viewModel.resendCode() }
                }
                .buttonStyle(SappTextButtonStyle())
                .disabled(viewModel.isLoading)
            }
            .padding(.horizontal, SappSpacing.xl)
            
            Spacer()
            
            if let error = viewModel.errorMessage {
                Text(error)
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.error)
                    .padding(.horizontal, SappSpacing.xl)
                    .padding(.bottom, SappSpacing.lg)
            }
            
            Button("Back") {
                viewModel.previousStep()
            }
            .buttonStyle(SappTextButtonStyle())
            .padding(.bottom, SappSpacing.xxl)
        }
        .onAppear {
            isCodeFocused = true
        }
    }
}

// MARK: - Handle Setup Step

struct HandleSetupStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    var body: some View {
        VStack(spacing: 0) {
            ProgressBar(progress: viewModel.currentStep.progress)
                .padding(.horizontal, SappSpacing.xl)
                .padding(.top, SappSpacing.lg)
            
            VStack(spacing: SappSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(SappColors.accentLight)
                        .frame(width: 80, height: 80)
                    
                    Text("@")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(SappColors.accent)
                }
                
                Text("Choose your handle")
                    .font(SappTypography.displaySmall)
                    .foregroundColor(SappColors.textPrimary)
                
                Text("This is how others will find and message you")
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, SappSpacing.xl)
            
            Spacer()
            
            VStack(spacing: SappSpacing.lg) {
                // Handle input
                VStack(alignment: .leading, spacing: SappSpacing.sm) {
                    Text("Handle")
                        .font(SappTypography.labelMedium)
                        .foregroundColor(SappColors.textSecondary)
                    
                    HStack(spacing: SappSpacing.xs) {
                        Text("@")
                            .font(SappTypography.bodyLarge)
                            .foregroundColor(SappColors.textSecondary)
                        
                        TextField("yourhandle", text: $viewModel.handle)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .font(SappTypography.bodyLarge)
                            .foregroundColor(SappColors.textPrimary)
                            .onChange(of: viewModel.handle) { _, newValue in
                                viewModel.validateHandle(newValue)
                            }
                        
                        if viewModel.isCheckingHandle {
                            ProgressView()
                                .scaleEffect(0.8)
                        } else if viewModel.isHandleValid {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                        } else if !viewModel.handle.isEmpty && !viewModel.handleError.isEmpty {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.red)
                        }
                    }
                    .padding(SappSpacing.md)
                    .background(
                        RoundedRectangle(cornerRadius: SappRadius.medium)
                            .stroke(viewModel.isHandleValid ? Color.green : SappColors.border, lineWidth: 1)
                    )
                    
                    if !viewModel.handleError.isEmpty {
                        Text(viewModel.handleError)
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.error)
                    } else {
                        Text("3-20 characters, lowercase letters, numbers, and underscores")
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textTertiary)
                    }
                }

                Button("Continue") {
                    Task { await viewModel.registerHandle() }
                }
                .buttonStyle(SappPrimaryButtonStyle(isEnabled: viewModel.canRegisterHandle))
                .disabled(!viewModel.canRegisterHandle || viewModel.isLoading)
                
                if viewModel.isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                }
            }
            .padding(.horizontal, SappSpacing.xl)
            
            Spacer()
            
            if let error = viewModel.errorMessage {
                Text(error)
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.error)
                    .padding(.horizontal, SappSpacing.xl)
                    .padding(.bottom, SappSpacing.lg)
            }
        }
    }
}

// MARK: - Wallet Setup Step

struct WalletSetupStepView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    var body: some View {
        VStack(spacing: 0) {
            ProgressBar(progress: viewModel.currentStep.progress)
                .padding(.horizontal, SappSpacing.xl)
                .padding(.top, SappSpacing.lg)
            
            VStack(spacing: SappSpacing.sm) {
                Text("Wallet")
                    .font(SappTypography.displaySmall)
                    .foregroundColor(SappColors.textPrimary)

                Text("Set up your wallets to send,\nreceive, and swap crypto")
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, SappSpacing.xxl)
            
            Spacer()
            
            VStack(spacing: SappSpacing.lg) {
                // Wallet icon
                Image(systemName: "wallet.pass.fill")
                    .font(.system(size: 64, weight: .thin))
                    .foregroundColor(SappColors.textPrimary)
                
                VStack(spacing: SappSpacing.sm) {
                    Text("Create Wallets")
                        .font(SappTypography.headlineMedium)
                        .foregroundColor(SappColors.textPrimary)

                    Text("Solana and Ethereum wallets will be created\nand securely stored for swapping and transfers")
                        .font(SappTypography.bodySmall)
                        .foregroundColor(SappColors.textSecondary)
                        .multilineTextAlignment(.center)
                }
            }
            
            Spacer()
            
            VStack(spacing: SappSpacing.md) {
                Button("Create Wallets") {
                    Task { await viewModel.setupWallet() }
                }
                .buttonStyle(SappPrimaryButtonStyle())
                .disabled(viewModel.isLoading)

                if viewModel.isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                }
            }
            .padding(.horizontal, SappSpacing.xl)
            .padding(.bottom, SappSpacing.xxl)
            
            if let error = viewModel.errorMessage {
                Text(error)
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.error)
                    .padding(.horizontal, SappSpacing.xl)
                    .padding(.bottom, SappSpacing.lg)
            }
        }
    }
}

// MARK: - Onboarding Complete

struct OnboardingCompleteView: View {
    let onFinish: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            
            VStack(spacing: SappSpacing.xl) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 80, weight: .thin))
                    .foregroundColor(SappColors.success)
                
                VStack(spacing: SappSpacing.sm) {
                    Text("You're all set!")
                        .font(SappTypography.displaySmall)
                        .foregroundColor(SappColors.textPrimary)
                    
                    Text("Start messaging securely\nwith Sapp")
                        .font(SappTypography.bodyMedium)
                        .foregroundColor(SappColors.textSecondary)
                        .multilineTextAlignment(.center)
                }
            }
            
            Spacer()
            
            Button("Start Messaging", action: onFinish)
                .buttonStyle(SappPrimaryButtonStyle())
                .padding(.horizontal, SappSpacing.xl)
                .padding(.bottom, SappSpacing.xxl)
        }
    }
}

// MARK: - Progress Bar

struct ProgressBar: View {
    let progress: Double
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(SappColors.border)
                    .frame(height: 4)
                
                RoundedRectangle(cornerRadius: 2)
                    .fill(SappColors.accent)
                    .frame(width: geometry.size.width * progress, height: 4)
                    .animation(.easeInOut(duration: 0.3), value: progress)
            }
        }
        .frame(height: 4)
    }
}
