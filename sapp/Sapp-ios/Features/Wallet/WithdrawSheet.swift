import SwiftUI

/// Sheet for withdrawing tokens from a yield pool position
struct WithdrawSheet: View {
    @ObservedObject var viewModel: EarnViewModel
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
                Text("Withdraw")
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.textPrimary)

                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 12)

            ScrollView {
                VStack(spacing: 16) {
                        // Position info header
                        if let position = viewModel.selectedPositionForWithdraw {
                            positionHeader(position)
                        }

                        // Amount input
                        amountInput

                        // Pending withdrawals info
                        if !viewModel.pendingWithdrawals.isEmpty {
                            pendingWithdrawalsSection
                        }

                        // Info note
                        infoNote

                        // Error message
                        if let error = viewModel.errorMessage {
                            errorView(error)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
            }

            Spacer(minLength: 8)

            // Bottom action bar
            bottomActionBar
        }
        .background(SappColors.background)
        .presentationDetents([.fraction(0.60), .large])
        .presentationDragIndicator(.hidden)
        .alert("Withdrawal Submitted", isPresented: $viewModel.showWithdrawSuccess) {
            Button("Done") {
                dismiss()
            }
        } message: {
            Text("Your withdrawal has been submitted. Protected deposits may take up to 24 hours to process.")
        }
    }

    // MARK: - Position Header

    @ViewBuilder
    private func positionHeader(_ position: LuloPosition) -> some View {
        VStack(spacing: SappSpacing.md) {
            HStack(spacing: SappSpacing.md) {
                // Token icon
                ZStack {
                    Circle()
                        .fill(tokenColor(for: position.tokenSymbol).opacity(0.15))
                        .frame(width: 56, height: 56)

                    Text(position.tokenSymbol.prefix(1))
                        .font(SappTypography.headlineLarge)
                        .foregroundColor(tokenColor(for: position.tokenSymbol))
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(position.tokenSymbol)
                        .font(SappTypography.headlineMedium)
                        .foregroundColor(SappColors.textPrimary)

                    Text("Position")
                        .font(SappTypography.bodySmall)
                        .foregroundColor(SappColors.textSecondary)
                }

                Spacer()

                // Earnings badge
                if position.earningsDouble > 0 {
                    VStack(alignment: .trailing, spacing: 4) {
                        Text(position.formattedEarnings)
                            .font(SappTypography.labelMedium)
                            .foregroundColor(SappColors.success)

                        Text("earned")
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textTertiary)
                    }
                }
            }

            Divider()

            // Balance breakdown
            VStack(spacing: SappSpacing.sm) {
                balanceRow(label: "Available to withdraw", value: position.formattedTotalBalance, highlight: true)

                if position.hasRegularDeposit {
                    balanceRow(
                        label: "Regular",
                        value: String(format: "%.4f %@", position.regularBalanceDouble, position.tokenSymbol)
                    )
                }

                if position.hasProtectedDeposit {
                    balanceRow(
                        label: "Protected",
                        value: String(format: "%.4f %@", position.protectedBalanceDouble, position.tokenSymbol),
                        icon: "shield.fill"
                    )
                }
            }
        }
        .padding(SappSpacing.lg)
        .background(
            RoundedRectangle(cornerRadius: SappRadius.large)
                .fill(SappColors.surface)
        )
    }

    @ViewBuilder
    private func balanceRow(label: String, value: String, highlight: Bool = false, icon: String? = nil) -> some View {
        HStack {
            HStack(spacing: SappSpacing.xs) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 10))
                        .foregroundColor(SappColors.textTertiary)
                }
                Text(label)
                    .font(highlight ? SappTypography.bodyMedium : SappTypography.caption)
                    .foregroundColor(highlight ? SappColors.textSecondary : SappColors.textTertiary)
            }

            Spacer()

            Text(value)
                .font(highlight ? SappTypography.bodyMedium : SappTypography.caption)
                .foregroundColor(highlight ? SappColors.textPrimary : SappColors.textSecondary)
        }
    }

    // MARK: - Amount Input

    private var amountInput: some View {
        VStack(alignment: .leading, spacing: SappSpacing.sm) {
            Text("Amount to Withdraw")
                .font(SappTypography.labelMedium)
                .foregroundColor(SappColors.textSecondary)

            HStack {
                TextField("0.00", text: $viewModel.withdrawAmount)
                    .font(SappTypography.displaySmall)
                    .keyboardType(.decimalPad)
                    .foregroundColor(SappColors.textPrimary)

                if let position = viewModel.selectedPositionForWithdraw {
                    Text(position.tokenSymbol)
                        .font(SappTypography.headlineSmall)
                        .foregroundColor(SappColors.textSecondary)
                }
            }
            .padding(SappSpacing.lg)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.medium)
                    .stroke(
                        viewModel.isWithdrawAmountValid || viewModel.withdrawAmount.isEmpty
                            ? SappColors.border
                            : SappColors.error.opacity(0.5),
                        lineWidth: 1
                    )
            )

            // Max button
            HStack {
                if !viewModel.isWithdrawAmountValid && !viewModel.withdrawAmount.isEmpty {
                    Text("Amount exceeds available balance")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.error)
                }

                Spacer()

                Button("Max") {
                    viewModel.setMaxWithdrawAmount()
                }
                .font(SappTypography.labelSmall)
                .foregroundColor(SappColors.accent)
            }
        }
    }

    // MARK: - Pending Withdrawals

    private var pendingWithdrawalsSection: some View {
        VStack(alignment: .leading, spacing: SappSpacing.sm) {
            HStack {
                Image(systemName: "clock")
                    .font(.system(size: 14))
                    .foregroundColor(SappColors.warning)

                Text("Pending Withdrawals")
                    .font(SappTypography.labelMedium)
                    .foregroundColor(SappColors.textSecondary)
            }

            VStack(spacing: SappSpacing.sm) {
                ForEach(viewModel.pendingWithdrawals) { withdrawal in
                    pendingWithdrawalRow(withdrawal)
                }
            }
        }
        .padding(SappSpacing.md)
        .background(
            RoundedRectangle(cornerRadius: SappRadius.medium)
                .fill(SappColors.warning.opacity(0.1))
        )
    }

    @ViewBuilder
    private func pendingWithdrawalRow(_ withdrawal: LuloPendingWithdrawal) -> some View {
        HStack {
            Text(withdrawal.formattedAmount)
                .font(SappTypography.bodySmall)
                .foregroundColor(SappColors.textPrimary)

            Spacer()

            if let date = withdrawal.estimatedCompletionDate {
                Text("Est. \(date, style: .relative)")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textTertiary)
            }
        }
    }

    // MARK: - Info Note

    private var infoNote: some View {
        HStack(alignment: .top, spacing: SappSpacing.sm) {
            Image(systemName: "info.circle")
                .font(.system(size: 14))
                .foregroundColor(SappColors.info)

            Text("Protected deposits may have a withdrawal delay of up to 24 hours. Regular deposits are processed immediately.")
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textSecondary)
                .multilineTextAlignment(.leading)
        }
        .padding(SappSpacing.md)
        .background(
            RoundedRectangle(cornerRadius: SappRadius.medium)
                .fill(SappColors.info.opacity(0.1))
        )
    }

    // MARK: - Error View

    @ViewBuilder
    private func errorView(_ message: String) -> some View {
        HStack(spacing: SappSpacing.sm) {
            Image(systemName: "exclamationmark.circle.fill")
                .foregroundColor(SappColors.error)

            Text(message)
                .font(SappTypography.bodySmall)
                .foregroundColor(SappColors.error)
        }
        .padding(SappSpacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: SappRadius.medium)
                .fill(SappColors.error.opacity(0.1))
        )
    }

    // MARK: - Bottom Action Bar

    private var bottomActionBar: some View {
        HStack(spacing: 12) {
            // Cancel button (small round icon)
            Button {
                viewModel.clearWithdrawSelection()
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
                    await viewModel.withdraw()
                }
            } label: {
                HStack(spacing: 8) {
                    if viewModel.isWithdrawing {
                        ProgressView()
                            .tint(.white)
                            .scaleEffect(0.9)
                    }
                    Text(viewModel.isWithdrawing ? "Withdrawing..." : "Withdraw")
                        .font(SappTypography.labelMedium)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(
                    RoundedRectangle(cornerRadius: 24)
                        .fill(viewModel.canWithdraw ? SappColors.accent : SappColors.accent.opacity(0.4))
                )
            }
            .disabled(!viewModel.canWithdraw)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    // MARK: - Helpers

    private func tokenColor(for symbol: String) -> Color {
        switch symbol.uppercased() {
        case "USDC", "USDT":
            return SappColors.success
        case "SOL", "MSOL", "JITOSOL", "BSOL", "STSOL":
            return SappColors.info
        default:
            return SappColors.accent
        }
    }
}

#Preview {
    let viewModel = EarnViewModel()
    viewModel.selectedPositionForWithdraw = LuloPosition(
        mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        tokenSymbol: "USDC",
        regularBalance: "500.00",
        protectedBalance: "250.00",
        totalBalance: "750.00",
        earnings: "12.50"
    )

    return WithdrawSheet(viewModel: viewModel)
}
