import SwiftUI

// MARK: - Split Bill View

/// Main view for splitting a bill among chat participants
struct SplitBillView: View {
    let conversation: Conversation
    let currentUserHandle: String
    let onSendRequests: ([PaymentRequestData]) -> Void

    @Environment(\.dismiss) private var dismiss

    // Form State
    @State private var totalAmount = ""
    @State private var selectedToken = "USDC"  // Default to stablecoin for bills
    @State private var memo = ""
    @State private var splitMode: SplitMode = .equal
    @State private var participantShares: [String: String] = [:]  // handle -> amount string
    @State private var includeSelf = false
    @FocusState private var focusedField: FocusField?

    enum SplitMode: String, CaseIterable {
        case equal = "Equal"
        case custom = "Custom"
    }

    enum FocusField: Hashable {
        case total
        case memo
        case participant(String)
    }

    // Available tokens for payment requests
    private let availableTokens = ["USDC", "SOL", "USDT"]

    // Participants excluding current user
    private var billParticipants: [ChatParticipant] {
        conversation.participants.filter { $0.handle != currentUserHandle }
    }

    // Total number of people splitting (including self if selected)
    private var splitCount: Int {
        includeSelf ? billParticipants.count + 1 : billParticipants.count
    }

    // Equal split amount per person
    private var equalSplitAmount: Double {
        guard let total = Double(totalAmount), total > 0, splitCount > 0 else { return 0 }
        return (total / Double(splitCount)).rounded(toPlaces: 2)
    }

    // Custom total allocated
    private var customTotalAllocated: Double {
        participantShares.values.compactMap { Double($0) }.reduce(0, +)
    }

    // Remaining amount to allocate in custom mode
    private var remainingAmount: Double {
        guard let total = Double(totalAmount) else { return 0 }
        return total - customTotalAllocated
    }

    // Can send requests validation
    private var canSendRequests: Bool {
        guard let total = Double(totalAmount), total > 0 else { return false }
        guard !billParticipants.isEmpty else { return false }

        if splitMode == .custom {
            // In custom mode, total allocated must equal total (within small tolerance)
            return abs(remainingAmount) < 0.01
        }
        return true
    }

    var body: some View {
        ZStack {
            SappColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Drag indicator
                dragIndicator

                // Header
                header

                ScrollView {
                    VStack(spacing: 20) {
                        // Step 1: Total amount input
                        totalAmountSection

                        // Step 2: Memo (optional)
                        memoSection

                        // Step 3: Split mode toggle
                        splitModeToggle

                        // Step 4: Participants list
                        participantsList

                        // Summary
                        summarySection
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                    .padding(.bottom, 100) // Space for bottom bar
                }

                // Bottom action bar
                bottomActionBar
            }
        }
        .presentationDetents([.fraction(0.85), .large])
        .presentationDragIndicator(.hidden)
        .onAppear {
            initializeParticipantShares()
        }
    }

    // MARK: - Subviews

    private var dragIndicator: some View {
        RoundedRectangle(cornerRadius: 2.5)
            .fill(SappColors.textTertiary.opacity(0.5))
            .frame(width: 36, height: 5)
            .padding(.top, 8)
            .padding(.bottom, 4)
    }

    private var header: some View {
        VStack(spacing: 4) {
            Text("Split Bill")
                .font(SappTypography.headlineMedium)
                .foregroundColor(SappColors.textPrimary)

            Text("Request payment from \(billParticipants.count) participant\(billParticipants.count == 1 ? "" : "s")")
                .font(SappTypography.bodySmall)
                .foregroundColor(SappColors.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }

    private var totalAmountSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("TOTAL AMOUNT")
                .font(SappTypography.overline)
                .foregroundColor(SappColors.textTertiary)

            HStack(spacing: 12) {
                // Amount input
                HStack(spacing: 4) {
                    Text("$")
                        .font(.system(size: 24, weight: .medium))
                        .foregroundColor(SappColors.textSecondary)

                    TextField("0.00", text: $totalAmount)
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .keyboardType(.decimalPad)
                        .focused($focusedField, equals: .total)
                        .foregroundColor(SappColors.textPrimary)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(SappColors.surface)
                .cornerRadius(SappRadius.large)

                // Token picker
                Menu {
                    ForEach(availableTokens, id: \.self) { token in
                        Button(token) {
                            selectedToken = token
                        }
                    }
                } label: {
                    HStack(spacing: 6) {
                        Text(selectedToken)
                            .font(SappTypography.labelLarge)
                            .fontWeight(.semibold)
                        Image(systemName: "chevron.down")
                            .font(.system(size: 12, weight: .medium))
                    }
                    .foregroundColor(SappColors.textPrimary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                    .background(SappColors.surface)
                    .cornerRadius(SappRadius.large)
                }
            }
        }
    }

    private var memoSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("MEMO (OPTIONAL)")
                .font(SappTypography.overline)
                .foregroundColor(SappColors.textTertiary)

            TextField("e.g., Dinner at Mario's", text: $memo)
                .font(SappTypography.bodyMedium)
                .focused($focusedField, equals: .memo)
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(SappColors.surface)
                .cornerRadius(SappRadius.large)
        }
    }

    private var splitModeToggle: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("SPLIT METHOD")
                .font(SappTypography.overline)
                .foregroundColor(SappColors.textTertiary)

            HStack(spacing: 0) {
                ForEach(SplitMode.allCases, id: \.self) { mode in
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            splitMode = mode
                        }
                    } label: {
                        Text(mode.rawValue)
                            .font(SappTypography.labelMedium)
                            .fontWeight(splitMode == mode ? .semibold : .regular)
                            .foregroundColor(splitMode == mode ? .white : SappColors.textSecondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(
                                RoundedRectangle(cornerRadius: SappRadius.medium)
                                    .fill(splitMode == mode ? SappColors.accent : Color.clear)
                            )
                    }
                }
            }
            .padding(4)
            .background(SappColors.surface)
            .cornerRadius(SappRadius.large)
        }
    }

    private var participantsList: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("PARTICIPANTS")
                    .font(SappTypography.overline)
                    .foregroundColor(SappColors.textTertiary)

                Spacer()

                if splitMode == .equal {
                    Text("\(String(format: "%.2f", equalSplitAmount)) \(selectedToken) each")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.accent)
                }
            }

            VStack(spacing: 0) {
                ForEach(billParticipants) { participant in
                    participantRow(for: participant)

                    if participant.id != billParticipants.last?.id {
                        Divider()
                            .padding(.leading, 60)
                    }
                }

                // Include self toggle
                if conversation.isGroup {
                    Divider()
                        .padding(.leading, 60)

                    includeSelfRow
                }
            }
            .background(SappColors.surface)
            .cornerRadius(SappRadius.large)
        }
    }

    private func participantRow(for participant: ChatParticipant) -> some View {
        HStack(spacing: 12) {
            // Avatar
            Circle()
                .fill(SappColors.accentLight)
                .frame(width: 44, height: 44)
                .overlay(
                    Text(participant.handle.prefix(1).uppercased())
                        .font(SappTypography.labelLarge)
                        .foregroundColor(SappColors.textPrimary)
                )

            // Handle
            VStack(alignment: .leading, spacing: 2) {
                Text("@\(participant.handle)")
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textPrimary)

                if splitMode == .equal {
                    Text("Owes \(String(format: "%.2f", equalSplitAmount)) \(selectedToken)")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textSecondary)
                }
            }

            Spacer()

            // Amount (custom mode only)
            if splitMode == .custom {
                HStack(spacing: 4) {
                    TextField("0", text: Binding(
                        get: { participantShares[participant.handle] ?? "" },
                        set: { participantShares[participant.handle] = $0 }
                    ))
                    .font(SappTypography.bodyMedium)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.trailing)
                    .frame(width: 80)
                    .focused($focusedField, equals: .participant(participant.handle))

                    Text(selectedToken)
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textSecondary)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(SappColors.background)
                .cornerRadius(SappRadius.medium)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private var includeSelfRow: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(SappColors.accent.opacity(0.3))
                .frame(width: 44, height: 44)
                .overlay(
                    Text(currentUserHandle.prefix(1).uppercased())
                        .font(SappTypography.labelLarge)
                        .foregroundColor(SappColors.accent)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text("Include yourself")
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textPrimary)

                Text("Your share won't be requested")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textTertiary)
            }

            Spacer()

            Toggle("", isOn: $includeSelf)
                .labelsHidden()
                .tint(SappColors.accent)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private var summarySection: some View {
        VStack(spacing: 12) {
            if splitMode == .custom && Double(totalAmount) ?? 0 > 0 {
                HStack {
                    Text("Remaining to allocate:")
                        .font(SappTypography.bodySmall)
                        .foregroundColor(SappColors.textSecondary)

                    Spacer()

                    Text("\(String(format: "%.2f", remainingAmount)) \(selectedToken)")
                        .font(SappTypography.labelMedium)
                        .fontWeight(.semibold)
                        .foregroundColor(abs(remainingAmount) < 0.01 ? SappColors.success : SappColors.warning)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: SappRadius.medium)
                        .fill(abs(remainingAmount) < 0.01 ? SappColors.success.opacity(0.1) : SappColors.warning.opacity(0.1))
                )
            }

            // Total summary
            if let total = Double(totalAmount), total > 0 {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("You'll request")
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textTertiary)

                        let requestTotal = splitMode == .equal
                            ? equalSplitAmount * Double(billParticipants.count)
                            : customTotalAllocated

                        Text("\(String(format: "%.2f", requestTotal)) \(selectedToken)")
                            .font(SappTypography.headlineSmall)
                            .foregroundColor(SappColors.textPrimary)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        Text("From")
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textTertiary)

                        Text("\(billParticipants.count) people")
                            .font(SappTypography.labelMedium)
                            .foregroundColor(SappColors.textSecondary)
                    }
                }
                .padding(16)
                .background(SappColors.surface)
                .cornerRadius(SappRadius.large)
            }
        }
    }

    private var bottomActionBar: some View {
        HStack(spacing: 12) {
            // Close button
            Button { dismiss() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(SappColors.textSecondary)
                    .frame(width: 48, height: 48)
                    .background(Circle().fill(SappColors.surface))
            }

            Spacer()

            // Send requests button
            Button {
                sendPaymentRequests()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "paperplane.fill")
                    Text("Send Requests")
                }
                .font(SappTypography.labelLarge)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .padding(.horizontal, 24)
                .frame(height: 48)
                .background(
                    RoundedRectangle(cornerRadius: 24)
                        .fill(canSendRequests ? SappColors.accent : SappColors.textTertiary)
                )
            }
            .disabled(!canSendRequests)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(
            SappColors.background
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: -4)
        )
    }

    // MARK: - Helper Methods

    private func initializeParticipantShares() {
        for participant in billParticipants {
            participantShares[participant.handle] = ""
        }
    }

    private func sendPaymentRequests() {
        var requests: [PaymentRequestData] = []

        for participant in billParticipants {
            let amount: Double
            if splitMode == .equal {
                amount = equalSplitAmount
            } else {
                amount = Double(participantShares[participant.handle] ?? "0") ?? 0
            }

            guard amount > 0 else { continue }

            let request = PaymentRequestData(
                requesterId: currentUserHandle,
                payeeHandle: participant.handle,
                amount: amount,
                token: selectedToken,
                memo: memo.isEmpty ? nil : memo
            )
            requests.append(request)
        }

        guard !requests.isEmpty else { return }

        onSendRequests(requests)
        dismiss()
    }
}

// MARK: - Double Extension

private extension Double {
    func rounded(toPlaces places: Int) -> Double {
        let multiplier = pow(10.0, Double(places))
        return (self * multiplier).rounded() / multiplier
    }
}

// MARK: - Preview

#Preview {
    SplitBillView(
        conversation: Conversation(
            id: "test",
            participants: [
                ChatParticipant(id: "alice", email: nil),
                ChatParticipant(id: "bob", email: nil),
                ChatParticipant(id: "charlie", email: nil)
            ],
            createdAt: Date(),
            isGroup: true
        ),
        currentUserHandle: "alice",
        onSendRequests: { requests in
            print("Sending \(requests.count) requests")
        }
    )
}
