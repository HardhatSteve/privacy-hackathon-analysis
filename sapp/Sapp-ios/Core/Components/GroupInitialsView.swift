import SwiftUI

/// Displays overlapping initials circles for group chat participants
struct GroupInitialsView: View {
    let participants: [ChatParticipant]
    let size: CGFloat

    private let colors: [Color] = [
        Color(red: 0.3, green: 0.5, blue: 0.7),   // Blue
        Color(red: 0.2, green: 0.6, blue: 0.4),   // Green
        Color(red: 0.85, green: 0.65, blue: 0.2), // Amber
        Color(red: 0.6, green: 0.4, blue: 0.7),   // Purple
        Color(red: 0.8, green: 0.4, blue: 0.5),   // Pink
    ]

    private func colorForIndex(_ index: Int, handle: String) -> Color {
        // Use handle hash for consistent color assignment
        let hash = abs(handle.hashValue)
        return colors[hash % colors.count]
    }

    var body: some View {
        ZStack {
            // Display up to 3 participant initials with overlap
            ForEach(Array(participants.prefix(3).enumerated()), id: \.element.id) { index, participant in
                Circle()
                    .fill(colorForIndex(index, handle: participant.handle))
                    .frame(width: size * 0.65, height: size * 0.65)
                    .overlay(
                        Text(participant.handle.prefix(1).uppercased())
                            .font(.system(size: size * 0.25, weight: .medium))
                            .foregroundColor(.white)
                    )
                    .overlay(
                        Circle()
                            .stroke(SappColors.background, lineWidth: 2)
                    )
                    .offset(x: CGFloat(index) * size * 0.22)
            }
        }
        .frame(width: size, height: size)
    }
}

#Preview {
    VStack(spacing: 20) {
        GroupInitialsView(
            participants: [
                ChatParticipant(id: "alice", email: nil),
                ChatParticipant(id: "bob", email: nil),
                ChatParticipant(id: "charlie", email: nil)
            ],
            size: 52
        )

        GroupInitialsView(
            participants: [
                ChatParticipant(id: "david", email: nil),
                ChatParticipant(id: "emma", email: nil)
            ],
            size: 52
        )
    }
    .padding()
    .background(SappColors.background)
}
