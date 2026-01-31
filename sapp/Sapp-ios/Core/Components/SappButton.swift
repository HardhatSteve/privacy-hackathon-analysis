import SwiftUI

// MARK: - Sapp Button

struct SappButton: View {
    enum Style {
        case primary
        case secondary
    }

    let title: String
    let style: Style
    let isLoading: Bool
    let isDisabled: Bool
    let action: () -> Void

    init(
        _ title: String,
        style: Style = .primary,
        isLoading: Bool = false,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.style = style
        self.isLoading = isLoading
        self.isDisabled = isDisabled
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack {
                if isLoading {
                    ProgressView()
                        .tint(style == .primary ? Color.white : SappColors.accent)
                }
                Text(title)
                    .font(SappTypography.labelLarge)
                    .frame(maxWidth: .infinity)
            }
            .padding(.vertical, SappSpacing.md)
            .padding(.horizontal, SappSpacing.base)
            .foregroundColor(style == .primary ? Color.white : SappColors.textPrimary)
            .background(background)
            .cornerRadius(SappRadius.medium)
            .overlay(
                RoundedRectangle(cornerRadius: SappRadius.medium)
                    .stroke(style == .secondary ? SappColors.border : Color.clear, lineWidth: 1)
            )
        }
        .disabled(isDisabled || isLoading)
        .opacity(isDisabled || isLoading ? 0.6 : 1.0)
    }

    private var background: Color {
        switch style {
        case .primary:
            return SappColors.accent
        case .secondary:
            return SappColors.surface
        }
    }
}
