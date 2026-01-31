import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var appState: AppState
    @State private var selectedTab = 0
    let onSignOut: () -> Void

    var body: some View {
        TabView(selection: $selectedTab) {
            // Messages - Primary feature
            ConversationsView()
                .tag(0)
                .tabItem {
                    Image(systemName: selectedTab == 0 ? "bubble.left.and.bubble.right.fill" : "bubble.left.and.bubble.right")
                    Text("Messages")
                }

            // Wallet - Secondary feature
            WalletView()
                .tag(1)
                .tabItem {
                    Image(systemName: selectedTab == 1 ? "wallet.pass.fill" : "wallet.pass")
                    Text("Wallet")
                }

            // Settings
            SettingsView(onSignOut: onSignOut)
                .tag(2)
                .tabItem {
                    Image(systemName: selectedTab == 2 ? "gearshape.fill" : "gearshape")
                    Text("Settings")
                }
        }
        .tint(SappColors.accent)
    }
}
