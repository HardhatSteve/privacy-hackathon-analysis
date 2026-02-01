"""
Free Transfers Cost Comparison Animation
========================================

Visualizes:
1. PDA rent cost on competitors ($0.13/tx)
2. ZORB's indexed merkle tree approach (no PDA rent)
3. Dramatic cost comparison
"""

from manim import *
import sys
sys.path.append('..')
from zorb_animations.styles import *


class CostComparisonScene(Scene):
    """Side-by-side cost comparison with competitors."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        # Title
        title = Text("Transfer Costs Compared", font_size=TITLE_SIZE - 6, color=TEXT_WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Competitors column
        comp_header = Text("Other Privacy Protocols", font_size=BODY_SIZE, color=RENT_RED)
        comp_header.move_to(LEFT * 3.5 + UP * 1.5)

        comp_costs = VGroup(
            self.create_cost_row("PDA Creation", "$0.0016"),
            self.create_cost_row("Rent (2 years)", "$0.0891"),
            self.create_cost_row("Nullifier Storage", "$0.0456"),
            self.create_cost_row("Compute Units", "$0.0002"),
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        comp_costs.next_to(comp_header, DOWN, buff=0.4)

        comp_total = self.create_total_row("$0.1365/tx", RENT_RED)
        comp_total.next_to(comp_costs, DOWN, buff=0.3)

        self.play(Write(comp_header))
        for row in comp_costs:
            self.play(FadeIn(row), run_time=FAST)
        self.play(FadeIn(comp_total))
        self.wait(MEDIUM)

        # ZORB column
        zorb_header = Text("ZORB", font_size=BODY_SIZE, color=SUCCESS_GREEN, weight=BOLD)
        zorb_header.move_to(RIGHT * 3.5 + UP * 1.5)

        zorb_costs = VGroup(
            self.create_cost_row("Indexed Tree Update", "$0.0000", SUCCESS_GREEN),
            self.create_cost_row("No PDA Rent!", "$0.0000", SUCCESS_GREEN),
            self.create_cost_row("Batched Nullifiers", "$0.0000", SUCCESS_GREEN),
            self.create_cost_row("Compute Units", "$0.0002", TEXT_GRAY),
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        zorb_costs.next_to(zorb_header, DOWN, buff=0.4)

        zorb_total = self.create_total_row("$0.0002/tx", SUCCESS_GREEN)
        zorb_total.next_to(zorb_costs, DOWN, buff=0.3)

        self.play(Write(zorb_header))
        for row in zorb_costs:
            self.play(FadeIn(row), run_time=FAST)
        self.play(FadeIn(zorb_total))

        # Dramatic comparison
        vs_text = Text("VS", font_size=TITLE_SIZE, color=TEXT_GRAY)
        vs_text.move_to(UP * 0.5)
        self.play(Write(vs_text))

        # Savings calculation
        savings = VGroup(
            Text("682× cheaper!", font_size=SUBTITLE_SIZE, color=ZORB_CYAN, weight=BOLD),
            Text("Privacy should be free", font_size=BODY_SIZE, color=TEXT_GRAY)
        ).arrange(DOWN, buff=0.2)
        savings.to_edge(DOWN, buff=0.8)

        self.play(Write(savings[0]), run_time=SLOW)
        self.play(FadeIn(savings[1]))

        self.wait(2)

    def create_cost_row(self, label: str, cost: str, color=TEXT_GRAY):
        row = VGroup(
            Text(label, font_size=SMALL_SIZE, color=color),
            Text(cost, font_size=SMALL_SIZE, color=color)
        ).arrange(RIGHT, buff=1)
        return row

    def create_total_row(self, total: str, color):
        line = Line(LEFT * 1.5, RIGHT * 1.5, color=color, stroke_width=2)
        total_text = Text(f"Total: {total}", font_size=BODY_SIZE, color=color, weight=BOLD)
        return VGroup(line, total_text).arrange(DOWN, buff=0.1)


class PDAExplainerScene(Scene):
    """Explains why PDA rent is required by competitors."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        title = Text("The PDA Rent Problem", font_size=TITLE_SIZE - 6, color=TEXT_WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Traditional approach
        trad_label = Text("Traditional Nullifier Storage", font_size=BODY_SIZE, color=RENT_RED)
        trad_label.move_to(UP * 1.5)
        self.play(Write(trad_label))

        # PDAs visualization
        pdas = VGroup()
        for i in range(5):
            pda = RoundedRectangle(
                width=1.2, height=0.8, corner_radius=0.1,
                fill_color=RENT_RED, fill_opacity=0.3,
                stroke_color=RENT_RED, stroke_width=2
            )
            pda_text = Text(f"PDA", font_size=TINY_SIZE, color=RENT_RED)
            pda_text.move_to(pda.get_center())
            pdas.add(VGroup(pda, pda_text))

        pdas.arrange(RIGHT, buff=0.3)
        pdas.move_to(UP * 0.3)

        self.play(FadeIn(pdas))

        # Cost annotations
        for i, pda in enumerate(pdas):
            cost = Text("$0.13", font_size=TINY_SIZE - 2, color=RENT_RED)
            cost.next_to(pda, DOWN, buff=0.1)
            self.play(FadeIn(cost), run_time=FAST / 2)

        # 1000 transfers
        transfers_text = Text("1,000 transfers = $130 in rent!", font_size=BODY_SIZE, color=RENT_RED)
        transfers_text.move_to(DOWN * 1)
        self.play(Write(transfers_text))

        self.wait(MEDIUM)

        # ZORB solution
        zorb_label = Text("ZORB: Indexed Merkle Tree", font_size=BODY_SIZE, color=SUCCESS_GREEN)
        zorb_label.move_to(DOWN * 2)
        self.play(Write(zorb_label))

        tree = self.create_simple_tree()
        tree.scale(0.6)
        tree.move_to(DOWN * 3.5)
        self.play(FadeIn(tree))

        # Single tree annotation
        single_note = VGroup(
            Text("One tree, 67M nullifiers", font_size=SMALL_SIZE, color=SUCCESS_GREEN),
            Text("No per-transaction rent!", font_size=SMALL_SIZE, color=ZORB_CYAN)
        ).arrange(DOWN, buff=0.1)
        single_note.next_to(tree, RIGHT, buff=0.5)
        self.play(Write(single_note))

        self.wait(2)

    def create_simple_tree(self):
        """Create a simple tree visualization."""
        nodes = []
        # Root
        root = Circle(radius=0.25, fill_color=ZORB_CYAN, fill_opacity=0.8, stroke_color=ZORB_CYAN)
        nodes.append(root)

        # Level 1
        l1_left = Circle(radius=0.2, fill_color=ZORB_CYAN, fill_opacity=0.6, stroke_color=ZORB_CYAN)
        l1_right = Circle(radius=0.2, fill_color=ZORB_CYAN, fill_opacity=0.6, stroke_color=ZORB_CYAN)
        l1_left.next_to(root, DOWN + LEFT, buff=0.3)
        l1_right.next_to(root, DOWN + RIGHT, buff=0.3)
        nodes.extend([l1_left, l1_right])

        # Level 2 (leaves)
        leaves = []
        for parent in [l1_left, l1_right]:
            for direction in [LEFT, RIGHT]:
                leaf = Circle(radius=0.15, fill_color=SUCCESS_GREEN, fill_opacity=0.8, stroke_color=SUCCESS_GREEN)
                leaf.next_to(parent, DOWN + direction * 0.5, buff=0.2)
                leaves.append(leaf)
        nodes.extend(leaves)

        # Lines
        lines = VGroup()
        lines.add(Line(root.get_bottom(), l1_left.get_top(), color=TEXT_GRAY))
        lines.add(Line(root.get_bottom(), l1_right.get_top(), color=TEXT_GRAY))
        lines.add(Line(l1_left.get_bottom(), leaves[0].get_top(), color=TEXT_GRAY))
        lines.add(Line(l1_left.get_bottom(), leaves[1].get_top(), color=TEXT_GRAY))
        lines.add(Line(l1_right.get_bottom(), leaves[2].get_top(), color=TEXT_GRAY))
        lines.add(Line(l1_right.get_bottom(), leaves[3].get_top(), color=TEXT_GRAY))

        return VGroup(*nodes, lines)


class SavingsCalculatorScene(Scene):
    """Interactive savings calculator visualization."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        title = Text("Your Savings with ZORB", font_size=TITLE_SIZE - 6, color=TEXT_WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Transfer count slider (animated)
        counts = [10, 100, 1000, 10000]
        competitor_costs = [1.37, 13.65, 136.50, 1365.00]
        zorb_costs = [0.002, 0.02, 0.20, 2.00]

        table_header = VGroup(
            Text("Transfers", font_size=SMALL_SIZE, color=TEXT_GRAY),
            Text("Others", font_size=SMALL_SIZE, color=RENT_RED),
            Text("ZORB", font_size=SMALL_SIZE, color=SUCCESS_GREEN),
            Text("Saved", font_size=SMALL_SIZE, color=ZORB_CYAN),
        ).arrange(RIGHT, buff=1.5)
        table_header.move_to(UP * 1.5)

        self.play(FadeIn(table_header))

        rows = VGroup()
        for i, (count, comp, zorb) in enumerate(zip(counts, competitor_costs, zorb_costs)):
            saved = comp - zorb
            row = VGroup(
                Text(f"{count:,}", font_size=BODY_SIZE, color=TEXT_WHITE),
                Text(f"${comp:.2f}", font_size=BODY_SIZE, color=RENT_RED),
                Text(f"${zorb:.2f}", font_size=BODY_SIZE, color=SUCCESS_GREEN),
                Text(f"${saved:.2f}", font_size=BODY_SIZE, color=ZORB_CYAN, weight=BOLD),
            ).arrange(RIGHT, buff=1.5)
            rows.add(row)

        rows.arrange(DOWN, buff=0.4)
        rows.next_to(table_header, DOWN, buff=0.5)

        for row in rows:
            self.play(FadeIn(row), run_time=MEDIUM)

        # Bottom line
        bottom = VGroup(
            Text("10,000 transfers:", font_size=SUBTITLE_SIZE, color=TEXT_WHITE),
            Text("$1,363 saved", font_size=SUBTITLE_SIZE, color=ZORB_CYAN, weight=BOLD)
        ).arrange(RIGHT, buff=0.5)
        bottom.to_edge(DOWN, buff=1)

        self.play(Write(bottom))

        self.wait(2)
