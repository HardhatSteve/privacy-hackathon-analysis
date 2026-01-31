import UIKit
import AVFoundation

// MARK: - Feedback Service

/// Service for providing user feedback (haptics and sounds)
/// Used for message arrival notifications and UI interactions
final class FeedbackService {
    static let shared = FeedbackService()

    private let impactGenerator = UIImpactFeedbackGenerator(style: .medium)
    private let notificationGenerator = UINotificationFeedbackGenerator()
    private let selectionGenerator = UISelectionFeedbackGenerator()

    private init() {
        // Prepare generators for immediate response
        impactGenerator.prepare()
        notificationGenerator.prepare()
        selectionGenerator.prepare()
    }

    // MARK: - Message Feedback

    /// Trigger haptic feedback for incoming message
    func triggerMessageReceivedHaptic() {
        let settings = loadChatSettings()
        guard settings.vibrationEnabled else { return }
        impactGenerator.impactOccurred()
    }

    /// Play sound for incoming message
    func playMessageReceivedSound() {
        let settings = loadChatSettings()
        guard settings.soundEnabled else { return }
        // System sound 1007 is the standard message received sound
        AudioServicesPlaySystemSound(1007)
    }

    /// Combined feedback for new message arrival
    /// Provides both haptic and sound feedback based on user settings
    func triggerMessageArrivalFeedback() {
        triggerMessageReceivedHaptic()
        playMessageReceivedSound()
    }

    // MARK: - Transaction Feedback

    /// Trigger success haptic (for completed transactions, successful sends)
    func triggerSuccessHaptic() {
        let settings = loadChatSettings()
        guard settings.vibrationEnabled else { return }
        notificationGenerator.notificationOccurred(.success)
    }

    /// Trigger error haptic (for failed operations)
    func triggerErrorHaptic() {
        let settings = loadChatSettings()
        guard settings.vibrationEnabled else { return }
        notificationGenerator.notificationOccurred(.error)
    }

    /// Trigger warning haptic (for important alerts)
    func triggerWarningHaptic() {
        let settings = loadChatSettings()
        guard settings.vibrationEnabled else { return }
        notificationGenerator.notificationOccurred(.warning)
    }

    // MARK: - UI Interaction Feedback

    /// Trigger selection feedback (for UI selections, toggles)
    func triggerSelectionFeedback() {
        let settings = loadChatSettings()
        guard settings.vibrationEnabled else { return }
        selectionGenerator.selectionChanged()
    }

    /// Trigger light impact (for button taps)
    func triggerLightImpact() {
        let settings = loadChatSettings()
        guard settings.vibrationEnabled else { return }
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
    }

    /// Trigger heavy impact (for important actions)
    func triggerHeavyImpact() {
        let settings = loadChatSettings()
        guard settings.vibrationEnabled else { return }
        let generator = UIImpactFeedbackGenerator(style: .heavy)
        generator.impactOccurred()
    }

    // MARK: - Payment Request Feedback

    /// Trigger feedback for payment request received
    func triggerPaymentRequestFeedback() {
        let settings = loadChatSettings()
        guard settings.vibrationEnabled else { return }
        // Double tap pattern for payment requests
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            generator.impactOccurred()
        }
        if settings.soundEnabled {
            // Use a distinct sound for payment requests
            AudioServicesPlaySystemSound(1016)
        }
    }

    /// Trigger feedback for payment completed
    func triggerPaymentCompletedFeedback() {
        triggerSuccessHaptic()
        let settings = loadChatSettings()
        if settings.soundEnabled {
            // Payment complete sound
            AudioServicesPlaySystemSound(1054)
        }
    }

    // MARK: - Settings

    /// Load chat settings from UserDefaults
    private func loadChatSettings() -> ChatSettings {
        if let data = UserDefaults.standard.data(forKey: "chatSettings"),
           let settings = try? JSONDecoder().decode(ChatSettings.self, from: data) {
            return settings
        }
        return ChatSettings() // Default settings
    }

    /// Prepare haptic generators for immediate response
    /// Call this before performing actions that will need haptic feedback
    func prepareHaptics() {
        impactGenerator.prepare()
        notificationGenerator.prepare()
        selectionGenerator.prepare()
    }
}
