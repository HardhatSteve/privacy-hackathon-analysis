import SwiftUI
import AVFoundation

// MARK: - QR Scanner View

struct QRScannerView: View {
    @StateObject private var scanner = QRCodeScanner()
    @Environment(\.dismiss) private var dismiss

    let onScan: (QRCodeType) -> Void

    @State private var hasPermission = false
    @State private var showPermissionAlert = false
    @State private var isInitialized = false

    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                Color.black.ignoresSafeArea()

                if hasPermission && isInitialized {
                    // Camera preview
                    QRScannerPreview(scanner: scanner)
                        .ignoresSafeArea()

                    // Overlay
                    scannerOverlay
                } else if !hasPermission {
                    permissionDeniedView
                } else {
                    ProgressView()
                        .tint(.white)
                }

                // Scanned result
                if let code = scanner.scannedCode {
                    scannedResultOverlay(code)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }

                ToolbarItem(placement: .principal) {
                    Text("Scan QR Code")
                        .font(SappTypography.headlineSmall)
                        .foregroundColor(.white)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        scanner.toggleTorch()
                    } label: {
                        Image(systemName: scanner.torchEnabled ? "flashlight.on.fill" : "flashlight.off.fill")
                            .foregroundColor(.white)
                    }
                }
            }
            .toolbarBackground(.hidden, for: .navigationBar)
            .alert("Camera Permission Required", isPresented: $showPermissionAlert) {
                Button("Open Settings") {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
                Button("Cancel", role: .cancel) {
                    dismiss()
                }
            } message: {
                Text("Please enable camera access in Settings to scan QR codes.")
            }
            .task {
                await setupScanner()
            }
            .onDisappear {
                scanner.stopScanning()
            }
        }
    }

    // MARK: - Scanner Overlay

    private var scannerOverlay: some View {
        GeometryReader { geometry in
            let scanAreaSize = min(geometry.size.width, geometry.size.height) * 0.7

            ZStack {
                // Dimmed background with cutout
                Rectangle()
                    .fill(Color.black.opacity(0.5))
                    .mask(
                        ZStack {
                            Rectangle()
                            RoundedRectangle(cornerRadius: 20)
                                .frame(width: scanAreaSize, height: scanAreaSize)
                                .blendMode(.destinationOut)
                        }
                        .compositingGroup()
                    )

                // Scan frame corners
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color.white, lineWidth: 3)
                    .frame(width: scanAreaSize, height: scanAreaSize)

                // Corner accents
                scanFrameCorners(size: scanAreaSize)

                // Instructions
                VStack {
                    Spacer()

                    VStack(spacing: SappSpacing.sm) {
                        Text("Position the QR code within the frame")
                            .font(SappTypography.bodyMedium)
                            .foregroundColor(.white)
                            .multilineTextAlignment(.center)

                        Text("Supports Sapp handles, Solana addresses, and payment requests")
                            .font(SappTypography.caption)
                            .foregroundColor(.white.opacity(0.7))
                            .multilineTextAlignment(.center)
                    }
                    .padding(.horizontal, SappSpacing.xl)
                    .padding(.bottom, SappSpacing.xxxl)
                }
            }
        }
    }

    private func scanFrameCorners(size: CGFloat) -> some View {
        let cornerLength: CGFloat = 30
        let cornerWidth: CGFloat = 4

        return ZStack {
            // Top-left
            VStack(alignment: .leading, spacing: 0) {
                Rectangle()
                    .fill(SappColors.accent)
                    .frame(width: cornerLength, height: cornerWidth)
                Rectangle()
                    .fill(SappColors.accent)
                    .frame(width: cornerWidth, height: cornerLength)
            }
            .offset(x: -size/2 + cornerWidth/2, y: -size/2 + cornerWidth/2)

            // Top-right
            VStack(alignment: .trailing, spacing: 0) {
                Rectangle()
                    .fill(SappColors.accent)
                    .frame(width: cornerLength, height: cornerWidth)
                HStack {
                    Spacer()
                    Rectangle()
                        .fill(SappColors.accent)
                        .frame(width: cornerWidth, height: cornerLength)
                }
            }
            .frame(width: cornerLength)
            .offset(x: size/2 - cornerLength/2, y: -size/2 + cornerWidth/2)

            // Bottom-left
            VStack(alignment: .leading, spacing: 0) {
                Rectangle()
                    .fill(SappColors.accent)
                    .frame(width: cornerWidth, height: cornerLength)
                Rectangle()
                    .fill(SappColors.accent)
                    .frame(width: cornerLength, height: cornerWidth)
            }
            .offset(x: -size/2 + cornerWidth/2, y: size/2 - cornerLength)

            // Bottom-right
            VStack(alignment: .trailing, spacing: 0) {
                HStack {
                    Spacer()
                    Rectangle()
                        .fill(SappColors.accent)
                        .frame(width: cornerWidth, height: cornerLength)
                }
                Rectangle()
                    .fill(SappColors.accent)
                    .frame(width: cornerLength, height: cornerWidth)
            }
            .frame(width: cornerLength)
            .offset(x: size/2 - cornerLength/2, y: size/2 - cornerLength)
        }
    }

    // MARK: - Scanned Result Overlay

    private func scannedResultOverlay(_ code: String) -> some View {
        let parsedCode = QRCodeType.parse(code)

        return VStack {
            Spacer()

            VStack(spacing: SappSpacing.lg) {
                // Success icon
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 48))
                    .foregroundColor(SappColors.success)

                // Result type
                VStack(spacing: SappSpacing.xs) {
                    Text(resultTitle(for: parsedCode))
                        .font(SappTypography.headlineMedium)
                        .foregroundColor(SappColors.textPrimary)

                    Text(resultSubtitle(for: parsedCode))
                        .font(SappTypography.bodySmall)
                        .foregroundColor(SappColors.textSecondary)
                        .lineLimit(2)
                        .multilineTextAlignment(.center)
                }

                // Action button
                Button {
                    onScan(parsedCode)
                    dismiss()
                } label: {
                    Text(actionTitle(for: parsedCode))
                }
                .buttonStyle(SappPrimaryButtonStyle())
                .frame(maxWidth: 200)

                // Scan again button
                Button {
                    scanner.reset()
                    scanner.startScanning()
                } label: {
                    Text("Scan Again")
                        .font(SappTypography.labelMedium)
                        .foregroundColor(SappColors.textSecondary)
                }
            }
            .padding(SappSpacing.xl)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.large)
                    .fill(SappColors.surface)
            )
            .padding(.horizontal, SappSpacing.xl)
            .padding(.bottom, SappSpacing.xxxl)
        }
        .transition(.move(edge: .bottom).combined(with: .opacity))
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: scanner.scannedCode)
    }

    // MARK: - Permission Denied View

    private var permissionDeniedView: some View {
        VStack(spacing: SappSpacing.lg) {
            Image(systemName: "camera.fill")
                .font(.system(size: 64))
                .foregroundColor(.white.opacity(0.5))

            Text("Camera Access Required")
                .font(SappTypography.headlineMedium)
                .foregroundColor(.white)

            Text("Please allow camera access to scan QR codes")
                .font(SappTypography.bodyMedium)
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)

            Button {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            } label: {
                Text("Open Settings")
            }
            .buttonStyle(SappPrimaryButtonStyle())
            .frame(maxWidth: 200)
        }
        .padding(SappSpacing.xl)
    }

    // MARK: - Helper Methods

    private func setupScanner() async {
        hasPermission = await scanner.requestPermission()

        guard hasPermission else {
            showPermissionAlert = true
            return
        }

        do {
            try scanner.setupSession()
            isInitialized = true
            scanner.startScanning()
        } catch {
            scanner.error = error as? QRScannerError ?? .inputError(error.localizedDescription)
        }
    }

    private func resultTitle(for type: QRCodeType) -> String {
        switch type {
        case .solanaAddress:
            return "Solana Address"
        case .sappHandle(let handle):
            return "@\(handle)"
        case .paymentRequest:
            return "Payment Request"
        case .unknown:
            return "QR Code Scanned"
        }
    }

    private func resultSubtitle(for type: QRCodeType) -> String {
        switch type {
        case .solanaAddress(let address):
            return address.prefix(8) + "..." + address.suffix(8)
        case .sappHandle:
            return "Sapp user found"
        case .paymentRequest(let address, let amount, let token):
            if let amount = amount, let token = token {
                return "\(amount) \(token) to \(address.prefix(8))..."
            }
            return "Send to \(address.prefix(8))..."
        case .unknown(let code):
            return code.prefix(30) + (code.count > 30 ? "..." : "")
        }
    }

    private func actionTitle(for type: QRCodeType) -> String {
        switch type {
        case .solanaAddress:
            return "Send SOL"
        case .sappHandle:
            return "Start Chat"
        case .paymentRequest:
            return "Continue"
        case .unknown:
            return "Copy"
        }
    }
}

// MARK: - Preview

#Preview {
    QRScannerView { result in
        print("Scanned: \(result)")
    }
}
