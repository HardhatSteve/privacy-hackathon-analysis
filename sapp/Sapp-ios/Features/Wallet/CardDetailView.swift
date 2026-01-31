import SwiftUI

// MARK: - Card Detail View

struct CardDetailView: View {
    let card: SavedCard

    @Environment(\.dismiss) private var dismiss
    @StateObject private var cardStorage = StarpayCardStorage.shared

    @State private var showCopied = false
    @State private var copiedField: CopiedField?
    @State private var showDeleteConfirmation = false

    enum CopiedField {
        case cardNumber
        case expiry
        case cvv
        case all
    }

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

            ScrollView {
                VStack(spacing: 24) {
                    // Visual card display
                    cardVisual

                    // Card details section
                    cardDetailsSection

                    // Info section
                    infoSection
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 100)
            }

            Spacer(minLength: 0)

            // Bottom action bar
            bottomActionBar
        }
        .background(SappColors.background)
        .presentationDetents([.large])
        .presentationDragIndicator(.hidden)
        .confirmationDialog(
            "Delete Card",
            isPresented: $showDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                cardStorage.deleteCard(id: card.id)
                dismiss()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will remove the card from your saved cards. The card details are also in your email.")
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("Card Details")
                .font(SappTypography.headlineSmall)
                .foregroundColor(SappColors.textPrimary)

            Spacer()

            // Delete button
            Button {
                showDeleteConfirmation = true
            } label: {
                Image(systemName: "trash")
                    .font(.system(size: 16))
                    .foregroundColor(SappColors.error)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(SappColors.error.opacity(0.1)))
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 16)
    }

    // MARK: - Card Visual

    private var cardVisual: some View {
        VStack(spacing: 12) {
            // Card display (similar to CompactCardView in CardOrderView)
            VStack(spacing: 8) {
                HStack {
                    Text(card.cardType.displayName.uppercased())
                        .font(SappTypography.overline)
                    Spacer()
                    Image(systemName: "creditcard.fill")
                        .font(.system(size: 16))
                }
                .foregroundColor(.white.opacity(0.7))

                Text(formatCardNumber(card.cardDetails.cardNumber))
                    .font(.system(size: 18, weight: .medium, design: .monospaced))
                    .foregroundColor(.white)
                    .tracking(1)

                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("EXP")
                            .font(.system(size: 8, weight: .medium))
                            .foregroundColor(.white.opacity(0.5))
                        Text(card.cardDetails.formattedExpiry)
                            .font(SappTypography.labelSmall)
                            .foregroundColor(.white)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        Text("CVV")
                            .font(.system(size: 8, weight: .medium))
                            .foregroundColor(.white.opacity(0.5))
                        Text(card.cardDetails.cvv)
                            .font(SappTypography.labelSmall)
                            .foregroundColor(.white)
                    }
                }

                Text(card.cardDetails.cardholderName.uppercased())
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(.white.opacity(0.7))
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(16)
            .background(
                LinearGradient(
                    colors: [Color(hex: "1a1a2e"), Color(hex: "2d2d44")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.15), radius: 8, x: 0, y: 4)

            // Copy all button
            Button {
                copyAllDetails()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: copiedField == .all ? "checkmark" : "doc.on.doc")
                    Text(copiedField == .all ? "Copied!" : "Copy All Details")
                }
                .font(SappTypography.labelSmall)
                .foregroundColor(SappColors.textSecondary)
            }
        }
    }

    // MARK: - Card Details Section

    private var cardDetailsSection: some View {
        VStack(spacing: 0) {
            detailRow(
                label: "Card Number",
                value: formatCardNumber(card.cardDetails.cardNumber),
                field: .cardNumber
            )

            Divider()
                .padding(.leading, 16)

            detailRow(
                label: "Expiry Date",
                value: card.cardDetails.formattedExpiry,
                field: .expiry
            )

            Divider()
                .padding(.leading, 16)

            detailRow(
                label: "CVV",
                value: card.cardDetails.cvv,
                field: .cvv
            )
        }
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(SappColors.surface)
        )
    }

    private func detailRow(label: String, value: String, field: CopiedField) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textTertiary)

                Text(value)
                    .font(SappTypography.mono)
                    .foregroundColor(SappColors.textPrimary)
            }

            Spacer()

            Button {
                copyField(field, value: value)
            } label: {
                Image(systemName: copiedField == field ? "checkmark" : "doc.on.doc")
                    .font(.system(size: 14))
                    .foregroundColor(copiedField == field ? SappColors.success : SappColors.textTertiary)
                    .frame(width: 32, height: 32)
            }
        }
        .padding(16)
    }

    // MARK: - Info Section

    private var infoSection: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "envelope.fill")
                    .font(.system(size: 14))
                    .foregroundColor(SappColors.textTertiary)

                Text("Card details sent to \(card.email)")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textSecondary)

                Spacer()
            }

            HStack {
                Image(systemName: "calendar")
                    .font(.system(size: 14))
                    .foregroundColor(SappColors.textTertiary)

                Text("Ordered \(card.formattedOrderDate)")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textSecondary)

                Spacer()
            }

            HStack {
                Image(systemName: "dollarsign.circle.fill")
                    .font(.system(size: 14))
                    .foregroundColor(SappColors.textTertiary)

                Text("Card value: \(card.formattedCardValue)")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textSecondary)

                Spacer()
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(SappColors.accentLight)
        )
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

            // Copy all button (primary action)
            Button {
                copyAllDetails()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: copiedField == .all ? "checkmark.circle.fill" : "doc.on.doc.fill")
                        .font(.system(size: 14))
                    Text(copiedField == .all ? "Copied!" : "Copy All Details")
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
        .background(SappColors.background)
    }

    // MARK: - Helper Methods

    private func formatCardNumber(_ number: String) -> String {
        var formatted = ""
        for (index, char) in number.enumerated() {
            if index > 0 && index % 4 == 0 { formatted += " " }
            formatted += String(char)
        }
        return formatted
    }

    private func copyField(_ field: CopiedField, value: String) {
        let cleanValue: String
        switch field {
        case .cardNumber:
            cleanValue = card.cardDetails.cardNumber
        case .expiry:
            cleanValue = card.cardDetails.formattedExpiry
        case .cvv:
            cleanValue = card.cardDetails.cvv
        case .all:
            cleanValue = value
        }

        UIPasteboard.general.string = cleanValue
        showCopiedFeedback(for: field)
    }

    private func copyAllDetails() {
        let details = """
        Card Number: \(card.cardDetails.cardNumber)
        Expiry: \(card.cardDetails.formattedExpiry)
        CVV: \(card.cardDetails.cvv)
        Cardholder: \(card.cardDetails.cardholderName)
        """
        UIPasteboard.general.string = details
        showCopiedFeedback(for: .all)
    }

    private func showCopiedFeedback(for field: CopiedField) {
        copiedField = field
        Task {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            if copiedField == field {
                copiedField = nil
            }
        }
    }
}
