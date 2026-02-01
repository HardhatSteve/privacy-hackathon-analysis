"""
Shielding Flow Animations
=========================

Visualizes:
1. Shield → Send → Unshield flow (Zcash terminology)
2. Commitment creation process
3. ZK proof generation
"""

from manim import *
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from zorb_animations.styles import *


class ShieldingFlowScene(Scene):
    """Complete shield → send → unshield flow."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        # Title
        title = Text("Shield → Send → Unshield", font_size=TITLE_SIZE - 6, color=TEXT_WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Three columns
        shield_col = self.create_column("SHIELD", SOLANA_GREEN, LEFT * 4.5)
        send_col = self.create_column("SEND", ZORB_CYAN, ORIGIN)
        unshield_col = self.create_column("UNSHIELD", SOLANA_PURPLE, RIGHT * 4.5)

        self.play(
            FadeIn(shield_col), FadeIn(send_col), FadeIn(unshield_col)
        )

        # Shield step
        shield_items = VGroup(
            self.create_step_item("1. Deposit SOL/LST", TEXT_WHITE),
            self.create_step_item("2. Generate commitment", SOLANA_GREEN),
            self.create_step_item("3. Commitment → tree", TEXT_GRAY),
        ).arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        shield_items.next_to(shield_col, DOWN, buff=0.4)

        for item in shield_items:
            self.play(FadeIn(item), run_time=FAST)

        # Send step
        send_items = VGroup(
            self.create_step_item("1. ZK proof generated", TEXT_WHITE),
            self.create_step_item("2. Old nullifier → tree", RENT_RED),
            self.create_step_item("3. New commitment", ZORB_CYAN),
        ).arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        send_items.next_to(send_col, DOWN, buff=0.4)

        for item in send_items:
            self.play(FadeIn(item), run_time=FAST)

        # Unshield step
        unshield_items = VGroup(
            self.create_step_item("1. ZK proof of ownership", TEXT_WHITE),
            self.create_step_item("2. Nullifier published", WARNING_YELLOW),
            self.create_step_item("3. Receive SOL/LST", SOLANA_PURPLE),
        ).arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        unshield_items.next_to(unshield_col, DOWN, buff=0.4)

        for item in unshield_items:
            self.play(FadeIn(item), run_time=FAST)

        # Arrows between columns
        arrow1 = Arrow(
            shield_col.get_right() + DOWN * 0.5,
            send_col.get_left() + DOWN * 0.5,
            color=TEXT_GRAY, buff=0.5
        )
        arrow2 = Arrow(
            send_col.get_right() + DOWN * 0.5,
            unshield_col.get_left() + DOWN * 0.5,
            color=TEXT_GRAY, buff=0.5
        )

        self.play(Create(arrow1), Create(arrow2))

        # Bottom note
        note = Text(
            "All transfers are free — no PDA rent!",
            font_size=BODY_SIZE, color=SUCCESS_GREEN
        )
        note.to_edge(DOWN, buff=0.5)
        self.play(Write(note))

        self.wait(2)

    def create_column(self, label: str, color: str, position):
        box = RoundedRectangle(
            width=3, height=1.2, corner_radius=0.15,
            fill_color=ZORB_DARK_ALT, fill_opacity=0.9,
            stroke_color=color, stroke_width=3
        )
        text = Text(label, font_size=BODY_SIZE, color=color, weight=BOLD)
        text.move_to(box.get_center())
        group = VGroup(box, text)
        group.move_to(position + UP * 1)
        return group

    def create_step_item(self, text: str, color: str):
        return Text(text, font_size=SMALL_SIZE, color=color)


class CommitmentCreationScene(Scene):
    """How commitments are created."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        title = Text("Creating a Commitment", font_size=TITLE_SIZE - 6, color=TEXT_WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Input boxes
        inputs = VGroup()
        input_data = [
            ("amount", "100 SOL", SOLANA_GREEN),
            ("owner", "pubkey", ZORB_CYAN),
            ("randomness", "secret r", WARNING_YELLOW),
        ]

        for label, value, color in input_data:
            box = RoundedRectangle(
                width=2.5, height=1.2, corner_radius=0.15,
                fill_color=ZORB_DARK_ALT, fill_opacity=0.9,
                stroke_color=color, stroke_width=2
            )
            label_text = Text(label, font_size=TINY_SIZE, color=TEXT_GRAY)
            label_text.next_to(box, UP, buff=0.1)
            value_text = Text(value, font_size=SMALL_SIZE, color=color)
            value_text.move_to(box.get_center())
            inputs.add(VGroup(box, label_text, value_text))

        inputs.arrange(RIGHT, buff=0.5)
        inputs.move_to(UP * 1)

        self.play(FadeIn(inputs))
        self.wait(MEDIUM)

        # Hash function
        hash_box = RoundedRectangle(
            width=3, height=1.5, corner_radius=0.2,
            fill_color=SOLANA_PURPLE, fill_opacity=0.3,
            stroke_color=SOLANA_PURPLE, stroke_width=3
        )
        hash_label = Text("Poseidon Hash", font_size=BODY_SIZE, color=SOLANA_PURPLE, weight=BOLD)
        hash_label.move_to(hash_box.get_center())
        hash_group = VGroup(hash_box, hash_label)
        hash_group.move_to(DOWN * 0.5)

        # Arrows from inputs to hash
        arrows = VGroup()
        for inp in inputs:
            arrow = Arrow(
                inp.get_bottom(), hash_box.get_top(),
                color=TEXT_GRAY, buff=0.2, stroke_width=2
            )
            arrows.add(arrow)

        self.play(FadeIn(hash_group), *[Create(a) for a in arrows])
        self.wait(MEDIUM)

        # Output commitment
        commitment = RoundedRectangle(
            width=6, height=1.2, corner_radius=0.15,
            fill_color=SUCCESS_GREEN, fill_opacity=0.3,
            stroke_color=SUCCESS_GREEN, stroke_width=3
        )
        commitment.move_to(DOWN * 2.5)
        comm_label = Text("commitment", font_size=TINY_SIZE, color=TEXT_GRAY)
        comm_label.next_to(commitment, UP, buff=0.1)
        comm_value = Text("0x7f3a...b2c1", font_size=BODY_SIZE, color=SUCCESS_GREEN, weight=BOLD)
        comm_value.move_to(commitment.get_center())

        arrow_out = Arrow(
            hash_box.get_bottom(), commitment.get_top(),
            color=SOLANA_PURPLE, buff=0.2, stroke_width=3
        )

        self.play(Create(arrow_out))
        self.play(FadeIn(commitment), Write(comm_label), Write(comm_value))

        # Explanation
        explain = VGroup(
            Text("Commitment hides amount and owner", font_size=SMALL_SIZE, color=TEXT_GRAY),
            Text("Only commitment holder can spend", font_size=SMALL_SIZE, color=ZORB_CYAN)
        ).arrange(DOWN, buff=0.1)
        explain.to_edge(DOWN, buff=0.5)

        self.play(Write(explain))

        self.wait(2)


class ZKProofScene(Scene):
    """ZK proof generation visualization."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        title = Text("Zero-Knowledge Proof", font_size=TITLE_SIZE - 6, color=TEXT_WHITE, weight=BOLD)
        subtitle = Text("Prove ownership without revealing details", font_size=BODY_SIZE, color=TEXT_GRAY)
        VGroup(title, subtitle).arrange(DOWN, buff=0.2).to_edge(UP, buff=0.5)

        self.play(Write(title), FadeIn(subtitle))

        # What you HAVE (private inputs)
        private_box = RoundedRectangle(
            width=4, height=3, corner_radius=0.2,
            fill_color=RENT_RED, fill_opacity=0.1,
            stroke_color=RENT_RED, stroke_width=2
        )
        private_box.move_to(LEFT * 3.5)
        private_label = Text("PRIVATE (Hidden)", font_size=SMALL_SIZE, color=RENT_RED)
        private_label.next_to(private_box, UP, buff=0.2)

        private_items = VGroup(
            Text("• Amount: 100 SOL", font_size=SMALL_SIZE, color=TEXT_GRAY),
            Text("• Owner key", font_size=SMALL_SIZE, color=TEXT_GRAY),
            Text("• Randomness", font_size=SMALL_SIZE, color=TEXT_GRAY),
            Text("• Merkle path", font_size=SMALL_SIZE, color=TEXT_GRAY),
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        private_items.move_to(private_box.get_center())

        self.play(FadeIn(private_box), Write(private_label), FadeIn(private_items))

        # ZK Circuit (center)
        circuit = RoundedRectangle(
            width=2.5, height=2, corner_radius=0.2,
            fill_color=ZORB_CYAN, fill_opacity=0.3,
            stroke_color=ZORB_CYAN, stroke_width=3
        )
        circuit_label = Text("ZK Circuit", font_size=BODY_SIZE, color=ZORB_CYAN, weight=BOLD)
        circuit_label.move_to(circuit.get_center())
        circuit_group = VGroup(circuit, circuit_label)

        self.play(FadeIn(circuit_group))

        # What you PROVE (public outputs)
        public_box = RoundedRectangle(
            width=4, height=3, corner_radius=0.2,
            fill_color=SUCCESS_GREEN, fill_opacity=0.1,
            stroke_color=SUCCESS_GREEN, stroke_width=2
        )
        public_box.move_to(RIGHT * 3.5)
        public_label = Text("PUBLIC (Revealed)", font_size=SMALL_SIZE, color=SUCCESS_GREEN)
        public_label.next_to(public_box, UP, buff=0.2)

        public_items = VGroup(
            Text("• Nullifier", font_size=SMALL_SIZE, color=SUCCESS_GREEN),
            Text("• New commitment", font_size=SMALL_SIZE, color=SUCCESS_GREEN),
            Text("• Merkle root", font_size=SMALL_SIZE, color=SUCCESS_GREEN),
            Text("• Proof valid ✓", font_size=SMALL_SIZE, color=SUCCESS_GREEN),
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        public_items.move_to(public_box.get_center())

        self.play(FadeIn(public_box), Write(public_label), FadeIn(public_items))

        # Arrows
        arrow_in = Arrow(private_box.get_right(), circuit.get_left(), color=RENT_RED, buff=0.3)
        arrow_out = Arrow(circuit.get_right(), public_box.get_left(), color=SUCCESS_GREEN, buff=0.3)

        self.play(Create(arrow_in), Create(arrow_out))

        # Key insight
        insight = Text(
            "Verifier learns nothing about amount or owner!",
            font_size=BODY_SIZE, color=ZORB_CYAN
        )
        insight.to_edge(DOWN, buff=0.5)
        self.play(Write(insight))

        self.wait(2)


class TransferAnimationScene(Scene):
    """Animated transfer between two parties."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        title = Text("Private Transfer", font_size=TITLE_SIZE - 6, color=TEXT_WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Alice
        alice_avatar = Circle(radius=0.5, fill_color=VSOL_BLUE, fill_opacity=0.8, stroke_color=VSOL_BLUE)
        alice_label = Text("Alice", font_size=BODY_SIZE, color=VSOL_BLUE)
        alice_label.next_to(alice_avatar, DOWN, buff=0.2)
        alice_group = VGroup(alice_avatar, alice_label)
        alice_group.move_to(LEFT * 4)

        # Bob
        bob_avatar = Circle(radius=0.5, fill_color=JITOSOL_GREEN, fill_opacity=0.8, stroke_color=JITOSOL_GREEN)
        bob_label = Text("Bob", font_size=BODY_SIZE, color=JITOSOL_GREEN)
        bob_label.next_to(bob_avatar, DOWN, buff=0.2)
        bob_group = VGroup(bob_avatar, bob_label)
        bob_group.move_to(RIGHT * 4)

        self.play(FadeIn(alice_group), FadeIn(bob_group))

        # Shielded pool in center
        pool = RoundedRectangle(
            width=4, height=3, corner_radius=0.3,
            fill_color=ZORB_DARK_ALT, fill_opacity=0.9,
            stroke_color=ZORB_CYAN, stroke_width=3
        )
        pool_label = Text("Shielded Pool", font_size=SMALL_SIZE, color=ZORB_CYAN)
        pool_label.next_to(pool, UP, buff=0.2)

        # Commitments inside pool
        commitments = VGroup()
        for i in range(6):
            c = Circle(radius=0.25, fill_color=TEXT_GRAY, fill_opacity=0.5, stroke_color=TEXT_GRAY)
            commitments.add(c)
        commitments.arrange_in_grid(2, 3, buff=0.3)
        commitments.move_to(pool.get_center())

        self.play(FadeIn(pool), Write(pool_label), FadeIn(commitments))

        # Alice's commitment (highlight one)
        alice_commitment = commitments[2]
        self.play(alice_commitment.animate.set_fill(VSOL_BLUE, opacity=0.8).set_stroke(VSOL_BLUE))

        # Transfer animation
        # Step 1: Nullify Alice's commitment
        null_text = Text("1. Nullify", font_size=SMALL_SIZE, color=RENT_RED)
        null_text.next_to(pool, DOWN, buff=0.3)
        self.play(Write(null_text))
        self.play(alice_commitment.animate.set_fill(RENT_RED, opacity=0.3).set_stroke(RENT_RED))

        # Step 2: Create Bob's commitment
        self.play(FadeOut(null_text))
        create_text = Text("2. New commitment", font_size=SMALL_SIZE, color=SUCCESS_GREEN)
        create_text.next_to(pool, DOWN, buff=0.3)
        self.play(Write(create_text))

        bob_commitment = Circle(radius=0.25, fill_color=JITOSOL_GREEN, fill_opacity=0.8, stroke_color=JITOSOL_GREEN)
        bob_commitment.move_to(pool.get_center() + RIGHT * 0.5 + DOWN * 0.5)
        self.play(FadeIn(bob_commitment, scale=0.5))

        # Step 3: Complete
        self.play(FadeOut(create_text))
        complete_text = Text("Transfer complete!", font_size=BODY_SIZE, color=SUCCESS_GREEN)
        complete_text.next_to(pool, DOWN, buff=0.3)
        self.play(Write(complete_text))

        # Observer perspective
        observer = VGroup(
            Text("External observer sees:", font_size=SMALL_SIZE, color=TEXT_GRAY),
            Text("• Some commitment nullified", font_size=TINY_SIZE, color=TEXT_GRAY),
            Text("• New commitment created", font_size=TINY_SIZE, color=TEXT_GRAY),
            Text("• Amount? Sender? Receiver? Unknown!", font_size=TINY_SIZE, color=ZORB_CYAN),
        ).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        observer.to_edge(DOWN, buff=0.5)

        self.play(Write(observer))

        self.wait(2)
