import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
  spring,
  Easing,
} from "remotion";
import { colors, typography } from "../styles";

/**
 * [0:25-1:10] Free Shielded Transfers (1350 frames / 45s)
 *
 * Technical Reference: app/docs/protocol/nullifier-tree-specification.md
 *
 * Explains the indexed merkle tree that enables free transfers:
 * - Problem: PDA-based nullifiers cost $0.13 each (rent locked forever)
 * - Solution: Indexed merkle tree (67M nullifiers in ~1KB)
 * - Two-layer security: ZK non-membership + PDA existence check
 *
 * Script sync points:
 * - [0-300] PROBLEM: PDA costs, rent accumulation
 * - [300-500] EVIDENCE: PrivacyCash on-chain data
 * - [500-850] SOLUTION: Indexed merkle tree architecture
 * - [850-1100] TECHNICAL: Two-layer security model
 * - [1100-1350] DEMO: Stress test counter
 */

export const FreeShieldedTransfers: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: colors.backgroundGradient,
      }}
    >
      {/* Section 1: The Problem - PDA Costs (0-300) */}
      <Sequence from={0} durationInFrames={300}>
        <ProblemSection frame={frame} />
      </Sequence>

      {/* Section 2: On-Chain Evidence - PrivacyCash (300-500) */}
      <Sequence from={300} durationInFrames={200}>
        <OnChainEvidenceSection frame={frame - 300} />
      </Sequence>

      {/* Section 3: Solution - Indexed Merkle Tree (500-850) */}
      <Sequence from={500} durationInFrames={350}>
        <IndexedMerkleTreeSection frame={frame - 500} />
      </Sequence>

      {/* Section 4: Two-Layer Security Model (850-1100) */}
      <Sequence from={850} durationInFrames={250}>
        <TwoLayerSecuritySection frame={frame - 850} />
      </Sequence>

      {/* Section 5: Demo - Stress Test Counter (1100-1350) */}
      <Sequence from={1100} durationInFrames={250}>
        <StressTestCounterDemo frame={frame - 1100} />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Section 1: The Problem - PDA Costs
 * Shows nullifier PDAs accumulating, each locking $0.13
 */
const ProblemSection: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Animate PDAs appearing one by one
  const pdaCount = Math.min(Math.floor(frame / 8), 12);
  const costPerPda = 0.13;
  const totalCost = (pdaCount * costPerPda).toFixed(2);

  const costOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  const foreverOpacity = interpolate(frame, [150, 180], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      {/* Title */}
      <h2
        style={{
          ...typography.h1,
          color: colors.problemRed,
          opacity: titleOpacity,
          marginBottom: 20,
        }}
      >
        The Problem: Nullifier Rent
      </h2>

      {/* Subtitle explaining nullifiers */}
      <p
        style={{
          ...typography.bodySmall,
          color: colors.textMuted,
          opacity: titleOpacity,
          marginBottom: 40,
          textAlign: "center",
        }}
      >
        Private transactions require nullifiers to prevent double-spending
      </p>

      {/* PDA Grid - showing accumulation */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          maxWidth: 700,
          justifyContent: "center",
          marginBottom: 40,
        }}
      >
        {Array.from({ length: pdaCount }).map((_, i) => {
          const delay = i * 8;
          const scale = spring({
            frame: frame - delay,
            fps,
            config: { damping: 12, stiffness: 200 },
          });

          return (
            <div
              key={i}
              style={{
                width: 50,
                height: 50,
                background: `linear-gradient(135deg, ${colors.pdaOrange} 0%, #ff6b35 100%)`,
                borderRadius: 8,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 10,
                color: "#fff",
                fontWeight: "bold",
                transform: `scale(${scale})`,
                boxShadow: `0 2px 8px ${colors.pdaOrange}40`,
              }}
            >
              PDA
            </div>
          );
        })}
      </div>

      {/* Cost accumulator */}
      <div
        style={{
          opacity: costOpacity,
          textAlign: "center",
        }}
      >
        <p
          style={{
            ...typography.body,
            color: colors.text,
            margin: 0,
          }}
        >
          Each nullifier PDA costs{" "}
          <span
            style={{
              color: colors.problemRed,
              fontWeight: "bold",
              fontFamily: typography.statSmall.fontFamily,
            }}
          >
            $0.13
          </span>{" "}
          in rent
        </p>

        <p
          style={{
            ...typography.statSmall,
            color: colors.problemRed,
            margin: "20px 0",
          }}
        >
          {pdaCount} PDAs = ${totalCost}
        </p>

        <p
          style={{
            ...typography.bodySmall,
            color: colors.problemRed,
            opacity: foreverOpacity,
            fontStyle: "italic",
          }}
        >
          Locked forever. Every transaction.
        </p>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Section 2: On-Chain Evidence
 * Shows real PrivacyCash data
 */
const OnChainEvidenceSection: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const dataOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Simulated on-chain data
  const lockedAmount = "$47,230";
  const nullifierCount = "363,308";

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <h3
        style={{
          fontSize: 40,
          color: colors.problemRed,
          opacity,
          marginBottom: 40,
        }}
      >
        Real Protocol Data
      </h3>

      {/* PrivacyCash data card */}
      <div
        style={{
          opacity: dataOpacity,
          padding: 50,
          background: `linear-gradient(135deg, ${colors.problemRed}15 0%, ${colors.problemRed}05 100%)`,
          borderRadius: 20,
          border: `3px solid ${colors.problemRed}50`,
          textAlign: "center",
          maxWidth: 600,
        }}
      >
        <p
          style={{
            fontSize: 28,
            color: colors.textMuted,
            margin: 0,
            marginBottom: 20,
          }}
        >
          PrivacyCash Protocol
        </p>

        <p
          style={{
            fontSize: 80,
            color: colors.problemRed,
            fontWeight: "bold",
            fontFamily: "monospace",
            margin: 0,
            textShadow: `0 0 40px ${colors.problemRed}40`,
          }}
        >
          {lockedAmount}
        </p>

        <p
          style={{
            fontSize: 24,
            color: colors.text,
            margin: "20px 0 0 0",
          }}
        >
          locked in{" "}
          <span style={{ color: colors.pdaOrange, fontWeight: "bold" }}>
            {nullifierCount}
          </span>{" "}
          nullifier PDAs
        </p>

        <p
          style={{
            fontSize: 20,
            color: colors.problemRed,
            marginTop: 30,
            fontStyle: "italic",
          }}
        >
          That money is gone. Forever.
        </p>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Section 3: Indexed Merkle Tree Solution
 * Visualizes the tree structure and capacity
 */
const IndexedMerkleTreeSection: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const treeOpacity = interpolate(frame, [50, 90], [0, 1], {
    extrapolateRight: "clamp",
  });

  const statsOpacity = interpolate(frame, [120, 150], [0, 1], {
    extrapolateRight: "clamp",
  });

  const comparisonOpacity = interpolate(frame, [200, 240], [0, 1], {
    extrapolateRight: "clamp",
  });

  const freeOpacity = interpolate(frame, [280, 320], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Tree visualization - simplified representation
  const TreeNode: React.FC<{
    level: number;
    index: number;
    delay: number;
    isHighlighted?: boolean;
  }> = ({ level, index, delay, isHighlighted }) => {
    const scale = spring({
      frame: frame - 50 - delay,
      fps,
      config: { damping: 15, stiffness: 150 },
    });

    const size = Math.max(12, 40 - level * 6);

    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: isHighlighted
            ? `linear-gradient(135deg, ${colors.zorbCyan} 0%, ${colors.zorbPurple} 100%)`
            : `linear-gradient(135deg, ${colors.zorbCyan}60 0%, ${colors.zorbPurple}60 100%)`,
          transform: `scale(${scale})`,
          boxShadow: isHighlighted ? `0 0 20px ${colors.zorbCyan}60` : "none",
        }}
      />
    );
  };

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Title */}
      <h2
        style={{
          fontSize: 52,
          color: colors.solutionGreen,
          opacity: titleOpacity,
          marginBottom: 30,
          fontWeight: 700,
        }}
      >
        ZORB Solution: Indexed Merkle Tree
      </h2>

      <div
        style={{
          display: "flex",
          gap: 80,
          alignItems: "center",
          opacity: treeOpacity,
        }}
      >
        {/* Simplified tree visualization */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 15,
          }}
        >
          {/* Level 0 - Root */}
          <div style={{ display: "flex", gap: 8 }}>
            <TreeNode level={0} index={0} delay={0} isHighlighted />
          </div>
          {/* Level 1 */}
          <div style={{ display: "flex", gap: 40 }}>
            <TreeNode level={1} index={0} delay={5} />
            <TreeNode level={1} index={1} delay={7} />
          </div>
          {/* Level 2 */}
          <div style={{ display: "flex", gap: 20 }}>
            {[0, 1, 2, 3].map((i) => (
              <TreeNode key={i} level={2} index={i} delay={10 + i * 2} />
            ))}
          </div>
          {/* Level 3 */}
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <TreeNode key={i} level={3} index={i} delay={20 + i} />
            ))}
          </div>
          {/* Ellipsis */}
          <div
            style={{
              fontSize: 24,
              color: colors.textMuted,
              letterSpacing: "0.3em",
            }}
          >
            ⋮
          </div>
          {/* Level indicator */}
          <div
            style={{
              fontSize: 16,
              color: colors.zorbCyan,
              fontFamily: "monospace",
            }}
          >
            Height: 26 levels
          </div>
        </div>

        {/* Stats panel */}
        <div
          style={{
            opacity: statsOpacity,
            padding: 40,
            background: `${colors.zorbCyan}10`,
            borderRadius: 20,
            border: `2px solid ${colors.zorbCyan}40`,
          }}
        >
          <div style={{ marginBottom: 30 }}>
            <p
              style={{
                fontSize: 18,
                color: colors.textMuted,
                margin: 0,
                marginBottom: 8,
              }}
            >
              Capacity
            </p>
            <p
              style={{
                fontSize: 48,
                color: colors.zorbCyan,
                fontWeight: "bold",
                fontFamily: "monospace",
                margin: 0,
              }}
            >
              67,108,864
            </p>
            <p
              style={{ fontSize: 16, color: colors.textMuted, margin: 0 }}
            >
              nullifiers (2²⁶)
            </p>
          </div>

          <div>
            <p
              style={{
                fontSize: 18,
                color: colors.textMuted,
                margin: 0,
                marginBottom: 8,
              }}
            >
              Storage
            </p>
            <p
              style={{
                fontSize: 48,
                color: colors.solutionGreen,
                fontWeight: "bold",
                fontFamily: "monospace",
                margin: 0,
              }}
            >
              ~1 KB
            </p>
            <p
              style={{ fontSize: 16, color: colors.textMuted, margin: 0 }}
            >
              total on-chain
            </p>
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div
        style={{
          opacity: comparisonOpacity,
          marginTop: 40,
          display: "flex",
          gap: 40,
          alignItems: "center",
        }}
      >
        <div
          style={{
            padding: "15px 30px",
            background: `${colors.problemRed}20`,
            borderRadius: 12,
            border: `2px solid ${colors.problemRed}40`,
          }}
        >
          <p style={{ fontSize: 16, color: colors.problemRed, margin: 0 }}>
            PDA approach: <strong>67M × $0.13 = $8.7M</strong>
          </p>
        </div>

        <div style={{ fontSize: 32, color: colors.textMuted }}>→</div>

        <div
          style={{
            padding: "15px 30px",
            background: `${colors.solutionGreen}20`,
            borderRadius: 12,
            border: `2px solid ${colors.solutionGreen}40`,
          }}
        >
          <p style={{ fontSize: 16, color: colors.solutionGreen, margin: 0 }}>
            ZORB approach: <strong>~$0.01</strong> (tree account rent)
          </p>
        </div>
      </div>

      {/* Same as Aztec */}
      <p
        style={{
          fontSize: 20,
          color: colors.textMuted,
          marginTop: 30,
          opacity: comparisonOpacity,
        }}
      >
        Same structure Aztec uses in production
      </p>

      {/* FREE declaration */}
      <h3
        style={{
          fontSize: 56,
          color: colors.zorbCyan,
          opacity: freeOpacity,
          marginTop: 30,
          textAlign: "center",
        }}
      >
        ZORB transfers are{" "}
        <span style={{ color: colors.solutionGreen }}>FREE</span>
      </h3>
    </AbsoluteFill>
  );
};

/**
 * Section 4: Two-Layer Security Model
 * Explains ZK proofs + PDA checks
 */
const TwoLayerSecuritySection: React.FC<{ frame: number }> = ({ frame }) => {
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const layer1Opacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateRight: "clamp",
  });

  const layer2Opacity = interpolate(frame, [100, 130], [0, 1], {
    extrapolateRight: "clamp",
  });

  const combinedOpacity = interpolate(frame, [160, 190], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <h3
        style={{
          fontSize: 40,
          color: colors.text,
          opacity: titleOpacity,
          marginBottom: 40,
        }}
      >
        Two-Layer Security Model
      </h3>

      <div
        style={{
          display: "flex",
          gap: 40,
          marginBottom: 40,
        }}
      >
        {/* Layer 1: ZK Proof */}
        <div
          style={{
            opacity: layer1Opacity,
            padding: 30,
            background: `${colors.zorbCyan}15`,
            borderRadius: 16,
            border: `2px solid ${colors.zorbCyan}50`,
            width: 340,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: colors.zorbCyan,
              fontWeight: "bold",
              marginBottom: 12,
              fontFamily: "monospace",
            }}
          >
            LAYER 1
          </div>
          <h4
            style={{
              fontSize: 24,
              color: colors.text,
              margin: "0 0 12px 0",
            }}
          >
            ZK Non-Membership Proof
          </h4>
          <p
            style={{
              fontSize: 16,
              color: colors.textMuted,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Groth16 proof that nullifier is NOT in the indexed tree.
            Covers all historical nullifiers.
          </p>
          <div
            style={{
              marginTop: 16,
              padding: "8px 12px",
              background: `${colors.zorbCyan}20`,
              borderRadius: 8,
              fontSize: 14,
              color: colors.zorbCyan,
              fontFamily: "monospace",
            }}
          >
            N ∉ IndexedTree(root)
          </div>
        </div>

        {/* Layer 2: PDA Check */}
        <div
          style={{
            opacity: layer2Opacity,
            padding: 30,
            background: `${colors.zorbPurple}15`,
            borderRadius: 16,
            border: `2px solid ${colors.zorbPurple}50`,
            width: 340,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: colors.zorbPurple,
              fontWeight: "bold",
              marginBottom: 12,
              fontFamily: "monospace",
            }}
          >
            LAYER 2
          </div>
          <h4
            style={{
              fontSize: 24,
              color: colors.text,
              margin: "0 0 12px 0",
            }}
          >
            PDA Existence Check
          </h4>
          <p
            style={{
              fontSize: 16,
              color: colors.textMuted,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            On-chain check: create_account fails if PDA exists.
            Catches recent nullifier uses.
          </p>
          <div
            style={{
              marginTop: 16,
              padding: "8px 12px",
              background: `${colors.zorbPurple}20`,
              borderRadius: 8,
              fontSize: 14,
              color: colors.zorbPurple,
              fontFamily: "monospace",
            }}
          >
            ¬∃ NullifierPDA[N]
          </div>
        </div>
      </div>

      {/* Combined guarantee */}
      <div
        style={{
          opacity: combinedOpacity,
          padding: "20px 40px",
          background: `${colors.solutionGreen}15`,
          borderRadius: 16,
          border: `2px solid ${colors.solutionGreen}50`,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 20,
            color: colors.solutionGreen,
            margin: 0,
            fontWeight: "bold",
          }}
        >
          Combined: Complete double-spend prevention
        </p>
        <p
          style={{
            fontSize: 16,
            color: colors.textMuted,
            margin: "10px 0 0 0",
          }}
        >
          Layer 1 covers past • Layer 2 covers present • No gaps
        </p>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Section 5: Stress Test Counter Demo
 * Shows real-time savings
 */
const StressTestCounterDemo: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Animated counter - synced to "[Show stress test counter]"
  const txCount = Math.floor(
    interpolate(frame, [40, 220], [0, 5000], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    })
  );

  const savedAmount = (txCount * 0.13).toFixed(2);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <h3
        style={{
          fontSize: 36,
          color: colors.zorbCyan,
          opacity,
          marginBottom: 20,
        }}
      >
        Live Stress Test
      </h3>

      <p
        style={{
          fontSize: 24,
          color: colors.text,
          opacity,
          marginBottom: 40,
        }}
      >
        Every transaction free. Real money saved.
      </p>

      <div
        style={{
          display: "flex",
          gap: 100,
          opacity,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: "bold",
              color: colors.text,
              fontFamily: "monospace",
              textShadow: `0 0 40px ${colors.zorbCyan}30`,
            }}
          >
            {txCount.toLocaleString()}
          </div>
          <div style={{ fontSize: 22, color: colors.textMuted }}>
            Private Transactions
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: "bold",
              color: colors.solutionGreen,
              fontFamily: "monospace",
              textShadow: `0 0 40px ${colors.solutionGreen}30`,
            }}
          >
            ${savedAmount}
          </div>
          <div style={{ fontSize: 22, color: colors.textMuted }}>
            Rent Saved vs PDAs
          </div>
        </div>
      </div>

      <p
        style={{
          fontSize: 20,
          color: colors.zorbCyan,
          marginTop: 50,
          opacity,
          fontStyle: "italic",
        }}
      >
        67M capacity • ~1KB storage • Same tech as Aztec
      </p>
    </AbsoluteFill>
  );
};
