import SwiftUI
import Combine

struct NewChatView: View {
    let onSelectParticipants: ([String], String?) -> Void  // Returns array of handles and optional group name

    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = NewChatViewModel()
    @FocusState private var isInputFocused: Bool
    @State private var groupName: String = ""

    var body: some View {
        ZStack {
            SappColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Drag indicator
                dragIndicator

                // Header
                header

                // Selected participants chips (if any)
                if !viewModel.selectedParticipants.isEmpty {
                    selectedParticipantsSection
                }

                // Group name input (shown when 2+ participants selected)
                if viewModel.selectedParticipants.count >= 2 {
                    groupNameInputSection
                }

                // Handle input section
                handleInputSection

                // Content
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        // Quick actions (only when no input and no selections)
                        if viewModel.handleInput.isEmpty && viewModel.selectedParticipants.isEmpty {
                            quickActionsSection
                        }

                        // Search results or recent contacts
                        if !viewModel.handleInput.isEmpty {
                            searchResultsSection
                        } else if !viewModel.recentContacts.isEmpty && viewModel.selectedParticipants.isEmpty {
                            contactsSection
                        }
                    }
                    .padding(.top, 12)
                }

                // Bottom action bar
                bottomActionBar
            }
        }
        .presentationDetents([.fraction(0.80), .large])
        .presentationDragIndicator(.hidden)
        .onAppear {
            isInputFocused = true
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK") { viewModel.errorMessage = "" }
        } message: {
            Text(viewModel.errorMessage)
        }
    }

    // MARK: - Drag Indicator

    private var dragIndicator: some View {
        Capsule()
            .fill(SappColors.border)
            .frame(width: 36, height: 4)
            .padding(.top, 8)
            .padding(.bottom, 4)
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("New Message")
                .font(SappTypography.headlineSmall)
                .foregroundColor(SappColors.textPrimary)

            Spacer()

            // Group indicator (shows when 2+ participants selected)
            if viewModel.selectedParticipants.count >= 2 {
                HStack(spacing: 4) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 10))
                    Text("Group")
                        .font(SappTypography.caption)
                }
                .foregroundColor(SappColors.accent)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Capsule().fill(SappColors.accentLight))
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 8)
    }

    // MARK: - Selected Participants

    private var selectedParticipantsSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(viewModel.selectedParticipants, id: \.self) { handle in
                    selectedParticipantChip(handle: handle)
                }
            }
            .padding(.horizontal, 20)
        }
        .padding(.vertical, 8)
    }

    private func selectedParticipantChip(handle: String) -> some View {
        HStack(spacing: 6) {
            Text(handle)
                .font(SappTypography.labelMedium)
                .foregroundColor(SappColors.textPrimary)

            Button {
                withAnimation(.easeOut(duration: 0.2)) {
                    viewModel.removeParticipant(handle)
                }
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(SappColors.textSecondary)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
            Capsule()
                .fill(SappColors.surface)
                .overlay(
                    Capsule()
                        .stroke(SappColors.border, lineWidth: 1)
                )
        )
    }

    // MARK: - Group Name Input

    private var groupNameInputSection: some View {
        VStack(alignment: .leading, spacing: SappSpacing.xs) {
            Text("GROUP NAME (OPTIONAL)")
                .font(SappTypography.overline)
                .foregroundColor(SappColors.textTertiary)
                .padding(.horizontal, 20)

            TextField("Enter a group name...", text: $groupName)
                .font(SappTypography.bodyMedium)
                .textInputAutocapitalization(.words)
                .autocorrectionDisabled()
                .padding(.horizontal, 20)
                .padding(.vertical, 14)
                .background(SappColors.surface)
        }
        .padding(.vertical, SappSpacing.sm)
    }

    // MARK: - Handle Input

    private var handleInputSection: some View {
        HStack(spacing: 8) {
            Text("To:")
                .font(SappTypography.labelMedium)
                .foregroundColor(SappColors.textSecondary)

            HStack(spacing: 2) {
                Text("@")
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textSecondary)

                TextField("handle", text: $viewModel.handleInput)
                    .font(SappTypography.bodyMedium)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .focused($isInputFocused)
                    .onChange(of: viewModel.handleInput) { _, newValue in
                        viewModel.searchUsers(query: newValue)
                    }
                    .onSubmit {
                        addCurrentHandleIfValid()
                    }
            }

            Spacer()

            if viewModel.isSearching {
                ProgressView()
                    .scaleEffect(0.8)
            } else if !viewModel.handleInput.isEmpty {
                Button {
                    viewModel.handleInput = ""
                    viewModel.searchResults = []
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(SappColors.textTertiary)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(SappColors.surface)
    }

    // MARK: - Quick Actions

    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textTertiary)
                .textCase(.uppercase)
                .padding(.horizontal, 20)

            VStack(spacing: 0) {
                QuickActionRow(
                    icon: "qrcode.viewfinder",
                    title: "Scan QR Code",
                    subtitle: "Scan a user's handle"
                ) {
                    // Open QR scanner
                }

                Divider().padding(.leading, 60)

                QuickActionRow(
                    icon: "doc.on.clipboard",
                    title: "Paste from Clipboard",
                    subtitle: "Use copied handle"
                ) {
                    if let clipboard = UIPasteboard.general.string {
                        let handle = clipboard.trimmingCharacters(in: .whitespacesAndNewlines)
                            .replacingOccurrences(of: "@", with: "")
                        viewModel.handleInput = handle
                        viewModel.searchUsers(query: handle)
                    }
                }
            }
            .background(SappColors.surface)
            .cornerRadius(12)
            .padding(.horizontal, 20)
        }
    }

    // MARK: - Search Results

    private var searchResultsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            if !viewModel.searchResults.isEmpty {
                // Show search results
                VStack(alignment: .leading, spacing: 8) {
                    Text("Users")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textTertiary)
                        .textCase(.uppercase)
                        .padding(.horizontal, 20)

                    VStack(spacing: 0) {
                        ForEach(viewModel.searchResults, id: \.handle) { user in
                            UserResultRow(
                                user: user,
                                isSelected: viewModel.selectedParticipants.contains(user.handle)
                            ) {
                                toggleParticipant(user.handle)
                            }

                            if user.handle != viewModel.searchResults.last?.handle {
                                Divider().padding(.leading, 76)
                            }
                        }
                    }
                    .background(SappColors.surface)
                    .cornerRadius(12)
                    .padding(.horizontal, 20)
                }
            } else if viewModel.isValidHandle(viewModel.handleInput) && !viewModel.isSearching {
                // Show as potential handle to look up
                VStack(alignment: .leading, spacing: 8) {
                    Text("Add user")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textTertiary)
                        .textCase(.uppercase)
                        .padding(.horizontal, 20)

                    Button {
                        addCurrentHandleIfValid()
                    } label: {
                        HStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(SappColors.accentLight)
                                    .frame(width: 44, height: 44)

                                Text("@")
                                    .font(.system(size: 20, weight: .semibold))
                                    .foregroundColor(SappColors.accent)
                            }

                            VStack(alignment: .leading, spacing: 2) {
                                Text(viewModel.handleInput.lowercased())
                                    .font(SappTypography.labelMedium)
                                    .foregroundColor(SappColors.textPrimary)

                                Text("Tap to add this user")
                                    .font(SappTypography.caption)
                                    .foregroundColor(SappColors.textSecondary)
                            }

                            Spacer()

                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 20))
                                .foregroundColor(SappColors.accent)
                        }
                        .padding(16)
                        .background(SappColors.surface)
                        .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20)
                }
            } else if !viewModel.isSearching {
                // No results hint
                VStack(spacing: 12) {
                    Image(systemName: "at")
                        .font(.system(size: 32, weight: .thin))
                        .foregroundColor(SappColors.textTertiary)

                    Text("Enter a handle to find a user")
                        .font(SappTypography.bodySmall)
                        .foregroundColor(SappColors.textSecondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            }
        }
    }

    // MARK: - Contacts Section

    private var contactsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent")
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textTertiary)
                .textCase(.uppercase)
                .padding(.horizontal, 20)

            VStack(spacing: 0) {
                ForEach(viewModel.recentContacts) { contact in
                    ContactRow(
                        contact: contact,
                        isSelected: viewModel.selectedParticipants.contains(contact.id)
                    ) {
                        toggleParticipant(contact.id)
                    }

                    if contact.id != viewModel.recentContacts.last?.id {
                        Divider().padding(.leading, 76)
                    }
                }
            }
            .background(SappColors.surface)
            .cornerRadius(12)
            .padding(.horizontal, 20)
        }
    }

    // MARK: - Bottom Action Bar

    private var bottomActionBar: some View {
        HStack(spacing: 12) {
            // Cancel button (small round icon)
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(SappColors.textSecondary)
                    .frame(width: 48, height: 48)
                    .background(Circle().fill(SappColors.surface))
            }

            // Action button (primary)
            Button {
                startChat()
            } label: {
                HStack(spacing: 8) {
                    if viewModel.isValidating {
                        ProgressView()
                            .tint(.white)
                            .scaleEffect(0.9)
                    }
                    Text(actionButtonTitle)
                        .font(SappTypography.labelMedium)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(
                    RoundedRectangle(cornerRadius: 24)
                        .fill(canStartChat ? SappColors.accent : SappColors.accent.opacity(0.4))
                )
            }
            .disabled(!canStartChat || viewModel.isValidating)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    // MARK: - Computed Properties

    private var canStartChat: Bool {
        !viewModel.selectedParticipants.isEmpty ||
        viewModel.isValidHandle(viewModel.handleInput)
    }

    private var actionButtonTitle: String {
        if viewModel.isValidating {
            return "Checking..."
        } else if viewModel.selectedParticipants.count >= 2 {
            return "Start Group (\(viewModel.selectedParticipants.count))"
        } else if viewModel.selectedParticipants.count == 1 {
            return "Start Chat"
        } else if viewModel.isValidHandle(viewModel.handleInput) {
            return "Start Chat"
        } else {
            return "Select Users"
        }
    }

    // MARK: - Actions

    private func toggleParticipant(_ handle: String) {
        withAnimation(.easeOut(duration: 0.2)) {
            if viewModel.selectedParticipants.contains(handle) {
                viewModel.removeParticipant(handle)
            } else {
                viewModel.addParticipant(handle)
            }
        }
        // Clear input after selection
        viewModel.handleInput = ""
        viewModel.searchResults = []
    }

    private func addCurrentHandleIfValid() {
        let handle = viewModel.handleInput.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard viewModel.isValidHandle(handle) else {
            viewModel.errorMessage = "Please enter a valid handle (3-20 characters, letters, numbers, underscores)"
            viewModel.showError = true
            return
        }

        // Validate handle exists then add
        Task {
            let exists = await viewModel.validateHandleExists(handle)
            if exists {
                withAnimation(.easeOut(duration: 0.2)) {
                    viewModel.addParticipant(handle)
                }
                viewModel.handleInput = ""
                viewModel.searchResults = []
            }
        }
    }

    private func startChat() {
        print("[NewChatView] startChat() called")
        print("[NewChatView] Selected participants: \(viewModel.selectedParticipants)")
        print("[NewChatView] Handle input: \(viewModel.handleInput)")
        print("[NewChatView] Group name: \(groupName)")

        // If we have selected participants, use them
        if !viewModel.selectedParticipants.isEmpty {
            print("[NewChatView] Using selected participants: \(viewModel.selectedParticipants)")
            let trimmedGroupName = groupName.trimmingCharacters(in: .whitespacesAndNewlines)
            let finalGroupName = viewModel.selectedParticipants.count >= 2 && !trimmedGroupName.isEmpty ? trimmedGroupName : nil
            onSelectParticipants(viewModel.selectedParticipants, finalGroupName)
            return
        }

        // Otherwise try to add current input as participant first
        let handle = viewModel.handleInput.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard viewModel.isValidHandle(handle) else {
            print("[NewChatView] Invalid handle: \(handle)")
            viewModel.errorMessage = "Please enter a valid handle"
            viewModel.showError = true
            return
        }

        print("[NewChatView] Validating handle: \(handle)")
        Task {
            let exists = await viewModel.validateHandleExists(handle)
            if exists {
                print("[NewChatView] Handle exists, triggering callback with: [\(handle)]")
                onSelectParticipants([handle], nil)  // Single user chat, no group name
            } else {
                print("[NewChatView] Handle does not exist: \(handle)")
            }
        }
    }
}

// MARK: - ViewModel

@MainActor
final class NewChatViewModel: ObservableObject {
    @Published var handleInput: String = ""
    @Published var searchResults: [SappUserInfo] = []
    @Published var recentContacts: [Contact] = []
    @Published var selectedParticipants: [String] = []  // Array of handles
    @Published var isSearching: Bool = false
    @Published var isValidating: Bool = false
    @Published var showError: Bool = false
    @Published var errorMessage: String = ""

    private let apiService = SappAPIService.shared
    private let databaseManager = DatabaseManager.shared
    private var searchTask: Task<Void, Never>?

    init() {
        Task {
            await loadRecentContacts()
        }
    }

    func loadRecentContacts() async {
        do {
            let contactEntities = try await databaseManager.fetchRecentContacts(limit: 10)
            recentContacts = contactEntities.map { entity in
                Contact(
                    id: entity.handle,
                    notes: entity.notes,
                    isFavorite: entity.isFavorite,
                    isBlocked: entity.isBlocked,
                    addedAt: entity.addedAt,
                    lastInteraction: entity.lastInteraction
                )
            }
        } catch {
            print("[NewChatViewModel] Failed to load recent contacts: \(error)")
        }
    }

    func isValidHandle(_ handle: String) -> Bool {
        let trimmed = handle.trimmingCharacters(in: .whitespacesAndNewlines)
        let regex = try? NSRegularExpression(pattern: "^[a-zA-Z0-9_]{3,20}$")
        let range = NSRange(trimmed.startIndex..., in: trimmed)
        return regex?.firstMatch(in: trimmed, range: range) != nil
    }

    func searchUsers(query: String) {
        searchTask?.cancel()

        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

        if trimmed.count < 2 {
            searchResults = []
            return
        }

        isSearching = true

        searchTask = Task {
            try? await Task.sleep(nanoseconds: 300_000_000)  // 300ms debounce

            guard !Task.isCancelled else { return }

            do {
                let results = try await apiService.searchUsers(query: trimmed)
                guard !Task.isCancelled else { return }
                // Filter out already selected participants
                searchResults = results.filter { !selectedParticipants.contains($0.handle) }
            } catch {
                guard !Task.isCancelled else { return }
                searchResults = []
            }

            isSearching = false
        }
    }

    func validateHandleExists(_ handle: String) async -> Bool {
        isValidating = true
        defer { isValidating = false }

        do {
            let exists = try await apiService.handleExists(handle)
            if !exists {
                errorMessage = "User @\(handle) not found"
                showError = true
                return false
            }
            return true
        } catch {
            errorMessage = error.localizedDescription
            showError = true
            return false
        }
    }

    func addParticipant(_ handle: String) {
        let normalizedHandle = handle.lowercased()
        guard !selectedParticipants.contains(normalizedHandle) else { return }
        selectedParticipants.append(normalizedHandle)
    }

    func removeParticipant(_ handle: String) {
        selectedParticipants.removeAll { $0 == handle.lowercased() }
    }
}

// MARK: - Quick Action Row

struct QuickActionRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(SappColors.accent)
                    .frame(width: 44, height: 44)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(SappTypography.labelMedium)
                        .foregroundColor(SappColors.textPrimary)

                    Text(subtitle)
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textSecondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(SappColors.textTertiary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - User Result Row (for API search results)

struct UserResultRow: View {
    let user: SappUserInfo
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Initial circle
                ZStack {
                    Circle()
                        .fill(isSelected ? SappColors.accent : SappColors.accentLight)
                        .frame(width: 44, height: 44)

                    if isSelected {
                        Image(systemName: "checkmark")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                    } else {
                        Text(user.handle.prefix(1).uppercased())
                            .font(SappTypography.labelLarge)
                            .foregroundColor(SappColors.textPrimary)
                    }
                }

                // Info
                VStack(alignment: .leading, spacing: 2) {
                    Text(user.handle)
                        .font(SappTypography.labelMedium)
                        .foregroundColor(SappColors.textPrimary)
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(SappColors.accent)
                } else {
                    Image(systemName: "plus.circle")
                        .font(.system(size: 20))
                        .foregroundColor(SappColors.textTertiary)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Contact Row (for local contacts)

struct ContactRow: View {
    let contact: Contact
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Initial circle
                ZStack {
                    Circle()
                        .fill(isSelected ? SappColors.accent : SappColors.accentLight)
                        .frame(width: 44, height: 44)

                    if isSelected {
                        Image(systemName: "checkmark")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                    } else {
                        Text(contact.handle.prefix(1).uppercased())
                            .font(SappTypography.labelLarge)
                            .foregroundColor(SappColors.textPrimary)
                    }
                }

                // Info
                VStack(alignment: .leading, spacing: 2) {
                    Text(contact.handle)
                        .font(SappTypography.labelMedium)
                        .foregroundColor(SappColors.textPrimary)
                }

                Spacer()

                HStack(spacing: 8) {
                    if contact.isFavorite {
                        Image(systemName: "star.fill")
                            .font(.system(size: 10))
                            .foregroundColor(SappColors.warning)
                    }

                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 20))
                            .foregroundColor(SappColors.accent)
                    } else {
                        Image(systemName: "plus.circle")
                            .font(.system(size: 20))
                            .foregroundColor(SappColors.textTertiary)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .buttonStyle(.plain)
    }
}
