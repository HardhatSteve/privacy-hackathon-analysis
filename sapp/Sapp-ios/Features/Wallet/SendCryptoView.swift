import SwiftUI

/// Enhanced Send Crypto View with ShadowWire Integration
/// Supports multiple tokens and private transfers
struct SendCryptoView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var shadowWireService = ShadowWireService.shared
    private let webSocketService = WebSocketService.shared
    private let solanaService = SolanaWalletService()

    // Form State
    @State private var recipientInput = ""
    @State private var amount = ""
    @State private var selectedToken = "SOL"
    @State private var transferType: ShadowWireTransferType = .internal

    // UI State
    @State private var isSending = false
    @State private var errorMessage: String?
    @State private var showSuccess = false
    @State private var transactionSignature: String?
    @State private var showScanner = false
    @State private var usdEquivalent: Double?
    @State private var isResolvingHandle = false
    @State private var resolvedAddress: String?
    @State private var userBalance: Double = 0
    @State private var showSwapSuggestion = false

    // Computed fee breakdown
    private var feeInfo: (fee: Double, netAmount: Double, feePercentage: Double)? {
        guard let amountValue = Double(amount), amountValue > 0 else { return nil }
        return shadowWireService.calculateFee(amount: amountValue, token: selectedToken)
    }

    // Check if user has insufficient balance
    private var hasInsufficientBalance: Bool {
        guard let amountValue = Double(amount), amountValue > 0 else { return false }
        let total = feeInfo?.netAmount ?? amountValue
        return total > userBalance
    }

    // Calculate how much more token the user needs
    private var neededAmount: String {
        guard let amountValue = Double(amount), amountValue > 0 else { return amount }
        let total = (feeInfo?.netAmount ?? amountValue) + (feeInfo?.fee ?? 0)
        let needed = max(0, total - userBalance)
        return String(format: "%.4f", needed)
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
                // Amount input with USD display
                amountInputSection

                // Recipient input with QR scanner inside
                recipientSection

                // Privacy toggle with explanation
                privacySection

                // Fee summary (only show when balance is sufficient)
                if !hasInsufficientBalance, let fee = feeInfo {
                    feeSummary(fee: fee)
                }

                // Error message
                if let error = errorMessage {
                    Text(error)
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.error)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .padding(.horizontal)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)

            Spacer(minLength: 8)

            // Bottom action bar - minimal bottom margin
            bottomActionBar
        }
        .background(SappColors.background)
        .presentationDetents([.fraction(0.60), .large])
        .presentationDragIndicator(.hidden)
        .sheet(isPresented: $showScanner) {
            QRScannerView { qrResult in
                handleScannedQR(qrResult)
            }
        }
        .sheet(isPresented: $showSwapSuggestion) {
            SwapView(prefilledOutputToken: selectedToken, prefilledOutputAmount: neededAmount)
        }
        .alert("Transfer Complete", isPresented: $showSuccess) {
            Button("View on Explorer") {
                if let sig = transactionSignature {
                    openExplorer(signature: sig)
                }
                dismiss()
            }
            Button("Done") {
                dismiss()
            }
        } message: {
            if let sig = transactionSignature {
                let amountText = transferType == .internal ? "PRIVATE" : amount
                Text("Successfully sent \(amountText) \(selectedToken)\n\nSignature: \(sig.prefix(20))...")
            }
        }
        .task {
            await loadUserBalance()
        }
        .onChange(of: amount) { _, newValue in
            updateUSDEquivalent(newValue)
        }
        .onChange(of: recipientInput) { _, newValue in
            resolveRecipient(newValue)
        }
        .onChange(of: selectedToken) { _, _ in
            Task { await loadUserBalance() }
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("Send")
                .font(SappTypography.headlineSmall)
                .foregroundColor(SappColors.textPrimary)

            Spacer()
        }
        .padding(.horizontal, 20)
    }

    // MARK: - Amount Input Section

    private var amountInputSection: some View {
        VStack(spacing: 6) {
            Text("Amount")
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textTertiary)

            // Amount input centered with token selector overlaid on right
            ZStack {
                // Centered amount input
                TextField("0", text: $amount)
                    .font(.system(size: 48, weight: .semibold, design: .rounded))
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.center)

                // Token selector aligned to trailing edge
                HStack {
                    Spacer()
                    Menu {
                        ForEach(shadowWireService.getPopularTokens(), id: \.self) { token in
                            Button {
                                selectedToken = token
                                updateUSDEquivalent(amount)
                            } label: {
                                HStack {
                                    Text(token)
                                    if token == selectedToken {
                                        Image(systemName: "checkmark")
                                    }
                                }
                            }
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Text(selectedToken)
                                .font(SappTypography.labelLarge)
                            Image(systemName: "chevron.down")
                                .font(.system(size: 10))
                        }
                        .foregroundColor(SappColors.textPrimary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(SappColors.surface)
                        .cornerRadius(8)
                    }
                }
            }

            // USD equivalent
            if let usd = usdEquivalent, usd > 0 {
                Text("≈ $\(String(format: "%.2f", usd)) USD")
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
            }

            // Available balance
            Text("Available: \(formattedBalance) \(selectedToken)")
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textTertiary)
        }
    }

    private var formattedBalance: String {
        if userBalance == 0 {
            return "0"
        } else if userBalance < 0.0001 {
            return String(format: "%.6f", userBalance)
        } else if userBalance < 1 {
            return String(format: "%.4f", userBalance)
        } else {
            return String(format: "%.2f", userBalance)
        }
    }

    // MARK: - Recipient Section

    private var recipientSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("To")
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textTertiary)

            HStack(spacing: 0) {
                TextField("Wallet address", text: $recipientInput)
                    .font(SappTypography.bodyMedium)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .padding(.leading, 14)
                    .padding(.vertical, 14)

                // QR Scanner button inside input field
                Button {
                    showScanner = true
                } label: {
                    Image(systemName: "qrcode.viewfinder")
                        .font(.system(size: 18))
                        .foregroundColor(SappColors.textSecondary)
                        .frame(width: 44, height: 44)
                }
            }
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(SappColors.surface)
            )

            // Show resolved address for handles
            if isResolvingHandle {
                HStack(spacing: 4) {
                    ProgressView()
                        .scaleEffect(0.7)
                    Text("Looking up user...")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textTertiary)
                }
            } else if let resolved = resolvedAddress, recipientInput.hasPrefix("@") {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 12))
                        .foregroundColor(SappColors.success)
                    Text(shortAddress(resolved))
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textSecondary)
                }
            }
        }
    }

    // MARK: - Privacy Section

    private var privacySection: some View {
        VStack(spacing: 8) {
            HStack(spacing: 0) {
                // Private
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        transferType = .internal
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "lock.shield.fill")
                            .font(.system(size: 12))
                        Text("Private")
                            .font(SappTypography.labelSmall)
                    }
                    .foregroundColor(transferType == .internal ? .white : SappColors.textSecondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(transferType == .internal ? SappColors.accent : Color.clear)
                }
                .buttonStyle(.plain)

                // Public
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        transferType = .external
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "eye.fill")
                            .font(.system(size: 12))
                        Text("Public")
                            .font(SappTypography.labelSmall)
                    }
                    .foregroundColor(transferType == .external ? .white : SappColors.textSecondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(transferType == .external ? SappColors.accent : Color.clear)
                }
                .buttonStyle(.plain)
            }
            .background(SappColors.accentLight)
            .cornerRadius(12)

            // Explanation text
            Text(transferType == .internal
                ? "Amount is hidden using zero-knowledge proofs"
                : "Amount is visible on blockchain, sender identity protected")
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textTertiary)
                .multilineTextAlignment(.center)
        }
    }

    // MARK: - Fee Summary

    private func feeSummary(fee: (fee: Double, netAmount: Double, feePercentage: Double)) -> some View {
        HStack {
            Text("Total")
                .font(SappTypography.labelSmall)
                .foregroundColor(SappColors.textSecondary)
            Spacer()
            Text(shadowWireService.formatTokenAmount(fee.netAmount + fee.fee, token: selectedToken))
                .font(SappTypography.labelMedium)
                .fontWeight(.semibold)
                .foregroundColor(SappColors.textPrimary)
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(SappColors.accentLight)
        )
    }


    // MARK: - Bottom Action Bar

    private var bottomActionBar: some View {
        VStack(spacing: 8) {
            // Insufficient balance warning (one-liner)
            if hasInsufficientBalance {
                Text("Insufficient \(selectedToken) balance. Swap to get more.")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.warning)
            }

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
                    if hasInsufficientBalance {
                        showSwapSuggestion = true
                    } else {
                        Task { await sendCrypto() }
                    }
                } label: {
                    HStack(spacing: 8) {
                        if isSending {
                            ProgressView()
                                .tint(.white)
                                .scaleEffect(0.9)
                        }
                        Text(actionButtonTitle)
                            .font(SappTypography.labelMedium)
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(
                        RoundedRectangle(cornerRadius: 24)
                            .fill(isValidInput && !isSending
                                  ? SappColors.accent
                                  : SappColors.accent.opacity(0.4))
                    )
                }
                .disabled(!isValidInput || isSending)
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    private var actionButtonTitle: String {
        if isSending {
            return "Sending..."
        } else if hasInsufficientBalance {
            return "Proceed to swap"
        } else {
            return "Send \(selectedToken)"
        }
    }

    // MARK: - Computed Properties

    private var isValidInput: Bool {
        guard !recipientInput.isEmpty,
              !amount.isEmpty,
              let amountValue = Double(amount),
              amountValue > 0 else {
            return false
        }

        // For handles, check if resolved
        if recipientInput.hasPrefix("@") {
            return resolvedAddress != nil
        }

        // Validate address
        return shadowWireService.isValidAddress(recipientInput)
    }

    // MARK: - Helper Methods

    private func shortAddress(_ address: String) -> String {
        guard address.count > 12 else { return address }
        return "\(address.prefix(6))...\(address.suffix(4))"
    }

    private func loadUserBalance() async {
        // Get wallet address from Privy
        guard let walletAddress = PrivyAuthService.shared.solanaWalletAddress else {
            userBalance = 0
            return
        }

        do {
            if selectedToken == "SOL" {
                // Fetch SOL balance directly from Solana RPC
                let balance = try await fetchSOLBalance(for: walletAddress)
                await MainActor.run {
                    userBalance = balance
                }
            } else {
                // For SPL tokens, fetch from SolanaWalletService
                let tokenBalances = try await solanaService.getAllTokenBalances()
                let tokenBalance = tokenBalances.first { $0.symbol == selectedToken }?.balance ?? 0
                await MainActor.run {
                    userBalance = tokenBalance
                }
            }
        } catch {
            print("[SendCryptoView] Failed to load balance: \(error)")
            userBalance = 0
        }
    }

    /// Fetch SOL balance directly from Solana RPC
    private func fetchSOLBalance(for publicKey: String) async throws -> Double {
        let rpcURL = PrivyConfiguration.currentCluster.rpcURL
        guard let url = URL(string: rpcURL) else {
            throw SolanaError.invalidURL
        }

        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getBalance",
            "params": [publicKey]
        ]

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, _) = try await URLSession.shared.data(for: request)

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let result = json["result"] as? [String: Any],
              let lamports = result["value"] as? UInt64 else {
            return 0
        }

        // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
        return Double(lamports) / 1_000_000_000.0
    }

    private func updateUSDEquivalent(_ amountString: String) {
        guard let amountValue = Double(amountString), amountValue > 0 else {
            usdEquivalent = nil
            return
        }

        // Only convert SOL to USD for now
        if selectedToken == "SOL" {
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
        } else if selectedToken == "USDC" || selectedToken == "USDT" {
            usdEquivalent = amountValue
        } else {
            usdEquivalent = nil
        }
    }

    private func resolveRecipient(_ input: String) {
        resolvedAddress = nil
        isResolvingHandle = false

        // If not a handle (doesn't start with @), clear any handle-related errors and return
        guard input.hasPrefix("@") else {
            // Clear error if it was a handle-related error
            if errorMessage?.contains("@") == true {
                errorMessage = nil
            }
            return
        }

        let handle = String(input.dropFirst())
        guard handle.count >= 3 else {
            errorMessage = nil
            return
        }

        isResolvingHandle = true
        errorMessage = nil

        Task {
            do {
                let user = try await SappAPIService.shared.lookupUser(handle: handle)
                if let solanaAddress = user.solanaAddress {
                    await MainActor.run {
                        resolvedAddress = solanaAddress
                        isResolvingHandle = false
                        errorMessage = nil
                    }
                } else {
                    await MainActor.run {
                        resolvedAddress = nil
                        isResolvingHandle = false
                        errorMessage = "User @\(handle) has no wallet connected"
                    }
                }
            } catch {
                await MainActor.run {
                    resolvedAddress = nil
                    isResolvingHandle = false
                    errorMessage = "User @\(handle) not found"
                }
            }
        }
    }

    // MARK: - Actions

    private func sendCrypto() async {
        guard let amountValue = Double(amount) else {
            errorMessage = "Invalid amount"
            return
        }

        isSending = true
        errorMessage = nil

        do {
            let transferDetails: ShadowWireTransferResponse.TransferDetails

            // Use resolved address for handles, or direct input for addresses
            let recipientAddress = resolvedAddress ?? recipientInput

            if recipientInput.hasPrefix("@") {
                let handle = String(recipientInput.dropFirst())
                let details = try await shadowWireService.transferToHandle(
                    handle: handle,
                    amount: amountValue,
                    token: selectedToken,
                    type: transferType
                )
                transferDetails = ShadowWireTransferResponse.TransferDetails(
                    success: details.success,
                    signature: details.signature,
                    amount: details.amount,
                    token: details.token,
                    type: details.type,
                    fee: details.fee,
                    timestamp: details.timestamp
                )

                // Notify recipient via WebSocket
                webSocketService.notifyTransfer(
                    recipientHandle: handle,
                    conversationId: nil,
                    signature: transferDetails.signature,
                    amount: transferDetails.amount,
                    token: transferDetails.token,
                    type: transferDetails.type.rawValue
                )
            } else {
                transferDetails = try await shadowWireService.transfer(
                    to: recipientAddress,
                    amount: amountValue,
                    token: selectedToken,
                    type: transferType
                )
            }

            transactionSignature = transferDetails.signature
            showSuccess = true

        } catch let error as ShadowWireError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }

        isSending = false
    }

    private func handleScannedQR(_ result: QRCodeType) {
        switch result {
        case .solanaAddress(let address):
            recipientInput = address
        case .paymentRequest(let address, let requestedAmount, let token):
            recipientInput = address
            if let amt = requestedAmount {
                amount = String(amt)
            }
            if let tok = token {
                selectedToken = tok
            }
        case .sappHandle(let handle):
            recipientInput = "@\(handle)"
        default:
            break
        }
    }

    private func openExplorer(signature: String) {
        let cluster = PrivyConfiguration.currentCluster
        let clusterParam = cluster == .mainnetBeta ? "" : "?cluster=\(cluster.rawValue)"
        let urlString = "https://explorer.solana.com/tx/\(signature)\(clusterParam)"
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - Result Extension

extension Result where Success == Void {
    var isSuccess: Bool {
        if case .success = self {
            return true
        }
        return false
    }
}

// MARK: - Preview

#Preview {
    SendCryptoView()
}
