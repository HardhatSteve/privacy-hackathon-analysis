import SwiftUI
import PrivySDK

/// Swap View - Privacy-focused token swaps
/// Redesigned for minimalist UX following app design patterns
struct SwapView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var silentSwapService = SilentSwapService.shared
    @StateObject private var privyAuth = PrivyAuthService.shared

    // Prefilled parameters (optional)
    let prefilledOutputToken: String?
    let prefilledOutputAmount: String?

    // Form State
    @State private var fromToken: SilentSwapToken?
    @State private var toToken: SilentSwapToken?
    @State private var amount = ""
    @State private var selectedFromChain: BlockchainType = .solana
    @State private var selectedToChain: BlockchainType = .solana

    // UI State
    @State private var showFromTokenPicker = false
    @State private var showToTokenPicker = false
    @State private var isLoadingQuote = false
    @State private var isExecuting = false
    @State private var errorMessage: String?
    @State private var showSuccess = false
    @State private var showWalletSetup = false
    @State private var usdEquivalent: Double?
    @State private var isLoadingWallets = true

    // Current quote
    @State private var currentQuote: SilentSwapQuoteResponse?

    // MARK: - Initializer

    init(prefilledOutputToken: String? = nil, prefilledOutputAmount: String? = nil) {
        self.prefilledOutputToken = prefilledOutputToken
        self.prefilledOutputAmount = prefilledOutputAmount
    }

    var body: some View {
        VStack(spacing: 0) {
            // Drag indicator
            Capsule()
                .fill(SappColors.border)
                .frame(width: 36, height: 4)
                .padding(.top, 8)

            // Header - reduced spacing
            header
                .padding(.top, 12)

            // Main content - reduced spacing
            VStack(spacing: 16) {
                // Wallet status banner (if needed)
                if isLoadingWallets {
                    walletLoadingBanner
                } else if !hasRequiredWallets {
                    walletStatusBanner
                }

                // From section (amount input)
                fromSection

                // Swap direction indicator
                swapDirectionIndicator

                // To section (output)
                toSection

                // Quote summary (minimal)
                if let quote = currentQuote {
                    quoteSummary(quote: quote)
                }

                // Error message
                if let error = errorMessage {
                    Text(error)
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.error)
                        .multilineTextAlignment(.center)
                        .lineLimit(3)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)

            Spacer(minLength: 8)

            // Bottom action bar
            bottomActionBar
        }
        .background(SappColors.background)
        .presentationDetents([.fraction(0.60), .large])
        .presentationDragIndicator(.hidden)
        .task {
            await ensureWalletsLoaded()
            await loadTokens()
            await setupDefaultTokens()
        }
        .alert("Swap Complete", isPresented: $showSuccess) {
            Button("Done") {
                dismiss()
            }
        } message: {
            Text("Your swap has been initiated. The tokens will arrive in your wallet shortly.")
        }
        .sheet(isPresented: $showWalletSetup) {
            WalletSetupView()
        }
        .onChange(of: showWalletSetup) { wasShowing, isShowing in
            // Refresh wallet state when WalletSetupView is dismissed
            if wasShowing && !isShowing {
                Task {
                    await ensureWalletsLoaded()
                }
            }
        }
        .sheet(isPresented: $showFromTokenPicker) {
            TokenPickerView(
                chain: selectedFromChain,
                selectedToken: $fromToken,
                tokens: silentSwapService.getTokens(for: selectedFromChain)
            )
        }
        .sheet(isPresented: $showToTokenPicker) {
            TokenPickerView(
                chain: selectedToChain,
                selectedToken: $toToken,
                tokens: silentSwapService.getTokens(for: selectedToChain)
            )
        }
        .onChange(of: amount) { _, newValue in
            updateUSDEquivalent(newValue)
            currentQuote = nil
            errorMessage = nil
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("Swap")
                .font(SappTypography.headlineSmall)
                .foregroundColor(SappColors.textPrimary)

            Spacer()

            // Privacy indicator (subtle)
            HStack(spacing: 4) {
                Image(systemName: "lock.shield.fill")
                    .font(.system(size: 10))
                Text("Private")
                    .font(SappTypography.caption)
            }
            .foregroundColor(SappColors.success)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                Capsule()
                    .fill(SappColors.success.opacity(0.1))
            )
        }
        .padding(.horizontal, 20)
    }

    // MARK: - Wallet Loading Banner

    private var walletLoadingBanner: some View {
        HStack(spacing: 10) {
            ProgressView()
                .scaleEffect(0.8)

            Text("Loading wallets...")
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textSecondary)

            Spacer()
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(SappColors.surface)
        )
    }

    // MARK: - Wallet Status Banner

    private var walletStatusBanner: some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 14))
                .foregroundColor(SappColors.warning)

            Text("Wallets required for swaps")
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textSecondary)

            Spacer()

            Button("Set Up") {
                showWalletSetup = true
            }
            .font(SappTypography.labelSmall)
            .foregroundColor(SappColors.info)
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(SappColors.warning.opacity(0.1))
        )
    }

    // MARK: - From Section

    private var fromSection: some View {
        VStack(spacing: 6) {
            HStack {
                Text("From")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textTertiary)

                Spacer()

                // Chain selector (subtle)
                chainSelector(selectedChain: $selectedFromChain)
            }

            // Amount input centered with token selector overlaid
            ZStack {
                // Centered amount input
                TextField("0", text: $amount)
                    .font(.system(size: 48, weight: .semibold, design: .rounded))
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.center)
                    .foregroundColor(SappColors.textPrimary)

                // Token selector aligned to trailing edge
                HStack {
                    Spacer()
                    tokenSelectorButton(
                        token: fromToken,
                        action: { showFromTokenPicker = true }
                    )
                }
            }

            // USD equivalent
            if let usd = usdEquivalent, usd > 0 {
                Text("≈ $\(String(format: "%.2f", usd)) USD")
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
            }
        }
    }

    // MARK: - Swap Direction Indicator

    private var swapDirectionIndicator: some View {
        HStack {
            Rectangle()
                .fill(SappColors.border)
                .frame(height: 1)

            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    swap(&fromToken, &toToken)
                    swap(&selectedFromChain, &selectedToChain)
                    currentQuote = nil
                }
            } label: {
                Image(systemName: "arrow.up.arrow.down")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(SappColors.textSecondary)
                    .frame(width: 36, height: 36)
                    .background(
                        Circle()
                            .fill(SappColors.surface)
                            .overlay(Circle().stroke(SappColors.border, lineWidth: 1))
                    )
            }
            .buttonStyle(.plain)

            Rectangle()
                .fill(SappColors.border)
                .frame(height: 1)
        }
    }

    // MARK: - To Section

    private var toSection: some View {
        VStack(spacing: 6) {
            HStack {
                Text("To")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textTertiary)

                Spacer()

                // Chain selector (subtle)
                chainSelector(selectedChain: $selectedToChain)
            }

            // Output display centered with token selector overlaid
            ZStack {
                // Centered output amount
                Text(currentQuote?.estimatedOutput ?? "0")
                    .font(.system(size: 48, weight: .semibold, design: .rounded))
                    .foregroundColor(currentQuote == nil ? SappColors.textTertiary : SappColors.textPrimary)

                // Token selector aligned to trailing edge
                HStack {
                    Spacer()
                    tokenSelectorButton(
                        token: toToken,
                        action: { showToTokenPicker = true }
                    )
                }
            }

            // USD equivalent for output
            if let quote = currentQuote, let outputUsd = outputUsdEquivalent {
                Text("≈ $\(String(format: "%.2f", outputUsd)) USD")
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
            }
        }
    }

    /// Calculate USD equivalent for output amount
    private var outputUsdEquivalent: Double? {
        guard let quote = currentQuote,
              let outputValue = Double(quote.estimatedOutput),
              outputValue > 0,
              let token = toToken else {
            return nil
        }

        // For stablecoins, use 1:1 ratio
        if token.symbol == "USDC" || token.symbol == "USDT" {
            return outputValue
        }

        // For SOL, use the input ratio if available
        if token.symbol == "SOL", let inputUsd = usdEquivalent, let inputValue = Double(amount), inputValue > 0 {
            // Calculate price per SOL from input
            let pricePerUnit = inputUsd / inputValue
            return outputValue * pricePerUnit
        }

        return nil
    }

    // MARK: - Token Selector Button

    private func tokenSelectorButton(token: SilentSwapToken?, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Text(token?.symbol ?? "Select")
                    .font(SappTypography.labelLarge)
                    .foregroundColor(token != nil ? SappColors.textPrimary : SappColors.textTertiary)

                Image(systemName: "chevron.down")
                    .font(.system(size: 10))
                    .foregroundColor(SappColors.textSecondary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(SappColors.surface)
            .cornerRadius(8)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Chain Selector

    private func chainSelector(selectedChain: Binding<BlockchainType>) -> some View {
        Menu {
            ForEach(BlockchainType.allCases, id: \.self) { chain in
                Button {
                    selectedChain.wrappedValue = chain
                    currentQuote = nil
                } label: {
                    HStack {
                        Text(chain.displayName)
                        if selectedChain.wrappedValue == chain {
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            HStack(spacing: 4) {
                Text(selectedChain.wrappedValue.displayName)
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textSecondary)

                Image(systemName: "chevron.down")
                    .font(.system(size: 8))
                    .foregroundColor(SappColors.textSecondary)
            }
        }
    }

    // MARK: - Quote Summary

    private func quoteSummary(quote: SilentSwapQuoteResponse) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Fee")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textTertiary)
                Text("\(quote.estimatedFee) USDC")
                    .font(SappTypography.labelSmall)
                    .foregroundColor(SappColors.textSecondary)
            }

            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 16))
                .foregroundColor(SappColors.success)
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(SappColors.accentLight)
        )
    }

    // MARK: - Bottom Action Bar

    private var bottomActionBar: some View {
        HStack(spacing: 12) {
            // Cancel button (small round icon)
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(SappColors.textSecondary)
                    .frame(width: 48, height: 48)
                    .background(Circle().fill(SappColors.surface))
            }

            // Primary action button
            Button {
                Task {
                    if currentQuote == nil {
                        await getQuote()
                    } else {
                        await executeSwap()
                    }
                }
            } label: {
                HStack(spacing: 8) {
                    if isLoadingQuote || isExecuting {
                        ProgressView()
                            .tint(.white)
                            .scaleEffect(0.9)
                    }
                    Text(primaryButtonTitle)
                        .font(SappTypography.labelMedium)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(
                    RoundedRectangle(cornerRadius: 24)
                        .fill(primaryButtonEnabled ? SappColors.accent : SappColors.accent.opacity(0.4))
                )
            }
            .disabled(!primaryButtonEnabled)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    private var primaryButtonTitle: String {
        if isLoadingQuote {
            return "Getting Quote..."
        } else if isExecuting {
            return "Swapping..."
        } else if currentQuote != nil {
            return "Swap"
        } else {
            return "Get Quote"
        }
    }

    private var primaryButtonEnabled: Bool {
        if isLoadingWallets || isLoadingQuote || isExecuting {
            return false
        }
        if currentQuote != nil {
            return true
        }
        return canGetQuote
    }

    // MARK: - Computed Properties

    private var canGetQuote: Bool {
        guard let fromToken = fromToken,
              let toToken = toToken,
              let amountValue = Double(amount),
              amountValue > 0 else {
            return false
        }
        return hasRequiredWallets && fromToken.id != toToken.id
    }

    private var hasRequiredWallets: Bool {
        privyAuth.solanaWalletAddress != nil && privyAuth.ethereumWalletAddress != nil
    }

    // MARK: - Actions

    /// Ensures wallets are loaded before allowing swap operations.
    /// This handles both embedded wallets and server wallets, including the case
    /// where useServerWallets hasn't been set yet (e.g., after app restart).
    private func ensureWalletsLoaded() async {
        isLoadingWallets = true

        print("[SwapView] ensureWalletsLoaded - Current state:")
        print("[SwapView]   useServerWallets: \(privyAuth.useServerWallets)")
        print("[SwapView]   embeddedSolana: \(privyAuth.embeddedSolanaWallet?.address ?? "nil")")
        print("[SwapView]   embeddedEthereum: \(privyAuth.embeddedEthereumWallet?.address ?? "nil")")
        print("[SwapView]   serverSolana: \(WalletAPIService.shared.solanaAddress ?? "nil")")
        print("[SwapView]   serverEthereum: \(WalletAPIService.shared.ethereumAddress ?? "nil")")

        // Check if we have the required wallets from any source
        let hasSolana = privyAuth.solanaWalletAddress != nil
        let hasEthereum = privyAuth.ethereumWalletAddress != nil

        // If wallets are missing, always try to load server wallets.
        // This handles the case where useServerWallets is false because it wasn't persisted,
        // but the user actually has server wallets from onboarding.
        if !hasSolana || !hasEthereum {
            print("[SwapView] Missing wallets (Solana: \(hasSolana), Ethereum: \(hasEthereum)) - attempting to load server wallets...")
            do {
                try await privyAuth.loadServerWallets()
                print("[SwapView] Server wallets loaded successfully:")
                print("[SwapView]   useServerWallets: \(privyAuth.useServerWallets)")
                print("[SwapView]   serverSolana: \(WalletAPIService.shared.solanaAddress ?? "nil")")
                print("[SwapView]   serverEthereum: \(WalletAPIService.shared.ethereumAddress ?? "nil")")
                print("[SwapView]   solanaWalletAddress: \(privyAuth.solanaWalletAddress ?? "nil")")
                print("[SwapView]   ethereumWalletAddress: \(privyAuth.ethereumWalletAddress ?? "nil")")
            } catch {
                print("[SwapView] Failed to load server wallets: \(error)")
                // If server wallet loading fails, check if we have embedded wallets as fallback
                if privyAuth.embeddedSolanaWallet == nil || privyAuth.embeddedEthereumWallet == nil {
                    print("[SwapView] No embedded wallets available either - user needs to set up wallets")
                }
            }
        } else {
            print("[SwapView] Wallets already available:")
            print("[SwapView]   solanaWalletAddress: \(privyAuth.solanaWalletAddress ?? "nil")")
            print("[SwapView]   ethereumWalletAddress: \(privyAuth.ethereumWalletAddress ?? "nil")")
        }

        isLoadingWallets = false
    }

    private func loadTokens() async {
        do {
            try await silentSwapService.loadSupportedTokens()
        } catch {
            print("[SwapView] Failed to load tokens: \(error)")
        }
    }

    private func setupDefaultTokens() async {
        let solanaTokens = silentSwapService.getTokens(for: .solana)

        // Set up "to" token (output) - use prefilled if provided
        if let prefilledSymbol = prefilledOutputToken,
           let prefilledToken = solanaTokens.first(where: { $0.symbol == prefilledSymbol }) {
            toToken = prefilledToken
        } else if let usdc = solanaTokens.first(where: { $0.symbol == "USDC" }) {
            toToken = usdc
        }

        // Set up "from" token (input) - default to SOL or USDC if swapping to SOL
        if prefilledOutputToken == "SOL" {
            if let usdc = solanaTokens.first(where: { $0.symbol == "USDC" }) {
                fromToken = usdc
            } else {
                fromToken = solanaTokens.first
            }
        } else if let sol = solanaTokens.first(where: { $0.symbol == "SOL" }) {
            fromToken = sol
        } else {
            fromToken = solanaTokens.first
        }
    }

    private func updateUSDEquivalent(_ amountString: String) {
        guard let amountValue = Double(amountString), amountValue > 0 else {
            usdEquivalent = nil
            return
        }

        guard let token = fromToken else {
            usdEquivalent = nil
            return
        }

        // Get USD equivalent based on token
        if token.symbol == "SOL" {
            Task {
                do {
                    let usd = try await SolanaPriceService.shared.solToUSD(amountValue)
                    await MainActor.run {
                        usdEquivalent = usd
                    }
                } catch {
                    usdEquivalent = nil
                }
            }
        } else if token.symbol == "USDC" || token.symbol == "USDT" {
            usdEquivalent = amountValue
        } else {
            usdEquivalent = nil
        }
    }

    private func getQuote() async {
        guard let fromToken = fromToken,
              let toToken = toToken,
              let amountValue = Double(amount) else {
            return
        }

        isLoadingQuote = true
        errorMessage = nil

        do {
            let recipientAddress: String
            let senderAddress: String

            if selectedToChain == .solana {
                guard let solanaAddress = privyAuth.solanaWalletAddress else {
                    throw SilentSwapError.solanaWalletRequired
                }
                recipientAddress = solanaAddress
            } else {
                guard let evmAddress = privyAuth.ethereumWalletAddress else {
                    throw SilentSwapError.evmWalletRequired
                }
                recipientAddress = evmAddress
            }

            if selectedFromChain == .solana {
                guard let solanaAddress = privyAuth.solanaWalletAddress else {
                    throw SilentSwapError.solanaWalletRequired
                }
                senderAddress = solanaAddress
            } else {
                guard let evmAddress = privyAuth.ethereumWalletAddress else {
                    throw SilentSwapError.evmWalletRequired
                }
                senderAddress = evmAddress
            }

            let quote = try await silentSwapService.getQuote(
                fromToken: fromToken,
                toToken: toToken,
                amount: amountValue,
                recipientAddress: recipientAddress,
                senderAddress: senderAddress
            )

            currentQuote = quote
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoadingQuote = false
    }

    private func executeSwap() async {
        guard let quote = currentQuote else { return }

        isExecuting = true
        errorMessage = nil

        do {
            _ = try await silentSwapService.executeSwap(quoteResponse: quote)
            showSuccess = true
        } catch {
            errorMessage = error.localizedDescription
        }

        isExecuting = false
    }
}

// MARK: - Token Picker View

struct TokenPickerView: View {
    let chain: BlockchainType
    @Binding var selectedToken: SilentSwapToken?
    let tokens: [SilentSwapToken]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            // Drag indicator
            Capsule()
                .fill(SappColors.border)
                .frame(width: 36, height: 4)
                .padding(.top, 8)

            // Header
            HStack {
                Text("Select Token")
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.textPrimary)
                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 12)

            // Token list
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(tokens) { token in
                        Button {
                            selectedToken = token
                            dismiss()
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(token.symbol)
                                        .font(SappTypography.labelLarge)
                                        .foregroundColor(SappColors.textPrimary)

                                    Text(token.name)
                                        .font(SappTypography.caption)
                                        .foregroundColor(SappColors.textSecondary)
                                }

                                Spacer()

                                if selectedToken?.id == token.id {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(SappColors.accent)
                                }
                            }
                            .padding(16)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)

                        if token.id != tokens.last?.id {
                            Divider().padding(.leading, 16)
                        }
                    }
                }
            }

            // Bottom action bar - standardized
            HStack(spacing: 12) {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(SappColors.textSecondary)
                        .frame(width: 48, height: 48)
                        .background(Circle().fill(SappColors.surface))
                }

                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 8)
        }
        .background(SappColors.background)
        .presentationDetents([.fraction(0.65), .large])
        .presentationDragIndicator(.hidden)
    }
}

// MARK: - Wallet Setup View

struct WalletSetupView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var privyAuth = PrivyAuthService.shared
    @State private var isCreatingSolana = false
    @State private var isCreatingEthereum = false
    @State private var isLoadingExisting = true
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            // Drag indicator
            Capsule()
                .fill(SappColors.border)
                .frame(width: 36, height: 4)
                .padding(.top, 8)

            // Header
            HStack {
                Text("Wallet Setup")
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.textPrimary)
                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 12)

            // Content
            VStack(spacing: 24) {
                Spacer()

                // Icon and description
                VStack(spacing: 12) {
                    Image(systemName: "wallet.pass")
                        .font(.system(size: 48))
                        .foregroundColor(SappColors.textSecondary)

                    Text("Multi-Chain Wallets")
                        .font(SappTypography.headlineMedium)
                        .foregroundColor(SappColors.textPrimary)

                    Text("Swaps require both Solana and Ethereum wallets for cross-chain privacy")
                        .font(SappTypography.bodySmall)
                        .foregroundColor(SappColors.textSecondary)
                        .multilineTextAlignment(.center)
                }

                // Wallet status rows
                VStack(spacing: 12) {
                    if isLoadingExisting {
                        HStack(spacing: 10) {
                            ProgressView()
                                .scaleEffect(0.8)
                            Text("Checking for existing wallets...")
                                .font(SappTypography.caption)
                                .foregroundColor(SappColors.textSecondary)
                            Spacer()
                        }
                        .padding(14)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(SappColors.surface)
                        )
                    } else {
                        walletStatusRow(
                            chain: "Solana",
                            address: privyAuth.solanaWalletAddress,
                            isCreating: isCreatingSolana,
                            createAction: createSolanaWallet
                        )

                        walletStatusRow(
                            chain: "Ethereum",
                            address: privyAuth.ethereumWalletAddress,
                            isCreating: isCreatingEthereum,
                            createAction: createEthereumWallet
                        )
                    }
                }

                if let error = errorMessage {
                    Text(error)
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.error)
                        .multilineTextAlignment(.center)
                }

                Spacer()
            }
            .padding(.horizontal, 20)

            // Bottom action bar
            HStack(spacing: 12) {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(SappColors.textSecondary)
                        .frame(width: 48, height: 48)
                        .background(Circle().fill(SappColors.surface))
                }

                if privyAuth.solanaWalletAddress != nil && privyAuth.ethereumWalletAddress != nil {
                    Button {
                        dismiss()
                    } label: {
                        Text("Done")
                            .font(SappTypography.labelMedium)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(
                                RoundedRectangle(cornerRadius: 24)
                                    .fill(SappColors.accent)
                            )
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 8)
        }
        .background(SappColors.background)
        .presentationDetents([.fraction(0.65), .large])
        .presentationDragIndicator(.hidden)
        .task {
            await loadExistingWallets()
        }
    }

    /// Try to load existing server wallets when the view appears
    private func loadExistingWallets() async {
        isLoadingExisting = true
        print("[WalletSetupView] Attempting to load existing server wallets...")

        do {
            try await privyAuth.loadServerWallets()
            print("[WalletSetupView] Loaded wallets - Solana: \(privyAuth.solanaWalletAddress ?? "nil"), Ethereum: \(privyAuth.ethereumWalletAddress ?? "nil")")
        } catch {
            print("[WalletSetupView] Failed to load existing wallets: \(error)")
            // Not an error - user may need to create wallets
        }

        isLoadingExisting = false
    }

    private func walletStatusRow(
        chain: String,
        address: String?,
        isCreating: Bool,
        createAction: @escaping () async -> Void
    ) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(chain)
                    .font(SappTypography.labelMedium)
                    .foregroundColor(SappColors.textPrimary)

                if let address = address {
                    Text("\(address.prefix(10))...\(address.suffix(6))")
                        .font(SappTypography.mono)
                        .foregroundColor(SappColors.textSecondary)
                } else {
                    Text("Not connected")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textTertiary)
                }
            }

            Spacer()

            if address != nil {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(SappColors.success)
            } else {
                Button {
                    Task { await createAction() }
                } label: {
                    if isCreating {
                        ProgressView()
                            .scaleEffect(0.8)
                    } else {
                        Text("Create")
                            .font(SappTypography.labelSmall)
                            .foregroundColor(SappColors.accent)
                    }
                }
                .disabled(isCreating)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(SappColors.surface)
        )
    }

    private func createSolanaWallet() async {
        isCreatingSolana = true
        errorMessage = nil

        do {
            // If using server wallets, create a server wallet; otherwise create embedded
            if privyAuth.useServerWallets {
                print("[WalletSetupView] Creating server Solana wallet...")
                _ = try await WalletAPIService.shared.createWallet(chainType: .solana)
                print("[WalletSetupView] Server Solana wallet created: \(WalletAPIService.shared.solanaAddress ?? "nil")")
            } else {
                print("[WalletSetupView] Creating embedded Solana wallet...")
                _ = try await privyAuth.createSolanaWallet()
                print("[WalletSetupView] Embedded Solana wallet created: \(privyAuth.embeddedSolanaWallet?.address ?? "nil")")
            }
        } catch {
            print("[WalletSetupView] Failed to create Solana wallet: \(error)")
            errorMessage = "Failed to create Solana wallet: \(error.localizedDescription)"
        }

        isCreatingSolana = false
    }

    private func createEthereumWallet() async {
        isCreatingEthereum = true
        errorMessage = nil

        do {
            // If using server wallets, create a server wallet; otherwise create embedded
            if privyAuth.useServerWallets {
                print("[WalletSetupView] Creating server Ethereum wallet...")
                _ = try await WalletAPIService.shared.createWallet(chainType: .ethereum)
                print("[WalletSetupView] Server Ethereum wallet created: \(WalletAPIService.shared.ethereumAddress ?? "nil")")
            } else {
                print("[WalletSetupView] Creating embedded Ethereum wallet...")
                _ = try await privyAuth.createEthereumWallet()
                print("[WalletSetupView] Embedded Ethereum wallet created: \(privyAuth.embeddedEthereumWallet?.address ?? "nil")")
            }
        } catch {
            print("[WalletSetupView] Failed to create Ethereum wallet: \(error)")
            errorMessage = "Failed to create Ethereum wallet: \(error.localizedDescription)"
        }

        isCreatingEthereum = false
    }
}

// MARK: - Preview

#Preview {
    SwapView()
}
