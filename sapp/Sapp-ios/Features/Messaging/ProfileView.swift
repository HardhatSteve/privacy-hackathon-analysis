import SwiftUI

struct ProfileView: View {
    let handle: String
    @Environment(\.dismiss) private var dismiss
    @State private var showBlockAlert = false
    @State private var isBlocked = false
    @State private var isLoading = false

    // Colors for profile initials - consistent assignment based on handle
    private let initialsColors: [Color] = [
        Color(red: 0.3, green: 0.5, blue: 0.7),   // Blue
        Color(red: 0.2, green: 0.6, blue: 0.4),   // Green
        Color(red: 0.85, green: 0.65, blue: 0.2), // Amber
        Color(red: 0.6, green: 0.4, blue: 0.7),   // Purple
        Color(red: 0.8, green: 0.4, blue: 0.5),   // Pink
    ]

    private var initialsColor: Color {
        let hash = abs(handle.hashValue)
        return initialsColors[hash % initialsColors.count]
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Profile header
                profileHeader

                // Actions list
                actionsList

                Spacer()
            }
            .background(SappColors.background)
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundColor(SappColors.textPrimary)
                }
            }
            .alert("Block @\(handle)?", isPresented: $showBlockAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Block", role: .destructive) {
                    blockUser()
                }
            } message: {
                Text("You won't receive messages from this user. You can unblock them later.")
            }
            .task {
                await loadBlockedStatus()
            }
        }
    }

    private var profileHeader: some View {
        VStack(spacing: SappSpacing.md) {
            Circle()
                .fill(initialsColor)
                .frame(width: 80, height: 80)
                .overlay(
                    Text(handle.prefix(1).uppercased())
                        .font(SappTypography.displaySmall)
                        .foregroundColor(.white)
                )

            Text("@\(handle)")
                .font(SappTypography.headlineMedium)
                .foregroundColor(SappColors.textPrimary)
        }
        .frame(maxWidth: .infinity)
        .padding(SappSpacing.xl)
        .background(SappColors.surface)
    }

    private var actionsList: some View {
        VStack(spacing: 0) {
            Button {
                if isBlocked {
                    unblockUser()
                } else {
                    showBlockAlert = true
                }
            } label: {
                HStack(spacing: SappSpacing.md) {
                    Image(systemName: isBlocked ? "hand.raised.slash.fill" : "hand.raised.fill")
                        .font(.system(size: 18))
                        .foregroundColor(isBlocked ? SappColors.success : SappColors.error)
                        .frame(width: 28)

                    Text(isBlocked ? "Unblock" : "Block")
                        .font(SappTypography.bodyMedium)
                        .foregroundColor(isBlocked ? SappColors.success : SappColors.error)

                    Spacer()

                    if isLoading {
                        ProgressView()
                            .scaleEffect(0.8)
                    }
                }
                .padding(.horizontal, SappSpacing.lg)
                .padding(.vertical, SappSpacing.md)
            }
            .buttonStyle(.plain)
            .disabled(isLoading)
        }
        .background(SappColors.surface)
        .cornerRadius(SappRadius.large)
        .padding(.horizontal, SappSpacing.lg)
        .padding(.top, SappSpacing.lg)
    }

    private func loadBlockedStatus() async {
        do {
            if let contact = try await DatabaseManager.shared.fetchContact(byHandle: handle) {
                isBlocked = contact.isBlocked
            }
        } catch {
            print("[ProfileView] Failed to load blocked status: \(error)")
        }
    }

    private func blockUser() {
        isLoading = true
        Task {
            do {
                // Create or update contact with blocked status
                _ = try await DatabaseManager.shared.createOrUpdateContact(handle: handle)
                try await DatabaseManager.shared.updateContactBlocked(handle, isBlocked: true)
                isBlocked = true
            } catch {
                print("[ProfileView] Failed to block user: \(error)")
            }
            isLoading = false
        }
    }

    private func unblockUser() {
        isLoading = true
        Task {
            do {
                try await DatabaseManager.shared.updateContactBlocked(handle, isBlocked: false)
                isBlocked = false
            } catch {
                print("[ProfileView] Failed to unblock user: \(error)")
            }
            isLoading = false
        }
    }
}

#Preview {
    ProfileView(handle: "testuser")
}
