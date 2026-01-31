import SwiftUI
import AVFoundation
import Combine

// MARK: - QR Code Scanner

/// Handles QR code scanning using AVFoundation
final class QRCodeScanner: NSObject, ObservableObject {

    // MARK: - Published State

    @Published var scannedCode: String?
    @Published var isScanning = false
    @Published var error: QRScannerError?
    @Published var torchEnabled = false

    // MARK: - Private Properties

    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private let sessionQueue = DispatchQueue(label: "com.sapp.qrscanner")

    // MARK: - Initialization

    override init() {
        super.init()
    }

    // MARK: - Public Methods

    /// Request camera permission
    func requestPermission() async -> Bool {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            return true
        case .notDetermined:
            return await AVCaptureDevice.requestAccess(for: .video)
        case .denied, .restricted:
            return false
        @unknown default:
            return false
        }
    }

    /// Setup the capture session
    func setupSession() throws {
        guard captureSession == nil else { return }

        let session = AVCaptureSession()

        // Get video device
        guard let videoDevice = AVCaptureDevice.default(for: .video) else {
            throw QRScannerError.deviceNotAvailable
        }

        // Create video input
        let videoInput: AVCaptureDeviceInput
        do {
            videoInput = try AVCaptureDeviceInput(device: videoDevice)
        } catch {
            throw QRScannerError.inputError(error.localizedDescription)
        }

        // Add input to session
        guard session.canAddInput(videoInput) else {
            throw QRScannerError.cannotAddInput
        }
        session.addInput(videoInput)

        // Create metadata output
        let metadataOutput = AVCaptureMetadataOutput()

        guard session.canAddOutput(metadataOutput) else {
            throw QRScannerError.cannotAddOutput
        }
        session.addOutput(metadataOutput)

        // Configure for QR codes
        metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
        metadataOutput.metadataObjectTypes = [.qr]

        // Store session
        captureSession = session

        // Create preview layer
        let layer = AVCaptureVideoPreviewLayer(session: session)
        layer.videoGravity = .resizeAspectFill
        previewLayer = layer
    }

    /// Start scanning
    func startScanning() {
        guard let session = captureSession, !session.isRunning else { return }

        sessionQueue.async { [weak self] in
            session.startRunning()
            DispatchQueue.main.async {
                self?.isScanning = true
                self?.scannedCode = nil
                self?.error = nil
            }
        }
    }

    /// Stop scanning
    func stopScanning() {
        guard let session = captureSession, session.isRunning else { return }

        sessionQueue.async { [weak self] in
            session.stopRunning()
            DispatchQueue.main.async {
                self?.isScanning = false
            }
        }
    }

    /// Toggle torch/flashlight
    func toggleTorch() {
        guard let device = AVCaptureDevice.default(for: .video),
              device.hasTorch else { return }

        do {
            try device.lockForConfiguration()
            device.torchMode = device.torchMode == .on ? .off : .on
            torchEnabled = device.torchMode == .on
            device.unlockForConfiguration()
        } catch {
            self.error = .torchError(error.localizedDescription)
        }
    }

    /// Get the preview layer for display
    func getPreviewLayer() -> AVCaptureVideoPreviewLayer? {
        previewLayer
    }

    /// Reset scanner for new scan
    func reset() {
        scannedCode = nil
        error = nil
    }
}

// MARK: - AVCaptureMetadataOutputObjectsDelegate

extension QRCodeScanner: AVCaptureMetadataOutputObjectsDelegate {

    func metadataOutput(
        _ output: AVCaptureMetadataOutput,
        didOutput metadataObjects: [AVMetadataObject],
        from connection: AVCaptureConnection
    ) {
        guard let metadataObject = metadataObjects.first,
              let readableObject = metadataObject as? AVMetadataMachineReadableCodeObject,
              let stringValue = readableObject.stringValue else {
            return
        }

        // Vibrate to indicate successful scan
        AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))

        // Update state
        scannedCode = stringValue
        stopScanning()
    }
}

// MARK: - QR Scanner Errors

enum QRScannerError: Error, LocalizedError {
    case deviceNotAvailable
    case inputError(String)
    case cannotAddInput
    case cannotAddOutput
    case permissionDenied
    case torchError(String)

    var errorDescription: String? {
        switch self {
        case .deviceNotAvailable:
            return "Camera is not available on this device"
        case .inputError(let message):
            return "Could not create camera input: \(message)"
        case .cannotAddInput:
            return "Could not add camera input to session"
        case .cannotAddOutput:
            return "Could not add metadata output to session"
        case .permissionDenied:
            return "Camera permission was denied. Please enable it in Settings."
        case .torchError(let message):
            return "Could not toggle flashlight: \(message)"
        }
    }
}

// MARK: - QR Scanner View Representable

/// UIViewRepresentable wrapper for the camera preview
struct QRScannerPreview: UIViewRepresentable {
    let scanner: QRCodeScanner

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)

        if let previewLayer = scanner.getPreviewLayer() {
            previewLayer.frame = view.bounds
            view.layer.addSublayer(previewLayer)
        }

        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        if let previewLayer = scanner.getPreviewLayer() {
            previewLayer.frame = uiView.bounds
        }
    }
}

// MARK: - QR Code Parsing Utilities

enum QRCodeType {
    case solanaAddress(String)
    case sappHandle(String)
    case paymentRequest(address: String, amount: Double?, token: String?)
    case unknown(String)

    static func parse(_ code: String) -> QRCodeType {
        // Check if it's a Solana address (base58, 32-44 chars)
        if code.count >= 32 && code.count <= 44 && code.allSatisfy({ $0.isLetter || $0.isNumber }) {
            // Basic validation for Solana address (base58 characters)
            let base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
            if code.allSatisfy({ base58Chars.contains($0) }) {
                return .solanaAddress(code)
            }
        }

        // Check if it's a Sapp handle (starts with @)
        if code.hasPrefix("@") {
            let handle = String(code.dropFirst())
            if isValidHandle(handle) {
                return .sappHandle(handle)
            }
        }

        // Check if it's a sapp:// URL scheme
        if code.hasPrefix("sapp://") {
            return parseSappURL(code)
        }

        // Check if it's a Solana Pay URL
        if code.hasPrefix("solana:") {
            return parseSolanaPayURL(code)
        }

        return .unknown(code)
    }

    private static func isValidHandle(_ handle: String) -> Bool {
        let handleRegex = "^[a-z0-9_]{3,20}$"
        return handle.range(of: handleRegex, options: .regularExpression) != nil
    }

    private static func parseSappURL(_ url: String) -> QRCodeType {
        // Format: sapp://pay?to=handle&amount=1.5&token=SOL
        guard let components = URLComponents(string: url),
              let host = components.host else {
            return .unknown(url)
        }

        switch host {
        case "pay":
            let queryItems = components.queryItems ?? []
            let to = queryItems.first { $0.name == "to" }?.value
            let amount = queryItems.first { $0.name == "amount" }?.value.flatMap { Double($0) }
            let token = queryItems.first { $0.name == "token" }?.value

            if let to = to {
                if isValidHandle(to) {
                    return .sappHandle(to)
                }
                return .paymentRequest(address: to, amount: amount, token: token)
            }

        case "user":
            let queryItems = components.queryItems ?? []
            if let handle = queryItems.first(where: { $0.name == "handle" })?.value {
                return .sappHandle(handle)
            }

        default:
            break
        }

        return .unknown(url)
    }

    private static func parseSolanaPayURL(_ url: String) -> QRCodeType {
        // Format: solana:<recipient>?amount=1&spl-token=<mint>&reference=<ref>&label=<label>&message=<message>&memo=<memo>
        let cleanUrl = url.replacingOccurrences(of: "solana:", with: "")
        let parts = cleanUrl.split(separator: "?", maxSplits: 1)

        guard let address = parts.first.map(String.init) else {
            return .unknown(url)
        }

        if parts.count == 1 {
            return .solanaAddress(address)
        }

        // Parse query parameters
        var amount: Double?
        var token: String? = "SOL"

        if parts.count > 1 {
            let queryString = String(parts[1])
            let params = queryString.split(separator: "&")

            for param in params {
                let keyValue = param.split(separator: "=", maxSplits: 1)
                guard keyValue.count == 2 else { continue }

                let key = String(keyValue[0])
                let value = String(keyValue[1]).removingPercentEncoding ?? String(keyValue[1])

                switch key {
                case "amount":
                    amount = Double(value)
                case "spl-token":
                    token = value
                default:
                    break
                }
            }
        }

        return .paymentRequest(address: address, amount: amount, token: token)
    }
}
