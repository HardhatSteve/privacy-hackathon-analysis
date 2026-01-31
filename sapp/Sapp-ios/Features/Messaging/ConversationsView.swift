import SwiftUI
import Combine

struct ConversationsView: View {
    @StateObject private var viewModel = ConversationsViewModel()
    @EnvironmentObject private var appState: AppState
    @State private var searchText = ""
    @State private var showNewChat = false
    @State private var selectedConversation: Conversation?
    @State private var errorMessage: String?
    @State private var showError = false
    
    var filteredConversations: [Conversation] {
        if searchText.isEmpty {
            return viewModel.conversations
        }
        return viewModel.conversations.filter { conversation in
            conversation.displayName.localizedCaseInsensitiveContains(searchText)
        }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                SappColors.background.ignoresSafeArea()
                
                if viewModel.conversations.isEmpty && !viewModel.isLoading {
                    emptyState
                } else {
                    conversationsList
                }
            }
            .navigationTitle("")
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Messages")
                        .font(SappTypography.displaySmall)
                        .foregroundColor(SappColors.textPrimary)
                }
            }
            .searchable(text: $searchText, prompt: "Search conversations")
            .floatingActionButton(icon: "square.and.pencil") {
                showNewChat = true
            }
            .sheet(isPresented: $showNewChat) {
                NewChatView { participantHandles, groupName in
                    print("[ConversationsView] NewChatView callback triggered with handles: \(participantHandles), groupName: \(groupName ?? "nil")")

                    // Create conversation first
                    Task {
                        print("[ConversationsView] Starting conversation creation task...")
                        do {
                            let conversation = try await viewModel.createConversation(with: participantHandles, groupName: groupName)
                            print("[ConversationsView] Conversation created successfully, dismissing sheet...")
                            
                            // Dismiss sheet and navigate on main thread
                            await MainActor.run {
                                showNewChat = false
                                print("[ConversationsView] Sheet dismissed, scheduling navigation...")
                                
                                // Delay navigation slightly to allow sheet dismissal
                                Task {
                                    try? await Task.sleep(nanoseconds: 400_000_000)
                                    print("[ConversationsView] Setting selectedConversation to: \(conversation.id)")
                                    selectedConversation = conversation
                                }
                            }
                        } catch {
                            print("[ConversationsView] ❌ Error creating conversation: \(error)")
                            await MainActor.run {
                                showNewChat = false
                                errorMessage = error.localizedDescription
                                showError = true
                            }
                        }
                    }
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK") { showError = false }
            } message: {
                Text(errorMessage ?? "Failed to create conversation")
            }
            .navigationDestination(item: $selectedConversation) { conversation in
                ChatView(conversation: conversation)
            }
            .onChange(of: selectedConversation) { oldValue, newValue in
                if let conv = newValue {
                    print("[ConversationsView] 📍 Navigation triggered to conversation: \(conv.id)")
                    print("[ConversationsView] Participants: \(conv.participants.map { $0.handle })")
                } else if oldValue != nil {
                    print("[ConversationsView] 📍 Navigation cleared")
                }
            }
            .task {
                // Configure ViewModel with MessagingService from AppState
                viewModel.configure(with: appState.messagingService)
                await viewModel.loadConversations()
            }
            .refreshable {
                await viewModel.loadConversations()
            }
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: SappSpacing.lg) {
            Image(systemName: "bubble.left.and.bubble.right")
                .font(.system(size: 64, weight: .thin))
                .foregroundColor(SappColors.textTertiary)
            
            Text("No messages yet")
                .font(SappTypography.headlineMedium)
                .foregroundColor(SappColors.textPrimary)
            
            Text("Start a conversation with someone")
                .font(SappTypography.bodyMedium)
                .foregroundColor(SappColors.textSecondary)
            
            Button {
                showNewChat = true
            } label: {
                Text("New Message")
            }
            .buttonStyle(SappPrimaryButtonStyle())
            .frame(width: 200)
        }
        .padding(SappSpacing.xl)
    }
    
    private var conversationsList: some View {
        List {
            ForEach(filteredConversations) { conversation in
                ConversationRow(conversation: conversation, currentUserHandle: appState.currentHandle)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        selectedConversation = conversation
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        // Delete/Leave action (full swipe gesture-friendly)
                        if conversation.isGroup {
                            Button(role: .destructive) {
                                Task {
                                    try? await viewModel.deleteConversation(conversation)
                                }
                            } label: {
                                Label("Leave", systemImage: "rectangle.portrait.and.arrow.right")
                            }
                        } else {
                            Button(role: .destructive) {
                                Task {
                                    try? await viewModel.deleteConversation(conversation)
                                }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }

                        // Pin/Unpin action
                        Button {
                            Task {
                                try? await viewModel.togglePin(conversation)
                            }
                        } label: {
                            Label(
                                conversation.isPinned ? "Unpin" : "Pin",
                                systemImage: conversation.isPinned ? "pin.slash" : "pin"
                            )
                        }
                        .tint(SappColors.accent)
                    }
                    .swipeActions(edge: .leading, allowsFullSwipe: false) {
                        // Mark as read/unread action
                        Button {
                            Task {
                                if conversation.unreadCount > 0 {
                                    try? await viewModel.markAsRead(conversation)
                                }
                            }
                        } label: {
                            Label(
                                conversation.unreadCount > 0 ? "Read" : "Unread",
                                systemImage: conversation.unreadCount > 0 ? "envelope.open" : "envelope.badge"
                            )
                        }
                        .tint(SappColors.info)

                        // Mute/Unmute action
                        Button {
                            Task {
                                try? await viewModel.toggleMute(conversation)
                            }
                        } label: {
                            Label(
                                conversation.isMuted ? "Unmute" : "Mute",
                                systemImage: conversation.isMuted ? "bell" : "bell.slash"
                            )
                        }
                        .tint(SappColors.warning)
                    }
                    .contextMenu {
                        contextMenuItems(for: conversation)
                    }
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(SappColors.background)
                    .listRowSeparatorTint(SappColors.border)
                    .alignmentGuide(.listRowSeparatorLeading) { _ in 76 }
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .background(SappColors.background)
    }
    
    @ViewBuilder
    private func contextMenuItems(for conversation: Conversation) -> some View {
        Button {
            Task { try? await viewModel.togglePin(conversation) }
        } label: {
            Label(
                conversation.isPinned ? "Unpin" : "Pin",
                systemImage: conversation.isPinned ? "pin.slash" : "pin"
            )
        }

        Button {
            Task { try? await viewModel.toggleMute(conversation) }
        } label: {
            Label(
                conversation.isMuted ? "Unmute" : "Mute",
                systemImage: conversation.isMuted ? "bell" : "bell.slash"
            )
        }

        Divider()

        if conversation.isGroup {
            Button(role: .destructive) {
                Task { try? await viewModel.deleteConversation(conversation) }
            } label: {
                Label("Leave Group", systemImage: "rectangle.portrait.and.arrow.right")
            }
        } else {
            Button(role: .destructive) {
                Task { try? await viewModel.deleteConversation(conversation) }
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }
}

// MARK: - Conversation Row

struct ConversationRow: View {
    let conversation: Conversation
    var currentUserHandle: String = ""

    var body: some View {
        HStack(spacing: SappSpacing.md) {
            // Avatar with unread indicator
            ZStack(alignment: .topTrailing) {
                if conversation.isGroup {
                    GroupInitialsView(participants: conversation.participants, size: 52)
                } else {
                    Circle()
                        .fill(SappColors.accentLight)
                        .frame(width: 52, height: 52)
                        .overlay(
                            Text(conversation.displayName.prefix(1).uppercased())
                                .font(SappTypography.headlineMedium)
                                .foregroundColor(SappColors.textPrimary)
                        )
                }
            }
            
            // Content
            VStack(alignment: .leading, spacing: SappSpacing.xxs) {
                HStack {
                    Text(conversation.displayName)
                        .font(SappTypography.bodyLarge)
                        .fontWeight(conversation.unreadCount > 0 ? .semibold : .regular)
                        .foregroundColor(conversation.unreadCount > 0 ? SappColors.textPrimary : SappColors.textPrimary)
                        .lineLimit(1)
                    
                    Spacer()
                    
                    if let lastMessage = conversation.lastMessage {
                        Text(formatTime(lastMessage.timestamp))
                            .font(SappTypography.caption)
                            .foregroundColor(conversation.unreadCount > 0 ? SappColors.accent : SappColors.textTertiary)
                            .fontWeight(conversation.unreadCount > 0 ? .semibold : .regular)
                    }
                }
                
                HStack {
                    if let lastMessage = conversation.lastMessage {
                        HStack(spacing: 4) {
                            // Show "You:" prefix and status icon for outgoing messages
                            if !currentUserHandle.isEmpty && lastMessage.senderId.lowercased() == currentUserHandle.lowercased() {
                                Text("You:")
                                    .font(SappTypography.bodySmall)
                                    .foregroundColor(SappColors.textTertiary)

                                Image(systemName: lastMessage.status.icon)
                                    .font(.system(size: 10))
                                    .foregroundColor(lastMessage.status == .read ? SappColors.accent : SappColors.textTertiary)
                            }

                            let previewText = lastMessage.content.previewText
                            Text(previewText.isEmpty ? "Tap to view message" : previewText)
                                .font(SappTypography.bodySmall)
                                .foregroundColor(conversation.unreadCount > 0 ? SappColors.textPrimary : SappColors.textSecondary)
                                .fontWeight(conversation.unreadCount > 0 ? .medium : .regular)
                                .lineLimit(2)
                        }
                    } else {
                        EmptyView()
                    }

                    Spacer()
                    
                    HStack(spacing: SappSpacing.xs) {
                        if conversation.isMuted {
                            Image(systemName: "bell.slash.fill")
                                .font(.system(size: 12))
                                .foregroundColor(SappColors.textTertiary)
                        }
                        
                        if conversation.isPinned {
                            Image(systemName: "pin.fill")
                                .font(.system(size: 12))
                                .foregroundColor(SappColors.textTertiary)
                        }
                        
                        if conversation.unreadCount > 0 {
                            Text(conversation.unreadCount > 99 ? "99+" : "\(conversation.unreadCount)")
                                .font(SappTypography.labelSmall)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                                .padding(.horizontal, conversation.unreadCount > 9 ? 6 : 5)
                                .padding(.vertical, 2)
                                .background(
                                    Capsule()
                                        .fill(SappColors.accent)
                                )
                                .frame(minWidth: 20)
                        }
                    }
                }
            }
        }
        .padding(.horizontal, SappSpacing.lg)
        .padding(.vertical, SappSpacing.md)
        .background(conversation.unreadCount > 0 ? SappColors.background : SappColors.background)
    }
    
    private func formatTime(_ date: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) {
            let formatter = DateFormatter()
            formatter.dateFormat = "HH:mm"
            return formatter.string(from: date)
        } else if calendar.isDateInYesterday(date) {
            return "Yesterday"
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "MMM d"
            return formatter.string(from: date)
        }
    }
}

// MARK: - Conversations ViewModel

@MainActor
final class ConversationsViewModel: ObservableObject {
    @Published var conversations: [Conversation] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private var messagingService: MessagingServicing?
    private var cancellables = Set<AnyCancellable>()
    private var isConfigured = false

    nonisolated init() {}

    /// Configure the ViewModel with the messaging service from AppState
    func configure(with messagingService: MessagingServicing) {
        guard !isConfigured else { return }
        self.messagingService = messagingService
        self.isConfigured = true

        // Subscribe to conversations publisher
        messagingService.conversationsPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] conversations in
                self?.conversations = conversations
            }
            .store(in: &cancellables)
    }

    func loadConversations() async {
        guard messagingService != nil else {
            print("[ConversationsViewModel] MessagingService not configured")
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            try await messagingService?.loadConversations()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func createConversation(with participantHandles: [String], groupName: String? = nil) async throws -> Conversation {
        print("[ConversationsViewModel] Creating conversation with: \(participantHandles), groupName: \(groupName ?? "nil")")

        // If messaging service is available, use it
        if let service = messagingService {
            do {
                let conversation = try await service.createConversation(with: participantHandles, groupName: groupName)
                print("[ConversationsViewModel] Conversation created: \(conversation.id)")
                return conversation
            } catch {
                print("[ConversationsViewModel] Failed to create conversation via service: \(error)")
                throw error
            }
        }

        // Otherwise create a local conversation for now
        print("[ConversationsViewModel] MessagingService not available, creating local conversation")
        let conversationId = UUID().uuidString

        // Create participants with handles only
        var participants: [ChatParticipant] = []
        for handle in participantHandles {
            participants.append(ChatParticipant(
                id: handle,
                email: nil
            ))
        }

        // Determine if this is a group chat based on participant count
        let isGroupChat = participantHandles.count > 1

        let conversation = Conversation(
            id: conversationId,
            participants: participants,
            createdAt: Date(),
            lastMessage: nil,
            unreadCount: 0,
            isPinned: false,
            isMuted: false,
            isGroup: isGroupChat,
            groupName: isGroupChat ? groupName : nil
        )

        // Add to local list
        conversations.insert(conversation, at: 0)
        print("[ConversationsViewModel] Local conversation created: \(conversationId)")

        return conversation
    }

    func togglePin(_ conversation: Conversation) async throws {
        try await messagingService?.pinConversation(conversation.id, pinned: !conversation.isPinned)
    }

    func toggleMute(_ conversation: Conversation) async throws {
        try await messagingService?.muteConversation(conversation.id, muted: !conversation.isMuted)
    }
    
    func markAsRead(_ conversation: Conversation) async throws {
        try await messagingService?.markAsRead(conversation.id)
    }

    func deleteConversation(_ conversation: Conversation) async throws {
        try await messagingService?.deleteConversation(conversation.id)
    }
}
