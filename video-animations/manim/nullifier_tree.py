"""
ZORB Nullifier Indexed Merkle Tree Animation
=============================================

Visualizes the key concepts from nullifier-tree-specification.md:
1. Indexed Merkle Tree structure (sorted linked list)
2. Non-membership proof (low element + gap)
3. Insertion operation
4. Two-layer security (ZK proof + PDA check)

Run with:
    manim -pql nullifier_tree.py IndexedMerkleTreeScene
    manim -pql nullifier_tree.py NonMembershipProofScene
    manim -pql nullifier_tree.py InsertionScene
    manim -pql nullifier_tree.py TwoLayerSecurityScene
    manim -pql nullifier_tree.py FullDemo

For high quality:
    manim -pqh nullifier_tree.py FullDemo
"""

from manim import *
import numpy as np

# ZORB brand colors
ZORB_CYAN = "#00D1FF"
ZORB_DARK = "#0a0a0f"
RENT_RED = "#FF4444"
PDA_ORANGE = "#FF8844"
SOLANA_PURPLE = "#9945FF"
SUCCESS_GREEN = "#44FF88"


class IndexedLeaf(VGroup):
    """Visual representation of an indexed merkle tree leaf."""

    def __init__(self, value: str, next_value: str, next_index: int, index: int, **kwargs):
        super().__init__(**kwargs)

        # Main box
        box = RoundedRectangle(
            width=2.5, height=1.8, corner_radius=0.15,
            fill_color=ZORB_DARK, fill_opacity=0.9,
            stroke_color=ZORB_CYAN, stroke_width=2
        )

        # Index label (top)
        index_label = Text(f"[{index}]", font_size=20, color=GRAY)
        index_label.next_to(box, UP, buff=0.1)

        # Value (main content)
        value_text = Text(value, font_size=24, color=WHITE, weight=BOLD)
        value_text.move_to(box.get_center() + UP * 0.3)

        # Next pointer info
        next_info = VGroup(
            Text(f"next: {next_value}", font_size=16, color=GRAY),
            Text(f"idx: {next_index}", font_size=14, color=GRAY)
        ).arrange(DOWN, buff=0.05)
        next_info.move_to(box.get_center() + DOWN * 0.4)

        self.add(box, index_label, value_text, next_info)
        self.box = box
        self.value = value


class IndexedMerkleTreeScene(Scene):
    """Scene 1: Introduction to Indexed Merkle Tree structure."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        # Title
        title = Text("Indexed Merkle Tree", font_size=48, color=WHITE, weight=BOLD)
        subtitle = Text("Sorted linked list in a merkle tree", font_size=24, color=GRAY)
        title_group = VGroup(title, subtitle).arrange(DOWN, buff=0.3)
        title_group.to_edge(UP, buff=0.5)

        self.play(Write(title), run_time=1)
        self.play(FadeIn(subtitle), run_time=0.5)
        self.wait(0.5)

        # Genesis leaf
        genesis = IndexedLeaf("0", "∞", 0, 0)
        genesis.move_to(LEFT * 4)
        genesis_label = Text("Genesis", font_size=18, color=SOLANA_PURPLE)
        genesis_label.next_to(genesis, DOWN, buff=0.3)

        self.play(FadeIn(genesis), Write(genesis_label))
        self.wait(0.5)

        # Add nullifiers one by one
        nullifiers = [
            ("42", "∞", 0, 1),
            ("17", "42", 1, 2),
            ("89", "∞", 0, 3),
        ]

        leaves = [genesis]
        positions = [LEFT * 4, LEFT * 1.3, RIGHT * 1.3, RIGHT * 4]

        # Explanation text
        explain = Text(
            "Each leaf stores: value, next_value, next_index",
            font_size=20, color=GRAY
        )
        explain.to_edge(DOWN, buff=1)
        self.play(Write(explain))

        for i, (val, next_val, next_idx, idx) in enumerate(nullifiers):
            leaf = IndexedLeaf(val, next_val, next_idx, idx)
            leaf.move_to(positions[idx])

            # Animate insertion
            self.play(FadeIn(leaf, shift=UP * 0.5))

            # Draw arrow to next
            if next_idx < len(leaves):
                arrow = Arrow(
                    leaf.get_bottom() + DOWN * 0.2,
                    leaves[next_idx].get_bottom() + DOWN * 0.2,
                    color=ZORB_CYAN, buff=0.1,
                    stroke_width=2, max_tip_length_to_length_ratio=0.15
                )
                arrow.shift(DOWN * 0.3)
                self.play(Create(arrow), run_time=0.5)

            leaves.append(leaf)
            self.wait(0.3)

        # Show sorted order
        sorted_text = Text(
            "Sorted order: 0 → 17 → 42 → 89 → ∞",
            font_size=24, color=SUCCESS_GREEN
        )
        sorted_text.next_to(explain, UP, buff=0.3)
        self.play(Write(sorted_text))

        # Capacity note
        capacity = Text(
            "Tree depth 26 → 67 million nullifiers",
            font_size=20, color=ZORB_CYAN
        )
        capacity.next_to(sorted_text, UP, buff=0.2)
        self.play(Write(capacity))

        self.wait(2)


class NonMembershipProofScene(Scene):
    """Scene 2: How non-membership proofs work."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        # Title
        title = Text("Non-Membership Proof", font_size=42, color=WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Create tree visualization (simplified)
        leaves_data = [
            ("0", "17", 2, 0),
            ("42", "89", 3, 1),
            ("17", "42", 1, 2),
            ("89", "∞", 0, 3),
        ]

        leaves = []
        for val, next_val, next_idx, idx in leaves_data:
            leaf = IndexedLeaf(val, next_val, next_idx, idx)
            leaf.scale(0.7)
            leaves.append(leaf)

        # Arrange in sorted visual order
        sorted_order = [0, 2, 1, 3]  # indices in sorted value order
        tree_group = VGroup(*[leaves[i] for i in sorted_order])
        tree_group.arrange(RIGHT, buff=0.5)
        tree_group.move_to(UP * 0.5)

        self.play(FadeIn(tree_group))
        self.wait(0.5)

        # Draw arrows showing linked list
        arrows = []
        for i in range(len(sorted_order) - 1):
            arrow = Arrow(
                leaves[sorted_order[i]].get_right(),
                leaves[sorted_order[i+1]].get_left(),
                color=ZORB_CYAN, buff=0.1, stroke_width=2
            )
            arrows.append(arrow)
        self.play(*[Create(a) for a in arrows])

        # Now prove 25 is NOT in the tree
        prove_text = Text("Prove: 25 is NOT in tree", font_size=28, color=RENT_RED)
        prove_text.next_to(tree_group, DOWN, buff=1)
        self.play(Write(prove_text))
        self.wait(0.5)

        # Highlight low element (17)
        low_box = SurroundingRectangle(leaves[2], color=SUCCESS_GREEN, buff=0.1)
        low_label = Text("Low element", font_size=18, color=SUCCESS_GREEN)
        low_label.next_to(low_box, DOWN, buff=0.2)

        self.play(Create(low_box), Write(low_label))

        # Show the gap
        gap_text = VGroup(
            Text("17 < 25 < 42", font_size=32, color=WHITE),
            Text("Gap exists → 25 not in tree!", font_size=24, color=SUCCESS_GREEN)
        ).arrange(DOWN, buff=0.2)
        gap_text.next_to(prove_text, DOWN, buff=0.5)

        self.play(Write(gap_text[0]))
        self.wait(0.5)
        self.play(Write(gap_text[1]))

        # ZK proof explanation
        zk_box = RoundedRectangle(
            width=6, height=1.5, corner_radius=0.2,
            fill_color=SOLANA_PURPLE, fill_opacity=0.2,
            stroke_color=SOLANA_PURPLE
        )
        zk_text = VGroup(
            Text("ZK Proof verifies:", font_size=20, color=WHITE),
            Text("1. Low element (17) exists in tree", font_size=16, color=GRAY),
            Text("2. 17.next_value = 42 (proves gap)", font_size=16, color=GRAY),
        ).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        zk_group = VGroup(zk_box, zk_text)
        zk_text.move_to(zk_box.get_center())
        zk_group.to_edge(DOWN, buff=0.5)

        self.play(FadeIn(zk_group))
        self.wait(2)


class InsertionScene(Scene):
    """Scene 3: How nullifier insertion works."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        # Title
        title = Text("Nullifier Insertion", font_size=42, color=WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Before state
        before_label = Text("Before: inserting 25", font_size=24, color=GRAY)
        before_label.next_to(title, DOWN, buff=0.5)
        self.play(Write(before_label))

        # Simplified linked list view
        node_17 = self.create_node("17", "42", SUCCESS_GREEN)
        node_42 = self.create_node("42", "89", WHITE)

        node_17.move_to(LEFT * 2 + UP * 0.5)
        node_42.move_to(RIGHT * 2 + UP * 0.5)

        arrow_17_42 = Arrow(
            node_17.get_right(), node_42.get_left(),
            color=ZORB_CYAN, buff=0.2
        )

        self.play(FadeIn(node_17), FadeIn(node_42), Create(arrow_17_42))
        self.wait(0.5)

        # Step 1: Find low element
        step1 = Text("Step 1: Find low element (17 < 25 < 42)", font_size=20, color=GRAY)
        step1.move_to(DOWN * 1)
        self.play(Write(step1))

        low_highlight = SurroundingRectangle(node_17, color=SUCCESS_GREEN, buff=0.1)
        self.play(Create(low_highlight))
        self.wait(0.5)

        # Step 2: Update low element pointer
        step2 = Text("Step 2: Update 17.next → 25", font_size=20, color=GRAY)
        step2.move_to(DOWN * 1.5)
        self.play(Transform(step1, step2))

        # Create new node
        node_25 = self.create_node("25", "42", ZORB_CYAN)
        node_25.move_to(UP * 0.5)
        node_25.set_opacity(0)

        self.play(
            FadeOut(arrow_17_42),
            node_25.animate.set_opacity(1),
        )

        # New arrows
        arrow_17_25 = Arrow(
            node_17.get_right(), node_25.get_left(),
            color=SUCCESS_GREEN, buff=0.2
        )
        arrow_25_42 = Arrow(
            node_25.get_right(), node_42.get_left(),
            color=ZORB_CYAN, buff=0.2
        )

        self.play(Create(arrow_17_25), Create(arrow_25_42))

        # Step 3
        step3 = Text("Step 3: New leaf appended to tree", font_size=20, color=GRAY)
        step3.move_to(DOWN * 1.5)
        self.play(Transform(step1, step3))

        # Result
        result = Text(
            "Sorted order maintained: 17 → 25 → 42",
            font_size=24, color=SUCCESS_GREEN
        )
        result.move_to(DOWN * 2.5)
        self.play(Write(result))

        self.wait(2)

    def create_node(self, value, next_val, color):
        box = RoundedRectangle(
            width=1.8, height=1.2, corner_radius=0.1,
            fill_color=ZORB_DARK, fill_opacity=0.9,
            stroke_color=color, stroke_width=2
        )
        val_text = Text(value, font_size=28, color=color, weight=BOLD)
        next_text = Text(f"→{next_val}", font_size=16, color=GRAY)
        content = VGroup(val_text, next_text).arrange(DOWN, buff=0.1)
        content.move_to(box.get_center())
        return VGroup(box, content)


class TwoLayerSecurityScene(Scene):
    """Scene 4: Two-layer security model (ZK + PDA)."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        # Title
        title = Text("Two-Layer Security", font_size=42, color=WHITE, weight=BOLD)
        subtitle = Text("Complete double-spend prevention", font_size=24, color=GRAY)
        title_group = VGroup(title, subtitle).arrange(DOWN, buff=0.2)
        title_group.to_edge(UP, buff=0.5)
        self.play(Write(title), FadeIn(subtitle))

        # Timeline
        timeline = Line(LEFT * 5, RIGHT * 5, color=GRAY)
        timeline.move_to(UP * 1)

        # Epoch marker
        epoch_marker = Line(UP * 0.3, DOWN * 0.3, color=SOLANA_PURPLE, stroke_width=3)
        epoch_marker.move_to(timeline.get_center())
        epoch_label = Text("Epoch Root\nCaptured", font_size=14, color=SOLANA_PURPLE)
        epoch_label.next_to(epoch_marker, UP, buff=0.2)

        self.play(Create(timeline), Create(epoch_marker), Write(epoch_label))

        # Layer 1: ZK covers past
        layer1_region = Rectangle(
            width=5, height=0.8, fill_color=SUCCESS_GREEN, fill_opacity=0.3,
            stroke_color=SUCCESS_GREEN, stroke_width=2
        )
        layer1_region.move_to(LEFT * 2.5 + DOWN * 0.5)
        layer1_label = Text("Layer 1: ZK Proof", font_size=18, color=SUCCESS_GREEN)
        layer1_label.next_to(layer1_region, DOWN, buff=0.1)
        layer1_desc = Text("Proves nullifier not in tree", font_size=14, color=GRAY)
        layer1_desc.next_to(layer1_label, DOWN, buff=0.1)

        self.play(FadeIn(layer1_region), Write(layer1_label), Write(layer1_desc))

        # Layer 2: PDA covers future
        layer2_region = Rectangle(
            width=5, height=0.8, fill_color=PDA_ORANGE, fill_opacity=0.3,
            stroke_color=PDA_ORANGE, stroke_width=2
        )
        layer2_region.move_to(RIGHT * 2.5 + DOWN * 0.5)
        layer2_label = Text("Layer 2: PDA Check", font_size=18, color=PDA_ORANGE)
        layer2_label.next_to(layer2_region, DOWN, buff=0.1)
        layer2_desc = Text("Account exists = already spent", font_size=14, color=GRAY)
        layer2_desc.next_to(layer2_label, DOWN, buff=0.1)

        self.play(FadeIn(layer2_region), Write(layer2_label), Write(layer2_desc))

        # Combined coverage
        combined_box = RoundedRectangle(
            width=11, height=1.5, corner_radius=0.2,
            stroke_color=ZORB_CYAN, stroke_width=3
        )
        combined_box.move_to(DOWN * 2.8)
        combined_text = Text(
            "Combined: NO GAPS → Complete protection",
            font_size=24, color=ZORB_CYAN, weight=BOLD
        )
        combined_text.move_to(combined_box.get_center())

        self.play(Create(combined_box), Write(combined_text))

        # Show attempted double-spend
        attack_text = Text("Double-spend attempt:", font_size=20, color=RENT_RED)
        attack_text.move_to(DOWN * 4)

        case1 = Text("• Used before epoch → ZK proof fails", font_size=16, color=GRAY)
        case2 = Text("• Used after epoch → PDA exists, tx fails", font_size=16, color=GRAY)
        cases = VGroup(case1, case2).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        cases.next_to(attack_text, DOWN, buff=0.2)

        self.play(Write(attack_text), Write(cases))

        self.wait(2)


class FreeTransfersScene(Scene):
    """Scene 5: Why transfers are free (no per-tx PDA rent)."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        # Title
        title = Text("Free Shielded Transfers", font_size=42, color=WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))

        # Other protocols
        other_label = Text("Other Protocols:", font_size=24, color=RENT_RED)
        other_label.move_to(LEFT * 3 + UP * 1.5)
        self.play(Write(other_label))

        # PDA boxes accumulating
        pdas = VGroup()
        for i in range(6):
            pda = RoundedRectangle(
                width=1.2, height=0.6, corner_radius=0.1,
                fill_color=PDA_ORANGE, fill_opacity=0.8,
                stroke_color=PDA_ORANGE
            )
            pda_text = Text(f"PDA", font_size=12, color=WHITE)
            pda_text.move_to(pda.get_center())
            pda_group = VGroup(pda, pda_text)
            pdas.add(pda_group)

        pdas.arrange_in_grid(rows=2, cols=3, buff=0.2)
        pdas.move_to(LEFT * 3 + DOWN * 0.5)

        for pda in pdas:
            self.play(FadeIn(pda, shift=DOWN * 0.2), run_time=0.2)

        cost_text = Text("$0.13 × 6 = $0.78 locked", font_size=20, color=RENT_RED)
        cost_text.next_to(pdas, DOWN, buff=0.3)
        self.play(Write(cost_text))

        # ZORB
        zorb_label = Text("ZORB:", font_size=24, color=ZORB_CYAN)
        zorb_label.move_to(RIGHT * 3 + UP * 1.5)
        self.play(Write(zorb_label))

        # Single tree
        tree_box = RoundedRectangle(
            width=3, height=2, corner_radius=0.2,
            fill_color=ZORB_CYAN, fill_opacity=0.2,
            stroke_color=ZORB_CYAN, stroke_width=2
        )
        tree_box.move_to(RIGHT * 3 + DOWN * 0.3)

        tree_text = VGroup(
            Text("Indexed", font_size=20, color=ZORB_CYAN),
            Text("Merkle Tree", font_size=20, color=ZORB_CYAN),
            Text("67M nullifiers", font_size=16, color=GRAY),
            Text("~1KB account", font_size=16, color=GRAY),
        ).arrange(DOWN, buff=0.1)
        tree_text.move_to(tree_box.get_center())

        self.play(FadeIn(tree_box), Write(tree_text))

        zorb_cost = Text("$0.00 per transfer", font_size=20, color=SUCCESS_GREEN)
        zorb_cost.next_to(tree_box, DOWN, buff=0.3)
        self.play(Write(zorb_cost))

        # Bottom comparison
        comparison = Text(
            "Privacy that scales. Privacy that's free.",
            font_size=28, color=WHITE, weight=BOLD
        )
        comparison.to_edge(DOWN, buff=1)
        self.play(Write(comparison))

        self.wait(2)


class FullDemo(Scene):
    """Combined demo showing all concepts."""

    def construct(self):
        self.camera.background_color = ZORB_DARK

        # Intro
        logo = Text("ZORB", font_size=72, color=ZORB_CYAN, weight=BOLD)
        tagline = Text("Nullifier Indexed Merkle Tree", font_size=32, color=WHITE)
        intro = VGroup(logo, tagline).arrange(DOWN, buff=0.5)

        self.play(Write(logo), run_time=1)
        self.play(FadeIn(tagline))
        self.wait(1)
        self.play(FadeOut(intro))

        # Run each scene's content
        scenes = [
            ("Indexed Merkle Tree", "Sorted linked list structure"),
            ("Non-Membership Proofs", "Prove nullifier not in tree"),
            ("Free Transfers", "No per-tx rent costs"),
            ("Two-Layer Security", "ZK proofs + PDA checks"),
        ]

        for title_text, desc_text in scenes:
            title = Text(title_text, font_size=48, color=ZORB_CYAN, weight=BOLD)
            desc = Text(desc_text, font_size=24, color=GRAY)
            group = VGroup(title, desc).arrange(DOWN, buff=0.3)

            self.play(FadeIn(group))
            self.wait(1.5)
            self.play(FadeOut(group))

        # Closing
        closing = VGroup(
            Text("Privacy should be free.", font_size=36, color=WHITE),
            Text("ZORB makes it possible.", font_size=42, color=ZORB_CYAN, weight=BOLD),
        ).arrange(DOWN, buff=0.3)

        self.play(Write(closing[0]))
        self.play(Write(closing[1]))
        self.wait(2)


if __name__ == "__main__":
    # Instructions for running
    print("""
    Run individual scenes:
        manim -pql nullifier_tree.py IndexedMerkleTreeScene
        manim -pql nullifier_tree.py NonMembershipProofScene
        manim -pql nullifier_tree.py InsertionScene
        manim -pql nullifier_tree.py TwoLayerSecurityScene
        manim -pql nullifier_tree.py FreeTransfersScene
        manim -pql nullifier_tree.py FullDemo

    For high quality (1080p):
        manim -pqh nullifier_tree.py FullDemo

    For 4K:
        manim -pqk nullifier_tree.py FullDemo
    """)
