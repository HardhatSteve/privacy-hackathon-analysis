"""
Multi-LST Fungibility Animations
================================

Visualizes:
1. Domain boundary pattern (φ conversion)
2. LST tokens → Virtual SOL normalization
3. Cross-LST privacy (all LSTs look the same in pool)
"""

from manim import *
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from zorb_animations.styles import *


class LSTToken(VGroup):
    """Visual representation of an LST token."""

    def __init__(self, name: str, color: str, amount: str = "100", **kwargs):
        super().__init__(**kwargs)

        circle = Circle(radius=0.6, fill_color=color, fill_opacity=0.8, stroke_color=color, stroke_width=2)
        label = Text(name, font_size=SMALL_SIZE, color=TEXT_WHITE, weight=BOLD)
        label.move_to(circle.get_center())

        amount_text = Text(amount, font_size=TINY_SIZE, color=TEXT_GRAY)
        amount_text.next_to(circle, DOWN, buff=0.15)

        self.add(circle, label, amount_text)
        self.circle = circle
        self.name = name


class DomainBoundaryScene(Scene):
    """Shows LST → Virtual SOL conversion at domain boundary."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        # Title
        title = Text("Domain Boundary: φ Conversion", font_size=TITLE_SIZE - 6, color=TEXT_WHITE, weight=BOLD)
        subtitle = Text("All LSTs become Virtual SOL inside the pool", font_size=BODY_SIZE, color=TEXT_GRAY)
        VGroup(title, subtitle).arrange(DOWN, buff=0.2).to_edge(UP, buff=0.5)

        self.play(Write(title), FadeIn(subtitle))

        # Public side
        public_box = Rectangle(
            width=4, height=5, fill_color=ZORB_DARK_ALT, fill_opacity=0.5,
            stroke_color=TEXT_GRAY, stroke_width=1
        )
        public_box.move_to(LEFT * 4)
        public_label = Text("PUBLIC", font_size=SMALL_SIZE, color=TEXT_GRAY)
        public_label.next_to(public_box, UP, buff=0.2)

        # Shielded side
        shielded_box = Rectangle(
            width=4, height=5, fill_color=ZORB_DARK_ALT, fill_opacity=0.5,
            stroke_color=ZORB_CYAN, stroke_width=2
        )
        shielded_box.move_to(RIGHT * 4)
        shielded_label = Text("SHIELDED", font_size=SMALL_SIZE, color=ZORB_CYAN)
        shielded_label.next_to(shielded_box, UP, buff=0.2)

        # Domain boundary line
        boundary = DashedLine(
            UP * 2.5, DOWN * 2.5,
            color=SOLANA_PURPLE, stroke_width=3, dash_length=0.2
        )
        boundary_label = Text("φ", font_size=TITLE_SIZE, color=SOLANA_PURPLE)
        boundary_label.next_to(boundary, UP, buff=0.3)

        self.play(
            FadeIn(public_box), FadeIn(shielded_box),
            Write(public_label), Write(shielded_label),
            Create(boundary), Write(boundary_label)
        )
        self.wait(MEDIUM)

        # LST tokens on public side
        vsol = LSTToken("vSOL", VSOL_BLUE, "100")
        jito = LSTToken("jitoSOL", JITOSOL_GREEN, "95")
        msol = LSTToken("mSOL", MSOL_PURPLE, "105")

        tokens = VGroup(vsol, jito, msol).arrange(DOWN, buff=0.5)
        tokens.move_to(public_box.get_center())

        self.play(FadeIn(tokens))
        self.wait(MEDIUM)

        # Conversion formula
        formula = Text(
            "vSOL = LST × φ",
            font_size=BODY_SIZE, color=SOLANA_PURPLE
        )
        formula.next_to(boundary, DOWN, buff=1)
        self.play(Write(formula))

        # Animate conversion
        virtual_sol = VGroup()
        for token in tokens:
            vs = Circle(
                radius=0.5, fill_color=ZORB_CYAN, fill_opacity=0.8,
                stroke_color=ZORB_CYAN, stroke_width=2
            )
            vs_label = Text("vSOL", font_size=TINY_SIZE, color=TEXT_WHITE, weight=BOLD)
            vs_label.move_to(vs.get_center())
            virtual_sol.add(VGroup(vs, vs_label))

        virtual_sol.arrange(DOWN, buff=0.3)
        virtual_sol.move_to(shielded_box.get_center())

        # Animate tokens crossing boundary
        for i, (token, vs) in enumerate(zip(tokens, virtual_sol)):
            self.play(
                token.animate.move_to(boundary.get_center()),
                run_time=MEDIUM
            )
            self.play(
                Transform(token.copy(), vs),
                token.animate.set_opacity(0),
                run_time=MEDIUM
            )

        # Final state
        unified = Text("All unified as Virtual SOL!", font_size=BODY_SIZE, color=SUCCESS_GREEN)
        unified.to_edge(DOWN, buff=0.5)
        self.play(Write(unified))

        self.wait(2)


class CrossLSTPrivacyScene(Scene):
    """Shows how different LSTs become indistinguishable."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        title = Text("Cross-LST Privacy", font_size=TITLE_SIZE - 6, color=TEXT_WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Alice shields vSOL
        alice_label = Text("Alice", font_size=BODY_SIZE, color=VSOL_BLUE)
        alice_token = LSTToken("vSOL", VSOL_BLUE, "100")
        alice_group = VGroup(alice_label, alice_token).arrange(DOWN, buff=0.3)
        alice_group.move_to(LEFT * 4 + UP * 1)

        # Bob shields jitoSOL
        bob_label = Text("Bob", font_size=BODY_SIZE, color=JITOSOL_GREEN)
        bob_token = LSTToken("jitoSOL", JITOSOL_GREEN, "100")
        bob_group = VGroup(bob_label, bob_token).arrange(DOWN, buff=0.3)
        bob_group.move_to(LEFT * 4 + DOWN * 1.5)

        self.play(FadeIn(alice_group), FadeIn(bob_group))
        self.wait(MEDIUM)

        # Shielded pool
        pool = RoundedRectangle(
            width=4, height=4, corner_radius=0.3,
            fill_color=ZORB_DARK_ALT, fill_opacity=0.9,
            stroke_color=ZORB_CYAN, stroke_width=3
        )
        pool.move_to(RIGHT * 2)
        pool_label = Text("Shielded Pool", font_size=SMALL_SIZE, color=ZORB_CYAN)
        pool_label.next_to(pool, UP, buff=0.2)

        # Question marks inside pool
        mystery = VGroup()
        for i in range(4):
            q = Text("?", font_size=TITLE_SIZE, color=TEXT_GRAY)
            mystery.add(q)
        mystery.arrange_in_grid(2, 2, buff=0.5)
        mystery.move_to(pool.get_center())

        self.play(FadeIn(pool), Write(pool_label), FadeIn(mystery))

        # Arrows showing shielding
        arrow1 = Arrow(alice_token.get_right(), pool.get_left() + UP * 0.8, color=VSOL_BLUE, buff=0.2)
        arrow2 = Arrow(bob_token.get_right(), pool.get_left() + DOWN * 0.8, color=JITOSOL_GREEN, buff=0.2)

        self.play(Create(arrow1), Create(arrow2))

        # Key insight
        insight = VGroup(
            Text("Inside the pool:", font_size=BODY_SIZE, color=TEXT_WHITE),
            Text("• Can't tell vSOL from jitoSOL", font_size=SMALL_SIZE, color=TEXT_GRAY),
            Text("• All stored as Virtual SOL", font_size=SMALL_SIZE, color=TEXT_GRAY),
            Text("• Perfect fungibility", font_size=SMALL_SIZE, color=SUCCESS_GREEN)
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        insight.to_edge(DOWN, buff=0.5)

        self.play(Write(insight))

        self.wait(2)


class ExchangeRateScene(Scene):
    """Shows exchange rate mechanism."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        title = Text("Exchange Rate Oracle", font_size=TITLE_SIZE - 6, color=TEXT_WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))

        # LST rate cards
        rates = [
            ("vSOL", VSOL_BLUE, "φ = 1.0523"),
            ("jitoSOL", JITOSOL_GREEN, "φ = 1.0891"),
            ("mSOL", MSOL_PURPLE, "φ = 1.1247"),
        ]

        cards = VGroup()
        for name, color, rate in rates:
            card = VGroup()
            box = RoundedRectangle(
                width=3, height=1.5, corner_radius=0.15,
                fill_color=ZORB_DARK_ALT, fill_opacity=0.9,
                stroke_color=color, stroke_width=2
            )
            name_text = Text(name, font_size=BODY_SIZE, color=color, weight=BOLD)
            name_text.move_to(box.get_center() + UP * 0.3)
            rate_text = Text(rate, font_size=SMALL_SIZE, color=TEXT_WHITE)
            rate_text.move_to(box.get_center() + DOWN * 0.3)
            card.add(box, name_text, rate_text)
            cards.add(card)

        cards.arrange(RIGHT, buff=0.5)
        cards.move_to(UP * 0.5)

        self.play(FadeIn(cards))
        self.wait(MEDIUM)

        # Conversion example
        example = VGroup(
            Text("100 vSOL × 1.0523 = 105.23 vSOL", font_size=BODY_SIZE, color=VSOL_BLUE),
            Text("100 jitoSOL × 1.0891 = 108.91 vSOL", font_size=BODY_SIZE, color=JITOSOL_GREEN),
            Text("100 mSOL × 1.1247 = 112.47 vSOL", font_size=BODY_SIZE, color=MSOL_PURPLE),
        ).arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        example.move_to(DOWN * 1.5)

        for line in example:
            self.play(Write(line), run_time=MEDIUM)
            self.wait(FAST)

        # Note
        note = Text(
            "Rates frozen at epoch boundary for ZK compatibility",
            font_size=SMALL_SIZE, color=WARNING_YELLOW
        )
        note.to_edge(DOWN, buff=0.5)
        self.play(Write(note))

        self.wait(2)
