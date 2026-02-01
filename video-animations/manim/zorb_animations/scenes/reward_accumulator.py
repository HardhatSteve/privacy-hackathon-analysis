"""
Reward Accumulator Animations
=============================

Visualizes:
1. How yield accrues without revealing principal
2. Epoch-based rate freeze (harvest → finalize cycle)
3. Mathematical accumulator formula
"""

from manim import *
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from zorb_animations.styles import *


class RewardAccumulatorScene(Scene):
    """Visual explanation of the reward accumulator mechanism."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        # Title
        title = Text("Reward Accumulator", font_size=TITLE_SIZE, color=TEXT_WHITE, weight=BOLD)
        subtitle = Text("Private yield without revealing principal", font_size=BODY_SIZE, color=TEXT_GRAY)
        title_group = VGroup(title, subtitle).arrange(DOWN, buff=0.3)
        title_group.to_edge(UP, buff=0.5)

        self.play(Write(title), run_time=SLOW)
        self.play(FadeIn(subtitle), run_time=MEDIUM)
        self.wait(MEDIUM)

        # Shielded note representation
        note_box = RoundedRectangle(
            width=4, height=2.5, corner_radius=0.2,
            fill_color=ZORB_DARK_ALT, fill_opacity=0.9,
            stroke_color=ZORB_CYAN, stroke_width=3
        )
        note_label = Text("Shielded Note", font_size=SMALL_SIZE, color=ZORB_CYAN)
        note_label.next_to(note_box, UP, buff=0.2)

        note_content = VGroup(
            Text("amount: ???", font_size=BODY_SIZE, color=TEXT_GRAY),
            Text("acc_snapshot: 1.05", font_size=BODY_SIZE, color=SUCCESS_GREEN),
        ).arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        note_content.move_to(note_box.get_center())

        note_group = VGroup(note_box, note_label, note_content)
        note_group.move_to(LEFT * 3 + DOWN * 0.5)

        self.play(FadeIn(note_group))
        self.wait(MEDIUM)

        # Current accumulator
        acc_box = RoundedRectangle(
            width=3.5, height=1.5, corner_radius=0.2,
            fill_color=ZORB_DARK_ALT, fill_opacity=0.9,
            stroke_color=SOLANA_PURPLE, stroke_width=3
        )
        acc_label = Text("Pool State", font_size=SMALL_SIZE, color=SOLANA_PURPLE)
        acc_label.next_to(acc_box, UP, buff=0.2)
        acc_value = Text("accumulator: 1.12", font_size=BODY_SIZE, color=SOLANA_PURPLE)
        acc_value.move_to(acc_box.get_center())

        acc_group = VGroup(acc_box, acc_label, acc_value)
        acc_group.move_to(RIGHT * 3 + DOWN * 0.5)

        self.play(FadeIn(acc_group))
        self.wait(MEDIUM)

        # Formula
        formula_bg = RoundedRectangle(
            width=10, height=1.5, corner_radius=0.15,
            fill_color=ZORB_DARK_ALT, fill_opacity=0.8,
            stroke_color=TEXT_GRAY, stroke_width=1
        )
        formula_bg.to_edge(DOWN, buff=1)

        formula = Text(
            "yield = amount × (current - entry) / 10¹⁸",
            font_size=SUBTITLE_SIZE, color=TEXT_WHITE
        )
        formula.move_to(formula_bg.get_center())

        self.play(FadeIn(formula_bg), Write(formula))
        self.wait(MEDIUM)

        # Highlight the calculation
        calc_text = VGroup(
            Text("yield = ??? × (1.12 - 1.05) / 1e18", font_size=BODY_SIZE, color=SUCCESS_GREEN),
            Text("Amount hidden, but yield computed correctly!", font_size=SMALL_SIZE, color=TEXT_GRAY)
        ).arrange(DOWN, buff=0.2)
        calc_text.next_to(formula_bg, UP, buff=0.3)

        self.play(Write(calc_text[0]))
        self.wait(MEDIUM)
        self.play(Write(calc_text[1]))

        self.wait(2)


class HarvestFinalizeScene(Scene):
    """Epoch-based rate freeze cycle."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        title = Text("Harvest-Finalize Cycle", font_size=TITLE_SIZE - 6, color=TEXT_WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Timeline
        timeline = NumberLine(
            x_range=[0, 4, 1],
            length=10,
            color=TEXT_GRAY,
            include_numbers=False,
            include_ticks=True,
            tick_size=0.2
        )
        timeline.move_to(UP * 1)

        epoch_labels = VGroup()
        for i in range(5):
            label = Text(f"E{i}", font_size=TINY_SIZE, color=TEXT_GRAY)
            label.next_to(timeline.n2p(i), DOWN, buff=0.3)
            epoch_labels.add(label)

        self.play(Create(timeline), FadeIn(epoch_labels))

        # Harvest phase
        harvest_box = Rectangle(
            width=2, height=0.6, fill_color=WARNING_YELLOW, fill_opacity=0.3,
            stroke_color=WARNING_YELLOW, stroke_width=2
        )
        harvest_box.move_to(timeline.n2p(1.5) + UP * 0.5)
        harvest_label = Text("HARVEST", font_size=TINY_SIZE, color=WARNING_YELLOW)
        harvest_label.next_to(harvest_box, UP, buff=0.1)

        self.play(FadeIn(harvest_box), Write(harvest_label))

        # Finalize phase
        finalize_box = Rectangle(
            width=2, height=0.6, fill_color=SUCCESS_GREEN, fill_opacity=0.3,
            stroke_color=SUCCESS_GREEN, stroke_width=2
        )
        finalize_box.move_to(timeline.n2p(2.5) + UP * 0.5)
        finalize_label = Text("FINALIZE", font_size=TINY_SIZE, color=SUCCESS_GREEN)
        finalize_label.next_to(finalize_box, UP, buff=0.1)

        self.play(FadeIn(finalize_box), Write(finalize_label))

        # Explanation boxes
        harvest_exp = VGroup(
            Text("Freeze exchange rates", font_size=SMALL_SIZE, color=WARNING_YELLOW),
            Text("Fetch LST prices", font_size=TINY_SIZE, color=TEXT_GRAY),
            Text("Calculate pending yield", font_size=TINY_SIZE, color=TEXT_GRAY)
        ).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        harvest_exp.move_to(LEFT * 3 + DOWN * 1.5)

        finalize_exp = VGroup(
            Text("Update accumulator", font_size=SMALL_SIZE, color=SUCCESS_GREEN),
            Text("acc += yield / total_shares", font_size=TINY_SIZE, color=TEXT_GRAY),
            Text("Enable withdrawals", font_size=TINY_SIZE, color=TEXT_GRAY)
        ).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        finalize_exp.move_to(RIGHT * 3 + DOWN * 1.5)

        self.play(FadeIn(harvest_exp))
        self.wait(MEDIUM)
        self.play(FadeIn(finalize_exp))

        # INV-8 indicator
        inv8 = VGroup(
            Text("INV-8: Atomicity", font_size=SMALL_SIZE, color=ZORB_CYAN, weight=BOLD),
            Text("Rate freeze + accumulator update atomic", font_size=TINY_SIZE, color=TEXT_GRAY)
        ).arrange(DOWN, buff=0.1)
        inv8.to_edge(DOWN, buff=0.5)

        self.play(Write(inv8))
        self.wait(2)


class AccumulatorGrowthScene(Scene):
    """Animated accumulator growth over time."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        title = Text("Accumulator Growth", font_size=TITLE_SIZE - 6, color=TEXT_WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Create axes (no numbers to avoid LaTeX dependency)
        axes = Axes(
            x_range=[0, 10, 2],
            y_range=[1, 1.5, 0.1],
            x_length=8,
            y_length=4,
            axis_config={"color": TEXT_GRAY, "include_tip": False},
            x_axis_config={"include_numbers": False},
            y_axis_config={"include_numbers": False},
        )
        axes.move_to(DOWN * 0.5)

        x_label = Text("Epochs", font_size=SMALL_SIZE, color=TEXT_GRAY)
        x_label.next_to(axes.x_axis, DOWN, buff=0.3)
        y_label = Text("Acc", font_size=SMALL_SIZE, color=TEXT_GRAY)
        y_label.next_to(axes.y_axis, LEFT, buff=0.3)

        # Y-axis labels as Text
        y_labels = VGroup()
        for val in [1.0, 1.1, 1.2, 1.3, 1.4, 1.5]:
            label = Text(f"{val:.1f}", font_size=TINY_SIZE - 2, color=TEXT_GRAY)
            label.next_to(axes.c2p(0, val), LEFT, buff=0.1)
            y_labels.add(label)

        self.play(Create(axes), Write(x_label), Write(y_label), FadeIn(y_labels))

        # Accumulator curve (step function)
        points = [
            (0, 1.0), (1, 1.0),
            (1, 1.05), (2, 1.05),
            (2, 1.08), (3, 1.08),
            (3, 1.15), (4, 1.15),
            (4, 1.22), (5, 1.22),
            (5, 1.28), (6, 1.28),
            (6, 1.35), (7, 1.35),
            (7, 1.40), (8, 1.40),
            (8, 1.45), (9, 1.45),
            (9, 1.48), (10, 1.48),
        ]

        curve = VMobject(color=ZORB_CYAN, stroke_width=3)
        curve_points = [axes.c2p(x, y) for x, y in points]
        curve.set_points_as_corners(curve_points)

        self.play(Create(curve), run_time=2)

        # Entry point marker
        entry_dot = Dot(axes.c2p(3, 1.08), color=SUCCESS_GREEN, radius=0.15)
        entry_label = Text("Entry: 1.08", font_size=TINY_SIZE, color=SUCCESS_GREEN)
        entry_label.next_to(entry_dot, DOWN + LEFT, buff=0.1)

        self.play(FadeIn(entry_dot), Write(entry_label))

        # Current point marker
        current_dot = Dot(axes.c2p(9, 1.48), color=SOLANA_PURPLE, radius=0.15)
        current_label = Text("Current: 1.48", font_size=TINY_SIZE, color=SOLANA_PURPLE)
        current_label.next_to(current_dot, UP + RIGHT, buff=0.1)

        self.play(FadeIn(current_dot), Write(current_label))

        # Yield calculation
        yield_text = VGroup(
            Text("Yield multiplier: 1.48 - 1.08 = 0.40", font_size=BODY_SIZE, color=TEXT_WHITE),
            Text("40% yield earned since entry!", font_size=SMALL_SIZE, color=SUCCESS_GREEN)
        ).arrange(DOWN, buff=0.2)
        yield_text.to_edge(DOWN, buff=0.5)

        self.play(Write(yield_text[0]))
        self.wait(MEDIUM)
        self.play(Write(yield_text[1]))

        self.wait(2)
