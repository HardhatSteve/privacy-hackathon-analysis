import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { colors, typography } from "../styles";

/**
 * [0:00-0:25] Introduction — ZORB
 *
 * From PRESENTATION_VIDEO_SCRIPT.md:
 * 1. ZORB is exploring programmable privacy on Solana similar to Aztec and Miden
 * 2. We're starting with private payments — fully unlinkable transactions (ZEXE model)
 * 3. Architecturally similar to Zcash shielded payments
 */

interface IntroductionProps {
  title?: string;
  subtitle?: string;
}

export const Introduction: React.FC<IntroductionProps> = ({
  title = "ZORB",
  subtitle = "Programmable Privacy on Solana",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const titleOpacity = interpolate(frame, [15, 45], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [45, 75], [0, 1], {
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [90, 120], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: colors.backgroundGradient,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* ZORB Logo placeholder */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${colors.zorbCyan} 0%, ${colors.zorbPurple} 100%)`,
            boxShadow: `0 0 60px ${colors.zorbCyan}40`,
          }}
        />
      </div>

      {/* Title */}
      <h1
        style={{
          ...typography.hero,
          color: colors.text,
          opacity: titleOpacity,
          margin: 0,
        }}
      >
        {title}
      </h1>

      {/* Subtitle */}
      <h2
        style={{
          ...typography.h2,
          fontWeight: 400,
          color: colors.textMuted,
          opacity: subtitleOpacity,
          margin: "20px 0",
        }}
      >
        {subtitle}
      </h2>

      {/* Tagline */}
      <p
        style={{
          ...typography.body,
          color: colors.zorbCyan,
          opacity: taglineOpacity,
          marginTop: 60,
        }}
      >
        Similar to Aztec and Miden — on Solana
      </p>
    </AbsoluteFill>
  );
};
