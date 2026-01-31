import SwiftUI

/// Send Crypto view optimized for in-chat context
/// Pre-populates recipient from conversation participant
/// Matches the minimalist UI patterns from SendCryptoView
struct SendCryptoInChatView: View {
    let recipientHandle: String
    let conversationId: String
    var prefilledAmount: String?       // Pre-fill amount (e.g., from payment request)
    var prefilledToken: String?        // Pre-fill token (e.g., from payment request)
    var paymentRequestId: String?      // Track which payment request this fulfills
    let onSent: (ShadowWireTransferResponse.TransferDetails) -> Void

    @Environment(\.dismiss) private var dismiss
    @StateObject private var shadowWireService = ShadowWireService.shared
    private let webSocketService = WebSocketService.shared
    private let solanaService = SolanaWalletService()

    // Form State
    @State private var amount: String
    @State private var selectedToken: String
    @State private var transferType: ShadowWireTransferType = .internal

    init(recipientHandle: String,
         conversationId: String,
         prefilledAmount: String? = nil,
         prefilledToken: String? = nil,
         paymentRequestId: String? = nil,
         onSent: @escaping (ShadowWireTransferResponse.TransferDetails) -> Void) {
        self.recipientHandle = recipientHandle
        self.conversationId = conversationId
        self.prefilledAmount = prefilledAmount
        self.prefilledToken = prefilledToken
        self.paymentRequestId = paymentRequestId
        self.onSent = onSent

        // Initialize state with prefilled values
        _amount = State(initialValue: prefilledAmount ?? "")
        _selectedToken = State(initialValue: prefilledToken ?? "SOL")
    }

    // UI State
    @State private var isSending = false
    @State private var errorMessage: String?
    @State private var recipientSolanaAddress: String?
    @State private var isLoadingRecipient = false
    @State private var usdEquivalent: Double?
    @State private var userBalance: Double = 0

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

    var body: some View {
        VStack(spacing: 0) {
            // Drag indicator
            dragIndicator

            // Header
            header

            // Main content
            VStack(spacing: 20) {
                // Recipient card (pre-populated)
                recipientCard

                // Amount input with USD display
                amountInputSection

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
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            Spacer(minLength: 12)

            // Bottom action bar
            bottomActionBar
        }
        .background(SappColors.background)
        .presentationDetents([.fraction(0.80), .large])
        .presentationDragIndicator(.hidden)
        .task {
            await loadRecipientAddress()
            await loadUserBalance()
        }
        .onChange(of: amount) { _, newValue in
            updateUSDEquivalent(newValue)
        }
        .onChange(of: selectedToken) { _, _ in
            Task { await loadUserBalance() }
            updateUSDEquivalent(amount)
        }
    }

    // MARK: - Drag Indicator

    private var dragIndicator: some View {
        Capsule()
            .fill(SappColors.border)
            .frame(width: 36, height: 4)
            .padding(.top, 8)
            .padding(.bottom, 4)
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(paymentRequestId != nil ? "Pay Request" : "Send")
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.textPrimary)

                // Show indicator when paying a payment request
                if paymentRequestId != nil {
                    HStack(spacing: 4) {
                        Image(systemName: "dollarsign.circle.fill")
                            .font(.system(size: 12))
                        Text("Fulfilling payment request")
                            .font(SappTypography.caption)
                    }
                    .foregroundColor(SappColors.accent)
                }
            }

            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
    }

    // MARK: - Recipient Card

    private var recipientCard: some View {
        HStack(spacing: 12) {
            // Avatar
            ZStack {
                Circle()
                    .fill(SappColors.accentLight)
                    .frame(width: 44, height: 44)

                Text(String(recipientHandle.prefix(1)).uppercased())
                    .font(SappTypography.labelLarge)
                    .foregroundColor(SappColors.textPrimary)
            }

            // Recipient info
            VStack(alignment: .leading, spacing: 2) {
                Text("To @\(recipientHandle)")
                    .font(SappTypography.labelMedium)
                    .foregroundColor(SappColors.textPrimary)

                if isLoadingRecipient {
                    HStack(spacing: 4) {
                        ProgressView()
                            .scaleEffect(0.7)
                        Text("Looking up wallet...")
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textTertiary)
                    }
                } else if let address = recipientSolanaAddress {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 10))
                            .foregroundColor(SappColors.success)
                        Text(shortAddress(address))
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textSecondary)
                    }
                } else if errorMessage == nil {
                    Text("No wallet found")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.error)
                }
            }

            Spacer()

            // Privacy indicator
            if transferType == .internal {
                Image(systemName: "lock.shield.fill")
                    .font(.system(size: 16))
                    .foregroundColor(SappColors.success)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(SappColors.surface)
        )
    }

    // MARK: - Amount Input Section

    private var amountInputSection: some View {
        VStack(spacing: 6) {
            Text("Amount")
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textTertiary)

            // Amount input centered with token selector overlaid
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
            // Insufficient balance warning
            if hasInsufficientBalance {
                Text("Insufficient \(selectedToken) balance")
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
                    Task { await sendCrypto() }
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
        } else if !amount.isEmpty, let amountValue = Double(amount), amountValue > 0 {
            return "Send \(amount) \(selectedToken)"
        } else {
            return "Send \(selectedToken)"
        }
    }

    // MARK: - Computed Properties

    private var isValidInput: Bool {
        guard let amountValue = Double(amount),
              amountValue > 0,
              recipientSolanaAddress != nil,
              !hasInsufficientBalance else {
            return false
        }
        return shadowWireService.validateTransferAmount(amountValue, token: selectedToken).isSuccess
    }

    // MARK: - Helper Methods

    private func shortAddress(_ address: String) -> String {
        guard address.count > 12 else { return address }
        return "\(address.prefix(6))...\(address.suffix(4))"
    }

    private func loadRecipientAddress() async {
        print("[SendCryptoInChatView] loadRecipientAddress() called for handle: \(recipientHandle)")
        isLoadingRecipient = true
        errorMessage = nil

        do {
            print("[SendCryptoInChatView] About to call lookupUser...")
            let user = try await SappAPIService.shared.lookupUser(handle: recipientHandle)
            print("[SendCryptoInChatView] lookupUser returned: \(user)")
            await MainActor.run {
                recipientSolanaAddress = user.solanaAddress
                isLoadingRecipient = false
                if user.solanaAddress == nil {
                    errorMessage = "User @\(recipientHandle) has no wallet connected"
                } else {
                    errorMessage = nil  // Clear any error from cancelled requests
                }
            }
        } catch {
            print("[SendCryptoInChatView] Lookup failed for @\(recipientHandle): \(error)")
            await MainActor.run {
                isLoadingRecipient = false
                errorMessage = "Could not find @\(recipientHandle)"
            }
        }
    }

    private func loadUserBalance() async {
        guard let walletAddress = PrivyAuthService.shared.solanaWalletAddress else {
            userBalance = 0
            return
        }

        do {
            if selectedToken == "SOL" {
                let balance = try await fetchSOLBalance(for: walletAddress)
                await MainActor.run {
                    userBalance = balance
                }
            } else {
                let tokenBalances = try await solanaService.getAllTokenBalances()
                let tokenBalance = tokenBalances.first { $0.symbol == selectedToken }?.balance ?? 0
                await MainActor.run {
                    userBalance = tokenBalance
                }
            }
        } catch {
            print("[SendCryptoInChatView] Failed to load balance: \(error)")
            userBalance = 0
        }
    }

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

        return Double(lamports) / 1_000_000_000.0
    }

    private func updateUSDEquivalent(_ amountString: String) {
        guard let amountValue = Double(amountString), amountValue > 0 else {
            usdEquivalent = nil
            return
        }

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

    // MARK: - Actions

    private func sendCrypto() async {
        guard let amountValue = Double(amount) else {
            errorMessage = "Invalid amount"
            return
        }

        isSending = true
        errorMessage = nil

        do {
            let transferDetails = try await shadowWireService.transferToHandle(
                handle: recipientHandle,
                amount: amountValue,
                token: selectedToken,
                type: transferType
            )

            // Convert to response type
            let responseDetails = ShadowWireTransferResponse.TransferDetails(
                success: transferDetails.success,
                signature: transferDetails.signature,
                amount: transferDetails.amount,
                token: transferDetails.token,
                type: transferDetails.type,
                fee: transferDetails.fee,
                timestamp: transferDetails.timestamp
            )

            // Notify recipient via WebSocket
            webSocketService.notifyTransfer(
                recipientHandle: recipientHandle,
                conversationId: conversationId,
                signature: transferDetails.signature,
                amount: transferDetails.amount,
                token: transferDetails.token,
                type: transferDetails.type.rawValue
            )

            // Call completion handler to send transaction message
            onSent(responseDetails)

            // Dismiss view
            dismiss()

        } catch let error as ShadowWireError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }

        isSending = false
    }
}

// MARK: - Preview

#Preview {
    SendCryptoInChatView(
        recipientHandle: "alice",
        conversationId: "dm_alice_bob",
        onSent: { _ in }
    )
}
