import {makeScene2D, Txt, Rect, Circle, Line, Node} from '@motion-canvas/2d';
import {all, chain, createRef, waitFor, sequence, createSignal, Vector2} from '@motion-canvas/core';

/**
 * SCENE 2: THE PROBLEM (0:20-0:45)
 * Duration: 25 seconds
 *
 * Key messages:
 * - ZEXE paper reference: "Private execution requires commitments and nullifiers"
 * - 2-year rent-exempt cost (~$0.13)
 * - Scale examples: 10K tx = $1,300, 1M = $130,000
 * - "This doesn't scale"
 *
 * Animation: Flow diagram + PDA accumulation + scale examples
 */
export default makeScene2D(function* (view) {
  const ZORB_CYAN = '#00D1FF';
  const RENT_RED = '#FF4444';
  const PDA_ORANGE = '#FF8844';
  const BG_DARK = '#0a0a0f';
  const TEXT_WHITE = '#FFFFFF';
  const TEXT_GRAY = '#888888';
  const SOLANA_PURPLE = '#9945FF';

  view.fill(BG_DARK);

  // Title
  const title = createRef<Txt>();
  view.add(
    <Txt
      ref={title}
      text="The Nullifier Rent Problem"
      fontSize={52}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={TEXT_WHITE}
      y={-330}
      opacity={0}
    />
  );

  // ZEXE reference
  const zexeRef = createRef<Txt>();
  view.add(
    <Txt
      ref={zexeRef}
      text="ZEXE: Private execution requires commitments and nullifiers"
      fontSize={20}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={500}
      fill={SOLANA_PURPLE}
      y={-280}
      opacity={0}
    />
  );

  // Transaction visualization
  const txContainer = createRef<Node>();
  view.add(<Node ref={txContainer} y={-120} />);

  // Create transaction box
  const txBox = createRef<Rect>();
  txContainer().add(
    <Rect
      ref={txBox}
      width={180}
      height={70}
      radius={12}
      fill={SOLANA_PURPLE}
      opacity={0}
      x={-380}
    >
      <Txt
        text="Private TX"
        fontSize={22}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={600}
        fill={TEXT_WHITE}
      />
    </Rect>
  );

  // Arrow
  const arrow = createRef<Line>();
  txContainer().add(
    <Line
      ref={arrow}
      points={[[-270, 0], [-160, 0]]}
      stroke={TEXT_GRAY}
      lineWidth={3}
      endArrow
      opacity={0}
    />
  );

  // Nullifier box
  const nullifierBox = createRef<Rect>();
  txContainer().add(
    <Rect
      ref={nullifierBox}
      width={160}
      height={70}
      radius={12}
      fill={'#333355'}
      opacity={0}
      x={-60}
    >
      <Txt
        text="Nullifier"
        fontSize={22}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={600}
        fill={TEXT_WHITE}
      />
    </Rect>
  );

  // Arrow to PDA
  const arrow2 = createRef<Line>();
  txContainer().add(
    <Line
      ref={arrow2}
      points={[[30, 0], [140, 0]]}
      stroke={TEXT_GRAY}
      lineWidth={3}
      endArrow
      opacity={0}
    />
  );

  // PDA box
  const pdaBox = createRef<Rect>();
  txContainer().add(
    <Rect
      ref={pdaBox}
      width={160}
      height={70}
      radius={12}
      fill={PDA_ORANGE}
      opacity={0}
      x={240}
    >
      <Txt
        text="PDA"
        fontSize={22}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={600}
        fill={TEXT_WHITE}
      />
    </Rect>
  );

  // Rent explanation badge
  const rentBadge = createRef<Rect>();
  txContainer().add(
    <Rect
      ref={rentBadge}
      width={220}
      height={50}
      radius={25}
      fill={'#1a1a2e'}
      stroke={RENT_RED}
      lineWidth={2}
      opacity={0}
      x={240}
      y={60}
    >
      <Txt
        text="2-year rent-exempt"
        fontSize={14}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={500}
        fill={TEXT_GRAY}
        y={-10}
      />
      <Txt
        text="~$0.13 locked"
        fontSize={18}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={700}
        fill={RENT_RED}
        y={12}
      />
    </Rect>
  );

  // PDA stack visualization
  const pdaStack = createRef<Node>();
  view.add(<Node ref={pdaStack} y={60} />);

  const pdaRects: Rect[] = [];
  for (let i = 0; i < 8; i++) {
    const pda = createRef<Rect>();
    pdaStack().add(
      <Rect
        ref={pda}
        width={70}
        height={45}
        radius={8}
        fill={PDA_ORANGE}
        opacity={0}
        x={-280 + i * 85}
        y={0}
      >
        <Txt
          text={`PDA ${i + 1}`}
          fontSize={13}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={500}
          fill={TEXT_WHITE}
        />
      </Rect>
    );
    pdaRects.push(pda());
  }

  // Total rent counter
  const rentTotal = createSignal(0);
  const rentTotalLabel = createRef<Txt>();
  view.add(
    <Txt
      ref={rentTotalLabel}
      text={() => `Total Rent Locked: $${rentTotal().toFixed(2)}`}
      fontSize={36}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={RENT_RED}
      y={140}
      opacity={0}
    />
  );

  // Scale examples container
  const scaleContainer = createRef<Node>();
  view.add(<Node ref={scaleContainer} y={220} opacity={0} />);

  // Scale example boxes
  const scale1 = createRef<Rect>();
  scaleContainer().add(
    <Rect
      ref={scale1}
      width={260}
      height={70}
      radius={12}
      fill={'#1a1a1a'}
      stroke={TEXT_GRAY}
      lineWidth={1}
      x={-200}
    >
      <Txt
        text="10,000 tx"
        fontSize={18}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={500}
        fill={TEXT_GRAY}
        y={-15}
      />
      <Txt
        text="= $1,300"
        fontSize={26}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={700}
        fill={RENT_RED}
        y={15}
      />
    </Rect>
  );

  const scale2 = createRef<Rect>();
  scaleContainer().add(
    <Rect
      ref={scale2}
      width={260}
      height={70}
      radius={12}
      fill={'#1a1a1a'}
      stroke={TEXT_GRAY}
      lineWidth={1}
      x={100}
    >
      <Txt
        text="1 million tx"
        fontSize={18}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={500}
        fill={TEXT_GRAY}
        y={-15}
      />
      <Txt
        text="= $130,000"
        fontSize={26}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={700}
        fill={RENT_RED}
        y={15}
      />
    </Rect>
  );

  // Final message
  const finalMessage = createRef<Txt>();
  view.add(
    <Txt
      ref={finalMessage}
      text="This doesn't scale."
      fontSize={40}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={TEXT_WHITE}
      y={320}
      opacity={0}
    />
  );

  // "Forever" label
  const foreverLabel = createRef<Txt>();
  view.add(
    <Txt
      ref={foreverLabel}
      text="locked FOREVER"
      fontSize={24}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={600}
      fill={RENT_RED}
      y={355}
      opacity={0}
    />
  );

  // ========== ANIMATION SEQUENCE (25 seconds total) ==========

  // 0-2s: Title and ZEXE reference
  yield* title().opacity(1, 0.5);
  yield* waitFor(0.3);
  yield* zexeRef().opacity(1, 0.4);
  yield* waitFor(0.8);

  // 2-6s: Show the flow diagram
  yield* txBox().opacity(1, 0.3);
  yield* arrow().opacity(1, 0.2);
  yield* nullifierBox().opacity(1, 0.3);
  yield* arrow2().opacity(1, 0.2);
  yield* all(
    pdaBox().opacity(1, 0.3),
    rentBadge().opacity(1, 0.4),
  );

  yield* waitFor(0.8);

  // 6-12s: Show PDAs accumulating with rent counter
  yield* rentTotalLabel().opacity(1, 0.3);

  for (let i = 0; i < 8; i++) {
    yield* all(
      pdaRects[i].opacity(1, 0.12),
      pdaRects[i].y(-15, 0.1).to(0, 0.08),
      rentTotal(rentTotal() + 0.13, 0.15),
    );
  }

  yield* waitFor(0.5);

  // 12-18s: Scale examples
  yield* scaleContainer().opacity(1, 0.4);
  yield* scale1().scale(1.05, 0.2).to(1, 0.15);
  yield* waitFor(0.5);
  yield* scale2().scale(1.05, 0.2).to(1, 0.15);

  yield* waitFor(1);

  // 18-23s: Final message
  yield* all(
    finalMessage().opacity(1, 0.5),
    finalMessage().scale(1.1, 0.25).to(1, 0.2),
  );

  yield* waitFor(0.5);

  yield* foreverLabel().opacity(1, 0.4);

  // Flash red emphasis
  yield* all(
    rentTotalLabel().scale(1.08, 0.2).to(1, 0.2),
    finalMessage().fill(RENT_RED, 0.4),
  );

  yield* waitFor(2);
});
