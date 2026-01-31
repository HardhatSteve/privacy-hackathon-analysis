import SwiftUI
import Combine
import CoreImage.CIFilterBuiltins

struct ChatView: View {
    let conversation: Conversation
    @State private var messageText = ""
    @State private var isShowingAttachments = false
    @State private var isShowingSendCrypto = false
    @State private var isShowingSplitBill = false
    @State private var isShowingAddParticipants = false
    @State private var showSearchSheet = false
    @State private var searchText = ""
    @State private var selectedSearchMessageId: String?
    @State private var showBlockAlert = false
    @State private var showProfile = false
    @State private var showGroupDetails = false
    @State private var pendingPaymentRequest: PaymentRequestData?  // For pre-filled payment from request
    @FocusState private var isInputFocused: Bool
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appState: AppState
    @StateObject private var viewModel: ChatViewModel

    // Search results
    private var searchResults: [ChatMessage] {
        guard !searchText.isEmpty else { return [] }
        return viewModel.messages.filter { message in
            if case .text(let text) = message.content {
                return text.localizedCaseInsensitiveContains(searchText)
            }
            return false
        }
    }

    init(conversation: Conversation) {
        self.conversation = conversation
        // ViewModel will be configured via onAppear with AppState
        _viewModel = StateObject(wrappedValue: ChatViewModel(conversationId: conversation.id))
    }

    var body: some View {
        VStack(spacing: 0) {
            // Messages list
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: SappSpacing.sm) {
                        ForEach(viewModel.messages) { message in
                            MessageBubble(
                                message: message,
                                isOutgoing: message.isOutgoing(for: viewModel.currentUserId),
                                isGroupChat: conversation.isGroup,
                                senderName: message.isOutgoing(for: viewModel.currentUserId) ? nil : message.senderId,
                                currentUserHandle: viewModel.currentUserId,
                                onPaymentAction: { paymentData in
                                    pendingPaymentRequest = paymentData
                                },
                                onCancelPaymentRequest: { paymentData in
                                    Task {
                                        await viewModel.cancelPaymentRequest(paymentData.requestId)
                                    }
                                }
                            )
                            .id(message.id)
                            .background(
                                selectedSearchMessageId == message.id ?
                                    SappColors.accentLight.opacity(0.3) : Color.clear
                            )
                            .cornerRadius(SappRadius.medium)
                        }
                    }
                    .padding(.horizontal, SappSpacing.md)
                    .padding(.vertical, SappSpacing.lg)
                }
                .onChange(of: viewModel.messages.count) { _, _ in
                    if let lastMessage = viewModel.messages.last {
                        withAnimation {
                            proxy.scrollTo(lastMessage.id, anchor: .bottom)
                        }
                    }
                }
                .onChange(of: selectedSearchMessageId) { _, newMessageId in
                    if let messageId = newMessageId {
                        withAnimation {
                            proxy.scrollTo(messageId, anchor: .center)
                        }
                        // Clear highlight after a short delay
                        Task {
                            try? await Task.sleep(nanoseconds: 2_000_000_000)
                            await MainActor.run {
                                selectedSearchMessageId = nil
                            }
                        }
                    }
                }
            }

            // Typing indicator
            if !viewModel.typingParticipants.isEmpty {
                HStack {
                    TypingIndicatorView()
                    Text(typingText)
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textSecondary)
                    Spacer()
                }
                .padding(.horizontal, SappSpacing.lg)
                .padding(.vertical, SappSpacing.xs)
            }

            Divider()

            // Input area with back button
            chatBottomBar
        }
        .background(SappColors.background)
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .principal) {
                VStack(spacing: 0) {
                    Text(conversation.displayName)
                        .font(SappTypography.headlineSmall)
                        .foregroundColor(SappColors.textPrimary)

                    // Show participant count for groups, or handle for 1:1
                    if conversation.isGroup {
                        Text("\(conversation.participants.count) participants")
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textSecondary)
                    } else if let participant = conversation.participants.first {
                        Text(participant.handle)
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textSecondary)
                    }
                }
            }

            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    // Add participants (for group chats or convert to group)
                    Button {
                        isShowingAddParticipants = true
                    } label: {
                        Label("Add People", systemImage: "person.badge.plus")
                    }

                    Divider()

                    // Group Details (for groups) or View Profile (for 1:1)
                    if conversation.isGroup {
                        Button {
                            showGroupDetails = true
                        } label: {
                            Label("Group Info", systemImage: "person.2.circle")
                        }
                    } else {
                        Button {
                            showProfile = true
                        } label: {
                            Label("View Profile", systemImage: "person.circle")
                        }
                    }

                    Button {
                        showSearchSheet = true
                    } label: {
                        Label("Search", systemImage: "magnifyingglass")
                    }

                    Divider()

                    // Block only for 1:1 chats
                    if !conversation.isGroup {
                        Button(role: .destructive) {
                            showBlockAlert = true
                        } label: {
                            Label("Block", systemImage: "hand.raised")
                        }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.system(size: 18))
                        .foregroundColor(SappColors.textPrimary)
                }
            }
        }
        .task {
            print("[ChatView] Task started for conversation: \(conversation.id)")
            print("[ChatView] Participants: \(conversation.participants.map { $0.handle })")

            // Configure ViewModel with MessagingService from AppState
            viewModel.configure(
                with: appState.messagingService,
                currentUserId: appState.currentHandle
            )

            // Initialize activeConversation with the current conversation data
            viewModel.activeConversation = conversation

            print("[ChatView] Loading messages...")
            await viewModel.loadMessages()
            await viewModel.markAsRead()
            print("[ChatView] ✅ Messages loaded")
        }
        .onAppear {
            print("[ChatView] ✅ View appeared for conversation: \(conversation.id)")
        }
        .onDisappear {
            print("[ChatView] View disappeared for conversation: \(conversation.id)")
        }
        .onChange(of: messageText) { _, newValue in
            Task {
                await viewModel.setTyping(!newValue.isEmpty)
            }
        }
        .sheet(isPresented: $showProfile) {
            if let handle = conversation.participants.first?.handle {
                ProfileView(handle: handle)
            }
        }
        .sheet(isPresented: $showGroupDetails) {
            GroupDetailsView(
                conversation: conversation,
                onUpdateGroupName: { newName in
                    Task {
                        // Use MessagingService to update group name - this syncs local state, database, and notifies other users
                        try? await appState.messagingService.updateGroupName(
                            conversation.id,
                            groupName: newName.isEmpty ? nil : newName
                        )
                    }
                },
                onAddParticipants: {
                    showGroupDetails = false
                    isShowingAddParticipants = true
                },
                onLeaveGroup: {
                    Task {
                        try? await appState.messagingService.deleteConversation(conversation.id)
                        dismiss()
                    }
                }
            )
        }
        .alert("Block this user?", isPresented: $showBlockAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Block", role: .destructive) {
                Task {
                    if let handle = conversation.participants.first?.handle {
                        _ = try? await DatabaseManager.shared.createOrUpdateContact(handle: handle)
                        try? await DatabaseManager.shared.updateContactBlocked(handle, isBlocked: true)
                    }
                }
            }
        } message: {
            Text("You won't receive messages from this user.")
        }
        .sheet(isPresented: $showSearchSheet) {
            MessageSearchView(
                messages: viewModel.messages,
                searchText: $searchText,
                onSelectMessage: { messageId in
                    selectedSearchMessageId = messageId
                    showSearchSheet = false
                }
            )
        }
    }

    private var typingText: String {
        let names = viewModel.typingParticipants.map { $0.participantId.prefix(8) }
        if names.count == 1 {
            return "\(names[0]) is typing..."
        }
        return "\(names.joined(separator: ", ")) are typing..."
    }
    
    // MARK: - Chat Bottom Bar with Back Button

    /// Bottom bar with back button (left) and message input (center/right)
    /// Designed for thumb-friendly single-handed use
    private var chatBottomBar: some View {
        HStack(alignment: .bottom, spacing: SappSpacing.sm) {
            // Back button - positioned at bottom left for thumb reach
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundColor(SappColors.textPrimary)
                    .frame(width: 40, height: 40)
                    .background(
                        Circle()
                            .fill(SappColors.accentLight)
                    )
            }
            .buttonStyle(.plain)

            // Attachment button
            Button {
                isShowingAttachments = true
            } label: {
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 28))
                    .foregroundColor(SappColors.textTertiary)
            }

            // Text input
            HStack(alignment: .bottom) {
                TextField("Message", text: $messageText, axis: .vertical)
                    .font(SappTypography.bodyMedium)
                    .lineLimit(1...5)
                    .focused($isInputFocused)
                    .padding(.horizontal, SappSpacing.md)
                    .padding(.vertical, SappSpacing.sm)
            }
            .background(
                RoundedRectangle(cornerRadius: SappRadius.xl)
                    .fill(SappColors.accentLight)
            )

            // Send button
            Button {
                sendMessage()
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 32))
                    .foregroundColor(messageText.isEmpty ? SappColors.textTertiary : SappColors.accent)
            }
            .disabled(messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .padding(.horizontal, SappSpacing.md)
        .padding(.vertical, SappSpacing.sm)
        .background(SappColors.surface)
        .sheet(isPresented: $isShowingAttachments) {
            AttachmentPickerView(
                conversation: conversation,
                onSendCrypto: {
                    isShowingSendCrypto = true
                },
                onSplitBill: {
                    isShowingAttachments = false
                    isShowingSplitBill = true
                },
                onShareAddress: {
                    Task {
                        await viewModel.shareWalletAddress()
                    }
                },
                onSelect: { attachment in
                    // Handle other attachments
                }
            )
        }
        .sheet(isPresented: $isShowingSendCrypto) {
            if let recipientHandle = conversation.participants.first?.handle {
                SendCryptoInChatView(
                    recipientHandle: recipientHandle,
                    conversationId: conversation.id,
                    onSent: { transferDetails in
                        handleCryptoTransferSent(transferDetails)
                    }
                )
            }
        }
        .sheet(isPresented: $isShowingAddParticipants) {
            AddParticipantsView(
                conversation: viewModel.activeConversation ?? conversation,  // Use live data for up-to-date participants
                onAddParticipants: { newParticipantHandles in
                    Task {
                        await viewModel.addParticipants(newParticipantHandles, to: conversation.id)
                    }
                }
            )
        }
        .sheet(isPresented: $isShowingSplitBill) {
            SplitBillView(
                conversation: conversation,
                currentUserHandle: viewModel.currentUserId,
                onSendRequests: { requests in
                    Task {
                        await viewModel.sendPaymentRequests(requests)
                    }
                }
            )
        }
        .sheet(item: $pendingPaymentRequest) { paymentData in
            // Use PaymentFlowCoordinator to decide between direct payment and swap-then-pay
            PaymentFlowCoordinator(
                paymentRequest: paymentData,
                conversation: conversation,
                onComplete: { result in
                    handlePaymentFlowComplete(result, paymentData: paymentData)
                }
            )
        }
    }

    private func sendMessage() {
        let text = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        Task {
            await viewModel.sendMessage(.text(text))
            messageText = ""
        }
    }

    private func handleCryptoTransferSent(_ transferDetails: ShadowWireTransferResponse.TransferDetails) {
        // Send transaction message to the chat
        Task {
            let transactionContent = ChatMessage.MessageContent.transaction(
                signature: transferDetails.signature,
                amount: transferDetails.amount ?? 0.0,  // Use 0 for private transfers
                token: transferDetails.token
            )

            await viewModel.sendMessage(transactionContent)
        }
    }

    private func handlePaymentFlowComplete(_ result: PaymentFlowResult, paymentData: PaymentRequestData) {
        switch result {
        case .directPayment(let transferDetails):
            // Direct payment completed - send transaction message and update status
            handleCryptoTransferSent(transferDetails)
            Task {
                await viewModel.updatePaymentRequestStatus(paymentData.requestId, status: .paid)
            }

        case .swapAndPay(let swapResult):
            // Handle swap and pay result
            switch swapResult {
            case .success(_, let paymentSignature):
                // Payment succeeded - send transaction message and update status
                let transferDetails = ShadowWireTransferResponse.TransferDetails(
                    success: true,
                    signature: paymentSignature,
                    amount: paymentData.amount,
                    token: paymentData.token,
                    type: .internal,
                    fee: 0,
                    timestamp: Date()
                )
                handleCryptoTransferSent(transferDetails)
                Task {
                    await viewModel.updatePaymentRequestStatus(paymentData.requestId, status: .paid)
                }

            case .swapSucceededPaymentFailed(_, _):
                // Swap succeeded but payment failed - user can retry
                // Don't update status, let user retry
                break

            case .failed:
                // Both swap and payment failed - no action needed
                break
            }

        case .cancelled:
            // User cancelled - no action needed
            break
        }
    }
}

// MARK: - Message Bubble

struct MessageBubble: View {
    let message: ChatMessage
    let isOutgoing: Bool
    let isGroupChat: Bool
    let senderName: String?
    let currentUserHandle: String
    var onPaymentAction: ((PaymentRequestData) -> Void)?
    var onCancelPaymentRequest: ((PaymentRequestData) -> Void)?

    // Colors for group chat initials - consistent assignment based on sender name
    private let initialsColors: [Color] = [
        Color(red: 0.3, green: 0.5, blue: 0.7),   // Blue
        Color(red: 0.2, green: 0.6, blue: 0.4),   // Green
        Color(red: 0.85, green: 0.65, blue: 0.2), // Amber
        Color(red: 0.6, green: 0.4, blue: 0.7),   // Purple
        Color(red: 0.8, green: 0.4, blue: 0.5),   // Pink
    ]

    private var initialsColor: Color {
        guard let name = senderName else { return SappColors.accentLight }
        let hash = abs(name.hashValue)
        return initialsColors[hash % initialsColors.count]
    }

    private var isSystemMessage: Bool {
        if case .system = message.content { return true }
        return false
    }

    var body: some View {
        // System messages render differently - centered, full width
        if isSystemMessage {
            systemMessageView
        } else {
            regularMessageView
        }
    }

    private var systemMessageView: some View {
        VStack(spacing: SappSpacing.xxs) {
            messageContent
                .frame(maxWidth: .infinity)
                .padding(.horizontal, SappSpacing.lg)
                .padding(.vertical, SappSpacing.sm)
                .background(
                    RoundedRectangle(cornerRadius: SappRadius.small)
                        .fill(SappColors.accentLight.opacity(0.3))
                )

            Text(formatTime(message.timestamp))
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textTertiary)
        }
        .padding(.horizontal, SappSpacing.lg)
        .padding(.vertical, SappSpacing.xs)
    }

    private var regularMessageView: some View {
        HStack(alignment: .top, spacing: SappSpacing.sm) {
            if isOutgoing { Spacer(minLength: 60) }

            // Initials circle for incoming group messages
            if !isOutgoing && isGroupChat {
                Circle()
                    .fill(initialsColor)
                    .frame(width: 28, height: 28)
                    .overlay(
                        Text((senderName ?? "?").prefix(1).uppercased())
                            .font(SappTypography.labelSmall)
                            .foregroundColor(.white)
                    )
            }

            VStack(alignment: isOutgoing ? .trailing : .leading, spacing: SappSpacing.xxs) {
                // Sender name header for incoming group messages
                if !isOutgoing && isGroupChat, let name = senderName {
                    Text("@\(name)")
                        .font(SappTypography.labelSmall)
                        .foregroundColor(initialsColor)
                        .padding(.leading, SappSpacing.xs)
                }

                // Message content
                messageContent
                    .padding(.horizontal, SappSpacing.md)
                    .padding(.vertical, SappSpacing.sm)
                    .background(
                        RoundedRectangle(cornerRadius: SappRadius.large)
                            .fill(isOutgoing ? SappColors.messageSent : SappColors.messageReceived)
                    )

                // Time and status
                HStack(spacing: SappSpacing.xs) {
                    Text(formatTime(message.timestamp))
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textTertiary)

                    if isOutgoing {
                        Image(systemName: message.status.icon)
                            .font(.system(size: 10))
                            .foregroundColor(message.status == .read ? SappColors.accent : SappColors.textTertiary)
                    }
                }
            }

            if !isOutgoing { Spacer(minLength: 60) }
        }
    }
    
    @ViewBuilder
    private var messageContent: some View {
        switch message.content {
        case .text(let text):
            Text(text)
                .font(SappTypography.bodyMedium)
                .foregroundColor(isOutgoing ? .white : SappColors.textPrimary)
            
        case .image(let url, _, _):
            AsyncImage(url: URL(string: url)) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(maxWidth: 200, maxHeight: 200)
                    .cornerRadius(SappRadius.medium)
            } placeholder: {
                RoundedRectangle(cornerRadius: SappRadius.medium)
                    .fill(SappColors.accentLight)
                    .frame(width: 200, height: 150)
                    .overlay {
                        ProgressView()
                    }
            }
            
        case .transaction(let signature, let amount, let token):
            HStack(spacing: SappSpacing.sm) {
                Image(systemName: "dollarsign.circle.fill")
                    .font(.system(size: 24))
                    .foregroundColor(isOutgoing ? .white : SappColors.accent)

                VStack(alignment: .leading, spacing: 2) {
                    Text("\(String(format: "%.4f", amount)) \(token)")
                        .font(SappTypography.labelLarge)
                        .foregroundColor(isOutgoing ? .white : SappColors.textPrimary)

                    Text(signature.prefix(12) + "...")
                        .font(SappTypography.monoSmall)
                        .foregroundColor(isOutgoing ? .white.opacity(0.7) : SappColors.textSecondary)
                }
            }

        case .paymentRequest(let data):
            PaymentRequestBubbleContent(
                data: data,
                isOutgoing: isOutgoing,
                currentUserHandle: currentUserHandle,
                onPay: onPaymentAction,
                onCancel: onCancelPaymentRequest
            )

        case .system(let text):
            // System messages are centered with subtle styling
            Text(text)
                .font(SappTypography.bodySmall.italic())
                .foregroundColor(SappColors.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, SappSpacing.md)
                .padding(.vertical, SappSpacing.sm)

        case .contact(let name, let address):
            // Wallet address with QR code
            WalletAddressBubbleContent(
                label: name,
                address: address,
                isOutgoing: isOutgoing
            )

        default:
            Text(message.content.previewText)
                .font(SappTypography.bodyMedium)
                .foregroundColor(isOutgoing ? .white : SappColors.textPrimary)
        }
    }
    
    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }
}

// MARK: - Typing Indicator View

struct TypingIndicatorView: View {
    @State private var animationPhase = 0

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(SappColors.textTertiary)
                    .frame(width: 6, height: 6)
                    .offset(y: animationPhase == index ? -4 : 0)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.4).repeatForever()) {
                animationPhase = (animationPhase + 1) % 3
            }
        }
    }
}

// MARK: - Payment Request Bubble Content

/// Content view for payment request messages (used in split bill feature)
/// Handles three distinct view states:
/// - Requester: The person who sent the payment request (can cancel if pending)
/// - Payee: The specific person who should pay (can pay if pending)
/// - Observer: Other group members who are neither requester nor payee (greyed out view)
struct PaymentRequestBubbleContent: View {
    let data: PaymentRequestData
    let isOutgoing: Bool
    let currentUserHandle: String
    var onPay: ((PaymentRequestData) -> Void)?
    var onCancel: ((PaymentRequestData) -> Void)?

    // MARK: - View State Detection

    /// Current user is the requester (they sent this payment request)
    private var isRequester: Bool {
        isOutgoing
    }

    /// Current user is the specific payee for this request
    private var isPayee: Bool {
        !isOutgoing && data.payeeHandle.lowercased() == currentUserHandle.lowercased()
    }

    /// Current user is an observer (not requester, not payee - e.g., other group member)
    private var isObserver: Bool {
        !isRequester && !isPayee
    }

    /// Whether the request can be acted upon (paid or cancelled)
    private var isActionable: Bool {
        data.status.isActionable
    }

    // MARK: - Styling

    private var statusIcon: String {
        data.status.icon
    }

    private var statusText: String {
        data.status.displayText
    }

    private var statusColor: Color {
        switch data.status {
        case .pending: return SappColors.warning
        case .paid: return SappColors.success
        case .declined: return SappColors.error
        case .expired: return SappColors.textTertiary
        case .cancelled: return SappColors.textTertiary
        }
    }

    /// Overall opacity for observer view (greyed out)
    private var contentOpacity: Double {
        isObserver ? 0.6 : 1.0
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            headerView

            // Amount
            amountView

            // Memo (if present)
            if let memo = data.memo, !memo.isEmpty {
                memoView(memo)
            }

            // Target indicator for observers (who this request is for)
            if isObserver {
                targetIndicatorView
            }

            // Action area (Pay button, Cancel button, or Status)
            actionAreaView
        }
        .frame(maxWidth: 260)
        .opacity(contentOpacity)
    }

    // MARK: - Subviews

    private var headerView: some View {
        HStack(spacing: 8) {
            Image(systemName: "dollarsign.circle.fill")
                .font(.system(size: 20))
                .foregroundColor(isObserver ? SappColors.textTertiary : SappColors.accent)

            Text("Payment Request")
                .font(SappTypography.labelMedium)
                .foregroundColor(isOutgoing ? .white.opacity(0.8) : SappColors.textSecondary)
        }
    }

    private var amountView: some View {
        Text("\(String(format: "%.2f", data.amount)) \(data.token)")
            .font(.system(size: 24, weight: .bold, design: .rounded))
            .foregroundColor(isOutgoing ? .white : SappColors.textPrimary)
    }

    private func memoView(_ memo: String) -> some View {
        Text(memo)
            .font(SappTypography.bodySmall)
            .foregroundColor(isOutgoing ? .white.opacity(0.7) : SappColors.textSecondary)
            .italic()
    }

    /// Shows who this payment request is for (displayed to observers only)
    private var targetIndicatorView: some View {
        HStack(spacing: 4) {
            Image(systemName: "person.fill")
                .font(.system(size: 10))
            Text("For @\(data.payeeHandle)")
                .font(SappTypography.caption)
        }
        .foregroundColor(SappColors.textTertiary)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            RoundedRectangle(cornerRadius: SappRadius.small)
                .fill(SappColors.accentLight.opacity(0.3))
        )
    }

    @ViewBuilder
    private var actionAreaView: some View {
        if isPayee && isActionable {
            // Payee can pay this request
            payButton
        } else if isRequester && isActionable {
            // Requester can cancel this pending request
            requesterActionView
        } else if isObserver {
            // Observer sees a disabled/greyed view
            observerStatusView
        } else {
            // Final status for non-actionable states
            statusView
        }
    }

    private var payButton: some View {
        Button {
            onPay?(data)
        } label: {
            HStack {
                Image(systemName: "arrow.up.circle.fill")
                Text("Pay @\(data.requesterId)")
            }
            .font(SappTypography.labelMedium)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(SappColors.accent)
            .cornerRadius(SappRadius.medium)
        }
    }

    private var requesterActionView: some View {
        VStack(spacing: 8) {
            // Status indicator
            statusView

            // Cancel button
            Button {
                onCancel?(data)
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "xmark.circle")
                    Text("Cancel Request")
                }
                .font(SappTypography.caption)
                .foregroundColor(SappColors.error)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    RoundedRectangle(cornerRadius: SappRadius.small)
                        .stroke(SappColors.error.opacity(0.5), lineWidth: 1)
                )
            }
        }
    }

    private var observerStatusView: some View {
        HStack(spacing: 6) {
            Image(systemName: statusIcon)
            Text(statusText)
        }
        .font(SappTypography.caption)
        .foregroundColor(SappColors.textTertiary)
    }

    private var statusView: some View {
        HStack(spacing: 6) {
            Image(systemName: statusIcon)
            Text(statusText)
        }
        .font(SappTypography.caption)
        .foregroundColor(statusColor)
    }
}

// MARK: - Wallet Address Bubble Content

/// Displays a wallet address with a QR code and copy functionality
struct WalletAddressBubbleContent: View {
    let label: String
    let address: String
    let isOutgoing: Bool

    @State private var copied = false

    var body: some View {
        VStack(spacing: SappSpacing.sm) {
            // Label
            Text(label)
                .font(SappTypography.labelMedium)
                .foregroundColor(isOutgoing ? .white.opacity(0.8) : SappColors.textSecondary)

            // QR Code
            if let qrImage = generateQRCode(from: address) {
                Image(uiImage: qrImage)
                    .interpolation(.none)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 120, height: 120)
                    .background(Color.white)
                    .cornerRadius(SappRadius.small)
            }

            // Address with copy button
            HStack(spacing: SappSpacing.xs) {
                Text(shortAddress(address))
                    .font(SappTypography.monoSmall)
                    .foregroundColor(isOutgoing ? .white : SappColors.textPrimary)
                    .lineLimit(1)

                Button {
                    UIPasteboard.general.string = address
                    copied = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        copied = false
                    }
                } label: {
                    Image(systemName: copied ? "checkmark.circle.fill" : "doc.on.doc")
                        .font(.system(size: 14))
                        .foregroundColor(isOutgoing ? .white.opacity(0.8) : SappColors.accent)
                }
            }
            .padding(.horizontal, SappSpacing.sm)
            .padding(.vertical, SappSpacing.xs)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.small)
                    .fill(isOutgoing ? Color.white.opacity(0.1) : SappColors.surface)
            )

            if copied {
                Text("Copied!")
                    .font(SappTypography.caption)
                    .foregroundColor(isOutgoing ? .white.opacity(0.7) : SappColors.success)
            }
        }
        .padding(SappSpacing.sm)
    }

    private func shortAddress(_ addr: String) -> String {
        guard addr.count > 12 else { return addr }
        return "\(addr.prefix(6))...\(addr.suffix(4))"
    }

    private func generateQRCode(from string: String) -> UIImage? {
        guard let data = string.data(using: .ascii),
              let filter = CIFilter(name: "CIQRCodeGenerator") else {
            return nil
        }

        filter.setValue(data, forKey: "inputMessage")
        filter.setValue("M", forKey: "inputCorrectionLevel")

        guard let outputImage = filter.outputImage else {
            return nil
        }

        // Scale the image to a reasonable size
        let scale = 10.0
        let transformedImage = outputImage.transformed(by: CGAffineTransform(scaleX: scale, y: scale))

        let context = CIContext()
        guard let cgImage = context.createCGImage(transformedImage, from: transformedImage.extent) else {
            return nil
        }

        return UIImage(cgImage: cgImage)
    }
}

// MARK: - Chat ViewModel

@MainActor
final class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var typingParticipants: [TypingIndicator] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var activeConversation: Conversation?  // Tracks live conversation updates (e.g., participant changes)

    let conversationId: String
    private(set) var currentUserId: String = ""

    private var messagingService: MessagingServicing?
    private var cancellables = Set<AnyCancellable>()

    nonisolated init(conversationId: String) {
        self.conversationId = conversationId
    }

    /// Configure the ViewModel with the messaging service from AppState
    func configure(with messagingService: MessagingServicing, currentUserId: String) {
        self.messagingService = messagingService
        self.currentUserId = currentUserId

        // Subscribe to messages publisher
        messagingService.messagesPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] messages in
                guard let self = self else { return }
                // Filter messages for this conversation
                self.messages = messages.filter { $0.conversationId == self.conversationId }
            }
            .store(in: &cancellables)

        // Subscribe to typing indicators
        messagingService.typingPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] indicators in
                guard let self = self else { return }
                // Filter typing indicators for this conversation
                self.typingParticipants = indicators.filter { $0.conversationId == self.conversationId }
            }
            .store(in: &cancellables)

        // Subscribe to active conversation updates (for participant changes)
        messagingService.activeConversationPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] conversation in
                guard let self = self else { return }
                // Only update if it's for this conversation
                if conversation?.id == self.conversationId {
                    self.activeConversation = conversation
                }
            }
            .store(in: &cancellables)
    }

    func loadMessages() async {
        guard messagingService != nil else {
            print("[ChatViewModel] MessagingService not configured")
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            let loadedMessages = try await messagingService?.loadMessages(for: conversationId, limit: 50, before: nil) ?? []
            messages = loadedMessages
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func sendMessage(_ content: ChatMessage.MessageContent) async {
        guard messagingService != nil else {
            errorMessage = "Messaging service not available"
            return
        }

        do {
            _ = try await messagingService?.sendMessage(content, to: conversationId, replyTo: nil)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func markAsRead() async {
        try? await messagingService?.markAsRead(conversationId)
    }

    func setTyping(_ isTyping: Bool) async {
        await messagingService?.setTyping(isTyping, in: conversationId)
    }
    
    func addParticipants(_ handles: [String], to conversationId: String) async {
        guard let service = messagingService else {
            errorMessage = "Messaging service not available"
            return
        }

        do {
            try await service.addParticipants(handles, to: conversationId)
        } catch {
            errorMessage = "Failed to add participants: \(error.localizedDescription)"
        }
    }

    /// Send payment requests to multiple participants (split bill feature)
    func sendPaymentRequests(_ requests: [PaymentRequestData]) async {
        guard let service = messagingService else {
            errorMessage = "Messaging service not available"
            return
        }

        do {
            try await service.sendPaymentRequests(requests, in: conversationId)
        } catch {
            errorMessage = "Failed to send payment requests: \(error.localizedDescription)"
        }
    }

    /// Update the status of a payment request (e.g., when paid)
    func updatePaymentRequestStatus(_ requestId: String, status: PaymentRequestData.PaymentRequestStatus) async {
        guard let service = messagingService else {
            errorMessage = "Messaging service not available"
            return
        }

        do {
            try await service.updatePaymentRequestStatus(requestId, status: status)
        } catch {
            errorMessage = "Failed to update payment status: \(error.localizedDescription)"
        }
    }

    /// Cancel a payment request (only the requester can cancel their own pending requests)
    func cancelPaymentRequest(_ requestId: String) async {
        guard let service = messagingService else {
            errorMessage = "Messaging service not available"
            return
        }

        do {
            try await service.cancelPaymentRequest(requestId)
        } catch {
            errorMessage = "Failed to cancel payment request: \(error.localizedDescription)"
        }
    }

    /// Share the user's wallet address as a contact message with QR code data
    func shareWalletAddress() async {
        guard let walletAddress = PrivyAuthService.shared.solanaWalletAddress else {
            errorMessage = "No wallet connected"
            return
        }

        // Send as a contact message with the wallet address
        // The name field indicates it's a wallet address, the address field contains the Solana address
        // The UI can render this as a QR code + copyable address
        let content = ChatMessage.MessageContent.contact(name: "My Solana Address", address: walletAddress)
        await sendMessage(content)
    }
}

// MARK: - Attachment Picker

struct AttachmentPickerView: View {
    let conversation: Conversation
    let onSendCrypto: () -> Void
    let onSplitBill: () -> Void
    let onShareAddress: () -> Void
    let onSelect: (MessageDraft.DraftAttachment) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            // Drag indicator
            Capsule()
                .fill(SappColors.border)
                .frame(width: 36, height: 4)
                .padding(.top, 8)

            // Header - compact
            HStack {
                Text("Actions")
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.textPrimary)

                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 12)

            // Action list
            VStack(spacing: 0) {
                actionButton(
                    icon: "dollarsign.circle.fill",
                    title: "Send",
                    action: {
                        dismiss()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            onSendCrypto()
                        }
                    }
                )

                Divider().padding(.leading, 52)

                actionButton(
                    icon: "divide.circle.fill",
                    title: "Split Bill",
                    action: {
                        dismiss()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            onSplitBill()
                        }
                    }
                )

                Divider().padding(.leading, 52)

                actionButton(
                    icon: "qrcode",
                    title: "Share Address",
                    action: {
                        dismiss()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            onShareAddress()
                        }
                    }
                )

                Divider().padding(.leading, 52)

                actionButton(
                    icon: "photo.on.rectangle",
                    title: "Photo Library",
                    action: { dismiss() }
                )

                Divider().padding(.leading, 52)

                actionButton(
                    icon: "camera",
                    title: "Camera",
                    action: { dismiss() }
                )
            }
            .background(SappColors.surface)
            .cornerRadius(SappRadius.large)
            .padding(.horizontal, 20)

            Spacer()

            // Bottom action bar
            HStack(spacing: 12) {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(SappColors.textSecondary)
                        .frame(width: 48, height: 48)
                        .background(Circle().fill(SappColors.surface))
                }

                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 8)
        }
        .background(SappColors.background)
        .presentationDetents([.fraction(0.50)])
        .presentationDragIndicator(.hidden)
    }

    private func actionButton(icon: String, title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: SappSpacing.md) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(SappColors.accent)
                    .frame(width: 36, height: 36)

                Text(title)
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textPrimary)

                Spacer()
            }
            .padding(.horizontal, SappSpacing.lg)
            .padding(.vertical, SappSpacing.md)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
// MARK: - Add Participants View

struct AddParticipantsView: View {
    let conversation: Conversation
    let onAddParticipants: ([String]) -> Void
    
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AddParticipantsViewModel()
    @FocusState private var isInputFocused: Bool
    
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
                    Text("Add People")
                        .font(SappTypography.headlineSmall)
                        .foregroundColor(SappColors.textPrimary)
                    
                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 8)
                
                // Selected participants chips
                if !viewModel.selectedParticipants.isEmpty {
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
                
                // Handle input
                handleInputSection
                
                // Search results
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        if !viewModel.searchResults.isEmpty {
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
                        } else if !viewModel.handleInput.isEmpty && !viewModel.isSearching {
                            // No results
                            VStack(spacing: 12) {
                                Image(systemName: "at")
                                    .font(.system(size: 32, weight: .thin))
                                    .foregroundColor(SappColors.textTertiary)
                                
                                Text("No users found")
                                    .font(SappTypography.bodySmall)
                                    .foregroundColor(SappColors.textSecondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 40)
                        }
                    }
                    .padding(.top, 12)
                }
                
                // Bottom action bar
                bottomActionBar
            }
        }
        .presentationDetents([.fraction(0.75), .large])
        .presentationDragIndicator(.hidden)
        .onAppear {
            isInputFocused = true
            // Filter out existing participants
            viewModel.excludedHandles = conversation.participants.map { $0.handle }
        }
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
    
    private var bottomActionBar: some View {
        HStack(spacing: 12) {
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(SappColors.textSecondary)
                    .frame(width: 48, height: 48)
                    .background(Circle().fill(SappColors.surface))
            }
            
            Button {
                addParticipants()
            } label: {
                HStack(spacing: 8) {
                    if viewModel.isValidating {
                        ProgressView()
                            .tint(.white)
                            .scaleEffect(0.9)
                    }
                    Text("Add (\(viewModel.selectedParticipants.count))")
                        .font(SappTypography.labelMedium)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(
                    RoundedRectangle(cornerRadius: 24)
                        .fill(viewModel.selectedParticipants.isEmpty ? SappColors.accent.opacity(0.4) : SappColors.accent)
                )
            }
            .disabled(viewModel.selectedParticipants.isEmpty || viewModel.isValidating)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }
    
    private func toggleParticipant(_ handle: String) {
        withAnimation(.easeOut(duration: 0.2)) {
            if viewModel.selectedParticipants.contains(handle) {
                viewModel.removeParticipant(handle)
            } else {
                viewModel.addParticipant(handle)
            }
        }
        viewModel.handleInput = ""
        viewModel.searchResults = []
    }
    
    private func addParticipants() {
        guard !viewModel.selectedParticipants.isEmpty else { return }
        onAddParticipants(viewModel.selectedParticipants)
        dismiss()
    }
}

// MARK: - Add Participants ViewModel

@MainActor
final class AddParticipantsViewModel: ObservableObject {
    @Published var handleInput: String = ""
    @Published var searchResults: [SappUserInfo] = []
    @Published var selectedParticipants: [String] = []
    @Published var excludedHandles: [String] = []  // Existing participants to filter out
    @Published var isSearching: Bool = false
    @Published var isValidating: Bool = false
    
    private let apiService = SappAPIService.shared
    private var searchTask: Task<Void, Never>?
    
    func searchUsers(query: String) {
        searchTask?.cancel()
        
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        
        if trimmed.count < 2 {
            searchResults = []
            return
        }
        
        isSearching = true
        
        searchTask = Task {
            try? await Task.sleep(nanoseconds: 300_000_000)
            
            guard !Task.isCancelled else { return }
            
            do {
                let results = try await apiService.searchUsers(query: trimmed)
                guard !Task.isCancelled else { return }
                // Filter out already selected participants and excluded handles (case-insensitive)
                let excludedLowercased = excludedHandles.map { $0.lowercased() }
                searchResults = results.filter { user in
                    let handleLower = user.handle.lowercased()
                    return !selectedParticipants.contains(handleLower) && !excludedLowercased.contains(handleLower)
                }
            } catch {
                guard !Task.isCancelled else { return }
                searchResults = []
            }
            
            isSearching = false
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

// MARK: - Message Search View (Thumb-Friendly)

struct MessageSearchView: View {
    let messages: [ChatMessage]
    @Binding var searchText: String
    let onSelectMessage: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @FocusState private var isSearchFocused: Bool

    private var searchResults: [ChatMessage] {
        guard !searchText.isEmpty else { return [] }
        return messages.filter { message in
            if case .text(let text) = message.content {
                return text.localizedCaseInsensitiveContains(searchText)
            }
            return false
        }
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
                    Text("Search Messages")
                        .font(SappTypography.headlineSmall)
                        .foregroundColor(SappColors.textPrimary)

                    Spacer()

                    if !searchText.isEmpty {
                        Text("\(searchResults.count) found")
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textSecondary)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 8)

                // Search input
                HStack(spacing: SappSpacing.sm) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(SappColors.textTertiary)

                    TextField("Type to search...", text: $searchText)
                        .font(SappTypography.bodyMedium)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .focused($isSearchFocused)

                    if !searchText.isEmpty {
                        Button {
                            searchText = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(SappColors.textTertiary)
                        }
                    }
                }
                .padding(.horizontal, SappSpacing.md)
                .padding(.vertical, SappSpacing.sm)
                .background(SappColors.surface)
                .cornerRadius(SappRadius.large)
                .padding(.horizontal, 20)

                // Results
                ScrollView {
                    if searchText.isEmpty {
                        VStack(spacing: SappSpacing.md) {
                            Image(systemName: "magnifyingglass")
                                .font(.system(size: 48, weight: .thin))
                                .foregroundColor(SappColors.textTertiary)

                            Text("Enter text to search")
                                .font(SappTypography.bodyMedium)
                                .foregroundColor(SappColors.textSecondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                    } else if searchResults.isEmpty {
                        VStack(spacing: SappSpacing.md) {
                            Image(systemName: "doc.text.magnifyingglass")
                                .font(.system(size: 48, weight: .thin))
                                .foregroundColor(SappColors.textTertiary)

                            Text("No messages found")
                                .font(SappTypography.bodyMedium)
                                .foregroundColor(SappColors.textSecondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                    } else {
                        LazyVStack(spacing: 0) {
                            ForEach(searchResults) { message in
                                SearchResultRow(message: message, searchText: searchText)
                                    .contentShape(Rectangle())
                                    .onTapGesture {
                                        onSelectMessage(message.id)
                                    }

                                Divider()
                                    .padding(.leading, 20)
                            }
                        }
                        .padding(.top, SappSpacing.md)
                    }
                }

                // Bottom action bar (thumb-friendly)
                HStack(spacing: 12) {
                    // Close button
                    Button {
                        searchText = ""
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(SappColors.textSecondary)
                            .frame(width: 48, height: 48)
                            .background(Circle().fill(SappColors.surface))
                    }

                    // Clear search button
                    if !searchText.isEmpty {
                        Button {
                            searchText = ""
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "arrow.counterclockwise")
                                Text("Clear")
                                    .font(SappTypography.labelMedium)
                            }
                            .foregroundColor(SappColors.textSecondary)
                            .frame(height: 48)
                            .padding(.horizontal, 20)
                            .background(
                                RoundedRectangle(cornerRadius: 24)
                                    .fill(SappColors.surface)
                            )
                        }
                    }

                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(SappColors.background)
            }
        }
        .presentationDetents([.fraction(0.75), .large])
        .presentationDragIndicator(.hidden)
        .onAppear {
            isSearchFocused = true
        }
    }
}

// MARK: - Search Result Row

struct SearchResultRow: View {
    let message: ChatMessage
    let searchText: String

    var body: some View {
        VStack(alignment: .leading, spacing: SappSpacing.xs) {
            HStack {
                Text("@\(message.senderId)")
                    .font(SappTypography.labelSmall)
                    .foregroundColor(SappColors.textSecondary)

                Spacer()

                Text(formatDate(message.timestamp))
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textTertiary)
            }

            if case .text(let text) = message.content {
                highlightedText(text, highlight: searchText)
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textPrimary)
                    .lineLimit(2)
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, SappSpacing.md)
    }

    private func formatDate(_ date: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) {
            let formatter = DateFormatter()
            formatter.dateFormat = "HH:mm"
            return formatter.string(from: date)
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "MMM d, HH:mm"
            return formatter.string(from: date)
        }
    }

    @ViewBuilder
    private func highlightedText(_ text: String, highlight: String) -> some View {
        if let range = text.range(of: highlight, options: .caseInsensitive) {
            let before = String(text[..<range.lowerBound])
            let match = String(text[range])
            let after = String(text[range.upperBound...])

            Text(before) +
            Text(match).foregroundColor(SappColors.accent).bold() +
            Text(after)
        } else {
            Text(text)
        }
    }
}

