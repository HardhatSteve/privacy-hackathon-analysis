import SwiftUI
import Combine

/// Earn View - Deposit tokens to earn yield through Lulo
struct EarnView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var viewModel = EarnViewModel()
    @Environment(\.dismiss) private var dismiss

    @State private var showDeposit = false
    @State private var showWithdraw = false
    @State private var walletAddress: String?
    @State private var cancellables = Set<AnyCancellable>()

    var body: some View {
        ZStack {
            SappColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Drag indicator
                Capsule()
                    .fill(SappColors.border)
                    .frame(width: 36, height: 4)
                    .padding(.top, 8)

                // Compact header
                header

                // Tab picker
                tabPicker

                // Content
                TabView(selection: $viewModel.selectedTab) {
                    positionsTab
                        .tag(EarnTab.positions)

                    poolsTab
                        .tag(EarnTab.pools)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))

                // Bottom action bar
                bottomActionBar
            }
        }
        .onAppear {
            loadPoolsAndWalletData()
        }
        .task {
            await viewModel.loadPools()
        }
        .sheet(isPresented: $showDeposit) {
            DepositSheet(viewModel: viewModel)
        }
        .sheet(isPresented: $showWithdraw) {
            WithdrawSheet(viewModel: viewModel)
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.hidden)
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("Earn")
                .font(SappTypography.headlineSmall)
                .foregroundColor(SappColors.textPrimary)

            Spacer()

            // Refresh button
            Button {
                Task { await viewModel.refreshData() }
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 16))
                    .foregroundColor(viewModel.isLoading ? SappColors.textTertiary : SappColors.accent)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(SappColors.surface))
            }
            .disabled(viewModel.isLoading)
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 8)
    }

    // MARK: - Tab Picker

    private var tabPicker: some View {
        HStack(spacing: 0) {
            ForEach(EarnTab.allCases) { tab in
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        viewModel.selectedTab = tab
                    }
                } label: {
                    Text(tab.rawValue)
                        .font(SappTypography.labelSmall)
                        .foregroundColor(viewModel.selectedTab == tab ? .white : SappColors.textSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(viewModel.selectedTab == tab ? SappColors.accent : Color.clear)
                }
                .buttonStyle(.plain)
            }
        }
        .background(SappColors.accentLight)
        .cornerRadius(10)
        .padding(.horizontal, 20)
        .padding(.bottom, 12)
    }

    // MARK: - Positions Tab

    private var positionsTab: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                if viewModel.isLoading && viewModel.positions.isEmpty {
                    loadingView
                } else if viewModel.hasPositions {
                    // Summary card
                    EarnSummaryCard(
                        totalDeposited: viewModel.totalDeposited,
                        totalEarnings: viewModel.totalEarnings,
                        topAPY: viewModel.topPool?.rate.apy
                    )

                    // Positions list
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Your Positions")
                            .font(SappTypography.labelMedium)
                            .foregroundColor(SappColors.textSecondary)

                        ForEach(viewModel.positions) { position in
                            PositionCard(
                                position: position,
                                rate: viewModel.getPool(for: position.mintAddress)?.rate,
                                onWithdraw: {
                                    viewModel.selectPositionForWithdraw(position)
                                    showWithdraw = true
                                }
                            )
                        }
                    }

                    // Top pool suggestion
                    if let topPool = viewModel.topPool {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Earn More")
                                .font(SappTypography.labelMedium)
                                .foregroundColor(SappColors.textSecondary)

                            TopPoolCard(pool: topPool) {
                                viewModel.selectPoolForDeposit(topPool)
                                showDeposit = true
                            }
                        }
                    }
                } else {
                    // Empty state
                    EarnEmptyStateCard(
                        topAPY: viewModel.topPool?.rate.apy,
                        onBrowsePools: {
                            viewModel.selectedTab = .pools
                        }
                    )

                    // Show top pool even in empty state
                    if let topPool = viewModel.topPool {
                        TopPoolCard(pool: topPool) {
                            viewModel.selectPoolForDeposit(topPool)
                            showDeposit = true
                        }
                    }
                }

                // Error message
                if let error = viewModel.errorMessage {
                    errorBanner(error)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
        }
    }

    // MARK: - Pools Tab

    private var poolsTab: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                if viewModel.isLoading && viewModel.pools.isEmpty {
                    loadingView
                } else if viewModel.pools.isEmpty {
                    emptyPoolsView
                } else {
                    // Pools header
                    HStack {
                        Text("Available Pools")
                            .font(SappTypography.labelMedium)
                            .foregroundColor(SappColors.textSecondary)

                        Spacer()

                        Text("\(viewModel.pools.count) pools")
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textTertiary)
                    }

                    // Pool list sorted by APY
                    ForEach(viewModel.sortedPoolsByAPY) { poolWithRate in
                        PoolRowView(pool: poolWithRate) {
                            viewModel.selectPoolForDeposit(poolWithRate)
                            showDeposit = true
                        }
                    }
                }

                // Error message
                if let error = viewModel.errorMessage {
                    errorBanner(error)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
        }
    }

    // MARK: - Bottom Action Bar

    private var bottomActionBar: some View {
        HStack(spacing: 12) {
            // Close button (small round icon)
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(SappColors.textSecondary)
                    .frame(width: 48, height: 48)
                    .background(Circle().fill(SappColors.surface))
            }

            // Deposit button (primary action)
            if let topPool = viewModel.topPool {
                Button {
                    viewModel.selectPoolForDeposit(topPool)
                    showDeposit = true
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 14))
                        Text("Deposit")
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
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)

            Text("Loading pools...")
                .font(SappTypography.bodySmall)
                .foregroundColor(SappColors.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
    }

    // MARK: - Empty Pools View

    private var emptyPoolsView: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 40, weight: .thin))
                .foregroundColor(SappColors.textTertiary)

            Text("No pools available")
                .font(SappTypography.labelLarge)
                .foregroundColor(SappColors.textPrimary)

            Text("Check back later for yield opportunities.")
                .font(SappTypography.bodySmall)
                .foregroundColor(SappColors.textSecondary)
                .multilineTextAlignment(.center)

            Button {
                Task { await viewModel.refreshData() }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 12))
                    Text("Refresh")
                        .font(SappTypography.labelSmall)
                }
                .foregroundColor(SappColors.accent)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
    }

    // MARK: - Error Banner

    @ViewBuilder
    private func errorBanner(_ message: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.circle.fill")
                .foregroundColor(SappColors.error)

            Text(message)
                .font(SappTypography.caption)
                .foregroundColor(SappColors.error)

            Spacer()

            Button {
                viewModel.errorMessage = nil
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(SappColors.error)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(SappColors.error.opacity(0.1))
        )
    }

    // MARK: - Helpers

    private func loadPoolsAndWalletData() {
        appState.solanaService.walletStatePublisher
            .receive(on: DispatchQueue.main)
            .sink { [self] state in
                if case .connected(let walletInfo) = state {
                    self.walletAddress = walletInfo.publicKey
                    Task {
                        await viewModel.loadAccountData(walletAddress: walletInfo.publicKey)
                    }
                }
            }
            .store(in: &cancellables)
    }
}

#Preview {
    EarnView()
        .environmentObject(AppState())
}
