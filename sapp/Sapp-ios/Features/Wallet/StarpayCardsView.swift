import SwiftUI
import Combine

// MARK: - Starpay Cards View

struct StarpayCardsView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var cardStorage = StarpayCardStorage.shared
    @StateObject private var starpayService = StarPayService.shared

    @State private var showOrderCard = false
    @State private var selectedCard: SavedCard?
    @State private var isCheckingService = true

    var body: some View {
        VStack(spacing: 0) {
            // Drag indicator
            Capsule()
                .fill(SappColors.border)
                .frame(width: 36, height: 4)
                .padding(.top, 8)

            // Header
            header
                .padding(.top, 12)

            // Content
            if isCheckingService {
                loadingView
            } else if !starpayService.isServiceAvailable {
                serviceUnavailableView
            } else if cardStorage.savedCards.isEmpty {
                emptyStateView
            } else {
                cardListView
            }

            Spacer(minLength: 8)

            // Bottom action bar
            if starpayService.isServiceAvailable {
                bottomActionBar
            }
        }
        .background(SappColors.background)
        .presentationDetents([.large])
        .presentationDragIndicator(.hidden)
        .task {
            await checkServiceAvailability()
        }
        .sheet(isPresented: $showOrderCard) {
            CardOrderView()
        }
        .sheet(item: $selectedCard) { card in
            CardDetailView(card: card)
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("Cards")
                .font(SappTypography.headlineSmall)
                .foregroundColor(SappColors.textPrimary)

            Spacer()

            // Card count badge
            if !cardStorage.savedCards.isEmpty {
                Text("\(cardStorage.savedCards.count)")
                    .font(SappTypography.labelSmall)
                    .foregroundColor(SappColors.textSecondary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(SappColors.surface))
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 16)
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 16) {
            Spacer()

            ProgressView()
                .scaleEffect(1.2)

            Text("Checking service...")
                .font(SappTypography.bodySmall)
                .foregroundColor(SappColors.textSecondary)

            Spacer()
        }
    }

    // MARK: - Service Unavailable View

    private var serviceUnavailableView: some View {
        VStack(spacing: 16) {
            Spacer()

            Image(systemName: "creditcard.trianglebadge.exclamationmark")
                .font(.system(size: 48, weight: .thin))
                .foregroundColor(SappColors.textTertiary)

            VStack(spacing: 8) {
                Text("Service Unavailable")
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.textPrimary)

                Text("Virtual card ordering is temporarily unavailable. Please try again later.")
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }

            Button {
                Task { await checkServiceAvailability() }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.clockwise")
                    Text("Retry")
                }
                .font(SappTypography.labelMedium)
                .foregroundColor(SappColors.accent)
            }
            .padding(.top, 8)

            Spacer()
        }
    }

    // MARK: - Empty State View

    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Spacer()

            // Card illustration
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(LinearGradient(
                        colors: [Color(hex: "1a1a2e"), Color(hex: "2d2d44")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 200, height: 120)
                    .shadow(color: Color.black.opacity(0.2), radius: 12, x: 0, y: 6)

                VStack(spacing: 8) {
                    Image(systemName: "creditcard.fill")
                        .font(.system(size: 32))
                        .foregroundColor(.white.opacity(0.7))

                    Text("VIRTUAL CARD")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.white.opacity(0.5))
                        .tracking(2)
                }
            }

            VStack(spacing: 8) {
                Text("No Cards Yet")
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.textPrimary)

                Text("Get a virtual Mastercard to spend your crypto anywhere Mastercard is accepted.")
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            // Features list
            VStack(alignment: .leading, spacing: 12) {
                featureRow(icon: "bolt.fill", text: "Instant issuance")
                featureRow(icon: "globe", text: "Works worldwide")
                featureRow(icon: "lock.fill", text: "Pay with SOL")
            }
            .padding(.top, 8)

            Spacer()
        }
    }

    private func featureRow(icon: String, text: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(SappColors.accent)
                .frame(width: 24)

            Text(text)
                .font(SappTypography.bodySmall)
                .foregroundColor(SappColors.textSecondary)
        }
    }

    // MARK: - Card List View

    private var cardListView: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(cardStorage.savedCards) { card in
                    CardRowView(card: card) {
                        selectedCard = card
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, 20)
        }
    }

    // MARK: - Bottom Action Bar

    private var bottomActionBar: some View {
        HStack(spacing: 12) {
            // Close button (small round)
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(SappColors.textSecondary)
                    .frame(width: 48, height: 48)
                    .background(Circle().fill(SappColors.surface))
            }

            // Get New Card button (primary action)
            Button {
                showOrderCard = true
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 14))
                    Text("Get New Card")
                        .font(SappTypography.labelMedium)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(
                    RoundedRectangle(cornerRadius: 24)
                        .fill(SappColors.accent)
                )
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    // MARK: - Methods

    private func checkServiceAvailability() async {
        isCheckingService = true
        do {
            _ = try await starpayService.checkServiceStatus()
        } catch {
            print("[StarpayCardsView] Service check failed: \(error)")
        }
        isCheckingService = false
    }
}

// MARK: - Card Row View

struct CardRowView: View {
    let card: SavedCard
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                // Card icon
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(LinearGradient(
                            colors: [Color(hex: "1a1a2e"), Color(hex: "2d2d44")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .frame(width: 48, height: 32)

                    Image(systemName: "creditcard.fill")
                        .font(.system(size: 14))
                        .foregroundColor(.white.opacity(0.8))
                }

                // Card info
                VStack(alignment: .leading, spacing: 4) {
                    Text(card.displayName)
                        .font(SappTypography.labelMedium)
                        .foregroundColor(SappColors.textPrimary)

                    HStack(spacing: 8) {
                        Text(card.formattedCardValue)
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.accent)

                        Text("Exp: \(card.cardDetails.formattedExpiry)")
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textTertiary)
                    }
                }

                Spacer()

                // Chevron
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(SappColors.textTertiary)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(SappColors.surface)
            )
        }
        .buttonStyle(.plain)
    }
}
