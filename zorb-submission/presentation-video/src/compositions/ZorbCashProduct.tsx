import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Sequence,
} from "remotion";
import { colors } from "../styles";

/**
 * [1:50-2:45] zorb.cash — The Product (1650 frames / 55s)
 *
 * Script sync points:
 * - "zorb.cash is our early product..." (0-250)
 * - "[Demo: Generate shielded address]" (250-400)
 * - "[Demo: Shield]" (400-550)
 * - "[Demo: Send]" (550-700)
 * - "[Demo: Unshield]" (700-850)
 * - "[Show Break ZORB stress test]" (850-1400)
 * - Compliance/decentralization note (1400-1650)
 */

export const ZorbCashProduct: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: colors.backgroundGradient,
      }}
    >
      {/* Product Introduction (0-250) */}
      <Sequence from={0} durationInFrames={250}>
        <ProductIntro frame={frame} />
      </Sequence>

      {/* Demo: Basic Flows - 4 steps (250-850) */}
      <Sequence from={250} durationInFrames={600}>
        <FlowsDemo frame={frame - 250} />
      </Sequence>

      {/* Demo: Break ZORB Stress Test (850-1400) */}
      <Sequence from={850} durationInFrames={550}>
        <StressTestSection frame={frame - 850} />
      </Sequence>

      {/* Closing: Decentralization + Compliance (1400-1650) */}
      <Sequence from={1400} durationInFrames={250}>
        <ClosingNotes frame={frame - 1400} />
      </Sequence>
    </AbsoluteFill>
  );
};

const ProductIntro: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 100,
      }}
    >
      <h2
        style={{
          fontSize: 80,
          color: colors.zorbCyan,
          opacity,
          marginBottom: 40,
        }}
      >
        zorb.cash
      </h2>

      <p
        style={{
          fontSize: 36,
          color: colors.text,
          opacity,
          textAlign: "center",
        }}
      >
        An early product that combines both:
        <br />
        <span style={{ color: colors.solutionGreen }}>Free transfers</span> +{" "}
        <span style={{ color: colors.zorbCyan }}>Yield-bearing privacy</span>
      </p>
    </AbsoluteFill>
  );
};

const FlowsDemo: React.FC<{ frame: number }> = ({ frame }) => {
  // 4 demo steps from script: Generate, Shield, Send, Unshield
  const flows = [
    { name: "Generate", desc: "Create shielded address", icon: "🔑" },
    { name: "Shield", desc: "Deposit SOL/LST into pool", icon: "🛡️" },
    { name: "Send", desc: "Private transfer", icon: "↗️" },
    { name: "Unshield", desc: "Withdraw to public", icon: "🔓" },
  ];

  // 600 frames / 4 steps = 150 frames per step
  const activeFlow = Math.min(Math.floor(frame / 150), 3);

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
          fontSize: 44,
          color: colors.text,
          marginBottom: 50,
        }}
      >
        Demo: Basic Flows
      </h3>

      <div style={{ display: "flex", gap: 30 }}>
        {flows.map((flow, i) => {
          const isActive = i === activeFlow;
          const isPast = i < activeFlow;
          const opacity = isActive ? 1 : isPast ? 0.7 : 0.3;
          const borderColor = isActive
            ? colors.zorbCyan
            : isPast
              ? colors.solutionGreen
              : colors.textMuted;

          return (
            <div
              key={flow.name}
              style={{
                padding: 30,
                background: isActive
                  ? `${colors.zorbCyan}20`
                  : isPast
                    ? `${colors.solutionGreen}10`
                    : `${colors.textMuted}10`,
                borderRadius: 16,
                border: `3px solid ${borderColor}60`,
                opacity,
                width: 200,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>{flow.icon}</div>
              <h4
                style={{
                  fontSize: 28,
                  color: isPast ? colors.solutionGreen : colors.text,
                  marginBottom: 8,
                }}
              >
                {flow.name}
              </h4>
              <p
                style={{
                  fontSize: 16,
                  color: colors.textMuted,
                }}
              >
                {flow.desc}
              </p>
              {isPast && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 20,
                    color: colors.solutionGreen,
                  }}
                >
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p
        style={{
          fontSize: 22,
          color: colors.textMuted,
          marginTop: 40,
          fontStyle: "italic",
        }}
      >
        No one sees the amount. No one sees the recipient.
      </p>
    </AbsoluteFill>
  );
};

const StressTestSection: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Animated counters for stress test
  const txCount = Math.floor(
    interpolate(frame, [60, 450], [0, 2500], {
      extrapolateRight: "clamp",
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
      <h2
        style={{
          fontSize: 56,
          color: colors.zorbCyan,
          opacity,
          marginBottom: 30,
        }}
      >
        "Break ZORB" Stress Test
      </h2>

      <p
        style={{
          fontSize: 22,
          color: colors.textMuted,
          opacity,
          marginBottom: 40,
        }}
      >
        Running on devnet • Real ZK proofs • Real throughput
      </p>

      <div
        style={{
          display: "flex",
          gap: 80,
          opacity,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 90,
              fontWeight: "bold",
              color: colors.text,
              fontFamily: "monospace",
            }}
          >
            {txCount.toLocaleString()}
          </div>
          <div style={{ fontSize: 24, color: colors.textMuted }}>
            Private Transactions
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 90,
              fontWeight: "bold",
              color: colors.solutionGreen,
              fontFamily: "monospace",
            }}
          >
            ${savedAmount}
          </div>
          <div style={{ fontSize: 24, color: colors.textMuted }}>
            Rent Saved vs PDAs
          </div>
        </div>
      </div>

      <p
        style={{
          fontSize: 28,
          color: colors.solutionGreen,
          marginTop: 50,
          opacity,
        }}
      >
        Every transaction free. No nullifier rent.
      </p>
    </AbsoluteFill>
  );
};

const ClosingNotes: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 100,
      }}
    >
      <div
        style={{
          opacity,
          display: "flex",
          gap: 60,
        }}
      >
        <div
          style={{
            padding: 30,
            background: `${colors.zorbCyan}10`,
            borderRadius: 16,
            border: `2px solid ${colors.zorbCyan}30`,
            textAlign: "center",
            width: 350,
          }}
        >
          <h4
            style={{
              fontSize: 28,
              color: colors.zorbCyan,
              marginBottom: 12,
            }}
          >
            Decentralized
          </h4>
          <p
            style={{
              fontSize: 18,
              color: colors.textMuted,
            }}
          >
            No operators • No custody
            <br />
            Permissionless protocol
          </p>
        </div>

        <div
          style={{
            padding: 30,
            background: `${colors.zorbPurple}10`,
            borderRadius: 16,
            border: `2px solid ${colors.zorbPurple}30`,
            textAlign: "center",
            width: 350,
          }}
        >
          <h4
            style={{
              fontSize: 28,
              color: colors.zorbPurple,
              marginBottom: 12,
            }}
          >
            Compliance Path
          </h4>
          <p
            style={{
              fontSize: 18,
              color: colors.textMuted,
            }}
          >
            Proof of innocence
            <br />
            Association sets
          </p>
        </div>
      </div>

      <p
        style={{
          fontSize: 32,
          color: colors.text,
          marginTop: 50,
          opacity,
          fontWeight: 600,
        }}
      >
        Shield your SOL. Send for free. Earn while hidden.
      </p>
    </AbsoluteFill>
  );
};
