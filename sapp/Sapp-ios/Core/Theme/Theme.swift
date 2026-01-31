import SwiftUI

// MARK: - Sapp Design System
// Modern, type-driven layout with high-contrast serif/sans-serif pairing,
// generous whitespace, minimal color palette, and understated buttons.

enum SappColors {
    // Primary palette - minimal and high contrast
    static let background = Color(red: 0.98, green: 0.98, blue: 0.97)      // Off-white #FAFAF8
    static let surface = Color.white                                         // Pure white for cards
    static let textPrimary = Color(red: 0.1, green: 0.1, blue: 0.1)         // Near-black #1A1A1A
    static let textSecondary = Color(red: 0.45, green: 0.45, blue: 0.45)    // Medium gray #737373
    static let textTertiary = Color(red: 0.65, green: 0.65, blue: 0.65)     // Light gray #A6A6A6
    
    // Accent - subtle, not overwhelming
    static let accent = Color(red: 0.1, green: 0.1, blue: 0.1)              // Black accent
    static let accentLight = Color(red: 0.95, green: 0.95, blue: 0.95)      // Light gray for hover states
    
    // Borders and dividers
    static let border = Color(red: 0.88, green: 0.88, blue: 0.88)           // Subtle border #E0E0E0
    static let borderStrong = Color(red: 0.1, green: 0.1, blue: 0.1)        // Strong border (black)
    
    // Semantic colors
    static let success = Color(red: 0.2, green: 0.6, blue: 0.4)             // Muted green
    static let error = Color(red: 0.8, green: 0.3, blue: 0.3)               // Muted red
    static let warning = Color(red: 0.85, green: 0.65, blue: 0.2)           // Muted amber
    static let info = Color(red: 0.3, green: 0.5, blue: 0.7)                // Muted blue
    
    // Message bubbles
    static let messageSent = Color(red: 0.1, green: 0.1, blue: 0.1)         // Black for sent
    static let messageReceived = Color(red: 0.95, green: 0.95, blue: 0.95)  // Light gray for received
    
    static let primary = accent
}

enum SappSpacing {
    static let xxs: CGFloat = 2
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let base: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
    static let xxxl: CGFloat = 64
}

enum SappRadius {
    static let xs: CGFloat = 4
    static let small: CGFloat = 8
    static let medium: CGFloat = 12
    static let large: CGFloat = 16
    static let xl: CGFloat = 24
    static let full: CGFloat = 9999  // For pill shapes
}

enum SappTypography {
    // Serif fonts for headlines - elegant, editorial feel
    static let displayLarge = Font.system(size: 40, weight: .light, design: .serif)
    static let displayMedium = Font.system(size: 32, weight: .light, design: .serif)
    static let displaySmall = Font.system(size: 28, weight: .regular, design: .serif)
    
    // Sans-serif for body and UI elements - clean, readable
    static let headlineLarge = Font.system(size: 24, weight: .semibold, design: .default)
    static let headlineMedium = Font.system(size: 20, weight: .semibold, design: .default)
    static let headlineSmall = Font.system(size: 18, weight: .medium, design: .default)
    
    static let bodyLarge = Font.system(size: 17, weight: .regular, design: .default)
    static let bodyMedium = Font.system(size: 15, weight: .regular, design: .default)
    static let bodySmall = Font.system(size: 13, weight: .regular, design: .default)
    
    static let labelLarge = Font.system(size: 14, weight: .medium, design: .default)
    static let labelMedium = Font.system(size: 12, weight: .medium, design: .default)
    static let labelSmall = Font.system(size: 11, weight: .medium, design: .default)
    
    static let caption = Font.system(size: 12, weight: .regular, design: .default)
    static let overline = Font.system(size: 10, weight: .semibold, design: .default)
    
    // Monospace for addresses and codes
    static let mono = Font.system(size: 14, weight: .regular, design: .monospaced)
    static let monoSmall = Font.system(size: 12, weight: .regular, design: .monospaced)
    
    // Legacy aliases for backward compatibility
    static let titleFont = displaySmall
}

// MARK: - Button Styles

struct SappPrimaryButtonStyle: ButtonStyle {
    var isEnabled: Bool = true
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(SappTypography.labelLarge)
            .foregroundColor(isEnabled ? .white : SappColors.textTertiary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, SappSpacing.md)
            .padding(.horizontal, SappSpacing.lg)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.medium)
                    .fill(isEnabled ? SappColors.accent : SappColors.accentLight)
            )
            .opacity(configuration.isPressed ? 0.85 : 1.0)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct SappSecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(SappTypography.labelLarge)
            .foregroundColor(SappColors.textPrimary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, SappSpacing.md)
            .padding(.horizontal, SappSpacing.lg)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.medium)
                    .stroke(SappColors.border, lineWidth: 1)
                    .background(
                        RoundedRectangle(cornerRadius: SappRadius.medium)
                            .fill(configuration.isPressed ? SappColors.accentLight : SappColors.surface)
                    )
            )
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct SappTextButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(SappTypography.labelLarge)
            .foregroundColor(SappColors.textPrimary)
            .opacity(configuration.isPressed ? 0.6 : 1.0)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

// MARK: - View Extensions

extension View {
    func sappCard() -> some View {
        self
            .padding(SappSpacing.lg)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.large)
                    .fill(SappColors.surface)
                    .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
            )
    }

    func sappCardBordered() -> some View {
        self
            .padding(SappSpacing.lg)
            .background(
                RoundedRectangle(cornerRadius: SappRadius.large)
                    .fill(SappColors.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: SappRadius.large)
                            .stroke(SappColors.border, lineWidth: 1)
                    )
            )
    }
}

// MARK: - Floating Action Button Components

/// A thumb-friendly floating action button positioned at bottom-right
/// Designed for single-handed phone use
struct FloatingActionButton: View {
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 24, weight: .medium))
                .foregroundColor(.white)
                .frame(width: 56, height: 56)
                .background(
                    Circle()
                        .fill(SappColors.accent)
                        .shadow(color: Color.black.opacity(0.15), radius: 8, x: 0, y: 4)
                )
        }
        .buttonStyle(.plain)
    }
}

/// A floating action button that expands to show multiple actions
struct FloatingActionMenu: View {
    let primaryIcon: String
    let expandedIcon: String
    let actions: [FABAction]

    @State private var isExpanded = false

    init(
        primaryIcon: String = "plus",
        expandedIcon: String = "xmark",
        actions: [FABAction]
    ) {
        self.primaryIcon = primaryIcon
        self.expandedIcon = expandedIcon
        self.actions = actions
    }

    var body: some View {
        VStack(alignment: .trailing, spacing: SappSpacing.md) {
            // Action buttons (shown when expanded)
            if isExpanded {
                ForEach(actions.indices.reversed(), id: \.self) { index in
                    let action = actions[index]
                    FABMenuItem(
                        icon: action.icon,
                        label: action.label,
                        color: action.color ?? SappColors.accent
                    ) {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            isExpanded = false
                        }
                        action.action()
                    }
                    .transition(.asymmetric(
                        insertion: .scale.combined(with: .opacity).combined(with: .offset(y: 20)),
                        removal: .scale.combined(with: .opacity)
                    ))
                }
            }

            // Main FAB button
            Button {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    isExpanded.toggle()
                }
            } label: {
                Image(systemName: isExpanded ? expandedIcon : primaryIcon)
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(
                        Circle()
                            .fill(SappColors.accent)
                            .shadow(color: Color.black.opacity(0.15), radius: 8, x: 0, y: 4)
                    )
                    .rotationEffect(.degrees(isExpanded ? 45 : 0))
            }
            .buttonStyle(.plain)
        }
    }
}

/// Individual FAB menu item with label and icon
struct FABMenuItem: View {
    let icon: String
    let label: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: SappSpacing.sm) {
                Text(label)
                    .font(SappTypography.labelMedium)
                    .foregroundColor(SappColors.textPrimary)
                    .padding(.horizontal, SappSpacing.md)
                    .padding(.vertical, SappSpacing.sm)
                    .background(
                        Capsule()
                            .fill(SappColors.surface)
                            .shadow(color: Color.black.opacity(0.08), radius: 4, x: 0, y: 2)
                    )

                Image(systemName: icon)
                    .font(.system(size: 18, weight: .medium))
                    .foregroundColor(.white)
                    .frame(width: 44, height: 44)
                    .background(
                        Circle()
                            .fill(color)
                            .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
                    )
            }
        }
        .buttonStyle(.plain)
    }
}

/// Model for FAB action items
struct FABAction: Identifiable {
    let id = UUID()
    let icon: String
    let label: String
    let color: Color?
    let action: () -> Void

    init(icon: String, label: String, color: Color? = nil, action: @escaping () -> Void) {
        self.icon = icon
        self.label = label
        self.color = color
        self.action = action
    }
}

/// View modifier that adds a FAB to any view at the bottom-right corner
struct FABContainerModifier: ViewModifier {
    let fab: AnyView

    func body(content: Content) -> some View {
        ZStack(alignment: .bottomTrailing) {
            content

            fab
                .padding(.trailing, SappSpacing.lg)
                .padding(.bottom, SappSpacing.lg)
        }
    }
}

extension View {
    /// Adds a single floating action button to the bottom-right corner
    func floatingActionButton(icon: String, action: @escaping () -> Void) -> some View {
        modifier(FABContainerModifier(
            fab: AnyView(FloatingActionButton(icon: icon, action: action))
        ))
    }

    /// Adds an expandable floating action menu to the bottom-right corner
    func floatingActionMenu(
        primaryIcon: String = "plus",
        expandedIcon: String = "xmark",
        actions: [FABAction]
    ) -> some View {
        modifier(FABContainerModifier(
            fab: AnyView(FloatingActionMenu(
                primaryIcon: primaryIcon,
                expandedIcon: expandedIcon,
                actions: actions
            ))
        ))
    }
}
