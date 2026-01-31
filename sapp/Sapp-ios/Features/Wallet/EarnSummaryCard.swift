import SwiftUI

/// A summary card showing total deposited value and earnings
struct EarnSummaryCard: View {
    let totalDeposited: Double
    let totalEarnings: Double
    let topAPY: Double?

    var body: some View {
        VStack(spacing: SappSpacing.lg) {
            // Main value
            VStack(spacing: SappSpacing.xs) {
                Text("Total Deposited")
                    .font(SappTypography.labelMedium)
                    .foregroundColor(SappColors.textSecondary)
                    .textCase(.uppercase)

                Text(formattedTotalDeposited)
                    .font(SappTypography.displayMedium)
                    .foregroundColor(SappColors.textPrimary)

                // Earnings badge
                if totalEarnings > 0 {
                    HStack(spacing: SappSpacing.xs) {
                        Image(systemName: "arrow.up.right")
                            .font(.system(size: 12, weight: .medium))
                        Text(formattedTotalEarnings)
                            .font(SappTypography.labelMedium)
                    }
                    .foregroundColor(SappColors.success)
                    .padding(.horizontal, SappSpacing.md)
                    .padding(.vertical, SappSpacing.xs)
                    .background(
                        Capsule()
                            .fill(SappColors.success.opacity(0.15))
                    )
                }
            }

            // Stats row
            if let topAPY = topAPY {
                HStack(spacing: SappSpacing.xl) {
                    statItem(label: "Top APY", value: String(format: "%.2f%%", topAPY), color: SappColors.success)
                    statItem(label: "Earnings", value: formattedTotalEarnings, color: SappColors.success)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(SappSpacing.xl)
        .background(
            RoundedRectangle(cornerRadius: SappRadius.xl)
                .fill(SappColors.surface)
                .shadow(color: Color.black.opacity(0.04), radius: 12, x: 0, y: 4)
        )
    }

    private var formattedTotalDeposited: String {
        if totalDeposited >= 1000 {
            return String(format: "$%.2fK", totalDeposited / 1000)
        }
        return String(format: "$%.2f", totalDeposited)
    }

    private var formattedTotalEarnings: String {
        String(format: "+$%.2f", totalEarnings)
    }

    @ViewBuilder
    private func statItem(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(SappTypography.headlineSmall)
                .foregroundColor(color)

            Text(label)
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textTertiary)
        }
    }
}

/// Empty state card when user has no positions
struct EarnEmptyStateCard: View {
    let topAPY: Double?
    let onBrowsePools: () -> Void

    var body: some View {
        VStack(spacing: SappSpacing.lg) {
            // Icon
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.system(size: 48, weight: .thin))
                .foregroundColor(SappColors.warning)

            // Text
            VStack(spacing: SappSpacing.sm) {
                Text("Start Earning")
                    .font(SappTypography.headlineMedium)
                    .foregroundColor(SappColors.textPrimary)

                Text("Deposit your tokens to earn yield.\nUp to \(topAPYText) APY available.")
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textSecondary)
                    .multilineTextAlignment(.center)
            }

            // CTA Button
            Button(action: onBrowsePools) {
                HStack {
                    Text("Browse Pools")
                    Image(systemName: "arrow.right")
                }
                .font(SappTypography.labelLarge)
            }
            .buttonStyle(SappPrimaryButtonStyle())
            .padding(.horizontal, SappSpacing.xl)
        }
        .frame(maxWidth: .infinity)
        .padding(SappSpacing.xl)
        .padding(.vertical, SappSpacing.lg)
        .background(
            RoundedRectangle(cornerRadius: SappRadius.xl)
                .fill(SappColors.surface)
                .shadow(color: Color.black.opacity(0.04), radius: 12, x: 0, y: 4)
        )
    }

    private var topAPYText: String {
        if let topAPY = topAPY {
            return String(format: "%.2f%%", topAPY)
        }
        return "--"
    }
}

/// A highlight card showing the top earning pool
struct TopPoolCard: View {
    let pool: LuloPoolWithRate
    let onDeposit: () -> Void

    var body: some View {
        HStack(spacing: SappSpacing.md) {
            // Left side - pool info
            VStack(alignment: .leading, spacing: SappSpacing.sm) {
                HStack(spacing: SappSpacing.xs) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 10))
                        .foregroundColor(SappColors.warning)
                    Text("Top Yield")
                        .font(SappTypography.labelSmall)
                        .foregroundColor(SappColors.warning)
                }

                Text(pool.pool.tokenSymbol)
                    .font(SappTypography.headlineMedium)
                    .foregroundColor(SappColors.textPrimary)

                Text(pool.rate.formattedAPY + " APY")
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.success)
            }

            Spacer()

            // Deposit button
            Button(action: onDeposit) {
                Text("Deposit")
                    .font(SappTypography.labelMedium)
                    .foregroundColor(.white)
                    .padding(.horizontal, SappSpacing.lg)
                    .padding(.vertical, SappSpacing.sm)
                    .background(
                        Capsule()
                            .fill(SappColors.accent)
                    )
            }
            .buttonStyle(.plain)
        }
        .padding(SappSpacing.lg)
        .background(
            RoundedRectangle(cornerRadius: SappRadius.large)
                .fill(SappColors.warning.opacity(0.1))
                .overlay(
                    RoundedRectangle(cornerRadius: SappRadius.large)
                        .stroke(SappColors.warning.opacity(0.3), lineWidth: 1)
                )
        )
    }
}

#Preview {
    VStack(spacing: SappSpacing.lg) {
        EarnSummaryCard(
            totalDeposited: 1250.00,
            totalEarnings: 45.50,
            topAPY: 8.25
        )

        EarnEmptyStateCard(
            topAPY: 8.25,
            onBrowsePools: {}
        )

        TopPoolCard(
            pool: LuloPoolWithRate(
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
            ),
            onDeposit: {}
        )
    }
    .padding()
    .background(SappColors.background)
}
