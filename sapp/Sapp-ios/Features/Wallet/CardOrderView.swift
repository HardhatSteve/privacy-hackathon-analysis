import SwiftUI
import Combine

// MARK: - Card Order View

struct CardOrderView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = CardOrderViewModel()

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
            content

            Spacer(minLength: 8)

            // Bottom action bar
            bottomActionBar
        }
        .background(SappColors.background)
        .presentationDetents([.large])
        .presentationDragIndicator(.hidden)
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage ?? "An error occurred")
        }
        .task {
            await viewModel.loadWallet()
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text(headerTitle)
                .font(SappTypography.headlineSmall)
                .foregroundColor(SappColors.textPrimary)

            Spacer()

            // Wallet balance pill
            if viewModel.currentStep == .input || viewModel.currentStep == .payment {
                HStack(spacing: 4) {
                    Image(systemName: "wallet.pass.fill")
                        .font(.system(size: 12))
                    Text(String(format: "%.2f SOL", viewModel.walletBalance))
                        .font(SappTypography.monoSmall)
                }
                .foregroundColor(SappColors.textSecondary)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Capsule().fill(SappColors.surface))
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 12)
    }

    private var headerTitle: String {
        switch viewModel.currentStep {
        case .input: return "Get Virtual Card"
        case .payment: return "Confirm Payment"
        case .processing: return "Processing"
        case .completed: return "Card Ready"
        case .failed: return "Order Failed"
        }
    }

    // MARK: - Content

    @ViewBuilder
    private var content: some View {
        switch viewModel.currentStep {
        case .input:
            inputContent
        case .payment:
            paymentContent
        case .processing:
            processingContent
        case .completed:
            completedContent
        case .failed:
            failedContent
        }
    }

    // MARK: - Input Content

    private var inputContent: some View {
        VStack(spacing: 16) {
            Spacer()

            // Amount input
            VStack(spacing: 8) {
                Text("Card Value")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textTertiary)

                HStack(alignment: .center, spacing: 4) {
                    Text("$")
                        .font(.system(size: 32, weight: .medium))
                        .foregroundColor(SappColors.textSecondary)

                    TextField("50", text: $viewModel.amount)
                        .font(.system(size: 48, weight: .semibold, design: .rounded))
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: 160)
                        .onChange(of: viewModel.amount) { _, _ in
                            viewModel.updatePricing()
                        }
                }
                .foregroundColor(SappColors.textPrimary)

                // SOL equivalent
                if let solAmount = viewModel.solAmount {
                    Text("\(String(format: "%.4f", solAmount)) SOL")
                        .font(SappTypography.mono)
                        .foregroundColor(SappColors.accent)
                }
            }

            // Card type selector
            HStack(spacing: 12) {
                ForEach(CardType.allCases, id: \.self) { type in
                    CardTypeChip(
                        type: type,
                        isSelected: viewModel.cardType == type
                    ) {
                        viewModel.cardType = type
                    }
                }
            }

            // Email input
            VStack(alignment: .leading, spacing: 6) {
                TextField("Email for card details", text: $viewModel.email)
                    .font(SappTypography.bodyMedium)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .padding(14)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(SappColors.surface)
                    )
            }
            .padding(.horizontal, 20)

            // Fee info
            if let pricing = viewModel.pricing {
                HStack {
                    Text("Total incl. fees")
                        .foregroundColor(SappColors.textTertiary)
                    Spacer()
                    Text(pricing.formattedTotal)
                        .foregroundColor(SappColors.textPrimary)
                }
                .font(SappTypography.caption)
                .padding(.horizontal, 20)
            }

            Spacer()
        }
    }

    // MARK: - Payment Content

    private var paymentContent: some View {
        VStack(spacing: 20) {
            Spacer()

            // Timer
            if let expiresAt = viewModel.orderResponse?.expirationDate {
                CompactTimerView(expiresAt: expiresAt) {
                    viewModel.handleExpiration()
                }
            }

            // Payment amount
            if let payment = viewModel.orderResponse?.payment {
                VStack(spacing: 8) {
                    Text("You'll pay")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textTertiary)

                    Text(payment.formattedSolAmount)
                        .font(.system(size: 40, weight: .semibold, design: .rounded))
                        .foregroundColor(SappColors.textPrimary)

                    if let pricing = viewModel.orderResponse?.pricing {
                        Text("for \(pricing.formattedCardValue) \(viewModel.cardType.displayName) card")
                            .font(SappTypography.bodySmall)
                            .foregroundColor(SappColors.textSecondary)
                    }
                }
            }

            // Balance status
            BalanceStatusPill(
                balance: viewModel.walletBalance,
                required: viewModel.orderResponse?.payment.amountSol ?? 0,
                hasSufficient: viewModel.hasSufficientBalance
            )

            Spacer()

            // Manual payment toggle
            DisclosureGroup {
                if let payment = viewModel.orderResponse?.payment {
                    VStack(spacing: 12) {
                        Button {
                            UIPasteboard.general.string = payment.address
                            viewModel.showCopiedFeedback()
                        } label: {
                            HStack {
                                Text(payment.address)
                                    .font(SappTypography.monoSmall)
                                    .lineLimit(1)
                                    .truncationMode(.middle)
                                Image(systemName: viewModel.showCopied ? "checkmark" : "doc.on.doc")
                                    .font(.system(size: 12))
                            }
                            .foregroundColor(SappColors.textSecondary)
                            .padding(10)
                            .frame(maxWidth: .infinity)
                            .background(RoundedRectangle(cornerRadius: 8).fill(SappColors.surface))
                        }
                        .buttonStyle(.plain)

                        QRCodeView(value: payment.address)
                            .frame(width: 100, height: 100)
                            .background(RoundedRectangle(cornerRadius: 8).fill(Color.white))
                    }
                    .padding(.top, 12)
                }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "qrcode")
                    Text("Manual payment")
                }
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textTertiary)
            }
            .tint(SappColors.textTertiary)
            .padding(.horizontal, 20)
        }
    }

    // MARK: - Processing Content

    private var processingContent: some View {
        VStack(spacing: 24) {
            Spacer()

            // Progress indicator
            ZStack {
                Circle()
                    .stroke(SappColors.accentLight, lineWidth: 3)
                    .frame(width: 64, height: 64)

                ProgressView()
                    .scaleEffect(1.2)
                    .tint(SappColors.accent)
            }

            VStack(spacing: 8) {
                Text("Issuing your card")
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.textPrimary)

                Text("This usually takes less than a minute")
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
            }

            // Transaction signature
            if let signature = viewModel.paymentSignature {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(SappColors.success)
                    Text("Tx: \(String(signature.prefix(6)))...\(String(signature.suffix(4)))")
                        .font(SappTypography.monoSmall)
                        .foregroundColor(SappColors.textTertiary)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Capsule().fill(SappColors.success.opacity(0.1)))
            }

            Spacer()
        }
        .onAppear {
            viewModel.startPolling()
        }
    }

    // MARK: - Completed Content

    private var completedContent: some View {
        VStack(spacing: 16) {
            Spacer()

            if let card = viewModel.cardDetails {
                // Compact card display
                CompactCardView(card: card, cardType: viewModel.cardType)

                // Copy button
                Button {
                    let details = "\(card.cardNumber)\n\(card.formattedExpiry)\n\(card.cvv)"
                    UIPasteboard.general.string = details
                    viewModel.showCopiedFeedback()
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: viewModel.showCopied ? "checkmark" : "doc.on.doc")
                        Text(viewModel.showCopied ? "Copied!" : "Copy details")
                    }
                    .font(SappTypography.labelSmall)
                    .foregroundColor(SappColors.textSecondary)
                }

                // Email note
                Text("Details sent to \(viewModel.email)")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textTertiary)
            }

            Spacer()
        }
        .padding(.horizontal, 20)
    }

    // MARK: - Failed Content

    private var failedContent: some View {
        VStack(spacing: 16) {
            Spacer()

            Image(systemName: "xmark.circle.fill")
                .font(.system(size: 48))
                .foregroundColor(SappColors.error)

            VStack(spacing: 8) {
                Text("Something went wrong")
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.textPrimary)

                Text(viewModel.failureReason ?? "Please try again or contact support.")
                    .font(SappTypography.bodySmall)
                    .foregroundColor(SappColors.textSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 20)

            Spacer()
        }
    }

    // MARK: - Bottom Action Bar

    private var bottomActionBar: some View {
        HStack(spacing: 12) {
            // Cancel/Back button (small round)
            Button {
                handleSecondaryAction()
            } label: {
                Image(systemName: secondaryButtonIcon)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(SappColors.textSecondary)
                    .frame(width: 48, height: 48)
                    .background(Circle().fill(SappColors.surface))
            }

            // Primary action button
            Button {
                Task { await handlePrimaryAction() }
            } label: {
                HStack(spacing: 8) {
                    if viewModel.isLoading || viewModel.isSendingPayment {
                        ProgressView()
                            .tint(.white)
                            .scaleEffect(0.9)
                    }
                    Text(primaryButtonTitle)
                        .font(SappTypography.labelMedium)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(
                    RoundedRectangle(cornerRadius: 24)
                        .fill(primaryButtonEnabled ? SappColors.accent : SappColors.accent.opacity(0.4))
                )
            }
            .disabled(!primaryButtonEnabled)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    private var secondaryButtonIcon: String {
        switch viewModel.currentStep {
        case .input, .failed: return "xmark"
        case .payment: return "chevron.left"
        case .processing: return "clock"
        case .completed: return "xmark"
        }
    }

    private var primaryButtonTitle: String {
        switch viewModel.currentStep {
        case .input:
            return viewModel.isLoading ? "Creating..." : "Continue"
        case .payment:
            return viewModel.isSendingPayment ? "Sending..." : "Pay Now"
        case .processing:
            return "Processing..."
        case .completed:
            return "Add to Wallet"
        case .failed:
            return "Try Again"
        }
    }

    private var primaryButtonEnabled: Bool {
        switch viewModel.currentStep {
        case .input:
            return viewModel.isValidInput && !viewModel.isLoading
        case .payment:
            return viewModel.hasSufficientBalance && !viewModel.isSendingPayment
        case .processing:
            return false
        case .completed, .failed:
            return true
        }
    }

    private func handleSecondaryAction() {
        switch viewModel.currentStep {
        case .input, .completed:
            dismiss()
        case .payment:
            viewModel.currentStep = .input
        case .processing:
            break // No action during processing
        case .failed:
            dismiss()
        }
    }

    private func handlePrimaryAction() async {
        switch viewModel.currentStep {
        case .input:
            await viewModel.createOrder()
        case .payment:
            await viewModel.sendPayment()
        case .processing:
            break
        case .completed:
            // Add to wallet action (placeholder)
            break
        case .failed:
            viewModel.reset()
        }
    }
}

// MARK: - Supporting Components

struct CardTypeChip: View {
    let type: CardType
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: type.iconName)
                    .font(.system(size: 14))
                Text(type.displayName)
                    .font(SappTypography.labelSmall)
            }
            .foregroundColor(isSelected ? SappColors.accent : SappColors.textSecondary)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(
                Capsule()
                    .fill(isSelected ? SappColors.accentLight : SappColors.surface)
                    .overlay(
                        Capsule()
                            .stroke(isSelected ? SappColors.accent : Color.clear, lineWidth: 1.5)
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

struct CompactTimerView: View {
    let expiresAt: Date
    let onExpire: () -> Void

    @State private var timeRemaining: TimeInterval = 0
    @State private var timer: Timer?

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "clock")
                .font(.system(size: 12))
            Text(formattedTime)
                .font(SappTypography.monoSmall)
        }
        .foregroundColor(timeRemaining < 300 ? SappColors.error : SappColors.textTertiary)
        .onAppear {
            updateTimeRemaining()
            timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
                updateTimeRemaining()
            }
        }
        .onDisappear {
            timer?.invalidate()
        }
    }

    private var formattedTime: String {
        let minutes = Int(timeRemaining) / 60
        let seconds = Int(timeRemaining) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    private func updateTimeRemaining() {
        timeRemaining = max(0, expiresAt.timeIntervalSinceNow)
        if timeRemaining <= 0 {
            timer?.invalidate()
            onExpire()
        }
    }
}

struct BalanceStatusPill: View {
    let balance: Double
    let required: Double
    let hasSufficient: Bool

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: hasSufficient ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                .foregroundColor(hasSufficient ? SappColors.success : SappColors.error)

            VStack(alignment: .leading, spacing: 2) {
                Text("Wallet: \(String(format: "%.4f", balance)) SOL")
                    .font(SappTypography.labelSmall)
                    .foregroundColor(SappColors.textPrimary)

                if !hasSufficient {
                    Text("Need \(String(format: "%.4f", required - balance + 0.001)) more")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.error)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(hasSufficient ? SappColors.success.opacity(0.1) : SappColors.error.opacity(0.1))
        )
    }
}

struct CompactCardView: View {
    let card: CardDetails
    let cardType: CardType

    var body: some View {
        VStack(spacing: 12) {
            // Card visual
            VStack(spacing: 8) {
                HStack {
                    Text(cardType.displayName.uppercased())
                        .font(SappTypography.overline)
                    Spacer()
                    Image(systemName: "creditcard.fill")
                        .font(.system(size: 16))
                }
                .foregroundColor(.white.opacity(0.7))

                Text(formatCardNumber(card.cardNumber))
                    .font(.system(size: 18, weight: .medium, design: .monospaced))
                    .foregroundColor(.white)
                    .tracking(1)

                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("EXP")
                            .font(.system(size: 8, weight: .medium))
                            .foregroundColor(.white.opacity(0.5))
                        Text(card.formattedExpiry)
                            .font(SappTypography.labelSmall)
                            .foregroundColor(.white)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        Text("CVV")
                            .font(.system(size: 8, weight: .medium))
                            .foregroundColor(.white.opacity(0.5))
                        Text(card.cvv)
                            .font(SappTypography.labelSmall)
                            .foregroundColor(.white)
                    }
                }

                Text(card.cardholderName.uppercased())
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
        }
    }

    private func formatCardNumber(_ number: String) -> String {
        var formatted = ""
        for (index, char) in number.enumerated() {
            if index > 0 && index % 4 == 0 { formatted += " " }
            formatted += String(char)
        }
        return formatted
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Card Order Step

enum CardOrderStep {
    case input
    case payment
    case processing
    case completed
    case failed
}

// MARK: - Card Order ViewModel

@MainActor
final class CardOrderViewModel: ObservableObject {
    // Input state
    @Published var amount: String = ""
    @Published var cardType: CardType = .mastercard
    @Published var email: String = ""

    // Order state
    @Published var currentStep: CardOrderStep = .input
    @Published var orderResponse: CardOrderResponse?
    @Published var cardDetails: CardDetails?
    @Published var failureReason: String?

    // Pricing
    @Published var pricing: PricingInfo?
    @Published var solAmount: Double?

    // Wallet state
    @Published var walletBalance: Double = 0
    @Published var walletAddress: String?
    @Published var isSendingPayment = false
    @Published var paymentSignature: String?

    // UI state
    @Published var isLoading = false
    @Published var isPolling = false
    @Published var showError = false
    @Published var errorMessage: String?
    @Published var showCopied = false

    // Services
    private let starpayService = StarPayService.shared
    private let solanaService = SolanaWalletService()
    private let cardStorage = StarpayCardStorage.shared
    private var pollingTask: Task<Void, Never>?
    private var pricingTask: Task<Void, Never>?

    nonisolated init() {}

    // MARK: - Wallet Methods

    func loadWallet() async {
        do {
            let walletInfo = try await solanaService.connect()
            walletAddress = walletInfo.publicKey
            walletBalance = walletInfo.solBalance
        } catch {
            print("[CardOrderViewModel] Failed to load wallet: \(error)")
        }
    }

    func refreshWalletBalance() async {
        do {
            let walletInfo = try await solanaService.refreshBalance()
            walletBalance = walletInfo.solBalance
        } catch {
            print("[CardOrderViewModel] Failed to refresh balance: \(error)")
        }
    }

    var hasSufficientBalance: Bool {
        let requiredAmount: Double
        if let paymentAmount = orderResponse?.payment.amountSol {
            requiredAmount = paymentAmount
        } else if let pricingAmount = solAmount {
            requiredAmount = pricingAmount
        } else {
            return false
        }
        let feeBuffer = 0.001
        return walletBalance >= (requiredAmount + feeBuffer)
    }

    // MARK: - Payment

    func sendPayment() async {
        guard let payment = orderResponse?.payment else {
            showErrorMessage("No payment information available")
            return
        }

        isSendingPayment = true
        defer { isSendingPayment = false }

        do {
            let signature = try await solanaService.send(
                to: payment.address,
                amount: payment.amountSol,
                memo: "StarPay Card Order: \(orderResponse?.orderId ?? "")"
            )

            paymentSignature = signature
            currentStep = .processing
            startPolling()
            await refreshWalletBalance()

        } catch let error as SolanaError {
            showErrorMessage(error.errorDescription ?? "Payment failed")
        } catch {
            showErrorMessage(error.localizedDescription)
        }
    }

    // MARK: - Validation

    var isValidInput: Bool {
        guard let amountValue = Double(amount),
              amountValue >= 5,
              amountValue <= 10000,
              isValidEmail(email) else {
            return false
        }
        return true
    }

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }

    // MARK: - Actions

    func updatePricing() {
        pricingTask?.cancel()

        guard let amountValue = Double(amount), amountValue >= 5, amountValue <= 10000 else {
            pricing = nil
            solAmount = nil
            return
        }

        pricingTask = Task {
            do {
                try await Task.sleep(nanoseconds: 500_000_000)
                let response = try await starpayService.getPrice(amount: amountValue)
                pricing = response.pricing
                solAmount = response.amountSol
            } catch {
                // Silently fail
            }
        }
    }

    func createOrder() async {
        guard let amountValue = Double(amount) else {
            showErrorMessage("Invalid amount")
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            let order = try await starpayService.createOrder(
                amount: amountValue,
                cardType: cardType,
                email: email
            )

            orderResponse = order
            currentStep = .payment
        } catch let error as StarPayError {
            showErrorMessage(error.errorDescription ?? "Failed to create order")
        } catch {
            showErrorMessage(error.localizedDescription)
        }
    }

    func checkOrderStatus() async {
        guard let orderId = orderResponse?.orderId else { return }

        isPolling = true
        defer { isPolling = false }

        do {
            let status = try await starpayService.getOrderStatus(orderId: orderId)
            handleStatusUpdate(status)
        } catch let error as StarPayError {
            showErrorMessage(error.errorDescription ?? "Failed to check status")
        } catch {
            showErrorMessage(error.localizedDescription)
        }
    }

    func startPolling() {
        guard pollingTask == nil else { return }

        pollingTask = Task {
            while !Task.isCancelled {
                guard let orderId = orderResponse?.orderId else { break }

                do {
                    try await Task.sleep(nanoseconds: 15_000_000_000)
                    let status = try await starpayService.getOrderStatus(orderId: orderId)
                    handleStatusUpdate(status)

                    if status.status.isTerminal {
                        break
                    }
                } catch {
                    // Continue polling on error
                }
            }
        }
    }

    func stopPolling() {
        pollingTask?.cancel()
        pollingTask = nil
    }

    func handleExpiration() {
        stopPolling()
        failureReason = "Order expired. Please try again."
        currentStep = .failed
    }

    func reset() {
        amount = ""
        email = ""
        cardType = .mastercard
        currentStep = .input
        orderResponse = nil
        cardDetails = nil
        failureReason = nil
        pricing = nil
        solAmount = nil
        paymentSignature = nil
        isSendingPayment = false
        stopPolling()
    }

    func showCopiedFeedback() {
        showCopied = true
        Task {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            showCopied = false
        }
    }

    // MARK: - Private Helpers

    private func handleStatusUpdate(_ status: OrderStatusResponse) {
        switch status.status {
        case .pending:
            currentStep = .payment
        case .processing:
            currentStep = .processing
        case .completed:
            stopPolling()
            cardDetails = status.card
            currentStep = .completed
            // Save card to local storage
            if let card = status.card, let cardValue = orderResponse?.pricing.cardValue {
                cardStorage.saveCard(
                    cardDetails: card,
                    cardType: cardType,
                    email: email,
                    cardValue: cardValue
                )
            }
        case .failed:
            stopPolling()
            failureReason = status.failureReason ?? "Card issuance failed."
            currentStep = .failed
        case .expired:
            stopPolling()
            failureReason = "Order expired before payment."
            currentStep = .failed
        }
    }

    private func showErrorMessage(_ message: String) {
        errorMessage = message
        showError = true
    }
}
