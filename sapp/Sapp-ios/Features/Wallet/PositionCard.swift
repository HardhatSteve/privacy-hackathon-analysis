import SwiftUI

/// A card displaying a user's position in a yield pool
struct PositionCard: View {
    let position: LuloPosition
    let rate: LuloRate?
    let onWithdraw: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: SappSpacing.md) {
            // Header with token info
            HStack(spacing: SappSpacing.md) {
                tokenIcon

                VStack(alignment: .leading, spacing: 2) {
                    Text(position.tokenSymbol)
                        .font(SappTypography.headlineSmall)
                        .foregroundColor(SappColors.textPrimary)

                    if let rate = rate {
                        Text(rate.formattedAPY + " APY")
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.success)
                    }
                }

                Spacer()

                // Earnings badge
                if position.earningsDouble > 0 {
                    Text(position.formattedEarnings)
                        .font(SappTypography.labelSmall)
                        .foregroundColor(SappColors.success)
                        .padding(.horizontal, SappSpacing.sm)
                        .padding(.vertical, SappSpacing.xs)
                        .background(
                            Capsule()
                                .fill(SappColors.success.opacity(0.15))
                        )
                }
            }

            Divider()

            // Balance breakdown
            VStack(spacing: SappSpacing.sm) {
                balanceRow(label: "Total Balance", value: position.formattedTotalBalance)

                if position.hasRegularDeposit {
                    balanceRow(
                        label: "Regular",
                        value: String(format: "%.4f %@", position.regularBalanceDouble, position.tokenSymbol),
                        secondary: true
                    )
                }

                if position.hasProtectedDeposit {
                    balanceRow(
                        label: "Protected",
                        value: String(format: "%.4f %@", position.protectedBalanceDouble, position.tokenSymbol),
                        secondary: true,
                        icon: "shield.fill"
                    )
                }
            }

            // Withdraw button
            Button(action: onWithdraw) {
                HStack {
                    Image(systemName: "arrow.down.circle")
                    Text("Withdraw")
                }
                .font(SappTypography.labelMedium)
                .foregroundColor(SappColors.textPrimary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, SappSpacing.sm)
                .background(
                    RoundedRectangle(cornerRadius: SappRadius.small)
                        .stroke(SappColors.border, lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
        }
        .padding(SappSpacing.lg)
        .background(SappColors.surface)
        .cornerRadius(SappRadius.large)
        .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
    }

    private var tokenIcon: some View {
        ZStack {
            Circle()
                .fill(tokenColor.opacity(0.15))
                .frame(width: 48, height: 48)

            Text(position.tokenSymbol.prefix(1))
                .font(SappTypography.headlineMedium)
                .foregroundColor(tokenColor)
        }
    }

    private var tokenColor: Color {
        switch position.tokenSymbol.uppercased() {
        case "USDC", "USDT":
            return SappColors.success
        case "SOL", "MSOL", "JITOSOL", "BSOL", "STSOL":
            return SappColors.info
        default:
            return SappColors.accent
        }
    }

    @ViewBuilder
    private func balanceRow(label: String, value: String, secondary: Bool = false, icon: String? = nil) -> some View {
        HStack {
            HStack(spacing: SappSpacing.xs) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 10))
                        .foregroundColor(SappColors.textTertiary)
                }
                Text(label)
                    .font(secondary ? SappTypography.caption : SappTypography.bodySmall)
                    .foregroundColor(secondary ? SappColors.textTertiary : SappColors.textSecondary)
            }

            Spacer()

            Text(value)
                .font(secondary ? SappTypography.caption : SappTypography.bodyMedium)
                .foregroundColor(secondary ? SappColors.textSecondary : SappColors.textPrimary)
        }
    }
}

/// A compact position row for lists
struct PositionRowView: View {
    let position: LuloPosition
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: SappSpacing.md) {
                // Token icon
                ZStack {
                    Circle()
                        .fill(tokenColor.opacity(0.15))
                        .frame(width: 40, height: 40)

                    Text(position.tokenSymbol.prefix(1))
                        .font(SappTypography.labelLarge)
                        .foregroundColor(tokenColor)
                }

                // Position info
                VStack(alignment: .leading, spacing: 2) {
                    Text(position.tokenSymbol)
                        .font(SappTypography.bodyMedium)
                        .foregroundColor(SappColors.textPrimary)

                    Text(position.formattedTotalBalance)
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textSecondary)
                }

                Spacer()

                // Earnings
                VStack(alignment: .trailing, spacing: 2) {
                    Text(position.formattedEarnings)
                        .font(SappTypography.labelMedium)
                        .foregroundColor(SappColors.success)

                    Text("earned")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textTertiary)
                }

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(SappColors.textTertiary)
            }
            .padding(SappSpacing.md)
            .background(SappColors.surface)
            .cornerRadius(SappRadius.medium)
        }
        .buttonStyle(.plain)
    }

    private var tokenColor: Color {
        switch position.tokenSymbol.uppercased() {
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
    VStack(spacing: SappSpacing.md) {
        PositionCard(
            position: LuloPosition(
                mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                tokenSymbol: "USDC",
                regularBalance: "500.00",
                protectedBalance: "250.00",
                totalBalance: "750.00",
                earnings: "12.50"
            ),
            rate: LuloRate(
                mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                apy: 8.25,
                apyProtected: 5.50
            ),
            onWithdraw: {}
        )

        PositionRowView(
            position: LuloPosition(
                mintAddress: "So11111111111111111111111111111111111111112",
                tokenSymbol: "SOL",
                regularBalance: "10.5",
                protectedBalance: "0",
                totalBalance: "10.5",
                earnings: "0.25"
            ),
            onTap: {}
        )
    }
    .padding()
    .background(SappColors.background)
}
