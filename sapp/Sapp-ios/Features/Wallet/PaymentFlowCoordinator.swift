import SwiftUI

/// Coordinates the payment flow, deciding between direct payment and swap-then-pay
/// When user clicks "Pay" on a payment request, this view:
/// 1. Checks if user has sufficient balance of the requested token
/// 2. If sufficient → Shows SendCryptoInChatView (direct payment)
/// 3. If insufficient → Shows AutoSwapPayView (swap then pay)
struct PaymentFlowCoordinator: View {
    let paymentRequest: PaymentRequestData
    let conversation: Conversation
    let onComplete: (PaymentFlowResult) -> Void

    @Environment(\.dismiss) private var dismiss
    @StateObject private var swapAndPayService = SwapAndPayService.shared

    // State
    @State private var isCheckingBalance = true
    @State private var needsSwap = false
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isCheckingBalance {
                balanceCheckingView
            } else if needsSwap {
                AutoSwapPayView(
                    paymentRequest: paymentRequest,
                    onComplete: { result in
                        onComplete(.swapAndPay(result))
                        dismiss()
                    },
                    onCancel: {
                        onComplete(.cancelled)
                        dismiss()
                    }
                )
            } else {
                SendCryptoInChatView(
                    recipientHandle: paymentRequest.requesterId,
                    conversationId: conversation.id,
                    prefilledAmount: String(format: "%.2f", paymentRequest.amount),
                    prefilledToken: paymentRequest.token,
                    paymentRequestId: paymentRequest.requestId,
                    onSent: { transferDetails in
                        onComplete(.directPayment(transferDetails))
                    }
                )
            }
        }
        .task {
            await checkBalance()
        }
    }

    // MARK: - Balance Checking View

    private var balanceCheckingView: some View {
        VStack(spacing: 0) {
            // Drag indicator
            Capsule()
                .fill(SappColors.border)
                .frame(width: 36, height: 4)
                .padding(.top, 8)

            Spacer()

            VStack(spacing: 20) {
                // Loading indicator
                ProgressView()
                    .scaleEffect(1.5)
                    .tint(SappColors.accent)

                Text("Checking balance...")
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textSecondary)

                // Show payment request details
                VStack(spacing: 8) {
                    Text("\(String(format: "%.2f", paymentRequest.amount)) \(paymentRequest.token)")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundColor(SappColors.textPrimary)

                    Text("to @\(paymentRequest.requesterId)")
                        .font(SappTypography.bodyMedium)
                        .foregroundColor(SappColors.textSecondary)
                }
                .padding(.top, 12)

                // Error message
                if let error = errorMessage {
                    Text(error)
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.error)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 20)
                }
            }

            Spacer()

            // Cancel button
            Button {
                onComplete(.cancelled)
                dismiss()
            } label: {
                Text("Cancel")
                    .font(SappTypography.labelMedium)
                    .foregroundColor(SappColors.textSecondary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(SappColors.surface)
                    .cornerRadius(24)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
        .background(SappColors.background)
        .presentationDetents([.fraction(0.5)])
        .presentationDragIndicator(.hidden)
    }

    // MARK: - Balance Check

    private func checkBalance() async {
        do {
            // Get user's balance of the requested token
            let balance = try await swapAndPayService.getUserBalance(token: paymentRequest.token)

            // Calculate total needed (amount + fees)
            let feeInfo = ShadowWireService.shared.calculateFee(
                amount: paymentRequest.amount,
                token: paymentRequest.token
            )
            let totalNeeded = feeInfo.netAmount + feeInfo.fee

            print("[PaymentFlowCoordinator] Balance: \(balance), Needed: \(totalNeeded)")

            await MainActor.run {
                needsSwap = balance < totalNeeded
                isCheckingBalance = false
            }

        } catch {
            await MainActor.run {
                errorMessage = "Failed to check balance: \(error.localizedDescription)"
                // Default to direct payment flow on error
                needsSwap = false
                isCheckingBalance = false
            }
        }
    }
}

// MARK: - Preview

#Preview {
    PaymentFlowCoordinator(
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
        conversation: Conversation(
            id: "dm_alice_bob",
            participants: [
                ChatParticipant(id: "alice")
            ],
            createdAt: Date(),
            lastMessage: nil,
            unreadCount: 0,
            isGroup: false,
            groupName: nil
        ),
        onComplete: { _ in }
    )
}
