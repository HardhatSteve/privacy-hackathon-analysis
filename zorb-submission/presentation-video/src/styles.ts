/**
 * Shared styling constants for ZORB presentation video
 * Based on ZORB brand colors
 */

export const colors = {
  // ZORB Brand
  zorbCyan: "#00D1FF",
  zorbPurple: "#9945FF",

  // Semantic
  background: "#0a0a0f",
  backgroundGradient: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
  text: "#FFFFFF",
  textMuted: "#888888",
  textAccent: "#00D1FF",

  // Problem/Solution
  problemRed: "#FF4444",
  pdaOrange: "#FF8844",
  solutionGreen: "#00FF88",

  // LST tokens
  solPurple: "#9945FF",
  jitoGreen: "#00D18C",
  marinadeTeal: "#00A3A3",
};

export const fonts = {
  heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

/**
 * Typography scale for stage presentation
 * Designed for readability at distance on 1080p
 */
export const typography = {
  // Hero titles (Introduction, Close)
  hero: {
    fontSize: 100,
    fontWeight: 800,
    fontFamily: fonts.heading,
    letterSpacing: "-0.02em",
  },
  // Section titles (The Problem, The Solution, etc.)
  h1: {
    fontSize: 56,
    fontWeight: 700,
    fontFamily: fonts.heading,
  },
  // Subsection titles
  h2: {
    fontSize: 44,
    fontWeight: 600,
    fontFamily: fonts.heading,
  },
  // Card titles
  h3: {
    fontSize: 32,
    fontWeight: 600,
    fontFamily: fonts.heading,
  },
  // Primary body text
  body: {
    fontSize: 28,
    fontWeight: 400,
    fontFamily: fonts.body,
    lineHeight: 1.5,
  },
  // Secondary/muted text
  bodySmall: {
    fontSize: 22,
    fontWeight: 400,
    fontFamily: fonts.body,
    lineHeight: 1.5,
  },
  // Labels and captions
  label: {
    fontSize: 18,
    fontWeight: 500,
    fontFamily: fonts.body,
  },
  // Large stat numbers
  statLarge: {
    fontSize: 96,
    fontWeight: 700,
    fontFamily: fonts.mono,
  },
  // Medium stat numbers
  statMedium: {
    fontSize: 64,
    fontWeight: 700,
    fontFamily: fonts.mono,
  },
  // Small stat numbers
  statSmall: {
    fontSize: 48,
    fontWeight: 600,
    fontFamily: fonts.mono,
  },
  // Code/technical text
  code: {
    fontSize: 16,
    fontWeight: 500,
    fontFamily: fonts.mono,
  },
};

export const spacing = {
  xs: 8,
  sm: 16,
  md: 32,
  lg: 64,
  xl: 128,
};
