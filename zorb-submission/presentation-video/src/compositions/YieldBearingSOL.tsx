import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Sequence,
  spring,
  useVideoConfig,
} from "remotion";
import { colors } from "../styles";

/**
 * [1:10-1:50] Yield-Bearing Shielded SOL (1200 frames @ 30fps = 40 seconds)
 *
 * From PRESENTATION_VIDEO_SCRIPT.md:
 *
 * Structure:
 * [0-350] PROBLEM: Anonymity Set Fragmentation
 *   - "The value of privacy grows with anonymity set"
 *   - Visual: 4 small isolated pools
 *   - "4 small pools = weak privacy"
 *
 * [350-700] SOLUTION: Unified SOL
 *   - Transition: 4 pools merge into 1
 *   - Unified SOL icon
 *   - "One pool. Maximum anonymity set."
 *
 * [700-1000] BONUS: Yield-Bearing Privacy
 *   - "7-8% APY" stat
 *   - "Your privacy earns yield"
 *
 * [1000-1200] SUMMARY
 *   - "Privacy + yield — no tradeoff"
 */

export const YieldBearingSOL: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: colors.backgroundGradient,
      }}
    >
      {/* [0-350] Problem: Anonymity Set Fragmentation */}
      <Sequence from={0} durationInFrames={350}>
        <ProblemSection />
      </Sequence>

      {/* [350-700] Solution: Unified SOL */}
      <Sequence from={350} durationInFrames={350}>
        <SolutionSection />
      </Sequence>

      {/* [700-1000] Bonus: Yield-Bearing Privacy */}
      <Sequence from={700} durationInFrames={300}>
        <YieldSection />
      </Sequence>

      {/* [1000-1200] Summary */}
      <Sequence from={1000} durationInFrames={200}>
        <SummarySection />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * PROBLEM SECTION [0-350 frames]
 * Shows the fragmentation problem with 4 isolated pools
 */
const ProblemSection: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const insightOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateRight: "clamp",
  });

  const tokens = [
    { name: "SOL", color: "#9945FF" },
    { name: "jitoSOL", color: "#00D18C" },
    { name: "mSOL", color: "#31D7D7" },
    { name: "vSOL", color: "#F7931A" },
  ];

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
          color: colors.problemRed,
          opacity: titleOpacity,
          marginBottom: 30,
          textAlign: "center",
        }}
      >
        The Problem: Fragmented Anonymity
      </h2>

      <p
        style={{
          fontSize: 28,
          color: colors.text,
          opacity: insightOpacity,
          marginBottom: 50,
          textAlign: "center",
          maxWidth: 900,
        }}
      >
        "The value of a privacy solution grows with the size of its anonymity set"
      </p>

      {/* 4 Isolated Pools */}
      <div
        style={{
          display: "flex",
          gap: 40,
          marginBottom: 50,
        }}
      >
        {tokens.map((token, i) => {
          const poolOpacity = interpolate(
            frame,
            [80 + i * 30, 110 + i * 30],
            [0, 1],
            { extrapolateRight: "clamp" }
          );

          const poolScale = spring({
            frame: frame - (80 + i * 30),
            fps,
            config: { damping: 12, stiffness: 100 },
          });

          return (
            <div
              key={token.name}
              style={{
                opacity: poolOpacity,
                transform: `scale(${poolScale})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 100,
                  background: `${token.color}20`,
                  borderRadius: 12,
                  border: `2px solid ${token.color}60`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <span style={{ color: token.color, fontSize: 20, fontWeight: 600 }}>
                  Pool
                </span>
              </div>
              <span style={{ color: colors.text, fontSize: 18 }}>{token.name}</span>
            </div>
          );
        })}
      </div>

      {/* Weak privacy callout */}
      {frame > 200 && (
        <div
          style={{
            opacity: interpolate(frame, [200, 230], [0, 1], {
              extrapolateRight: "clamp",
            }),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 15,
          }}
        >
          <div
            style={{
              padding: "15px 40px",
              background: `${colors.problemRed}20`,
              borderRadius: 8,
              border: `2px solid ${colors.problemRed}60`,
            }}
          >
            <span style={{ color: colors.problemRed, fontSize: 32, fontWeight: 600 }}>
              4 small pools = weak privacy
            </span>
          </div>
          <p style={{ color: colors.textMuted, fontSize: 24 }}>
            Fewer users to hide among. Easier to trace.
          </p>
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * SOLUTION SECTION [350-700 frames]
 * Shows pools merging into Unified SOL
 */
const SolutionSection: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const tokens = [
    { name: "SOL", color: "#9945FF" },
    { name: "jitoSOL", color: "#00D18C" },
    { name: "mSOL", color: "#31D7D7" },
    { name: "vSOL", color: "#F7931A" },
  ];

  // Tokens start spread out, then converge to center
  const convergenceProgress = interpolate(frame, [50, 150], [0, 1], {
    extrapolateRight: "clamp",
  });

  const unifiedOpacity = interpolate(frame, [150, 180], [0, 1], {
    extrapolateRight: "clamp",
  });

  const unifiedScale = spring({
    frame: frame - 150,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const messageOpacity = interpolate(frame, [200, 230], [0, 1], {
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
      <h2
        style={{
          fontSize: 56,
          color: colors.solutionGreen,
          opacity: titleOpacity,
          marginBottom: 60,
          textAlign: "center",
        }}
      >
        The Solution: Unified SOL
      </h2>

      {/* Token icons converging */}
      <div
        style={{
          position: "relative",
          width: 600,
          height: 200,
          marginBottom: 40,
        }}
      >
        {tokens.map((token, i) => {
          const startX = (i - 1.5) * 150;
          const endX = 0;
          const currentX = interpolate(convergenceProgress, [0, 1], [startX, endX]);

          const tokenOpacity = interpolate(convergenceProgress, [0.8, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={token.name}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${currentX}px), -50%)`,
                opacity: tokenOpacity,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: `${token.color}30`,
                  border: `3px solid ${token.color}`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <span style={{ color: token.color, fontSize: 14, fontWeight: 600 }}>
                  {token.name}
                </span>
              </div>
            </div>
          );
        })}

        {/* Unified SOL icon */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) scale(${Math.max(0, unifiedScale)})`,
            opacity: unifiedOpacity,
          }}
        >
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${colors.solPurple}40, ${colors.zorbCyan}40)`,
              border: `4px solid ${colors.zorbCyan}`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: `0 0 40px ${colors.zorbCyan}40`,
            }}
          >
            <span
              style={{
                color: colors.zorbCyan,
                fontSize: 20,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Unified<br />SOL
            </span>
          </div>
        </div>
      </div>

      {/* Message */}
      <div
        style={{
          opacity: messageOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            padding: "15px 50px",
            background: `${colors.solutionGreen}20`,
            borderRadius: 8,
            border: `2px solid ${colors.solutionGreen}60`,
          }}
        >
          <span style={{ color: colors.solutionGreen, fontSize: 36, fontWeight: 600 }}>
            One pool. Maximum anonymity set.
          </span>
        </div>
        <p style={{ color: colors.text, fontSize: 24 }}>
          All SOL-equivalents treated as fungible in-circuit
        </p>
      </div>
    </AbsoluteFill>
  );
};

/**
 * YIELD SECTION [700-1000 frames]
 * Shows the APY benefit
 */
const YieldSection: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const apyCounter = interpolate(frame, [50, 150], [0, 7.5], {
    extrapolateRight: "clamp",
  });

  const detailOpacity = interpolate(frame, [150, 180], [0, 1], {
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
      <h2
        style={{
          fontSize: 48,
          color: colors.zorbCyan,
          opacity: titleOpacity,
          marginBottom: 30,
          textAlign: "center",
        }}
      >
        The Bonus: Yield-Bearing Privacy
      </h2>

      <p
        style={{
          fontSize: 28,
          color: colors.text,
          opacity: titleOpacity,
          marginBottom: 40,
          textAlign: "center",
        }}
      >
        Your shielded SOL earns staking rewards
      </p>

      <div
        style={{
          fontSize: 140,
          fontWeight: "bold",
          color: colors.solutionGreen,
          opacity: titleOpacity,
          marginBottom: 30,
        }}
      >
        {apyCounter.toFixed(1)}% APY
      </div>

      <div
        style={{
          opacity: detailOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 15,
        }}
      >
        <p style={{ color: colors.textMuted, fontSize: 24, textAlign: "center" }}>
          Underlying LSTs (jitoSOL, mSOL) continue accruing rewards
        </p>
        <p style={{ color: colors.textMuted, fontSize: 24, textAlign: "center" }}>
          ZK circuit computes yield share — amount never revealed
        </p>
      </div>
    </AbsoluteFill>
  );
};

/**
 * SUMMARY SECTION [1000-1200 frames]
 * The tagline
 */
const SummarySection: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        <h2
          style={{
            fontSize: 72,
            color: colors.zorbCyan,
            textAlign: "center",
          }}
        >
          Privacy + Yield
        </h2>

        <div
          style={{
            padding: "20px 60px",
            background: `${colors.solutionGreen}20`,
            borderRadius: 12,
            border: `2px solid ${colors.solutionGreen}60`,
          }}
        >
          <span style={{ color: colors.solutionGreen, fontSize: 48, fontWeight: 600 }}>
            No Tradeoff
          </span>
        </div>

        <p style={{ color: colors.text, fontSize: 28, textAlign: "center" }}>
          Unified SOL: Strong privacy. Real yield.
        </p>
      </div>
    </AbsoluteFill>
  );
};
