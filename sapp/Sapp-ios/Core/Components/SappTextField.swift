import SwiftUI
import UIKit

struct SappTextField: View {
    let title: String
    let placeholder: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    var isSecure: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: SappSpacing.xs) {
            Text(title)
                .font(SappTypography.caption)
                .foregroundColor(SappColors.textSecondary)
            Group {
                if isSecure {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                }
            }
            .font(SappTypography.bodyMedium)
            .keyboardType(keyboardType)
            .padding(.vertical, SappSpacing.sm)
            .padding(.horizontal, SappSpacing.base)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.medium)
                    .strokeBorder(SappColors.border, lineWidth: 1)
            )
        }
    }
}
