import React from "react";
import { Composition } from "remotion";
import { Introduction } from "./compositions/Introduction";
import { FreeShieldedTransfers } from "./compositions/FreeShieldedTransfers";
import { YieldBearingSOL } from "./compositions/YieldBearingSOL";
import { ZorbCashProduct } from "./compositions/ZorbCashProduct";
import { Close } from "./compositions/Close";
import { ZorbDemo } from "./compositions/ZorbDemo";

/**
 * Video structure from PRESENTATION_VIDEO_SCRIPT.md:
 *
 * [0:00-0:25] Introduction — ZORB (25s = 750 frames)
 * [0:25-1:10] Free Shielded Transfers (45s = 1350 frames)
 * [1:10-1:50] Yield-Bearing Shielded SOL (40s = 1200 frames)
 * [1:50-2:45] zorb.cash — The Product (55s = 1650 frames)
 * [2:45-3:00] Close (15s = 450 frames)
 *
 * Total: 3 minutes = 180s = 5400 frames @ 30fps
 */

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Full demo video composition */}
      <Composition
        id="ZorbDemo"
        component={ZorbDemo}
        durationInFrames={5400}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* Individual sections for preview/editing */}
      <Composition
        id="Introduction"
        component={Introduction}
        durationInFrames={750}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          title: "ZORB",
          subtitle: "Programmable Privacy on Solana",
        }}
      />

      <Composition
        id="FreeShieldedTransfers"
        component={FreeShieldedTransfers}
        durationInFrames={1350}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      <Composition
        id="YieldBearingSOL"
        component={YieldBearingSOL}
        durationInFrames={1200}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      <Composition
        id="ZorbCashProduct"
        component={ZorbCashProduct}
        durationInFrames={1650}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      <Composition
        id="Close"
        component={Close}
        durationInFrames={450}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
