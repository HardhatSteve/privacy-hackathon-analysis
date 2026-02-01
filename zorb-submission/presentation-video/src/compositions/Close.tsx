import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { colors, typography } from "../styles";

/**
 * [2:45-3:00] Close
 *
 * From PRESENTATION_VIDEO_SCRIPT.md:
 * - "ZORB. Shield your SOL. Send for free. Earn while hidden."
 * - Try it at zorb.cash
 * - Code is open source on GitHub
 * - "Privacy should be free. ZORB makes it possible."
 */

export const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const taglineOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  const linksOpacity = interpolate(frame, [90, 120], [0, 1], {
    extrapolateRight: "clamp",
  });

  const closingOpacity = interpolate(frame, [180, 210], [0, 1], {
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
      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          marginBottom: 30,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${colors.zorbCyan} 0%, ${colors.zorbPurple} 100%)`,
            boxShadow: `0 0 40px ${colors.zorbCyan}40`,
          }}
        />
      </div>

      {/* Brand */}
      <h1
        style={{
          ...typography.hero,
          color: colors.text,
          margin: 0,
        }}
      >
        ZORB
      </h1>

      {/* Tagline */}
      <p
        style={{
          ...typography.h3,
          color: colors.zorbCyan,
          opacity: taglineOpacity,
          marginTop: 20,
          marginBottom: 40,
        }}
      >
        Shield your SOL. Send for free. Earn while hidden.
      </p>

      {/* Links */}
      <div
        style={{
          display: "flex",
          gap: 60,
          opacity: linksOpacity,
          marginTop: 20,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ ...typography.bodySmall, color: colors.textMuted }}>Try it</div>
          <div style={{ ...typography.body, color: colors.text }}>
            zorb.cash
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ ...typography.bodySmall, color: colors.textMuted }}>Code</div>
          <div style={{ ...typography.body, color: colors.text }}>
            github.com/zorb-labs
          </div>
        </div>
      </div>

      {/* Closing tagline */}
      <p
        style={{
          ...typography.body,
          color: colors.solutionGreen,
          opacity: closingOpacity,
          marginTop: 60,
          fontStyle: "italic",
        }}
      >
        Privacy should be free. ZORB makes it possible.
      </p>
    </AbsoluteFill>
  );
};
