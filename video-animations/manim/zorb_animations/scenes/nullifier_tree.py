"""
Nullifier Indexed Merkle Tree Animations
=========================================

Visualizes:
1. Indexed merkle tree structure (sorted linked list)
2. Non-membership proof (low element + gap)
3. Insertion operation
4. Two-layer security (ZK + PDA)
"""

from manim import *
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from zorb_animations.styles import *


class IndexedLeaf(VGroup):
    """Visual representation of an indexed merkle tree leaf."""

    def __init__(self, value: str, next_value: str, next_index: int, index: int, **kwargs):
        super().__init__(**kwargs)

        box = RoundedRectangle(
            width=2.5, height=1.8, corner_radius=0.15,
            fill_color=ZORB_DARK, fill_opacity=0.9,
            stroke_color=ZORB_CYAN, stroke_width=2
        )

        index_label = Text(f"[{index}]", font_size=TINY_SIZE, color=TEXT_GRAY)
        index_label.next_to(box, UP, buff=0.1)

        value_text = Text(value, font_size=BODY_SIZE, color=TEXT_WHITE, weight=BOLD)
        value_text.move_to(box.get_center() + UP * 0.3)

        next_info = VGroup(
            Text(f"next: {next_value}", font_size=TINY_SIZE, color=TEXT_GRAY),
            Text(f"idx: {next_index}", font_size=TINY_SIZE - 2, color=TEXT_GRAY)
        ).arrange(DOWN, buff=0.05)
        next_info.move_to(box.get_center() + DOWN * 0.4)

        self.add(box, index_label, value_text, next_info)
        self.box = box
        self.value = value


class IndexedMerkleTreeScene(Scene):
    """Introduction to Indexed Merkle Tree structure."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        # Title
        title = Text("Indexed Merkle Tree", font_size=TITLE_SIZE, color=TEXT_WHITE, weight=BOLD)
        subtitle = Text("Sorted linked list in a merkle tree", font_size=BODY_SIZE, color=TEXT_GRAY)
        title_group = VGroup(title, subtitle).arrange(DOWN, buff=0.3)
        title_group.to_edge(UP, buff=0.5)

        self.play(Write(title), run_time=SLOW)
        self.play(FadeIn(subtitle), run_time=MEDIUM)
        self.wait(MEDIUM)

        # Genesis leaf
        genesis = IndexedLeaf("0", "∞", 0, 0)
        genesis.move_to(LEFT * 4)
        genesis_label = Text("Genesis", font_size=SMALL_SIZE, color=SOLANA_PURPLE)
        genesis_label.next_to(genesis, DOWN, buff=0.3)

        self.play(FadeIn(genesis), Write(genesis_label))
        self.wait(MEDIUM)

        # Add nullifiers
        nullifiers = [
            ("42", "∞", 0, 1),
            ("17", "42", 1, 2),
            ("89", "∞", 0, 3),
        ]

        leaves = [genesis]
        positions = [LEFT * 4, LEFT * 1.3, RIGHT * 1.3, RIGHT * 4]

        explain = Text(
            "Each leaf: value, next_value, next_index",
            font_size=SMALL_SIZE, color=TEXT_GRAY
        )
        explain.to_edge(DOWN, buff=1)
        self.play(Write(explain))

        for i, (val, next_val, next_idx, idx) in enumerate(nullifiers):
            leaf = IndexedLeaf(val, next_val, next_idx, idx)
            leaf.move_to(positions[idx])
            self.play(FadeIn(leaf, shift=UP * 0.5))

            if next_idx < len(leaves):
                arrow = Arrow(
                    leaf.get_bottom() + DOWN * 0.2,
                    leaves[next_idx].get_bottom() + DOWN * 0.2,
                    color=ZORB_CYAN, buff=0.1, stroke_width=2
                )
                arrow.shift(DOWN * 0.3)
                self.play(Create(arrow), run_time=FAST)

            leaves.append(leaf)
            self.wait(FAST)

        sorted_text = Text(
            "Sorted: 0 → 17 → 42 → 89 → ∞",
            font_size=BODY_SIZE, color=SUCCESS_GREEN
        )
        sorted_text.next_to(explain, UP, buff=0.3)
        self.play(Write(sorted_text))

        capacity = Text(
            "Depth 26 → 67 million nullifiers",
            font_size=SMALL_SIZE, color=ZORB_CYAN
        )
        capacity.next_to(sorted_text, UP, buff=0.2)
        self.play(Write(capacity))

        self.wait(2)


class NonMembershipProofScene(Scene):
    """How non-membership proofs work."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        title = Text("Non-Membership Proof", font_size=TITLE_SIZE - 6, color=TEXT_WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Simplified linked list
        nodes = []
        values = ["0", "17", "42", "89"]
        for i, val in enumerate(values):
            node = self.create_node(val)
            node.scale(0.8)
            nodes.append(node)

        node_group = VGroup(*nodes).arrange(RIGHT, buff=1)
        node_group.move_to(UP * 0.5)

        self.play(FadeIn(node_group))

        # Arrows
        arrows = []
        for i in range(len(nodes) - 1):
            arrow = Arrow(
                nodes[i].get_right(), nodes[i + 1].get_left(),
                color=ZORB_CYAN, buff=0.1, stroke_width=2
            )
            arrows.append(arrow)
        self.play(*[Create(a) for a in arrows])

        # Prove 25 NOT in tree
        prove_text = Text("Prove: 25 NOT in tree", font_size=BODY_SIZE, color=RENT_RED)
        prove_text.next_to(node_group, DOWN, buff=1)
        self.play(Write(prove_text))

        # Highlight low element (17)
        low_box = SurroundingRectangle(nodes[1], color=SUCCESS_GREEN, buff=0.1)
        low_label = Text("Low element", font_size=SMALL_SIZE, color=SUCCESS_GREEN)
        low_label.next_to(low_box, DOWN, buff=0.2)
        self.play(Create(low_box), Write(low_label))

        # Gap proof
        gap = VGroup(
            Text("17 < 25 < 42", font_size=SUBTITLE_SIZE, color=TEXT_WHITE),
            Text("Gap exists → 25 not in tree!", font_size=BODY_SIZE, color=SUCCESS_GREEN)
        ).arrange(DOWN, buff=0.2)
        gap.next_to(prove_text, DOWN, buff=0.5)

        self.play(Write(gap[0]))
        self.wait(MEDIUM)
        self.play(Write(gap[1]))

        self.wait(2)

    def create_node(self, value):
        box = RoundedRectangle(
            width=1.5, height=1, corner_radius=0.1,
            fill_color=ZORB_DARK, fill_opacity=0.9,
            stroke_color=ZORB_CYAN, stroke_width=2
        )
        text = Text(value, font_size=BODY_SIZE, color=TEXT_WHITE, weight=BOLD)
        text.move_to(box.get_center())
        return VGroup(box, text)


class TwoLayerSecurityScene(Scene):
    """Two-layer security model (ZK + PDA)."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        title = Text("Two-Layer Security", font_size=TITLE_SIZE - 6, color=TEXT_WHITE, weight=BOLD)
        subtitle = Text("Complete double-spend prevention", font_size=BODY_SIZE, color=TEXT_GRAY)
        VGroup(title, subtitle).arrange(DOWN, buff=0.2).to_edge(UP, buff=0.5)
        self.play(Write(title), FadeIn(subtitle))

        # Timeline
        timeline = Line(LEFT * 5, RIGHT * 5, color=TEXT_GRAY)
        timeline.move_to(UP * 1)

        epoch = Line(UP * 0.3, DOWN * 0.3, color=SOLANA_PURPLE, stroke_width=3)
        epoch.move_to(timeline.get_center())
        epoch_label = Text("Epoch\nSnapshot", font_size=TINY_SIZE, color=SOLANA_PURPLE)
        epoch_label.next_to(epoch, UP, buff=0.2)

        self.play(Create(timeline), Create(epoch), Write(epoch_label))

        # Layer 1: ZK
        layer1 = Rectangle(
            width=5, height=0.8, fill_color=SUCCESS_GREEN, fill_opacity=0.3,
            stroke_color=SUCCESS_GREEN, stroke_width=2
        )
        layer1.move_to(LEFT * 2.5 + DOWN * 0.5)
        l1_label = Text("Layer 1: ZK Proof", font_size=SMALL_SIZE, color=SUCCESS_GREEN)
        l1_label.next_to(layer1, DOWN, buff=0.1)

        self.play(FadeIn(layer1), Write(l1_label))

        # Layer 2: PDA
        layer2 = Rectangle(
            width=5, height=0.8, fill_color=PDA_ORANGE, fill_opacity=0.3,
            stroke_color=PDA_ORANGE, stroke_width=2
        )
        layer2.move_to(RIGHT * 2.5 + DOWN * 0.5)
        l2_label = Text("Layer 2: PDA Check", font_size=SMALL_SIZE, color=PDA_ORANGE)
        l2_label.next_to(layer2, DOWN, buff=0.1)

        self.play(FadeIn(layer2), Write(l2_label))

        # Combined
        combined = RoundedRectangle(
            width=11, height=1.2, corner_radius=0.2,
            stroke_color=ZORB_CYAN, stroke_width=3
        )
        combined.move_to(DOWN * 2.5)
        combined_text = Text(
            "NO GAPS → Complete protection",
            font_size=BODY_SIZE, color=ZORB_CYAN, weight=BOLD
        )
        combined_text.move_to(combined.get_center())

        self.play(Create(combined), Write(combined_text))
        self.wait(2)
