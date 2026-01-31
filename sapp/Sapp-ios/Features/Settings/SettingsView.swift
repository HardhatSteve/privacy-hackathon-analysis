import SwiftUI
import UIKit
import LocalAuthentication
import Combine
import PrivySDK

struct SettingsView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showingSignOutAlert = false
    @State private var isBiometricEnabled: Bool = BiometricSettingsStore.shared.isBiometricEnabled
    @State private var biometricAuthError: String?
    @State private var chatSettings = ChatSettings()
    @State private var showWalletBackup = false

    // MARK: - Seed Phrase State
    @State private var isExportingSeedPhrase = false
    @State private var exportedSeedPhrase: String?
    @State private var isSeedPhraseRevealed = false
    @State private var seedPhraseCopied = false
    @State private var seedPhraseError: String?
    @State private var showSeedPhraseWarning = false

    private let biometricService = BiometricAuthService.shared
    private let biometricSettings = BiometricSettingsStore.shared
    private let privyService = PrivyAuthService.shared
    @StateObject private var viewModel = SettingsViewModel()

    let onSignOut: () -> Void

    init(onSignOut: @escaping () -> Void) {
        self.onSignOut = onSignOut
    }
    
    var body: some View {
        NavigationStack {
            // Only show settings if user is authenticated
            if case .authenticated = privyService.authState {
                ScrollView {
                    VStack(spacing: SappSpacing.lg) {
                        // Profile section (reduced top spacing)
                        profileSection
                            .padding(.top, -SappSpacing.sm)

                        // Wallet & Seed Phrase
                        walletSection

                        // Chat settings
                        chatSettingsSection

                        // Security
                        securitySection

                        // Sign out
                        signOutSection
                    }
                    .padding(.horizontal, SappSpacing.lg)
                    .padding(.vertical, SappSpacing.lg)
                }
                .background(SappColors.background)
                .navigationTitle("")
                .toolbar {
                    ToolbarItem(placement: .principal) {
                        Text("Settings")
                            .font(SappTypography.displaySmall)
                            .foregroundColor(SappColors.textPrimary)
                    }
                }
                .task {
                    // Load wallet data using ViewModel (reactive to changes)
                    await viewModel.loadWalletData()
                }
            } else {
                // User is not authenticated - show message
                VStack(spacing: SappSpacing.lg) {
                    Image(systemName: "person.crop.circle.badge.exclamationmark")
                        .font(.system(size: 64))
                        .foregroundColor(SappColors.textTertiary)
                    
                    Text("Session Expired")
                        .font(SappTypography.headlineLarge)
                        .foregroundColor(SappColors.textPrimary)
                    
                    Text("Please sign in again to view your settings.")
                        .font(SappTypography.bodyMedium)
                        .foregroundColor(SappColors.textSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, SappSpacing.xl)
                    
                    Button {
                        onSignOut()
                    } label: {
                        Text("Sign In")
                            .font(SappTypography.labelLarge)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(SappSpacing.md)
                            .background(SappColors.accent)
                            .cornerRadius(SappRadius.large)
                    }
                    .padding(.horizontal, SappSpacing.xl)
                    .padding(.top, SappSpacing.lg)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(SappColors.background)
            }
        }
    }
    
    private var profileSection: some View {
        let storedHandle = UserDefaults.standard.string(forKey: "user.handle") ?? "user"
        
        return VStack(spacing: SappSpacing.sm) {
            // Handle
            Text("@\(storedHandle)")
                .font(SappTypography.headlineMedium)
                .foregroundColor(SappColors.textPrimary)

            // Email or phone if available
            if let email = privyService.currentUser?.email {
                Text(email)
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
            } else if let phone = privyService.currentUser?.phone {
                Text(phone)
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
            } else {
                // Debug: Show if currentUser is nil
                Text("⚠️ User info not loaded")
                    .font(SappTypography.bodySmall)
                    .foregroundColor(.orange)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(SappSpacing.lg)
        .background(SappColors.surface)
        .cornerRadius(SappRadius.large)
        .onAppear {
            // Debug logging
            print("[SettingsView] Profile Section Debug:")
            print("  - Stored handle: \(storedHandle)")
            print("  - PrivyService.currentUser: \(privyService.currentUser != nil ? "✓ exists" : "✗ nil")")
            print("  - AuthState: \(privyService.authState)")
            print("  - Email: \(privyService.currentUser?.email ?? "nil")")
            print("  - Phone: \(privyService.currentUser?.phone ?? "nil")")
        }
    }

    // MARK: - Wallet Section

    private var walletSection: some View {
        VStack(alignment: .leading, spacing: SappSpacing.md) {
            Text("WALLET")
                .font(SappTypography.overline)
                .foregroundColor(SappColors.textTertiary)
                .padding(.horizontal, SappSpacing.sm)

            VStack(spacing: 0) {
                // Wallet Address Row - Use ViewModel's reactive state
                if viewModel.isLoadingWallet && !viewModel.hasLoadedWallet {
                    // Loading state - shown during initial load
                    HStack(spacing: SappSpacing.md) {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: SappColors.accent))
                        Text("Loading wallet...")
                            .font(SappTypography.bodyMedium)
                            .foregroundColor(SappColors.textSecondary)
                    }
                    .padding(SappSpacing.lg)
                    Divider().padding(.leading, 52)
                } else if let address = viewModel.walletAddress {
                    // Wallet address found - display it
                    walletAddressRow(address: address)
                    Divider().padding(.leading, 52)
                } else if viewModel.shouldShowWalletError {
                    // Error state - only shown after loading completes with no wallet
                    VStack(alignment: .leading, spacing: SappSpacing.xs) {
                        HStack(spacing: SappSpacing.md) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.orange)
                            Text("Wallet not detected")
                                .font(SappTypography.bodyMedium)
                                .foregroundColor(.orange)
                        }
                        if let error = viewModel.walletLoadError {
                            Text(error)
                                .font(SappTypography.caption)
                                .foregroundColor(SappColors.textSecondary)
                                .padding(.leading, 36)
                        }
                    }
                    .padding(SappSpacing.lg)
                    Divider().padding(.leading, 52)
                } else {
                    // Fallback loading state (between init and task start)
                    HStack(spacing: SappSpacing.md) {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: SappColors.accent))
                        Text("Loading...")
                            .font(SappTypography.bodyMedium)
                            .foregroundColor(SappColors.textSecondary)
                    }
                    .padding(SappSpacing.lg)
                    Divider().padding(.leading, 52)
                }

                // View Seed Phrase Row
                seedPhraseRow
            }
            .background(SappColors.surface)
            .cornerRadius(SappRadius.large)
            .onAppear {
                // Debug logging using ViewModel state
                print("[SettingsView] Wallet Section Debug:")
                print("  - viewModel.walletAddress: \(viewModel.walletAddress ?? "nil")")
                print("  - viewModel.isLoadingWallet: \(viewModel.isLoadingWallet)")
                print("  - viewModel.hasLoadedWallet: \(viewModel.hasLoadedWallet)")
                print("  - viewModel.shouldShowWalletError: \(viewModel.shouldShowWalletError)")
                print("  - WalletAPIService.solanaWallet: \(WalletAPIService.shared.solanaWallet != nil)")
            }

            // Seed Phrase Display (when revealed)
            if isSeedPhraseRevealed, let seedPhrase = exportedSeedPhrase {
                seedPhraseDisplayCard(seedPhrase: seedPhrase)
            }

            // Error message
            if let error = seedPhraseError {
                HStack(spacing: SappSpacing.xs) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .font(.system(size: 12))
                        .foregroundColor(SappColors.error)
                    Text(error)
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.error)
                }
                .padding(.horizontal, SappSpacing.sm)
            }
        }
        .alert("Security Warning", isPresented: $showSeedPhraseWarning) {
            Button("Cancel", role: .cancel) {}
            Button("I Understand, Show Seed Phrase", role: .destructive) {
                Task {
                    await revealSeedPhrase()
                }
            }
        } message: {
            Text("Your seed phrase gives full access to your wallet. Never share it with anyone. Make sure no one is watching your screen.")
        }
    }

    private func walletAddressRow(address: String) -> some View {
        HStack(spacing: SappSpacing.md) {
            Image(systemName: "wallet.pass.fill")
                .font(.system(size: 18))
                .foregroundColor(SappColors.accent)
                .frame(width: 28)

            VStack(alignment: .leading, spacing: 2) {
                Text("Wallet Address")
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textPrimary)

                Text(formatAddress(address))
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(SappColors.textSecondary)
            }

            Spacer()

            Button {
                UIPasteboard.general.string = address
                // Haptic feedback
                let impactFeedback = UIImpactFeedbackGenerator(style: .light)
                impactFeedback.impactOccurred()
            } label: {
                Image(systemName: "doc.on.doc")
                    .font(.system(size: 14))
                    .foregroundColor(SappColors.accent)
            }
        }
        .padding(.horizontal, SappSpacing.lg)
        .padding(.vertical, SappSpacing.md)
    }

    private var seedPhraseRow: some View {
        Button {
            if isSeedPhraseRevealed {
                // Hide the seed phrase
                withAnimation(.easeInOut(duration: 0.2)) {
                    isSeedPhraseRevealed = false
                    exportedSeedPhrase = nil
                }
            } else {
                // Show warning first
                showSeedPhraseWarning = true
            }
        } label: {
            HStack(spacing: SappSpacing.md) {
                Image(systemName: isSeedPhraseRevealed ? "eye.slash.fill" : "key.fill")
                    .font(.system(size: 18))
                    .foregroundColor(isSeedPhraseRevealed ? .orange : SappColors.accent)
                    .frame(width: 28)

                VStack(alignment: .leading, spacing: 2) {
                    Text(isSeedPhraseRevealed ? "Hide Seed Phrase" : "View Seed Phrase")
                        .font(SappTypography.bodyMedium)
                        .foregroundColor(SappColors.textPrimary)

                    Text(isSeedPhraseRevealed ? "Tap to hide your seed phrase" : "Reveal your wallet's private key")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textSecondary)
                }

                Spacer()

                if isExportingSeedPhrase {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: SappColors.accent))
                        .scaleEffect(0.8)
                } else {
                    Image(systemName: isSeedPhraseRevealed ? "chevron.up" : "chevron.down")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(SappColors.textTertiary)
                }
            }
            .padding(.horizontal, SappSpacing.lg)
            .padding(.vertical, SappSpacing.md)
        }
        .buttonStyle(.plain)
        .disabled(isExportingSeedPhrase)
    }

    private func seedPhraseDisplayCard(seedPhrase: String) -> some View {
        VStack(alignment: .leading, spacing: SappSpacing.md) {
            // Warning banner
            HStack(spacing: SappSpacing.sm) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 16))
                    .foregroundColor(.orange)

                Text("Never share your seed phrase with anyone!")
                    .font(SappTypography.labelMedium)
                    .foregroundColor(.orange)
            }
            .padding(SappSpacing.sm)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.orange.opacity(0.15))
            .cornerRadius(SappRadius.small)

            // Seed phrase display
            VStack(alignment: .leading, spacing: SappSpacing.xs) {
                Text("SEED PHRASE / PRIVATE KEY")
                    .font(SappTypography.overline)
                    .foregroundColor(SappColors.textTertiary)

                Text(seedPhrase)
                    .font(.system(size: 13, design: .monospaced))
                    .foregroundColor(SappColors.textPrimary)
                    .lineLimit(nil)
                    .multilineTextAlignment(.leading)
                    .textSelection(.enabled)
                    .padding(SappSpacing.md)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(SappColors.background)
                    .cornerRadius(SappRadius.small)
                    .overlay(
                        RoundedRectangle(cornerRadius: SappRadius.small)
                            .stroke(SappColors.accent.opacity(0.3), lineWidth: 1)
                    )
            }

            // Copy button
            Button {
                UIPasteboard.general.string = seedPhrase
                seedPhraseCopied = true
                let impactFeedback = UINotificationFeedbackGenerator()
                impactFeedback.notificationOccurred(.success)
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    seedPhraseCopied = false
                }
            } label: {
                HStack {
                    Image(systemName: seedPhraseCopied ? "checkmark.circle.fill" : "doc.on.doc")
                    Text(seedPhraseCopied ? "Copied!" : "Copy Seed Phrase")
                }
                .font(SappTypography.labelMedium)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, SappSpacing.sm)
                .background(seedPhraseCopied ? Color.green : SappColors.accent)
                .cornerRadius(SappRadius.medium)
            }

            // Hide button
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isSeedPhraseRevealed = false
                    exportedSeedPhrase = nil
                }
            } label: {
                HStack {
                    Image(systemName: "eye.slash.fill")
                    Text("Hide Seed Phrase")
                }
                .font(SappTypography.labelMedium)
                .foregroundColor(SappColors.textPrimary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, SappSpacing.sm)
                .background(SappColors.surface)
                .cornerRadius(SappRadius.medium)
                .overlay(
                    RoundedRectangle(cornerRadius: SappRadius.medium)
                        .stroke(SappColors.textTertiary.opacity(0.3), lineWidth: 1)
                )
            }

            // Security tips
            VStack(alignment: .leading, spacing: SappSpacing.xs) {
                securityTipItem(icon: "lock.shield.fill", text: "Store this in a secure, offline location")
                securityTipItem(icon: "person.fill.xmark", text: "Never share with anyone, even support staff")
                securityTipItem(icon: "photo.fill", text: "Consider writing it down, not screenshots")
            }
        }
        .padding(SappSpacing.md)
        .background(SappColors.surface)
        .cornerRadius(SappRadius.large)
        .transition(.opacity.combined(with: .move(edge: .top)))
    }

    private func securityTipItem(icon: String, text: String) -> some View {
        HStack(spacing: SappSpacing.sm) {
            Image(systemName: icon)
                .font(.system(size: 12))
                .foregroundColor(SappColors.textTertiary)
                .frame(width: 16)

            Text(text)
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textSecondary)
        }
    }

    private func formatAddress(_ address: String) -> String {
        guard address.count > 12 else { return address }
        let prefix = address.prefix(6)
        let suffix = address.suffix(4)
        return "\(prefix)...\(suffix)"
    }

    // MARK: - Seed Phrase Actions

    private func revealSeedPhrase() async {
        seedPhraseError = nil
        isExportingSeedPhrase = true

        // Check if user is still authenticated
        guard case .authenticated = privyService.authState else {
            await MainActor.run {
                isExportingSeedPhrase = false
                seedPhraseError = "Session expired. Please sign in again."
            }
            return
        }

        // First, authenticate with biometrics if available
        if biometricService.isBiometricAvailable() {
            do {
                let authenticated = try await biometricService.authenticate(
                    reason: "Authenticate to view your seed phrase"
                )
                guard authenticated else {
                    await MainActor.run {
                        isExportingSeedPhrase = false
                        seedPhraseError = "Authentication cancelled"
                    }
                    return
                }
            } catch {
                await MainActor.run {
                    isExportingSeedPhrase = false
                    seedPhraseError = "Authentication failed: \(error.localizedDescription)"
                }
                return
            }
        }

        // NOW verify we can get an access token (after biometric auth)
        // This ensures the Privy session is still valid
        print("[SettingsView] Checking if access token is available...")
        let accessToken = await privyService.getAccessToken()
        
        if accessToken == nil {
            print("[SettingsView] ❌ Failed to get access token")
            print("[SettingsView] AuthState: \(privyService.authState)")
            print("[SettingsView] CurrentUser: \(privyService.currentUser != nil)")
            await MainActor.run {
                isExportingSeedPhrase = false
                seedPhraseError = "Unable to authenticate with server. Please restart the app or sign out and back in."
            }
            return
        } else {
            print("[SettingsView] ✅ Access token available (length: \(accessToken!.count))")
        }

        // Try to load server wallets if not already loaded
        if !privyService.useServerWallets || privyService.serverSolanaWalletId == nil {
            do {
                try await privyService.loadServerWallets()
                print("[SettingsView] Server wallets reloaded for seed phrase export")
            } catch {
                print("[SettingsView] Failed to load server wallets: \(error)")
                await MainActor.run {
                    isExportingSeedPhrase = false
                    
                    // Check if it's an auth error
                    if let walletError = error as? WalletAPIError {
                        switch walletError {
                        case .authorizationFailed, .missingAccessToken:
                            seedPhraseError = "Authentication failed. Please restart the app or sign out and back in."
                        default:
                            seedPhraseError = "Unable to load wallet. Error: \(walletError.localizedDescription)"
                        }
                    } else {
                        seedPhraseError = "Unable to load wallet. Please try again or restart the app."
                    }
                }
                return
            }
        }

        // Verify we have a wallet before attempting export
        guard WalletAPIService.shared.solanaWalletId != nil || privyService.serverSolanaWalletId != nil else {
            await MainActor.run {
                isExportingSeedPhrase = false
                seedPhraseError = "No wallet found. Please ensure you're signed in and have created a wallet."
            }
            return
        }

        print("[SettingsView] Attempting to export wallet...")
        print("[SettingsView] Wallet ID: \(WalletAPIService.shared.solanaWalletId ?? privyService.serverSolanaWalletId ?? "nil")")
        
        // Export the seed phrase via server
        do {
            let privateKey = try await privyService.exportWalletViaServer()
            await MainActor.run {
                exportedSeedPhrase = privateKey
                withAnimation(.easeInOut(duration: 0.3)) {
                    isSeedPhraseRevealed = true
                }
                isExportingSeedPhrase = false
            }
            print("[SettingsView] ✅ Seed phrase exported successfully")
        } catch {
            print("[SettingsView] ❌ Seed phrase export failed: \(error)")
            
            // Try to get more details
            if let nsError = error as NSError? {
                print("[SettingsView] Error domain: \(nsError.domain)")
                print("[SettingsView] Error code: \(nsError.code)")
                print("[SettingsView] Error userInfo: \(nsError.userInfo)")
            }
            
            await MainActor.run {
                isExportingSeedPhrase = false
                
                // Provide more specific error messages
                if let walletError = error as? WalletAPIError {
                    switch walletError {
                    case .authorizationFailed, .missingAccessToken:
                        seedPhraseError = "Authentication with server failed. This is likely a backend configuration issue. Please check that your backend is configured with the correct Privy App ID and is using Privy's server SDK for JWT validation."
                    case .walletNotFound:
                        seedPhraseError = "Wallet not found on server. Please ensure you have created a wallet."
                    case .serverError(let message):
                        // Check for JWT-specific errors
                        if message.lowercased().contains("jwt") || message.lowercased().contains("token") {
                            seedPhraseError = "Backend JWT validation error: \(message)\n\nThis is a backend configuration issue. Your backend needs to be configured to accept Privy JWT tokens. See BACKEND_JWT_ISSUE.md for details."
                        } else {
                            seedPhraseError = "Server error: \(message)"
                        }
                    default:
                        seedPhraseError = "Error: \(walletError.localizedDescription)"
                    }
                } else {
                    seedPhraseError = error.localizedDescription
                }
            }
        }
    }

    private var chatSettingsSection: some View {
        VStack(alignment: .leading, spacing: SappSpacing.md) {
            Text("MESSAGES")
                .font(SappTypography.overline)
                .foregroundColor(SappColors.textTertiary)
                .padding(.horizontal, SappSpacing.sm)
            
            VStack(spacing: 0) {
                SettingsToggleRow(
                    icon: "bell.fill",
                    title: "Notifications",
                    isOn: $chatSettings.notificationsEnabled
                )
                
                Divider().padding(.leading, 52)
                
                SettingsToggleRow(
                    icon: "checkmark.circle.fill",
                    title: "Read Receipts",
                    subtitle: "Let others know when you've read their messages",
                    isOn: $chatSettings.readReceipts
                )
                
                Divider().padding(.leading, 52)
                
                SettingsToggleRow(
                    icon: "ellipsis.bubble.fill",
                    title: "Typing Indicators",
                    subtitle: "Show when you're typing",
                    isOn: $chatSettings.typingIndicators
                )
                
                Divider().padding(.leading, 52)
                
                SettingsNavigationRow(
                    icon: "arrow.down.circle.fill",
                    title: "Auto-Download Media",
                    value: chatSettings.autoDownloadMedia.displayName
                ) {
                    // Navigate to auto-download settings
                }
            }
            .background(SappColors.surface)
            .cornerRadius(SappRadius.large)
        }
    }
    
    private var securitySection: some View {
        VStack(alignment: .leading, spacing: SappSpacing.md) {
            Text("SECURITY")
                .font(SappTypography.overline)
                .foregroundColor(SappColors.textTertiary)
                .padding(.horizontal, SappSpacing.sm)

            VStack(spacing: 0) {
                if biometricService.isBiometricAvailable() {
                    SettingsToggleRow(
                        icon: biometricService.biometricType().iconName,
                        title: biometricService.biometricType().displayName,
                        subtitle: "Require to unlock app",
                        isOn: $isBiometricEnabled
                    )
                    .onChange(of: isBiometricEnabled) { _, newValue in
                        handleBiometricToggle(newValue)
                    }
                }
            }
            .background(SappColors.surface)
            .cornerRadius(SappRadius.large)

            if let error = biometricAuthError {
                Text(error)
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.error)
                    .padding(.horizontal, SappSpacing.sm)
            }
        }
    }
    
    private var signOutSection: some View {
        Button {
            showingSignOutAlert = true
        } label: {
            HStack {
                Image(systemName: "rectangle.portrait.and.arrow.right")
                    .font(.system(size: 18))
                Text("Sign Out")
                    .font(SappTypography.labelLarge)
            }
            .foregroundColor(SappColors.error)
            .frame(maxWidth: .infinity)
            .padding(SappSpacing.md)
            .background(SappColors.surface)
            .cornerRadius(SappRadius.large)
        }
        .alert("Sign Out?", isPresented: $showingSignOutAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Sign Out", role: .destructive) {
                onSignOut()
            }
        } message: {
            Text("You'll need to sign in again to access your messages and wallet.")
        }
    }
    
    private func handleBiometricToggle(_ enabled: Bool) {
        biometricAuthError = nil
        
        if enabled {
            Task {
                do {
                    let authenticated = try await biometricService.authenticate(
                        reason: "Authenticate to enable \(biometricService.biometricType().displayName)"
                    )
                    if authenticated {
                        biometricSettings.isBiometricEnabled = true
                    } else {
                        isBiometricEnabled = false
                    }
                } catch let error as BiometricAuthService.BiometricError {
                    isBiometricEnabled = false
                    switch error {
                    case .userCancelled:
                        break
                    default:
                        biometricAuthError = error.errorDescription
                    }
                } catch {
                    isBiometricEnabled = false
                    biometricAuthError = "Failed to enable biometric authentication."
                }
            }
        } else {
            biometricSettings.isBiometricEnabled = false
        }
    }
}

// MARK: - Settings Row Components

struct SettingsToggleRow: View {
    let icon: String
    let title: String
    var subtitle: String? = nil
    @Binding var isOn: Bool
    
    var body: some View {
        Toggle(isOn: $isOn) {
            HStack(spacing: SappSpacing.md) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(SappColors.accent)
                    .frame(width: 28)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(SappTypography.bodyMedium)
                        .foregroundColor(SappColors.textPrimary)
                    
                    if let subtitle = subtitle {
                        Text(subtitle)
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textSecondary)
                    }
                }
            }
        }
        .tint(SappColors.accent)
        .padding(.horizontal, SappSpacing.lg)
        .padding(.vertical, SappSpacing.md)
    }
}

struct SettingsNavigationRow: View {
    let icon: String
    let title: String
    let value: String?
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: SappSpacing.md) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(SappColors.accent)
                    .frame(width: 28)
                
                Text(title)
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textPrimary)
                
                Spacer()
                
                if let value = value {
                    Text(value)
                        .font(SappTypography.bodySmall)
                        .foregroundColor(SappColors.textTertiary)
                }
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(SappColors.textTertiary)
            }
            .padding(.horizontal, SappSpacing.lg)
            .padding(.vertical, SappSpacing.md)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Settings ViewModel

@MainActor
final class SettingsViewModel: ObservableObject {
    // MARK: - Published State
    @Published var isLoadingWallet = false
    @Published private(set) var walletAddress: String?
    @Published private(set) var hasLoadedWallet = false
    @Published var walletLoadError: String?

    // MARK: - Services
    private let privyService = PrivyAuthService.shared
    private let walletService = WalletAPIService.shared
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization

    nonisolated init() {
        Task { @MainActor in
            setupObservers()
            initializeFromCurrentState()
        }
    }

    // MARK: - Combine Observers

    private func setupObservers() {
        // Observe WalletAPIService.solanaWallet changes
        walletService.$solanaWallet
            .receive(on: RunLoop.main)
            .sink { [weak self] wallet in
                guard let self else { return }
                self.updateWalletAddress(from: wallet)
            }
            .store(in: &cancellables)

        // Observe isLoading from wallet service
        walletService.$isLoading
            .receive(on: RunLoop.main)
            .sink { [weak self] loading in
                guard let self else { return }
                // Only update if we haven't finished our own load
                if !self.hasLoadedWallet {
                    self.isLoadingWallet = loading
                }
            }
            .store(in: &cancellables)

        // Observe PrivyAuthService.useServerWallets changes
        privyService.$useServerWallets
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in
                guard let self else { return }
                // Re-evaluate wallet address when server wallet preference changes
                self.updateWalletAddress(from: self.walletService.solanaWallet)
            }
            .store(in: &cancellables)
    }

    /// Initialize wallet address from current state (in case wallet was already loaded elsewhere)
    private func initializeFromCurrentState() {
        // Check if wallet data is already available
        if let wallet = walletService.solanaWallet {
            walletAddress = wallet.address
            print("[SettingsViewModel] Initialized with existing wallet: \(wallet.address)")
        } else if let address = privyService.unifiedSolanaWalletAddress {
            walletAddress = address
            print("[SettingsViewModel] Initialized with unified address: \(address)")
        }
    }

    private func updateWalletAddress(from wallet: WalletInfo?) {
        if let wallet = wallet {
            walletAddress = wallet.address
        } else if privyService.useServerWallets {
            walletAddress = privyService.unifiedSolanaWalletAddress
        } else {
            walletAddress = privyService.embeddedSolanaWallet?.address
        }
    }

    // MARK: - Load Wallet Data

    func loadWalletData() async {
        // Prevent duplicate loads
        guard !isLoadingWallet else {
            print("[SettingsViewModel] Already loading, skipping duplicate load")
            return
        }

        // Check authentication
        guard case .authenticated = privyService.authState else {
            print("[SettingsViewModel] User not authenticated, skipping wallet load")
            hasLoadedWallet = true
            return
        }

        isLoadingWallet = true
        walletLoadError = nil

        defer {
            isLoadingWallet = false
            hasLoadedWallet = true
        }

        do {
            try await privyService.loadServerWallets()

            // Update from service state
            updateWalletAddress(from: walletService.solanaWallet)

            print("[SettingsViewModel] Wallet loaded successfully: \(walletAddress ?? "nil")")
        } catch {
            print("[SettingsViewModel] Failed to load wallet: \(error)")
            // Only set error if we have no wallet data at all
            if walletAddress == nil {
                walletLoadError = "Unable to load wallet information"
            }
        }
    }

    // MARK: - Computed Properties

    /// Only show error after loading completes with no wallet found
    var shouldShowWalletError: Bool {
        return hasLoadedWallet && !isLoadingWallet && walletAddress == nil
    }
}
