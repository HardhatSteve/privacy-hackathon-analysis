import SwiftUI

/// A row displaying a yield pool with APY and deposit action
struct PoolRowView: View {
    let pool: LuloPoolWithRate
    let onDeposit: () -> Void

    var body: some View {
        HStack(spacing: SappSpacing.md) {
            // Token icon placeholder
            tokenIcon

            // Pool info
            VStack(alignment: .leading, spacing: 2) {
                Text(pool.pool.tokenSymbol)
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textPrimary)

                Text(pool.pool.formattedTVL + " TVL")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textTertiary)
            }

            Spacer()

            // APY
            VStack(alignment: .trailing, spacing: 2) {
                Text(pool.rate.formattedAPY)
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.success)

                Text("APY")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textTertiary)
            }

            // Deposit button
            Button(action: onDeposit) {
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 28))
                    .foregroundColor(SappColors.accent)
            }
            .buttonStyle(.plain)
        }
        .padding(SappSpacing.md)
        .background(SappColors.surface)
        .cornerRadius(SappRadius.medium)
    }

    private var tokenIcon: some View {
        ZStack {
            Circle()
                .fill(tokenColor.opacity(0.15))
                .frame(width: 44, height: 44)

            Text(pool.pool.tokenSymbol.prefix(1))
                .font(SappTypography.headlineSmall)
                .foregroundColor(tokenColor)
        }
    }

    private var tokenColor: Color {
        switch pool.pool.tokenSymbol.uppercased() {
        case "USDC", "USDT":
            return SappColors.success
        case "SOL", "MSOL", "JITOSOL", "BSOL", "STSOL":
            return SappColors.info
        default:
            return SappColors.accent
        }
    }
}

/// A compact version of the pool row for lists
struct PoolRowCompactView: View {
    let pool: LuloPoolWithRate
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: SappSpacing.md) {
                // Token icon
                ZStack {
                    Circle()
                        .fill(tokenColor.opacity(0.15))
                        .frame(width: 36, height: 36)

                    Text(pool.pool.tokenSymbol.prefix(1))
                        .font(SappTypography.labelMedium)
                        .foregroundColor(tokenColor)
                }

                // Pool info
                VStack(alignment: .leading, spacing: 2) {
                    Text(pool.pool.tokenSymbol)
                        .font(SappTypography.bodyMedium)
                        .foregroundColor(SappColors.textPrimary)

                    Text(pool.rate.formattedAPY + " APY")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.success)
                }

                Spacer()

                // Selection indicator
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(SappColors.success)
                }
            }
            .padding(SappSpacing.sm)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.small)
                    .fill(isSelected ? SappColors.accentLight : Color.clear)
            )
        }
        .buttonStyle(.plain)
    }

    private var tokenColor: Color {
        switch pool.pool.tokenSymbol.uppercased() {
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
        PoolRowView(
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

        PoolRowCompactView(
            pool: LuloPoolWithRate(
                pool: LuloPool(
                    mintAddress: "So11111111111111111111111111111111111111112",
                    tokenSymbol: "SOL",
                    tokenName: "Wrapped SOL",
                    decimals: 9,
                    tvl: "25000000",
                    isActive: true
                ),
                rate: LuloRate(
                    mintAddress: "So11111111111111111111111111111111111111112",
                    apy: 6.50,
                    apyProtected: 4.00
                )
            ),
            isSelected: true,
            onTap: {}
        )
    }
    .padding()
    .background(SappColors.background)
}
