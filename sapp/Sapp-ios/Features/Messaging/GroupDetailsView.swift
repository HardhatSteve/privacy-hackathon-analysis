import SwiftUI

struct GroupDetailsView: View {
    let conversation: Conversation
    let onUpdateGroupName: (String) -> Void
    let onAddParticipants: () -> Void
    let onLeaveGroup: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var groupName: String
    @State private var showLeaveAlert = false
    @State private var isEditing = false
    @FocusState private var isNameFocused: Bool

    // Colors for participant initials - consistent assignment based on handle
    private let initialsColors: [Color] = [
        Color(red: 0.3, green: 0.5, blue: 0.7),   // Blue
        Color(red: 0.2, green: 0.6, blue: 0.4),   // Green
        Color(red: 0.85, green: 0.65, blue: 0.2), // Amber
        Color(red: 0.6, green: 0.4, blue: 0.7),   // Purple
        Color(red: 0.8, green: 0.4, blue: 0.5),   // Pink
    ]

    private func colorForHandle(_ handle: String) -> Color {
        let hash = abs(handle.hashValue)
        return initialsColors[hash % initialsColors.count]
    }

    private var hasChanges: Bool {
        let trimmedName = groupName.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmedName != (conversation.groupName ?? "")
    }

    init(conversation: Conversation,
         onUpdateGroupName: @escaping (String) -> Void,
         onAddParticipants: @escaping () -> Void,
         onLeaveGroup: @escaping () -> Void) {
        self.conversation = conversation
        self.onUpdateGroupName = onUpdateGroupName
        self.onAddParticipants = onAddParticipants
        self.onLeaveGroup = onLeaveGroup
        _groupName = State(initialValue: conversation.groupName ?? "")
    }

    var body: some View {
        ZStack {
            SappColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Drag indicator
                Capsule()
                    .fill(SappColors.border)
                    .frame(width: 36, height: 4)
                    .padding(.top, 8)
                    .padding(.bottom, 4)

                // Header
                HStack {
                    Text("Group Info")
                        .font(SappTypography.headlineSmall)
                        .foregroundColor(SappColors.textPrimary)

                    Spacer()

                    Text("\(conversation.participants.count) members")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textSecondary)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 8)

                // Scrollable content
                ScrollView {
                    VStack(spacing: SappSpacing.lg) {
                        // Group avatar and name section
                        groupHeaderSection

                        // Participants section
                        participantsSection
                    }
                    .padding(.vertical, SappSpacing.lg)
                }

                // Bottom action bar (thumb-friendly)
                bottomActionBar
            }
        }
        .presentationDetents([.fraction(0.75), .large])
        .presentationDragIndicator(.hidden)
        .alert("Leave Group?", isPresented: $showLeaveAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Leave", role: .destructive) {
                onLeaveGroup()
                dismiss()
            }
        } message: {
            Text("You will no longer receive messages from this group.")
        }
    }

    // MARK: - Group Header Section

    private var groupHeaderSection: some View {
        VStack(spacing: SappSpacing.md) {
            // Group avatar (overlapping initials)
            GroupInitialsView(participants: conversation.participants, size: 72)

            // Group name input
            VStack(alignment: .leading, spacing: SappSpacing.xs) {
                Text("GROUP NAME")
                    .font(SappTypography.overline)
                    .foregroundColor(SappColors.textTertiary)
                    .padding(.horizontal, 20)

                HStack {
                    TextField("Enter group name", text: $groupName)
                        .font(SappTypography.bodyMedium)
                        .focused($isNameFocused)
                        .textInputAutocapitalization(.words)

                    if !groupName.isEmpty {
                        Button {
                            groupName = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(SappColors.textTertiary)
                        }
                    }
                }
                .padding(SappSpacing.md)
                .background(SappColors.surface)
                .cornerRadius(SappRadius.large)
                .padding(.horizontal, 20)
            }
        }
    }

    // MARK: - Participants Section

    private var participantsSection: some View {
        VStack(alignment: .leading, spacing: SappSpacing.md) {
            Text("MEMBERS")
                .font(SappTypography.overline)
                .foregroundColor(SappColors.textTertiary)
                .padding(.horizontal, 20)

            VStack(spacing: 0) {
                // Add People button at top
                Button(action: {
                    dismiss()
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        onAddParticipants()
                    }
                }) {
                    HStack(spacing: SappSpacing.md) {
                        Circle()
                            .fill(SappColors.accentLight)
                            .frame(width: 44, height: 44)
                            .overlay(
                                Image(systemName: "person.badge.plus")
                                    .font(.system(size: 18))
                                    .foregroundColor(SappColors.accent)
                            )

                        Text("Add People")
                            .font(SappTypography.bodyMedium)
                            .foregroundColor(SappColors.accent)

                        Spacer()

                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(SappColors.textTertiary)
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, SappSpacing.md)
                }
                .buttonStyle(.plain)

                Divider().padding(.leading, 76)

                // Participants list
                ForEach(conversation.participants) { participant in
                    participantRow(participant)

                    if participant.id != conversation.participants.last?.id {
                        Divider().padding(.leading, 76)
                    }
                }
            }
            .background(SappColors.surface)
            .cornerRadius(SappRadius.large)
            .padding(.horizontal, 20)
        }
    }

    private func participantRow(_ participant: ChatParticipant) -> some View {
        HStack(spacing: SappSpacing.md) {
            Circle()
                .fill(colorForHandle(participant.handle))
                .frame(width: 44, height: 44)
                .overlay(
                    Text(participant.handle.prefix(1).uppercased())
                        .font(SappTypography.labelLarge)
                        .foregroundColor(.white)
                )

            Text("@\(participant.handle)")
                .font(SappTypography.bodyMedium)
                .foregroundColor(SappColors.textPrimary)

            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, SappSpacing.md)
    }

    // MARK: - Bottom Action Bar (Thumb-Friendly)

    private var bottomActionBar: some View {
        HStack(spacing: 12) {
            // Close/Cancel button
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(SappColors.textSecondary)
                    .frame(width: 48, height: 48)
                    .background(Circle().fill(SappColors.surface))
            }

            // Leave group button
            Button {
                showLeaveAlert = true
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 14))
                    Text("Leave")
                        .font(SappTypography.labelMedium)
                }
                .foregroundColor(SappColors.error)
                .frame(height: 48)
                .padding(.horizontal, 20)
                .background(
                    RoundedRectangle(cornerRadius: 24)
                        .fill(SappColors.surface)
                )
            }

            Spacer()

            // Save button (shown when there are changes)
            if hasChanges {
                Button {
                    let trimmedName = groupName.trimmingCharacters(in: .whitespacesAndNewlines)
                    onUpdateGroupName(trimmedName)
                    dismiss()
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 14, weight: .semibold))
                        Text("Save")
                            .font(SappTypography.labelMedium)
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.white)
                    .frame(height: 48)
                    .padding(.horizontal, 24)
                    .background(
                        RoundedRectangle(cornerRadius: 24)
                            .fill(SappColors.accent)
                    )
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(SappColors.background)
    }
}

#Preview {
    GroupDetailsView(
        conversation: Conversation(
            id: "test",
            participants: [
                ChatParticipant(id: "alice", email: nil),
                ChatParticipant(id: "bob", email: nil),
                ChatParticipant(id: "charlie", email: nil)
            ],
            createdAt: Date(),
            isGroup: true,
            groupName: "My Group"
        ),
        onUpdateGroupName: { _ in },
        onAddParticipants: { },
        onLeaveGroup: { }
    )
}
