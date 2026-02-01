import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Introduction } from "./Introduction";
import { FreeShieldedTransfers } from "./FreeShieldedTransfers";
import { YieldBearingSOL } from "./YieldBearingSOL";
import { ZorbCashProduct } from "./ZorbCashProduct";
import { Close } from "./Close";

/**
 * Full ZORB Demo Video (3 minutes)
 *
 * Timing from PRESENTATION_VIDEO_SCRIPT.md:
 * [0:00-0:25] Introduction — ZORB (750 frames)
 * [0:25-1:10] Free Shielded Transfers (1350 frames)
 * [1:10-1:50] Yield-Bearing Shielded SOL (1200 frames)
 * [1:50-2:45] zorb.cash — The Product (1650 frames)
 * [2:45-3:00] Close (450 frames)
 *
 * Total: 5400 frames @ 30fps = 180 seconds = 3 minutes
 */

export const ZorbDemo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* [0:00-0:25] Introduction */}
      <Sequence from={0} durationInFrames={750}>
        <Introduction
          title="ZORB"
          subtitle="Programmable Privacy on Solana"
        />
      </Sequence>

      {/* [0:25-1:10] Free Shielded Transfers */}
      <Sequence from={750} durationInFrames={1350}>
        <FreeShieldedTransfers />
      </Sequence>

      {/* [1:10-1:50] Yield-Bearing Shielded SOL */}
      <Sequence from={2100} durationInFrames={1200}>
        <YieldBearingSOL />
      </Sequence>

      {/* [1:50-2:45] zorb.cash — The Product */}
      <Sequence from={3300} durationInFrames={1650}>
        <ZorbCashProduct />
      </Sequence>

      {/* [2:45-3:00] Close */}
      <Sequence from={4950} durationInFrames={450}>
        <Close />
      </Sequence>
    </AbsoluteFill>
  );
};
