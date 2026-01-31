import SwiftUI

struct WalletBackupView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var copiedToClipboard = false
    @State private var copiedPrivateKey = false
    @State private var isExporting = false
    @State private var exportedPrivateKey: String?
    @State private var showExportAlert = false
    @State private var showErrorAlert = false
    @State private var errorMessage = ""

    private let privyService = PrivyAuthService.shared

    var walletAddress: String? {
        privyService.unifiedSolanaWalletAddress
    }

    var body: some View {
        ScrollView {
            VStack(spacing: SappSpacing.xl) {
                // Warning banner
                warningBanner

                // Wallet address section
                if let address = walletAddress {
                    walletAddressSection(address: address)
                } else {
                    noWalletSection
                }

                // Private key export section
                privateKeyExportSection

                // Security tips
                securityTipsSection
            }
            .padding(.horizontal, SappSpacing.lg)
            .padding(.vertical, SappSpacing.lg)
        }
        .background(SappColors.background)
        .navigationTitle("Backup Wallet")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Private Key Exported", isPresented: $showExportAlert) {
            Button("Copy to Clipboard") {
                if let key = exportedPrivateKey {
                    UIPasteboard.general.string = key
                    copiedPrivateKey = true
                }
            }
            Button("Close", role: .cancel) {
                exportedPrivateKey = nil
            }
        } message: {
            Text("Your private key has been exported. Store it securely and never share it with anyone.")
        }
        .alert("Export Failed", isPresented: $showErrorAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
    }

    private var warningBanner: some View {
        HStack(spacing: SappSpacing.md) {
            Image(systemName: "info.circle.fill")
                .font(.system(size: 24))
                .foregroundColor(SappColors.accent)

            VStack(alignment: .leading, spacing: 4) {
                Text("Wallet Backup")
                    .font(SappTypography.labelLarge)
                    .foregroundColor(SappColors.textPrimary)

                Text("Your wallet is securely managed. Save your wallet address to receive funds.")
                    .font(SappTypography.caption)
                    .foregroundColor(SappColors.textSecondary)
            }
        }
        .padding(SappSpacing.md)
        .background(SappColors.accentLight)
        .cornerRadius(SappRadius.medium)
    }

    private var noWalletSection: some View {
        VStack(spacing: SappSpacing.md) {
            Image(systemName: "wallet.pass")
                .font(.system(size: 48))
                .foregroundColor(SappColors.textTertiary)

            Text("No Wallet Yet")
                .font(SappTypography.headlineMedium)
                .foregroundColor(SappColors.textPrimary)

            Text("Create a wallet to send and receive crypto")
                .font(SappTypography.bodySmall)
                .foregroundColor(SappColors.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(SappSpacing.xl)
        .frame(maxWidth: .infinity)
        .background(SappColors.surface)
        .cornerRadius(SappRadius.medium)
    }

    private func walletAddressSection(address: String) -> some View {
        VStack(alignment: .leading, spacing: SappSpacing.md) {
            Text("WALLET ADDRESS")
                .font(SappTypography.overline)
                .foregroundColor(SappColors.textTertiary)

            VStack(spacing: SappSpacing.sm) {
                Text(address)
                    .font(.system(size: 14, design: .monospaced))
                    .foregroundColor(SappColors.textPrimary)
                    .lineLimit(nil)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)

                Button {
                    UIPasteboard.general.string = address
                    copiedToClipboard = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        copiedToClipboard = false
                    }
                } label: {
                    HStack {
                        Image(systemName: copiedToClipboard ? "checkmark.circle.fill" : "doc.on.doc")
                        Text(copiedToClipboard ? "Copied!" : "Copy Address")
                    }
                    .font(SappTypography.labelMedium)
                    .foregroundColor(copiedToClipboard ? .green : SappColors.accent)
                }
            }
            .padding(SappSpacing.md)
            .background(SappColors.surface)
            .cornerRadius(SappRadius.medium)
        }
    }

    private var privateKeyExportSection: some View {
        VStack(alignment: .leading, spacing: SappSpacing.md) {
            Text("PRIVATE KEY EXPORT")
                .font(SappTypography.overline)
                .foregroundColor(SappColors.textTertiary)

            VStack(spacing: SappSpacing.md) {
                VStack(alignment: .leading, spacing: SappSpacing.sm) {
                    HStack(alignment: .top, spacing: SappSpacing.sm) {
                        Image(systemName: "key.fill")
                            .font(.system(size: 20))
                            .foregroundColor(SappColors.accent)
                            .frame(width: 28)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Export Private Key")
                                .font(SappTypography.labelMedium)
                                .foregroundColor(SappColors.textPrimary)

                            Text("Export your wallet's private key to use it with other wallet apps like Phantom or Solflare.")
                                .font(SappTypography.caption)
                                .foregroundColor(SappColors.textSecondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }

                    if walletAddress != nil {
                        Button {
                            Task {
                                await exportPrivateKey()
                            }
                        } label: {
                            HStack {
                                if isExporting {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Image(systemName: "key.fill")
                                    Text("Export Private Key")
                                }
                            }
                            .font(SappTypography.labelMedium)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, SappSpacing.sm)
                            .background(isExporting ? SappColors.accent.opacity(0.5) : SappColors.accent)
                            .cornerRadius(SappRadius.medium)
                        }
                        .disabled(isExporting)
                    }

                    // Show exported key if available
                    if let privateKey = exportedPrivateKey {
                        VStack(alignment: .leading, spacing: SappSpacing.sm) {
                            Divider()

                            Text("PRIVATE KEY")
                                .font(SappTypography.overline)
                                .foregroundColor(SappColors.textTertiary)

                            Text(privateKey)
                                .font(.system(size: 12, design: .monospaced))
                                .foregroundColor(SappColors.textPrimary)
                                .lineLimit(nil)
                                .multilineTextAlignment(.leading)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(SappSpacing.sm)
                                .background(SappColors.background)
                                .cornerRadius(SappRadius.small)

                            Button {
                                UIPasteboard.general.string = privateKey
                                copiedPrivateKey = true
                                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                    copiedPrivateKey = false
                                }
                            } label: {
                                HStack {
                                    Image(systemName: copiedPrivateKey ? "checkmark.circle.fill" : "doc.on.doc")
                                    Text(copiedPrivateKey ? "Copied!" : "Copy Private Key")
                                }
                                .font(SappTypography.labelMedium)
                                .foregroundColor(copiedPrivateKey ? .green : SappColors.accent)
                            }
                        }
                    }
                }

                Divider()

                VStack(alignment: .leading, spacing: SappSpacing.xs) {
                    HStack(alignment: .top, spacing: SappSpacing.xs) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 12))
                            .foregroundColor(.orange)

                        Text("Never share your private key with anyone. Anyone with your private key can access your funds.")
                            .font(SappTypography.caption)
                            .foregroundColor(SappColors.textSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
            .padding(SappSpacing.md)
            .background(SappColors.surface)
            .cornerRadius(SappRadius.medium)
        }
    }

    private var securityTipsSection: some View {
        VStack(alignment: .leading, spacing: SappSpacing.md) {
            Text("SECURITY TIPS")
                .font(SappTypography.overline)
                .foregroundColor(SappColors.textTertiary)

            VStack(alignment: .leading, spacing: SappSpacing.sm) {
                SecurityTipRow(
                    icon: "checkmark.shield.fill",
                    text: "Your wallet is managed securely on our servers"
                )
                SecurityTipRow(
                    icon: "arrow.down.doc.fill",
                    text: "Save your wallet address to receive funds"
                )
                SecurityTipRow(
                    icon: "lock.fill",
                    text: "Never share your private key with anyone"
                )
                SecurityTipRow(
                    icon: "exclamationmark.triangle.fill",
                    text: "Only send crypto to trusted addresses"
                )
            }
            .padding(SappSpacing.md)
            .background(SappColors.surface)
            .cornerRadius(SappRadius.medium)
        }
    }

    // MARK: - Actions

    private func exportPrivateKey() async {
        isExporting = true

        do {
            // Try server wallet export first, fall back to embedded wallet
            if privyService.useServerWallets {
                let privateKey = try await privyService.exportWalletViaServer()
                await MainActor.run {
                    exportedPrivateKey = privateKey
                    showExportAlert = true
                    isExporting = false
                }
            } else {
                // For embedded wallets, show error - they need to use web export
                await MainActor.run {
                    errorMessage = "Embedded wallet export requires web authentication. Please contact support for assistance."
                    showErrorAlert = true
                    isExporting = false
                }
            }
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
                showErrorAlert = true
                isExporting = false
            }
        }
    }
}

struct SecurityTipRow: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: SappSpacing.sm) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(SappColors.accent)
                .frame(width: 24)

            Text(text)
                .font(SappTypography.bodySmall)
                .foregroundColor(SappColors.textPrimary)
        }
    }
}
