import SwiftUI
import Combine

struct WalletView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var viewModel = WalletViewModel()
    @State private var showSend = false
    @State private var showReceive = false
    @State private var showSwap = false
    @State private var showEarn = false
    @State private var showCard = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: SappSpacing.xl) {
                    // Balance card
                    balanceCard

                    // Recent transactions
                    transactionsSection
                }
                .padding(.horizontal, SappSpacing.lg)
                .padding(.top, SappSpacing.sm)
            }
            .background(SappColors.background)
            .navigationTitle("")
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Wallet")
                        .font(SappTypography.displaySmall)
                        .foregroundColor(SappColors.textPrimary)
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            // Floating action menu with 5 actions at bottom-right
            .floatingActionMenu(
                primaryIcon: "plus",
                actions: [
                    FABAction(icon: "arrow.up", label: "Send", color: SappColors.accent) {
                        showSend = true
                    },
                    FABAction(icon: "arrow.down", label: "Receive", color: SappColors.success) {
                        showReceive = true
                    },
                    FABAction(icon: "arrow.swap", label: "Swap", color: SappColors.info) {
                        showSwap = true
                    },
                    FABAction(icon: "chart.line.uptrend.xyaxis", label: "Earn", color: SappColors.warning) {
                        showEarn = true
                    },
                    FABAction(icon: "creditcard.fill", label: "Card", color: SappColors.accent) {
                        showCard = true
                    }
                ]
            )
            .sheet(isPresented: $showSend) {
                SendCryptoView()
            }
            .sheet(isPresented: $showReceive) {
                ReceiveSOLView(address: viewModel.walletInfo?.publicKey ?? "")
            }
            .sheet(isPresented: $showSwap) {
                SwapView()
            }
            .sheet(isPresented: $showEarn) {
                EarnView()
            }
            .sheet(isPresented: $showCard) {
                StarpayCardsView()
            }
            .task {
                await viewModel.loadWallet()
            }
        }
    }
    
    private var balanceCard: some View {
        VStack(spacing: SappSpacing.lg) {
            // Main balance display (tappable for breakdown)
            Button {
                viewModel.toggleBalanceBreakdown()
            } label: {
                VStack(spacing: SappSpacing.xs) {
                    Text("Total Balance")
                        .font(SappTypography.labelMedium)
                        .foregroundColor(SappColors.textSecondary)
                        .textCase(.uppercase)

                    if viewModel.isLoading {
                        ProgressView()
                            .frame(height: 48)
                    } else {
                        // USD value shown prominently by default
                        if let usdValue = viewModel.usdBalance {
                            Text("$\(String(format: "%.2f", usdValue))")
                                .font(SappTypography.displayMedium)
                                .foregroundColor(SappColors.textPrimary)
                        } else {
                            Text(viewModel.walletInfo?.formattedBalance ?? "0.0000 SOL")
                                .font(SappTypography.displayMedium)
                                .foregroundColor(SappColors.textPrimary)
                        }
                    }

                    // SOL balance shown as secondary
                    HStack(spacing: SappSpacing.xs) {
                        Text(viewModel.walletInfo?.formattedBalance ?? "0.0000 SOL")
                            .font(SappTypography.bodySmall)
                            .foregroundColor(SappColors.textSecondary)

                        Image(systemName: viewModel.showBalanceBreakdown ? "chevron.up" : "chevron.down")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(SappColors.textTertiary)
                    }
                }
            }
            .buttonStyle(.plain)

            // Token breakdown dropdown
            if viewModel.showBalanceBreakdown {
                tokenBreakdownView
            }

            // Address
            if let address = viewModel.walletInfo?.publicKey {
                Button {
                    UIPasteboard.general.string = address
                    viewModel.showCopiedFeedback()
                } label: {
                    HStack(spacing: SappSpacing.xs) {
                        Text(viewModel.walletInfo?.shortAddress ?? "")
                            .font(SappTypography.mono)
                            .foregroundColor(SappColors.textSecondary)

                        Image(systemName: viewModel.showCopied ? "checkmark" : "doc.on.doc")
                            .font(.system(size: 12))
                            .foregroundColor(viewModel.showCopied ? SappColors.success : SappColors.textTertiary)
                    }
                    .padding(.horizontal, SappSpacing.md)
                    .padding(.vertical, SappSpacing.xs)
                    .background(
                        Capsule()
                            .fill(SappColors.accentLight)
                    )
                }
                .buttonStyle(.plain)
            }

            // Network badge
            HStack(spacing: SappSpacing.xs) {
                Circle()
                    .fill(PrivyConfiguration.currentCluster.isProduction ? SappColors.success : SappColors.warning)
                    .frame(width: 6, height: 6)
                Text(PrivyConfiguration.currentCluster.displayName)
                    .font(SappTypography.labelSmall)
                    .foregroundColor(SappColors.textSecondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(SappSpacing.xl)
        .background(
            RoundedRectangle(cornerRadius: SappRadius.xl)
                .fill(SappColors.surface)
                .shadow(color: Color.black.opacity(0.04), radius: 12, x: 0, y: 4)
        )
    }

    private var tokenBreakdownView: some View {
        VStack(spacing: 0) {
            Divider()
                .padding(.vertical, SappSpacing.md)

            ForEach(viewModel.tokenBalances) { token in
                HStack {
                    // Token name
                    Text(token.symbol)
                        .font(SappTypography.labelMedium)
                        .foregroundColor(SappColors.textPrimary)

                    Spacer()

                    // Balance
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(token.formattedBalance)
                            .font(SappTypography.labelMedium)
                            .foregroundColor(SappColors.textPrimary)

                        if let usd = token.formattedUSD {
                            Text(usd)
                                .font(SappTypography.caption)
                                .foregroundColor(SappColors.textSecondary)
                        }
                    }
                }
                .padding(.vertical, SappSpacing.sm)
            }
        }
        .transition(.opacity.combined(with: .move(edge: .top)))
    }

    private var transactionsSection: some View {
        VStack(alignment: .leading, spacing: SappSpacing.md) {
            Text("Recent Activity")
                .font(SappTypography.headlineSmall)
                .foregroundColor(SappColors.textPrimary)
            
            if viewModel.transactions.isEmpty {
                VStack(spacing: SappSpacing.md) {
                    Image(systemName: "clock")
                        .font(.system(size: 32, weight: .thin))
                        .foregroundColor(SappColors.textTertiary)
                    
                    Text("No transactions yet")
                        .font(SappTypography.bodySmall)
                        .foregroundColor(SappColors.textSecondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, SappSpacing.xxl)
            } else {
                VStack(spacing: 0) {
                    ForEach(viewModel.transactions) { tx in
                        TransactionRow(transaction: tx)
                        
                        if tx.id != viewModel.transactions.last?.id {
                            Divider()
                                .padding(.leading, 52)
                        }
                    }
                }
                .background(SappColors.surface)
                .cornerRadius(SappRadius.large)
            }
        }
    }
}

// MARK: - Transaction Row

struct TransactionRow: View {
    let transaction: SolanaTransaction
    
    var body: some View {
        HStack(spacing: SappSpacing.md) {
            // Icon
            Image(systemName: transaction.isOutgoing ? "arrow.up.right" : "arrow.down.left")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(transaction.isOutgoing ? SappColors.error : SappColors.success)
                .frame(width: 36, height: 36)
                .background(
                    Circle()
                        .fill((transaction.isOutgoing ? SappColors.error : SappColors.success).opacity(0.1))
                )
            
            // Details
            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.isOutgoing ? "Sent" : "Received")
                    .font(SappTypography.bodyMedium)
                    .foregroundColor(SappColors.textPrimary)
                
                if let timestamp = transaction.timestamp {
                    Text(formatDate(timestamp))
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textTertiary)
                }
            }
            
            Spacer()
            
            // Amount
            VStack(alignment: .trailing, spacing: 2) {
                Text(transaction.formattedAmount)
                    .font(SappTypography.labelLarge)
                    .foregroundColor(transaction.isOutgoing ? SappColors.error : SappColors.success)
                
                Text(transaction.status.rawValue.capitalized)
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textTertiary)
            }
        }
        .padding(.horizontal, SappSpacing.lg)
        .padding(.vertical, SappSpacing.md)
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, HH:mm"
        return formatter.string(from: date)
    }
}

// MARK: - Wallet ViewModel

@MainActor
final class WalletViewModel: ObservableObject {
    @Published var walletInfo: SolanaWalletInfo?
    @Published var transactions: [SolanaTransaction] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showCopied = false
    @Published var usdBalance: Double?
    @Published var showBalanceBreakdown = false
    @Published var tokenBalances: [TokenBalance] = []

    private let solanaService = SolanaWalletService()

    nonisolated init() {}

    // MARK: - Token Balance Model
    struct TokenBalance: Identifiable {
        let id = UUID()
        let symbol: String
        let balance: Double
        let usdValue: Double?
        let iconName: String

        var formattedBalance: String {
            String(format: "%.4f", balance)
        }

        var formattedUSD: String? {
            guard let usd = usdValue else { return nil }
            return String(format: "$%.2f", usd)
        }
    }

    func loadWallet() async {
        isLoading = true
        defer { isLoading = false }

        do {
            walletInfo = try await solanaService.connect()
            transactions = try await solanaService.loadTransactions(limit: 20)

            // Fetch real SOL price and token balances
            await fetchAllBalances()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func fetchAllBalances() async {
        do {
            let solBalance = walletInfo?.solBalance ?? 0
            let solUSD = try await SolanaPriceService.shared.solToUSD(solBalance)
            usdBalance = solUSD

            // Build token balances array
            var balances: [TokenBalance] = []

            // Add SOL balance
            balances.append(TokenBalance(
                symbol: "SOL",
                balance: solBalance,
                usdValue: solUSD,
                iconName: "sun.max.fill"
            ))

            // Fetch SPL token balances
            if let splBalances = try? await solanaService.getAllTokenBalances() {
                for spl in splBalances where spl.balance > 0 {
                    // Get USD value for known tokens
                    var usdValue: Double? = nil
                    if spl.symbol == "USDC" || spl.symbol == "USDT" {
                        usdValue = spl.balance // Stablecoins are 1:1 with USD
                    }

                    balances.append(TokenBalance(
                        symbol: spl.symbol,
                        balance: spl.balance,
                        usdValue: usdValue,
                        iconName: iconForToken(spl.symbol)
                    ))
                }
            }

            tokenBalances = balances

            // Calculate total USD balance
            let totalUSD = balances.compactMap { $0.usdValue }.reduce(0, +)
            if totalUSD > solUSD {
                usdBalance = totalUSD
            }
        } catch {
            // Silently fail - USD balance is optional display
            usdBalance = nil
        }
    }

    private func iconForToken(_ symbol: String) -> String {
        switch symbol {
        case "SOL": return "sun.max.fill"
        case "USDC": return "dollarsign.circle.fill"
        case "USDT": return "dollarsign.circle"
        default: return "circle.fill"
        }
    }

    func refresh() async {
        do {
            walletInfo = try await solanaService.refreshBalance()
            transactions = try await solanaService.loadTransactions(limit: 20)

            // Refresh all balances
            await fetchAllBalances()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func requestAirdrop() async {
        do {
            _ = try await solanaService.requestAirdrop(amount: 1.0)
            await refresh()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func showCopiedFeedback() {
        showCopied = true
        Task {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            showCopied = false
        }
    }

    func toggleBalanceBreakdown() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
            showBalanceBreakdown.toggle()
        }
    }
}

// MARK: - Send SOL View

struct SendSOLView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var recipientAddress = ""
    @State private var amount = ""
    @State private var isSending = false
    @State private var errorMessage: String?
    @State private var showSuccess = false
    @State private var transactionSignature: String?
    @State private var showScanner = false
    @State private var usdEquivalent: Double?

    private let solanaService = SolanaWalletService()

    var body: some View {
        NavigationStack {
            VStack(spacing: SappSpacing.xl) {
                VStack(alignment: .leading, spacing: SappSpacing.sm) {
                    HStack {
                        Text("Recipient")
                            .font(SappTypography.labelMedium)
                            .foregroundColor(SappColors.textSecondary)

                        Spacer()

                        Button {
                            showScanner = true
                        } label: {
                            HStack(spacing: SappSpacing.xs) {
                                Image(systemName: "qrcode.viewfinder")
                                Text("Scan")
                            }
                            .font(SappTypography.labelSmall)
                            .foregroundColor(SappColors.accent)
                        }
                    }

                    TextField("Solana address", text: $recipientAddress)
                        .font(SappTypography.mono)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .padding(SappSpacing.md)
                        .background(
                            RoundedRectangle(cornerRadius: SappRadius.medium)
                                .stroke(SappColors.border, lineWidth: 1)
                        )
                }

                VStack(alignment: .leading, spacing: SappSpacing.sm) {
                    Text("Amount")
                        .font(SappTypography.labelMedium)
                        .foregroundColor(SappColors.textSecondary)

                    HStack {
                        TextField("0.0", text: $amount)
                            .font(SappTypography.displaySmall)
                            .keyboardType(.decimalPad)
                            .onChange(of: amount) { _, newValue in
                                updateUSDEquivalent(newValue)
                            }

                        Text("SOL")
                            .font(SappTypography.headlineSmall)
                            .foregroundColor(SappColors.textSecondary)
                    }
                    .padding(SappSpacing.md)
                    .background(
                        RoundedRectangle(cornerRadius: SappRadius.medium)
                            .stroke(SappColors.border, lineWidth: 1)
                    )

                    if let usd = usdEquivalent {
                        Text("≈ $\(String(format: "%.2f", usd)) USD")
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textTertiary)
                    }
                }

                // Network fee info
                HStack {
                    Image(systemName: "info.circle")
                        .foregroundColor(SappColors.textTertiary)
                    Text("Network fee: ~0.000005 SOL")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textTertiary)
                }

                if let error = errorMessage {
                    Text(error)
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.error)
                        .multilineTextAlignment(.center)
                }

                Spacer()

                Button {
                    Task { await sendTransaction() }
                } label: {
                    if isSending {
                        HStack(spacing: SappSpacing.sm) {
                            ProgressView()
                                .tint(.white)
                            Text("Sending...")
                        }
                    } else {
                        Text("Send")
                    }
                }
                .buttonStyle(SappPrimaryButtonStyle(isEnabled: isValidInput && !isSending))
                .disabled(!isValidInput || isSending)
            }
            .padding(SappSpacing.xl)
            .background(SappColors.background)
            .navigationTitle("Send SOL")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .sheet(isPresented: $showScanner) {
                QRScannerView { qrResult in
                    handleScannedQR(qrResult)
                }
            }
            .alert("Transaction Sent", isPresented: $showSuccess) {
                Button("View on Explorer") {
                    if let sig = transactionSignature {
                        openExplorer(signature: sig)
                    }
                    dismiss()
                }
                Button("Done") {
                    dismiss()
                }
            } message: {
                if let sig = transactionSignature {
                    Text("Successfully sent \(amount) SOL\n\nSignature: \(sig.prefix(20))...")
                }
            }
        }
    }

    // MARK: - Computed Properties

    private var isValidInput: Bool {
        guard !recipientAddress.isEmpty,
              !amount.isEmpty,
              let amountValue = Double(amount),
              amountValue > 0,
              isValidSolanaAddress(recipientAddress) else {
            return false
        }
        return true
    }

    // MARK: - Methods

    private func sendTransaction() async {
        guard let amountValue = Double(amount) else {
            errorMessage = "Invalid amount"
            return
        }

        isSending = true
        errorMessage = nil

        do {
            // Connect wallet if needed
            _ = try await solanaService.connect()

            // Send the transaction
            let signature = try await solanaService.send(
                to: recipientAddress,
                amount: amountValue,
                memo: nil
            )

            transactionSignature = signature
            showSuccess = true
        } catch {
            errorMessage = error.localizedDescription
        }

        isSending = false
    }

    private func handleScannedQR(_ result: QRCodeType) {
        switch result {
        case .solanaAddress(let address):
            recipientAddress = address
        case .paymentRequest(let address, let requestedAmount, _):
            recipientAddress = address
            if let amt = requestedAmount {
                amount = String(amt)
            }
        case .sappHandle(let handle):
            // Look up handle to get Solana address
            Task {
                if let user = try? await SappAPIService.shared.lookupUser(handle: handle),
                   let solanaAddress = user.solanaAddress {
                    await MainActor.run {
                        recipientAddress = solanaAddress
                    }
                }
            }
        default:
            break
        }
    }

    private func updateUSDEquivalent(_ amountString: String) {
        guard let amountValue = Double(amountString), amountValue > 0 else {
            usdEquivalent = nil
            return
        }

        Task {
            do {
                let usd = try await SolanaPriceService.shared.solToUSD(amountValue)
                await MainActor.run {
                    usdEquivalent = usd
                }
            } catch {
                usdEquivalent = nil
            }
        }
    }

    private func isValidSolanaAddress(_ address: String) -> Bool {
        let base58Chars = CharacterSet(charactersIn: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")
        return address.count >= 32 && address.count <= 44 &&
               address.unicodeScalars.allSatisfy { base58Chars.contains($0) }
    }

    private func openExplorer(signature: String) {
        let cluster = PrivyConfiguration.currentCluster
        let clusterParam = cluster == .mainnetBeta ? "" : "?cluster=\(cluster.rawValue)"
        let urlString = "https://explorer.solana.com/tx/\(signature)\(clusterParam)"
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - Receive SOL View

struct ReceiveSOLView: View {
    let address: String
    @Environment(\.dismiss) private var dismiss
    @State private var showCopied = false

    var body: some View {
        VStack(spacing: 0) {
            // Drag indicator
            Capsule()
                .fill(SappColors.border)
                .frame(width: 36, height: 4)
                .padding(.top, 8)

            // Compact header - reduced spacing
            HStack {
                Text("Receive")
                    .font(SappTypography.headlineSmall)
                    .foregroundColor(SappColors.textPrimary)

                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 16)

            // Content - centered
            VStack(spacing: 16) {
                Spacer()

                // QR Code
                QRCodeView(value: address)
                    .frame(width: 180, height: 180)
                    .padding(16)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white)
                    )
                    .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)

                // Address display
                VStack(spacing: 8) {
                    Text("Your Solana Address")
                        .font(SappTypography.caption)
                        .foregroundColor(SappColors.textTertiary)

                    Text(address)
                        .font(SappTypography.monoSmall)
                        .foregroundColor(SappColors.textPrimary)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(SappColors.accentLight)
                        )
                }
                .padding(.horizontal, 20)

                Spacer()
            }

            // Bottom action bar - standardized, no background
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

                // Copy button (primary action)
                Button {
                    UIPasteboard.general.string = address
                    showCopied = true
                    Task {
                        try? await Task.sleep(nanoseconds: 2_000_000_000)
                        showCopied = false
                    }
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: showCopied ? "checkmark" : "doc.on.doc")
                        Text(showCopied ? "Copied!" : "Copy Address")
                    }
                    .font(SappTypography.labelMedium)
                    .fontWeight(.semibold)
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
        .background(SappColors.background)
        .presentationDetents([.fraction(0.60), .large])
        .presentationDragIndicator(.hidden)
    }
}
