import {makeScene2D, Txt, Rect, Circle, Line, Node} from '@motion-canvas/2d';
import {all, chain, createRef, waitFor, sequence, loop} from '@motion-canvas/core';

/**
 * SCENE 5: TECH HIGHLIGHTS (2:30-2:50)
 * Duration: 20 seconds
 *
 * Key innovations:
 * - Zero rent costs — indexed merkle tree vs PDAs
 * - Batch proofs — 4, 16, or 64 nullifiers per ZK proof
 * - Yield while shielded — other projects have TODOs; ours works
 *
 * Competitive emphasis: "Other projects: TODOs and stubs. ZORB: Working."
 */
export default makeScene2D(function* (view) {
  const ZORB_CYAN = '#00D1FF';
  const BATCH_PURPLE = '#9945FF';
  const YIELD_GREEN = '#44FF88';
  const SECURITY_ORANGE = '#FF8844';
  const BG_DARK = '#0a0a0f';
  const TEXT_WHITE = '#FFFFFF';
  const TEXT_GRAY = '#888888';
  const COMPETITOR_RED = '#FF4444';

  view.fill(BG_DARK);

  // Title
  const title = createRef<Txt>();
  view.add(
    <Txt
      ref={title}
      text="Technical Innovations"
      fontSize={52}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={ZORB_CYAN}
      y={-330}
      opacity={0}
    />
  );

  // ========== Innovation 1: Zero Rent Costs ==========
  const zeroRent = createRef<Node>();
  view.add(<Node ref={zeroRent} x={-400} y={-140} opacity={0} />);

  const zeroRentTitle = createRef<Txt>();
  zeroRent().add(
    <Txt
      ref={zeroRentTitle}
      text="Zero Rent Costs"
      fontSize={28}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={YIELD_GREEN}
      y={-80}
    />
  );

  // Comparison boxes
  const pdaApproach = createRef<Rect>();
  zeroRent().add(
    <Rect
      ref={pdaApproach}
      width={150}
      height={55}
      radius={10}
      fill={'#2a1a1a'}
      stroke={COMPETITOR_RED}
      lineWidth={2}
      x={-60}
      y={-20}
      opacity={0}
    >
      <Txt
        text="PDAs"
        fontSize={14}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={600}
        fill={COMPETITOR_RED}
        y={-12}
      />
      <Txt
        text="$0.13 each"
        fontSize={12}
        fontFamily="monospace"
        fontWeight={500}
        fill={TEXT_GRAY}
        y={8}
      />
    </Rect>
  );

  const vsLabel = createRef<Txt>();
  zeroRent().add(
    <Txt
      ref={vsLabel}
      text="vs"
      fontSize={20}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={TEXT_GRAY}
      x={20}
      y={-20}
      opacity={0}
    />
  );

  const treeApproach = createRef<Rect>();
  zeroRent().add(
    <Rect
      ref={treeApproach}
      width={150}
      height={55}
      radius={10}
      fill={'#1a2a1a'}
      stroke={YIELD_GREEN}
      lineWidth={2}
      x={100}
      y={-20}
      opacity={0}
    >
      <Txt
        text="Merkle Tree"
        fontSize={14}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={600}
        fill={YIELD_GREEN}
        y={-12}
      />
      <Txt
        text="~$0.00"
        fontSize={12}
        fontFamily="monospace"
        fontWeight={500}
        fill={YIELD_GREEN}
        y={8}
      />
    </Rect>
  );

  const zeroRentResult = createRef<Txt>();
  zeroRent().add(
    <Txt
      ref={zeroRentResult}
      text="67M nullifiers → $0"
      fontSize={18}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={600}
      fill={YIELD_GREEN}
      y={50}
      opacity={0}
    />
  );

  // ========== Innovation 2: Batch Proofs ==========
  const batch = createRef<Node>();
  view.add(<Node ref={batch} x={200} y={-140} opacity={0} />);

  const batchTitle = createRef<Txt>();
  batch().add(
    <Txt
      ref={batchTitle}
      text="Batch Proofs"
      fontSize={28}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={BATCH_PURPLE}
      y={-80}
    />
  );

  // Batch size options
  const batchSizes = ['4', '16', '64'];
  const batchBoxes: Rect[] = [];
  for (let i = 0; i < 3; i++) {
    const box = createRef<Rect>();
    batch().add(
      <Rect
        ref={box}
        width={80}
        height={50}
        radius={10}
        fill={'#1a1a3a'}
        stroke={BATCH_PURPLE}
        lineWidth={2}
        x={-80 + i * 90}
        y={-20}
        opacity={0}
      >
        <Txt
          text={batchSizes[i]}
          fontSize={22}
          fontFamily="monospace"
          fontWeight={700}
          fill={BATCH_PURPLE}
        />
      </Rect>
    );
    batchBoxes.push(box());
  }

  // Arrow and result
  const batchArrow = createRef<Line>();
  batch().add(
    <Line
      ref={batchArrow}
      points={[[0, 20], [0, 50]]}
      stroke={BATCH_PURPLE}
      lineWidth={3}
      endArrow
      opacity={0}
    />
  );

  const proofBox = createRef<Rect>();
  batch().add(
    <Rect
      ref={proofBox}
      width={120}
      height={50}
      radius={10}
      fill={BATCH_PURPLE}
      y={80}
      opacity={0}
    >
      <Txt
        text="1 ZK Proof"
        fontSize={16}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={700}
        fill={TEXT_WHITE}
      />
    </Rect>
  );

  // ========== Innovation 3: Yield While Shielded ==========
  const yieldSection = createRef<Node>();
  view.add(<Node ref={yieldSection} y={120} opacity={0} />);

  const yieldTitle = createRef<Txt>();
  yieldSection().add(
    <Txt
      ref={yieldTitle}
      text="Yield While Shielded"
      fontSize={28}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={SECURITY_ORANGE}
      y={-60}
    />
  );

  // LST tokens
  const lstTokens = ['vSOL', 'jitoSOL', 'mSOL'];
  const lstRects: Rect[] = [];
  for (let i = 0; i < 3; i++) {
    const rect = createRef<Rect>();
    yieldSection().add(
      <Rect
        ref={rect}
        width={100}
        height={45}
        radius={10}
        fill={'#1a2a2a'}
        stroke={SECURITY_ORANGE}
        lineWidth={2}
        x={-120 + i * 120}
        y={0}
        opacity={0}
      >
        <Txt
          text={lstTokens[i]}
          fontSize={16}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={600}
          fill={SECURITY_ORANGE}
        />
      </Rect>
    );
    lstRects.push(rect());
  }

  const yieldArrow = createRef<Line>();
  yieldSection().add(
    <Line
      ref={yieldArrow}
      points={[[0, 30], [0, 60]]}
      stroke={SECURITY_ORANGE}
      lineWidth={3}
      endArrow
      opacity={0}
    />
  );

  const poolBox = createRef<Rect>();
  yieldSection().add(
    <Rect
      ref={poolBox}
      width={320}
      height={55}
      radius={12}
      fill={null}
      stroke={YIELD_GREEN}
      lineWidth={2}
      y={95}
      opacity={0}
    >
      <Txt
        text="Unified Pool → 7-8% APY"
        fontSize={20}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={600}
        fill={YIELD_GREEN}
      />
    </Rect>
  );

  // ========== COMPETITIVE JAB ==========
  const competitiveContainer = createRef<Node>();
  view.add(<Node ref={competitiveContainer} y={280} opacity={0} />);

  const competitorLabel = createRef<Txt>();
  competitiveContainer().add(
    <Txt
      ref={competitorLabel}
      text="Other projects:"
      fontSize={22}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={500}
      fill={TEXT_GRAY}
      x={-180}
    />
  );

  const todoLabel = createRef<Txt>();
  competitiveContainer().add(
    <Txt
      ref={todoLabel}
      text="// TODO"
      fontSize={24}
      fontFamily="monospace"
      fontWeight={600}
      fill={COMPETITOR_RED}
      x={-30}
    />
  );

  const zorbLabel = createRef<Txt>();
  competitiveContainer().add(
    <Txt
      ref={zorbLabel}
      text="ZORB:"
      fontSize={22}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={500}
      fill={TEXT_GRAY}
      x={80}
    />
  );

  const workingLabel = createRef<Txt>();
  competitiveContainer().add(
    <Txt
      ref={workingLabel}
      text="Working ✓"
      fontSize={24}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={YIELD_GREEN}
      x={180}
    />
  );

  // ========== ANIMATION SEQUENCE (20 seconds total) ==========

  // 0-1s: Title
  yield* title().opacity(1, 0.5);
  yield* waitFor(0.5);

  // 1-6s: Zero rent costs innovation
  yield* zeroRent().opacity(1, 0.4);
  yield* all(
    pdaApproach().opacity(1, 0.3),
    vsLabel().opacity(1, 0.2),
    treeApproach().opacity(1, 0.3),
  );
  yield* treeApproach().scale(1.1, 0.2).to(1, 0.15);
  yield* zeroRentResult().opacity(1, 0.3);

  yield* waitFor(1);

  // 6-11s: Batch proofs
  yield* batch().opacity(1, 0.4);
  yield* sequence(
    0.15,
    ...batchBoxes.map(b => all(
      b.opacity(1, 0.2),
      b.fill('#2a2a4a', 0.1).to('#1a1a3a', 0.1),
    )),
  );
  yield* batchArrow().opacity(1, 0.2);
  yield* all(
    proofBox().opacity(1, 0.3),
    proofBox().scale(1.15, 0.2).to(1, 0.15),
  );

  yield* waitFor(1);

  // 11-16s: Yield while shielded
  yield* yieldSection().opacity(1, 0.4);
  yield* sequence(
    0.12,
    ...lstRects.map(r => r.opacity(1, 0.2)),
  );
  yield* yieldArrow().opacity(1, 0.2);
  yield* poolBox().opacity(1, 0.3);

  yield* waitFor(1);

  // 16-20s: Competitive jab
  yield* competitiveContainer().opacity(1, 0.4);
  yield* all(
    competitorLabel().opacity(1, 0.3),
    todoLabel().opacity(1, 0.3),
  );
  yield* waitFor(0.3);
  yield* all(
    zorbLabel().opacity(1, 0.3),
    workingLabel().opacity(1, 0.4),
    workingLabel().scale(1.1, 0.2).to(1, 0.15),
  );

  yield* waitFor(2);
});
