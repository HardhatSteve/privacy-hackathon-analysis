import SwiftUI

/// Combined Swap and Pay View
/// Shows when user needs to swap tokens to fulfill a payment request
struct AutoSwapPayView: View {
    let paymentRequest: PaymentRequestData
    let onComplete: (SwapAndPayResult) -> Void
    let onCancel: () -> Void

    @Environment(\.dismiss) private var dismiss
    @StateObject private var swapAndPayService = SwapAndPayService.shared

    // State
    @State private var suggestions: [SwapSuggestion] = []
    @State private var selectedSuggestion: SwapSuggestion?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            // Drag indicator
            dragIndicator

            // Header
            header

            // Content based on state
            ScrollView {
                VStack(spacing: 20) {
                    // Payment request card
                    paymentRequestCard

                    // Current balance info
                    currentBalanceInfo

                    // State-based content
                    stateContent
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
            }

            Spacer(minLength: 12)

            // Bottom action bar
            bottomActionBar
        }
        .background(SappColors.background)
        .presentationDetents([.large])
        .presentationDragIndicator(.hidden)
        .task {
            await loadSuggestions()
        }
        .onChange(of: swapAndPayService.state) { _, newState in
            handleStateChange(newState)
        }
    }

    // MARK: - Subviews

    private var dragIndicator: some View {
        Capsule()
            .fill(SappColors.border)
            .frame(width: 36, height: 4)
            .padding(.top, 8)
            .padding(.bottom, 4)
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Swap & Pay")
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.textPrimary)

                HStack(spacing: 4) {
                    Image(systemName: "arrow.triangle.swap")
                        .font(.system(size: 12))
                    Text("Swap tokens to fulfill request")
                        .font(SappTypography.caption)
                }
                .foregroundColor(SappColors.accent)
            }

            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
    }

    private var paymentRequestCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "dollarsign.circle.fill")
                    .font(.system(size: 20))
                    .foregroundColor(SappColors.accent)

                Text("Payment Request")
                    .font(SappTypography.labelMedium)
                    .foregroundColor(SappColors.textSecondary)

                Spacer()
            }

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(String(format: "%.2f", paymentRequest.amount)) \(paymentRequest.token)")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundColor(SappColors.textPrimary)

                    Text("to @\(paymentRequest.requesterId)")
                        .font(SappTypography.bodyMedium)
                        .foregroundColor(SappColors.textSecondary)

                    if let memo = paymentRequest.memo, !memo.isEmpty {
                        Text(memo)
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textTertiary)
                            .italic()
                    }
                }

                Spacer()

                // Recipient avatar
                ZStack {
                    Circle()
                        .fill(SappColors.accentLight)
                        .frame(width: 48, height: 48)

                    Text(String(paymentRequest.requesterId.prefix(1)).uppercased())
                        .font(SappTypography.labelLarge)
                        .foregroundColor(SappColors.textPrimary)
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(SappColors.surface)
        )
    }

    private var currentBalanceInfo: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 14))
                .foregroundColor(SappColors.warning)

            Text("Insufficient \(paymentRequest.token) balance")
                .font(SappTypography.bodySmall)
                .foregroundColor(SappColors.textSecondary)

            Spacer()
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(SappColors.warning.opacity(0.1))
        )
    }

    @ViewBuilder
    private var stateContent: some View {
        switch swapAndPayService.state {
        case .loadingBalances:
            loadingView(message: "Loading balances...")

        case .noTokensAvailable:
            noTokensView

        case .selectingSource(let suggestions):
            tokenSelectionView(suggestions: suggestions)

        case .loadingQuote:
            loadingView(message: "Getting swap quote...")

        case .confirmingSwap(let quote):
            swapConfirmationView(quote: quote)

        case .executingSwap(let progress, let message):
            progressView(progress: progress, message: message, stage: "Swapping")

        case .executingPayment(let progress, let message):
            progressView(progress: progress, message: message, stage: "Paying")

        case .completed(let result):
            completedView(result: result)

        case .failed(let error):
            errorView(error: error)
        }
    }

    private func loadingView(message: String) -> some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
                .tint(SappColors.accent)

            Text(message)
                .font(SappTypography.bodyMedium)
                .foregroundColor(SappColors.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }

    private var noTokensView: some View {
        VStack(spacing: 16) {
            Image(systemName: "wallet.pass")
                .font(.system(size: 48, weight: .light))
                .foregroundColor(SappColors.textTertiary)

            Text("No tokens available to swap")
                .font(SappTypography.bodyMedium)
                .foregroundColor(SappColors.textSecondary)

            Text("Deposit funds to your wallet first")
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textTertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }

    private func tokenSelectionView(suggestions: [SwapSuggestion]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Swap from")
                .font(SappTypography.labelMedium)
                .foregroundColor(SappColors.textSecondary)

            ForEach(suggestions) { suggestion in
                tokenSuggestionRow(suggestion: suggestion)
            }
        }
    }

    private func tokenSuggestionRow(suggestion: SwapSuggestion) -> some View {
        Button {
            selectedSuggestion = suggestion
        } label: {
            HStack(spacing: 12) {
                // Token icon placeholder
                ZStack {
                    Circle()
                        .fill(SappColors.accentLight)
                        .frame(width: 40, height: 40)

                    Text(String(suggestion.fromToken.prefix(1)))
                        .font(SappTypography.labelMedium)
                        .foregroundColor(SappColors.textPrimary)
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(suggestion.fromToken)
                            .font(SappTypography.labelMedium)
                            .foregroundColor(SappColors.textPrimary)

                        if suggestion.isRecommended {
                            Text("Recommended")
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.white)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(SappColors.accent)
                                .cornerRadius(4)
                        }
                    }

                    Text("Balance: \(String(format: "%.4f", suggestion.userBalance))")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textTertiary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(String(format: "%.4f", suggestion.fromAmount))")
                        .font(SappTypography.labelMedium)
                        .foregroundColor(SappColors.textPrimary)

                    Text("→ \(String(format: "%.2f", suggestion.toAmount)) \(suggestion.toToken)")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textSecondary)
                }

                // Selection indicator
                Image(systemName: selectedSuggestion?.id == suggestion.id ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 20))
                    .foregroundColor(selectedSuggestion?.id == suggestion.id ? SappColors.accent : SappColors.textTertiary)
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(SappColors.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(
                                selectedSuggestion?.id == suggestion.id ? SappColors.accent : Color.clear,
                                lineWidth: 2
                            )
                    )
            )
        }
        .buttonStyle(.plain)
    }

    private func swapConfirmationView(quote: AutoSwapPayState.SwapQuoteDetails) -> some View {
        VStack(spacing: 16) {
            // Swap details
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("From")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textTertiary)

                    Text("\(String(format: "%.4f", quote.fromAmount)) \(quote.fromToken)")
                        .font(SappTypography.labelLarge)
                        .foregroundColor(SappColors.textPrimary)
                }

                Spacer()

                Image(systemName: "arrow.right")
                    .font(.system(size: 20))
                    .foregroundColor(SappColors.accent)

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("To")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textTertiary)

                    Text("\(String(format: "%.2f", quote.toAmount)) \(quote.toToken)")
                        .font(SappTypography.labelLarge)
                        .foregroundColor(SappColors.textPrimary)
                }
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(SappColors.surface)
            )

            // Fee breakdown
            VStack(spacing: 8) {
                feeRow(label: "Swap fee", value: "~$\(String(format: "%.2f", quote.swapFee))")
                feeRow(label: "Payment fee", value: "~$\(String(format: "%.2f", quote.paymentFee))")
                Divider()
                feeRow(label: "Total cost", value: "\(String(format: "%.4f", quote.totalCost)) \(quote.fromToken)", isBold: true)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(SappColors.accentLight)
            )
        }
    }

    private func feeRow(label: String, value: String, isBold: Bool = false) -> some View {
        HStack {
            Text(label)
                .font(isBold ? SappTypography.labelMedium : SappTypography.bodySmall)
                .foregroundColor(SappColors.textSecondary)

            Spacer()

            Text(value)
                .font(isBold ? SappTypography.labelMedium : SappTypography.bodySmall)
                .fontWeight(isBold ? .semibold : .regular)
                .foregroundColor(SappColors.textPrimary)
        }
    }

    private func progressView(progress: Double, message: String, stage: String) -> some View {
        VStack(spacing: 20) {
            // Stage indicator
            HStack(spacing: 8) {
                // Swap stage
                stageIndicator(
                    stage: "Swap",
                    isActive: stage == "Swapping",
                    isComplete: stage == "Paying"
                )

                // Arrow
                Image(systemName: "arrow.right")
                    .font(.system(size: 12))
                    .foregroundColor(SappColors.textTertiary)

                // Pay stage
                stageIndicator(
                    stage: "Pay",
                    isActive: stage == "Paying",
                    isComplete: false
                )
            }

            // Progress bar
            VStack(spacing: 8) {
                ProgressView(value: progress)
                    .tint(SappColors.accent)
                    .scaleEffect(y: 2)

                Text(message)
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
            }
        }
        .padding(.vertical, 30)
    }

    private func stageIndicator(stage: String, isActive: Bool, isComplete: Bool) -> some View {
        HStack(spacing: 6) {
            if isComplete {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 16))
                    .foregroundColor(SappColors.success)
            } else if isActive {
                ProgressView()
                    .scaleEffect(0.7)
                    .tint(SappColors.accent)
            } else {
                Circle()
                    .stroke(SappColors.textTertiary, lineWidth: 1.5)
                    .frame(width: 16, height: 16)
            }

            Text(stage)
                .font(SappTypography.labelSmall)
                .foregroundColor(isActive || isComplete ? SappColors.textPrimary : SappColors.textTertiary)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(isActive ? SappColors.accentLight : Color.clear)
        )
    }

    private func completedView(result: AutoSwapPayState.CompletedResult) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(SappColors.success)

            Text("Payment Complete!")
                .font(SappTypography.headlineSmall)
                .foregroundColor(SappColors.textPrimary)

            Text("Successfully paid \(String(format: "%.2f", result.amountPaid)) \(result.token) to @\(paymentRequest.requesterId)")
                .font(SappTypography.bodyMedium)
                .foregroundColor(SappColors.textSecondary)
                .multilineTextAlignment(.center)

            let sig = result.paymentSignature.prefix(20)
            Text("Signature: \(sig)...")
                .font(SappTypography.monoSmall)
                .foregroundColor(SappColors.textTertiary)
        }
        .padding(.vertical, 30)
    }

    private func errorView(error: AutoSwapPayError) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 48))
                .foregroundColor(SappColors.error)

            Text("Something went wrong")
                .font(SappTypography.labelLarge)
                .foregroundColor(SappColors.textPrimary)

            Text(error.localizedDescription)
                .font(SappTypography.bodySmall)
                .foregroundColor(SappColors.textSecondary)
                .multilineTextAlignment(.center)

            if error.canRetryPayment {
                // Show retry payment button
                Button {
                    Task {
                        await retryPayment()
                    }
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "arrow.clockwise")
                        Text("Retry Payment")
                    }
                    .font(SappTypography.labelMedium)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(SappColors.accent)
                    .cornerRadius(22)
                }
                .padding(.top, 8)
            }
        }
        .padding(.vertical, 30)
    }

    // MARK: - Bottom Action Bar

    private var bottomActionBar: some View {
        HStack(spacing: 12) {
            // Cancel button
            Button {
                onCancel()
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
                    await handlePrimaryAction()
                }
            } label: {
                HStack(spacing: 8) {
                    if swapAndPayService.isExecuting {
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
                        .fill(isPrimaryButtonEnabled ? SappColors.accent : SappColors.accent.opacity(0.4))
                )
            }
            .disabled(!isPrimaryButtonEnabled)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    private var primaryButtonTitle: String {
        switch swapAndPayService.state {
        case .loadingBalances, .loadingQuote:
            return "Loading..."
        case .noTokensAvailable:
            return "Deposit Funds"
        case .selectingSource:
            return selectedSuggestion != nil ? "Swap & Pay" : "Select Token"
        case .confirmingSwap:
            return "Confirm Swap & Pay"
        case .executingSwap, .executingPayment:
            return "Processing..."
        case .completed:
            return "Done"
        case .failed(let error):
            return error.canRetryPayment ? "Retry Payment" : "Try Again"
        }
    }

    private var isPrimaryButtonEnabled: Bool {
        switch swapAndPayService.state {
        case .loadingBalances, .loadingQuote, .noTokensAvailable:
            return false
        case .selectingSource:
            return selectedSuggestion != nil
        case .confirmingSwap:
            return true
        case .executingSwap, .executingPayment:
            return false
        case .completed:
            return true
        case .failed:
            return true
        }
    }

    // MARK: - Actions

    private func loadSuggestions() async {
        do {
            suggestions = try await swapAndPayService.getSwapSuggestions(
                targetToken: paymentRequest.token,
                targetAmount: paymentRequest.amount
            )

            // Auto-select the recommended suggestion
            if let recommended = suggestions.first(where: { $0.isRecommended }) {
                selectedSuggestion = recommended
            } else if let first = suggestions.first {
                selectedSuggestion = first
            }

            isLoading = false
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }

    private func handlePrimaryAction() async {
        switch swapAndPayService.state {
        case .selectingSource, .confirmingSwap:
            guard let suggestion = selectedSuggestion else { return }
            await executeSwapAndPay(suggestion: suggestion)

        case .completed:
            if case .completed(let result) = swapAndPayService.state {
                onComplete(.success(swapSignature: result.swapSignature, paymentSignature: result.paymentSignature))
            }
            dismiss()

        case .failed(let error):
            if error.canRetryPayment {
                await retryPayment()
            } else {
                // Reset and try again
                swapAndPayService.reset()
                await loadSuggestions()
            }

        default:
            break
        }
    }

    private func executeSwapAndPay(suggestion: SwapSuggestion) async {
        do {
            let result = try await swapAndPayService.executeSwapAndPay(
                fromToken: suggestion.fromToken,
                fromAmount: suggestion.fromAmount,
                paymentRequest: paymentRequest
            )
            onComplete(result)
        } catch {
            // Error handling is done by the service
        }
    }

    private func retryPayment() async {
        do {
            let result = try await swapAndPayService.retryPayment(paymentRequest: paymentRequest)
            onComplete(result)
        } catch {
            // Error handling is done by the service
        }
    }

    private func handleStateChange(_ state: AutoSwapPayState) {
        // Handle state changes if needed
        if case .completed = state {
            // Could trigger haptic feedback, etc.
        }
    }
}

// MARK: - Preview

#Preview {
    AutoSwapPayView(
        paymentRequest: PaymentRequestData(
            requestId: "test-123",
            requesterId: "alice",
            payeeHandle: "bob",
            amount: 10.0,
            token: "USDC",
            memo: "Dinner split",
            status: .pending,
            createdAt: Date()
        ),
        onComplete: { _ in },
        onCancel: {}
    )
}
