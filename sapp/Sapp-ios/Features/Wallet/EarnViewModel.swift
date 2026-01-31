import Foundation
import Combine

// MARK: - Earn Tab

enum EarnTab: String, CaseIterable, Identifiable {
    case positions = "Positions"
    case pools = "Pools"

    var id: String { rawValue }
}

// MARK: - Deposit Flow State

enum DepositFlowState {
    case ready                    // User has enough USDC
    case insufficientUSDC         // User needs to swap
    case swapping                 // Swap in progress
    case swapComplete             // Swap done, ready to deposit
    case depositing               // Deposit in progress
    case complete                 // All done
    case error(String)            // Error occurred
}

// MARK: - Earn ViewModel

@MainActor
final class EarnViewModel: ObservableObject {

    // MARK: - Published State

    @Published var selectedTab: EarnTab = .positions
    @Published var pools: [LuloPoolWithRate] = []
    @Published var positions: [LuloPosition] = []
    @Published var pendingWithdrawals: [LuloPendingWithdrawal] = []

    @Published var isLoading = false
    @Published var errorMessage: String?

    // Deposit state (protected mode only)
    @Published var selectedPoolForDeposit: LuloPoolWithRate?
    @Published var depositAmount: String = ""
    @Published private(set) var depositMode: LuloDepositMode = .protected
    @Published var isDepositing = false
    @Published var showDepositSuccess = false

    // Token balances for auto-swap
    @Published var usdcBalance: Double = 0
    @Published var solBalance: Double = 0
    @Published var isLoadingBalances = false

    // Auto-swap state
    @Published var depositFlowState: DepositFlowState = .ready
    @Published var needsSwap = false
    @Published var swapQuote: SilentSwapQuoteResponse?
    @Published var isGettingSwapQuote = false
    @Published var swapAmount: Double = 0  // Amount of SOL to swap

    // Withdraw state
    @Published var selectedPositionForWithdraw: LuloPosition?
    @Published var withdrawAmount: String = ""
    @Published var isWithdrawing = false
    @Published var showWithdrawSuccess = false

    // MARK: - Private Properties

    private let luloService = LuloService.shared
    private let silentSwapService = SilentSwapService.shared
    private let solanaService = SolanaWalletService()
    private var cancellables = Set<AnyCancellable>()
    private var walletAddress: String?
    private var quoteTask: Task<Void, Never>?

    // MARK: - Computed Properties

    var totalEarnings: Double {
        positions.reduce(0) { $0 + $1.earningsDouble }
    }

    var totalDeposited: Double {
        positions.reduce(0) { $0 + $1.totalBalanceDouble }
    }

    var hasPositions: Bool {
        !positions.isEmpty
    }

    var sortedPoolsByAPY: [LuloPoolWithRate] {
        pools.sorted { $0.rate.apyProtected > $1.rate.apyProtected }
    }

    var topPool: LuloPoolWithRate? {
        sortedPoolsByAPY.first
    }

    var formattedTotalEarnings: String {
        String(format: "+$%.2f", totalEarnings)
    }

    var formattedTotalDeposited: String {
        String(format: "$%.2f", totalDeposited)
    }

    // Deposit validation
    var depositAmountDouble: Double {
        Double(depositAmount) ?? 0
    }

    var isDepositAmountValid: Bool {
        depositAmountDouble > 0
    }

    var canDeposit: Bool {
        isDepositAmountValid && selectedPoolForDeposit != nil && !isDepositing
    }

    // Withdraw validation
    var withdrawAmountDouble: Double {
        Double(withdrawAmount) ?? 0
    }

    var isWithdrawAmountValid: Bool {
        guard let position = selectedPositionForWithdraw else { return false }
        return withdrawAmountDouble > 0 && withdrawAmountDouble <= position.totalBalanceDouble
    }

    var canWithdraw: Bool {
        isWithdrawAmountValid && selectedPositionForWithdraw != nil && !isWithdrawing
    }

    var maxWithdrawAmount: Double {
        selectedPositionForWithdraw?.totalBalanceDouble ?? 0
    }

    // Auto-swap computed properties
    var usdcNeeded: Double {
        max(0, depositAmountDouble - usdcBalance)
    }

    var hasEnoughUSDC: Bool {
        usdcBalance >= depositAmountDouble && depositAmountDouble > 0
    }

    var canSwapAndDeposit: Bool {
        !hasEnoughUSDC && solBalance > 0 && depositAmountDouble > 0
    }

    var formattedUSDCBalance: String {
        String(format: "%.2f USDC", usdcBalance)
    }

    var formattedSOLBalance: String {
        String(format: "%.4f SOL", solBalance)
    }

    var estimatedSOLNeeded: Double {
        // Rough estimate: USDC needed / estimated SOL price (~$100)
        // This will be refined when we get actual quote
        usdcNeeded / 100.0 * 1.05  // Add 5% buffer for slippage
    }

    // MARK: - Initialization

    init() {
        setupBindings()
    }

    private func setupBindings() {
        // Observe LuloService state changes
        luloService.$pools
            .receive(on: DispatchQueue.main)
            .sink { [weak self] pools in
                self?.pools = pools
            }
            .store(in: &cancellables)

        luloService.$userPositions
            .receive(on: DispatchQueue.main)
            .sink { [weak self] positions in
                self?.positions = positions
            }
            .store(in: &cancellables)

        luloService.$pendingWithdrawals
            .receive(on: DispatchQueue.main)
            .sink { [weak self] withdrawals in
                self?.pendingWithdrawals = withdrawals
            }
            .store(in: &cancellables)

        luloService.$isLoadingPools
            .combineLatest(luloService.$isLoadingAccount)
            .map { $0 || $1 }
            .receive(on: DispatchQueue.main)
            .sink { [weak self] isLoading in
                self?.isLoading = isLoading
            }
            .store(in: &cancellables)

        luloService.$isDepositing
            .receive(on: DispatchQueue.main)
            .sink { [weak self] isDepositing in
                self?.isDepositing = isDepositing
            }
            .store(in: &cancellables)

        luloService.$isWithdrawing
            .receive(on: DispatchQueue.main)
            .sink { [weak self] isWithdrawing in
                self?.isWithdrawing = isWithdrawing
            }
            .store(in: &cancellables)
    }

    // MARK: - Data Loading

    /// Load pools only (no wallet required)
    func loadPools() async {
        errorMessage = nil

        do {
            try await luloService.loadPools()
            print("[EarnViewModel] Pools loaded: \(pools.count)")
        } catch {
            errorMessage = error.localizedDescription
            print("[EarnViewModel] Load pools error: \(error)")
        }
    }

    /// Load account data (wallet required)
    func loadAccountData(walletAddress: String) async {
        self.walletAddress = walletAddress
        errorMessage = nil

        do {
            try await luloService.loadAccount(walletAddress: walletAddress)
            try await luloService.loadPendingWithdrawals(walletAddress: walletAddress)

            // Auto-switch to positions tab if user has positions
            if hasPositions && selectedTab == .pools {
                selectedTab = .positions
            }
        } catch {
            errorMessage = error.localizedDescription
            print("[EarnViewModel] Load account error: \(error)")
        }
    }

    /// Load all data (pools + account)
    func loadData(walletAddress: String) async {
        self.walletAddress = walletAddress
        errorMessage = nil

        do {
            try await luloService.loadPools()
            try await luloService.loadAccount(walletAddress: walletAddress)
            try await luloService.loadPendingWithdrawals(walletAddress: walletAddress)

            // Auto-switch to positions tab if user has positions
            if hasPositions && selectedTab == .pools {
                selectedTab = .positions
            }
        } catch {
            errorMessage = error.localizedDescription
            print("[EarnViewModel] Load error: \(error)")
        }
    }

    func refreshData() async {
        // Always refresh pools
        do {
            try await luloService.loadPools(forceRefresh: true)
        } catch {
            print("[EarnViewModel] Refresh pools error: \(error)")
        }

        // Refresh account data if wallet is connected
        if let walletAddress = walletAddress {
            do {
                try await luloService.loadAccount(walletAddress: walletAddress)
                try await luloService.loadPendingWithdrawals(walletAddress: walletAddress)
            } catch {
                errorMessage = error.localizedDescription
                print("[EarnViewModel] Refresh account error: \(error)")
            }
        }
    }

    // MARK: - Deposit

    func selectPoolForDeposit(_ pool: LuloPoolWithRate) {
        selectedPoolForDeposit = pool
        depositAmount = ""
    }

    func clearDepositSelection() {
        selectedPoolForDeposit = nil
        depositAmount = ""
    }

    func deposit() async -> Bool {
        guard let walletAddress = walletAddress,
              let pool = selectedPoolForDeposit,
              isDepositAmountValid else {
            return false
        }

        errorMessage = nil

        do {
            // Generate the deposit transaction
            let transaction = try await luloService.generateDepositTransaction(
                walletAddress: walletAddress,
                mintAddress: pool.pool.mintAddress,
                amount: depositAmountDouble,
                mode: depositMode
            )

            // TODO: Sign and send the transaction using wallet service
            // For now, we'll just log the transaction
            print("[EarnViewModel] Deposit transaction generated: \(transaction.prefix(50))...")

            showDepositSuccess = true
            clearDepositSelection()

            // Refresh positions after deposit
            try await luloService.loadAccount(walletAddress: walletAddress)

            return true
        } catch {
            errorMessage = error.localizedDescription
            print("[EarnViewModel] Deposit error: \(error)")
            return false
        }
    }

    // MARK: - Token Balance Loading

    func loadTokenBalances() async {
        guard let walletAddress = walletAddress else { return }

        isLoadingBalances = true
        defer { isLoadingBalances = false }

        do {
            // Connect wallet service if needed
            let walletInfo = try await solanaService.connect()
            solBalance = Double(walletInfo.balance) / 1_000_000_000.0  // Convert lamports to SOL

            // Get USDC balance
            let usdcBalanceResult = try await solanaService.getTokenBalance(mintAddress: WellKnownToken.USDC)
            usdcBalance = usdcBalanceResult.balance

            // Update needsSwap state
            updateSwapNeededState()

            print("[EarnViewModel] Balances loaded - SOL: \(solBalance), USDC: \(usdcBalance)")
        } catch {
            print("[EarnViewModel] Failed to load balances: \(error)")
            // Don't set error message - balance loading failure shouldn't block the UI
        }
    }

    func updateSwapNeededState() {
        let depositValue = depositAmountDouble
        needsSwap = depositValue > 0 && depositValue > usdcBalance && solBalance > 0

        if needsSwap {
            depositFlowState = .insufficientUSDC
        } else if depositValue > 0 && depositValue <= usdcBalance {
            depositFlowState = .ready
        }
    }

    /// Called when deposit amount changes - triggers debounced quote fetch
    func onDepositAmountChanged() {
        // Update swap needed state first
        updateSwapNeededState()

        // Cancel any pending quote task
        quoteTask?.cancel()
        quoteTask = nil
        swapQuote = nil

        // Only auto-fetch quote if swap is needed and we have a valid amount
        guard needsSwap, depositAmountDouble > 0 else { return }

        // Debounce: wait 500ms before fetching quote
        quoteTask = Task {
            do {
                try await Task.sleep(nanoseconds: 500_000_000) // 500ms debounce

                guard !Task.isCancelled else { return }

                await getSwapQuote()
            } catch {
                // Task cancelled or sleep interrupted, ignore
            }
        }
    }

    // MARK: - Auto-Swap Flow

    func getSwapQuote() async {
        guard let walletAddress = walletAddress else { return }
        guard needsSwap else { return }

        isGettingSwapQuote = true
        swapQuote = nil
        errorMessage = nil

        do {
            // Calculate how much SOL we need to swap to get the needed USDC
            let usdcNeededAmount = usdcNeeded

            // Get SOL token for swap
            let solToken = SilentSwapToken(
                symbol: "SOL",
                name: "Solana",
                decimals: 9,
                chain: .solana,
                address: "native"
            )

            // Get USDC token for swap
            let usdcToken = SilentSwapToken(
                symbol: "USDC",
                name: "USD Coin",
                decimals: 6,
                chain: .solana,
                address: WellKnownToken.USDC
            )

            // Estimate SOL amount needed (rough estimate, will be refined by quote)
            // Using a conservative estimate assuming ~$100/SOL
            let estimatedSolAmount = usdcNeededAmount / 100.0 * 1.1  // 10% buffer

            swapAmount = min(estimatedSolAmount, solBalance * 0.95)  // Leave some SOL for fees

            let quote = try await silentSwapService.getQuote(
                fromToken: solToken,
                toToken: usdcToken,
                amount: swapAmount,
                recipientAddress: walletAddress,
                senderAddress: walletAddress
            )

            // Check if task was cancelled while waiting for quote
            guard !Task.isCancelled else {
                isGettingSwapQuote = false
                return
            }

            swapQuote = quote
            print("[EarnViewModel] Swap quote received: \(quote.estimatedOutput) USDC for \(swapAmount) SOL")
        } catch is CancellationError {
            // Task was cancelled, don't show error
            print("[EarnViewModel] Swap quote request cancelled")
        } catch {
            // Only show error if not cancelled
            if !Task.isCancelled {
                errorMessage = "Failed to get swap quote: \(error.localizedDescription)"
            }
            print("[EarnViewModel] Swap quote error: \(error)")
        }

        isGettingSwapQuote = false
    }

    func executeSwapAndDeposit() async -> Bool {
        guard let walletAddress = walletAddress,
              let pool = selectedPoolForDeposit,
              let quote = swapQuote else {
            return false
        }

        errorMessage = nil
        depositFlowState = .swapping

        do {
            // Step 1: Execute the swap
            print("[EarnViewModel] Starting swap...")
            let swapResult = try await silentSwapService.executeSwap(quoteResponse: quote)
            print("[EarnViewModel] Swap executed: \(swapResult.orderId)")

            // Step 2: Wait for swap to complete (poll status)
            depositFlowState = .swapping
            var swapComplete = false
            var attempts = 0
            let maxAttempts = 60  // 5 minutes with 5-second intervals

            while !swapComplete && attempts < maxAttempts {
                try await Task.sleep(nanoseconds: 5_000_000_000)  // 5 seconds
                let status = try await silentSwapService.getSwapStatus(orderId: swapResult.orderId)

                if status.status == .completed {
                    swapComplete = true
                } else if status.status == .failed {
                    throw SilentSwapError.executeFailed(status.error ?? "Swap failed")
                }

                attempts += 1
            }

            if !swapComplete {
                throw SilentSwapError.executeFailed("Swap timed out")
            }

            depositFlowState = .swapComplete

            // Step 3: Refresh balances
            await loadTokenBalances()

            // Step 4: Now deposit the USDC
            depositFlowState = .depositing
            print("[EarnViewModel] Swap complete, starting deposit...")

            let transaction = try await luloService.generateDepositTransaction(
                walletAddress: walletAddress,
                mintAddress: pool.pool.mintAddress,
                amount: depositAmountDouble,
                mode: depositMode
            )

            // TODO: Sign and send the deposit transaction
            print("[EarnViewModel] Deposit transaction generated: \(transaction.prefix(50))...")

            depositFlowState = .complete
            showDepositSuccess = true
            clearDepositSelection()

            // Refresh positions after deposit
            try await luloService.loadAccount(walletAddress: walletAddress)

            return true
        } catch {
            depositFlowState = .error(error.localizedDescription)
            errorMessage = error.localizedDescription
            print("[EarnViewModel] Swap and deposit error: \(error)")
            return false
        }
    }

    func resetDepositFlow() {
        depositFlowState = .ready
        swapQuote = nil
        swapAmount = 0
        errorMessage = nil
        updateSwapNeededState()
    }

    // MARK: - Withdraw

    func selectPositionForWithdraw(_ position: LuloPosition) {
        selectedPositionForWithdraw = position
        withdrawAmount = ""
    }

    func clearWithdrawSelection() {
        selectedPositionForWithdraw = nil
        withdrawAmount = ""
    }

    func setMaxWithdrawAmount() {
        withdrawAmount = String(format: "%.4f", maxWithdrawAmount)
    }

    func withdraw() async -> Bool {
        guard let walletAddress = walletAddress,
              let position = selectedPositionForWithdraw,
              isWithdrawAmountValid else {
            return false
        }

        errorMessage = nil

        do {
            // Generate the withdraw transaction
            let transaction = try await luloService.generateWithdrawTransaction(
                walletAddress: walletAddress,
                mintAddress: position.mintAddress,
                amount: withdrawAmountDouble
            )

            // TODO: Sign and send the transaction using wallet service
            // For now, we'll just log the transaction
            print("[EarnViewModel] Withdraw transaction generated: \(transaction.prefix(50))...")

            showWithdrawSuccess = true
            clearWithdrawSelection()

            // Refresh positions after withdrawal
            try await luloService.loadAccount(walletAddress: walletAddress)
            try await luloService.loadPendingWithdrawals(walletAddress: walletAddress)

            return true
        } catch {
            errorMessage = error.localizedDescription
            print("[EarnViewModel] Withdraw error: \(error)")
            return false
        }
    }

    // MARK: - Helpers

    func getPosition(for mintAddress: String) -> LuloPosition? {
        positions.first { $0.mintAddress == mintAddress }
    }

    func getPool(for mintAddress: String) -> LuloPoolWithRate? {
        pools.first { $0.pool.mintAddress == mintAddress }
    }

    func estimatedAPY(for pool: LuloPoolWithRate, mode: LuloDepositMode) -> Double {
        mode == .regular ? pool.rate.apy : pool.rate.apyProtected
    }

    func estimatedEarnings(for pool: LuloPoolWithRate, amount: Double, mode: LuloDepositMode) -> Double {
        let apy = estimatedAPY(for: pool, mode: mode)
        return amount * (apy / 100) / 12 // Monthly estimate
    }
}
