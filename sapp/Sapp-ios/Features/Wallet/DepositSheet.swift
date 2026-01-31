import SwiftUI

/// Sheet for depositing tokens into a yield pool
struct DepositSheet: View {
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
                Text("Deposit")
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.textPrimary)

                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 12)

            ScrollView {
                VStack(spacing: 16) {
                        // Pool info header
                        if let pool = viewModel.selectedPoolForDeposit {
                            poolHeader(pool)
                        }

                        // Amount input
                        amountInput

                        // Insufficient USDC banner with auto-swap option
                        insufficientUSDCBanner

                        // Protected mode badge
                        protectedModeBadge

                        // APY preview
                        if let pool = viewModel.selectedPoolForDeposit {
                            apyPreview(pool)
                        }

                        // Deposit flow status
                        depositFlowStatus

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
        .task {
            // Load token balances when sheet appears
            await viewModel.loadTokenBalances()
        }
        .alert("Deposit Successful", isPresented: $viewModel.showDepositSuccess) {
            Button("Done") {
                dismiss()
            }
        } message: {
            Text("Your deposit has been submitted. It may take a few moments to reflect in your positions.")
        }
    }

    // MARK: - Deposit Flow Status

    @ViewBuilder
    private var depositFlowStatus: some View {
        switch viewModel.depositFlowState {
        case .swapping:
            HStack(spacing: SappSpacing.sm) {
                ProgressView()
                    .scaleEffect(0.8)
                Text("Swapping SOL to USDC...")
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
            }
            .padding(SappSpacing.md)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.medium)
                    .fill(SappColors.info.opacity(0.1))
            )

        case .swapComplete:
            HStack(spacing: SappSpacing.sm) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(SappColors.success)
                Text("Swap complete! Depositing...")
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
            }
            .padding(SappSpacing.md)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.medium)
                    .fill(SappColors.success.opacity(0.1))
            )

        case .depositing:
            HStack(spacing: SappSpacing.sm) {
                ProgressView()
                    .scaleEffect(0.8)
                Text("Depositing into earn pool...")
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
            }
            .padding(SappSpacing.md)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.medium)
                    .fill(SappColors.success.opacity(0.1))
            )

        case .error(let message):
            HStack(spacing: SappSpacing.sm) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(SappColors.error)
                Text(message)
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.error)
                    .lineLimit(2)
            }
            .padding(SappSpacing.md)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.medium)
                    .fill(SappColors.error.opacity(0.1))
            )

        default:
            EmptyView()
        }
    }

    // MARK: - Pool Header

    @ViewBuilder
    private func poolHeader(_ pool: LuloPoolWithRate) -> some View {
        HStack(spacing: SappSpacing.md) {
            // Token icon
            ZStack {
                Circle()
                    .fill(tokenColor(for: pool.pool.tokenSymbol).opacity(0.15))
                    .frame(width: 56, height: 56)

                Text(pool.pool.tokenSymbol.prefix(1))
                    .font(SappTypography.headlineLarge)
                    .foregroundColor(tokenColor(for: pool.pool.tokenSymbol))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(pool.pool.tokenSymbol)
                    .font(SappTypography.headlineMedium)
                    .foregroundColor(SappColors.textPrimary)

                Text(pool.pool.tokenName)
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(pool.rate.formattedProtectedAPY)
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.success)

                Text("Protected APY")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textTertiary)
            }
        }
        .padding(SappSpacing.lg)
        .background(
            RoundedRectangle(cornerRadius: SappRadius.large)
                .fill(SappColors.surface)
        )
    }

    // MARK: - Amount Input

    private var amountInput: some View {
        VStack(alignment: .leading, spacing: SappSpacing.sm) {
            Text("Amount")
                .font(SappTypography.labelMedium)
                .foregroundColor(SappColors.textSecondary)

            HStack {
                TextField("0.00", text: $viewModel.depositAmount)
                    .font(SappTypography.displaySmall)
                    .keyboardType(.decimalPad)
                    .foregroundColor(SappColors.textPrimary)
                    .onChange(of: viewModel.depositAmount) { _, _ in
                        viewModel.onDepositAmountChanged()
                    }

                if let pool = viewModel.selectedPoolForDeposit {
                    Text(pool.pool.tokenSymbol)
                        .font(SappTypography.headlineSmall)
                        .foregroundColor(SappColors.textSecondary)
                }
            }
            .padding(SappSpacing.lg)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.medium)
                    .stroke(
                        viewModel.isDepositAmountValid ? SappColors.border : SappColors.error.opacity(0.5),
                        lineWidth: 1
                    )
            )

            // Balance display with available USDC
            HStack {
                if viewModel.isLoadingBalances {
                    ProgressView()
                        .scaleEffect(0.7)
                    Text("Loading balance...")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textTertiary)
                } else {
                    Text("Available: \(viewModel.formattedUSDCBalance)")
                        .font(SappTypography.caption)
                        .foregroundColor(viewModel.hasEnoughUSDC ? SappColors.textTertiary : SappColors.warning)
                }

                Spacer()

                Button("Max") {
                    viewModel.depositAmount = String(format: "%.2f", viewModel.usdcBalance)
                }
                .font(SappTypography.labelSmall)
                .foregroundColor(SappColors.accent)
                .disabled(viewModel.usdcBalance <= 0)
            }
        }
    }

    // MARK: - Insufficient USDC Banner

    @ViewBuilder
    private var insufficientUSDCBanner: some View {
        if viewModel.needsSwap && viewModel.depositAmountDouble > 0 {
            VStack(alignment: .leading, spacing: SappSpacing.sm) {
                HStack(spacing: SappSpacing.sm) {
                    Image(systemName: "arrow.triangle.swap")
                        .font(.system(size: 18))
                        .foregroundColor(SappColors.info)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Auto-Swap Available")
                            .font(SappTypography.labelMedium)
                            .foregroundColor(SappColors.textPrimary)

                        Text("You need \(String(format: "%.2f", viewModel.usdcNeeded)) more USDC")
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textSecondary)
                    }

                    Spacer()
                }

                // SOL balance info
                HStack {
                    Text("Your SOL balance:")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textSecondary)

                    Text(viewModel.formattedSOLBalance)
                        .font(SappTypography.labelSmall)
                        .foregroundColor(SappColors.textPrimary)
                }

                // Swap quote (auto-fetched) or loading indicator
                if let quote = viewModel.swapQuote {
                    swapQuoteSummary(quote: quote)
                } else if viewModel.isGettingSwapQuote {
                    HStack {
                        ProgressView()
                            .scaleEffect(0.8)
                        Text("Getting swap quote...")
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textSecondary)
                    }
                    .padding(.top, SappSpacing.xs)
                }
            }
            .padding(SappSpacing.md)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.medium)
                    .fill(SappColors.info.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: SappRadius.medium)
                            .stroke(SappColors.info.opacity(0.3), lineWidth: 1)
                    )
            )
        }
    }

    @ViewBuilder
    private func swapQuoteSummary(quote: SilentSwapQuoteResponse) -> some View {
        VStack(alignment: .leading, spacing: SappSpacing.xs) {
            Divider()
                .padding(.vertical, SappSpacing.xs)

            HStack {
                Text("Swap")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textSecondary)

                Spacer()

                Text("\(String(format: "%.4f", viewModel.swapAmount)) SOL → \(quote.estimatedOutput) USDC")
                    .font(SappTypography.labelSmall)
                    .foregroundColor(SappColors.textPrimary)
            }

            HStack {
                Text("Fee")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textSecondary)

                Spacer()

                Text("~\(quote.estimatedFee) USDC")
                    .font(SappTypography.labelSmall)
                    .foregroundColor(SappColors.textTertiary)
            }

            HStack {
                Text("Via")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textSecondary)

                Spacer()

                Text(quote.bridgeProvider.uppercased())
                    .font(SappTypography.labelSmall)
                    .foregroundColor(SappColors.textTertiary)
            }
        }
    }

    // MARK: - Protected Mode Badge

    private var protectedModeBadge: some View {
        HStack(spacing: SappSpacing.md) {
            Image(systemName: "shield.fill")
                .font(.system(size: 20))
                .foregroundColor(SappColors.success)

            VStack(alignment: .leading, spacing: 2) {
                Text("Protected Deposit")
                    .font(SappTypography.labelLarge)
                    .foregroundColor(SappColors.textPrimary)

                Text("Your principal is protected")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textSecondary)
            }

            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 20))
                .foregroundColor(SappColors.success)
        }
        .padding(SappSpacing.md)
        .background(
            RoundedRectangle(cornerRadius: SappRadius.medium)
                .fill(SappColors.success.opacity(0.1))
                .overlay(
                    RoundedRectangle(cornerRadius: SappRadius.medium)
                        .stroke(SappColors.success.opacity(0.3), lineWidth: 1)
                )
        )
    }

    // MARK: - APY Preview

    @ViewBuilder
    private func apyPreview(_ pool: LuloPoolWithRate) -> some View {
        let apy = pool.rate.apyProtected
        let monthlyEstimate = viewModel.estimatedEarnings(
            for: pool,
            amount: viewModel.depositAmountDouble,
            mode: .protected
        )

        VStack(spacing: SappSpacing.md) {
            HStack {
                Text("Estimated Monthly Earnings")
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)

                Spacer()

                Text(String(format: "+%.4f %@", monthlyEstimate, pool.pool.tokenSymbol))
                    .font(SappTypography.labelMedium)
                    .foregroundColor(SappColors.success)
            }

            HStack {
                Text("Current APY")
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)

                Spacer()

                Text(String(format: "%.2f%%", apy))
                    .font(SappTypography.labelMedium)
                    .foregroundColor(SappColors.success)
            }
        }
        .padding(SappSpacing.md)
        .background(
            RoundedRectangle(cornerRadius: SappRadius.medium)
                .fill(SappColors.success.opacity(0.1))
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
                viewModel.clearDepositSelection()
                viewModel.resetDepositFlow()
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(SappColors.textSecondary)
                    .frame(width: 48, height: 48)
                    .background(Circle().fill(SappColors.surface))
            }

            // Primary action button
            if viewModel.needsSwap && viewModel.swapQuote != nil {
                // Swap and Deposit button
                Button {
                    Task {
                        await viewModel.executeSwapAndDeposit()
                    }
                } label: {
                    HStack(spacing: 8) {
                        if case .swapping = viewModel.depositFlowState {
                            ProgressView()
                                .tint(.white)
                                .scaleEffect(0.9)
                        } else if case .depositing = viewModel.depositFlowState {
                            ProgressView()
                                .tint(.white)
                                .scaleEffect(0.9)
                        } else {
                            Image(systemName: "arrow.triangle.swap")
                        }
                        Text(swapAndDepositButtonTitle)
                            .font(SappTypography.labelMedium)
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(
                        RoundedRectangle(cornerRadius: 24)
                            .fill(canSwapAndDeposit ? SappColors.accent : SappColors.accent.opacity(0.4))
                    )
                }
                .disabled(!canSwapAndDeposit)
            } else {
                // Regular deposit button
                Button {
                    Task {
                        await viewModel.deposit()
                    }
                } label: {
                    HStack(spacing: 8) {
                        if viewModel.isDepositing {
                            ProgressView()
                                .tint(.white)
                                .scaleEffect(0.9)
                        }
                        Text(viewModel.isDepositing ? "Depositing..." : "Deposit")
                            .font(SappTypography.labelMedium)
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(
                        RoundedRectangle(cornerRadius: 24)
                            .fill(canDirectDeposit ? SappColors.accent : SappColors.accent.opacity(0.4))
                    )
                }
                .disabled(!canDirectDeposit)
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    private var swapAndDepositButtonTitle: String {
        switch viewModel.depositFlowState {
        case .swapping: return "Swapping..."
        case .depositing: return "Depositing..."
        default: return "Swap & Deposit"
        }
    }

    private var canDirectDeposit: Bool {
        viewModel.canDeposit && viewModel.hasEnoughUSDC
    }

    private var canSwapAndDeposit: Bool {
        viewModel.swapQuote != nil &&
        viewModel.depositAmountDouble > 0 &&
        viewModel.solBalance > 0 &&
        !isFlowInProgress
    }

    private var isFlowInProgress: Bool {
        switch viewModel.depositFlowState {
        case .swapping, .swapComplete, .depositing:
            return true
        default:
            return false
        }
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
    viewModel.selectedPoolForDeposit = LuloPoolWithRate(
        pool: LuloPool(
            mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            tokenSymbol: "USDC",
            tokenName: "USD Coin",
            decimals: 6,
            tvl: "15000000",
            isActive: true
        ),
        rate: LuloRate(
            mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            apy: 8.25,
            apyProtected: 5.50
        )
    )

    return DepositSheet(viewModel: viewModel)
}
