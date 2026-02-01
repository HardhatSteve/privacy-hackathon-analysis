import {makeScene2D, Txt, Rect, Circle, Line, Img, Node} from '@motion-canvas/2d';
import {all, chain, createRef, waitFor, loop, sequence, createSignal} from '@motion-canvas/core';

/**
 * SCENE 1: HOOK (0:00-0:20)
 * Duration: 20 seconds
 *
 * New framing: Research-driven exploration of programmable privacy
 * Key message: "Native private payments using commitments + nullifiers"
 * Reference: ZEXE model
 *
 * Animation: ZORB Logo → Title → Concept intro → Cost counter → ZORB solution
 */
export default makeScene2D(function* (view) {
  // Colors
  const ZORB_CYAN = '#00D1FF';
  const RENT_RED = '#FF4444';
  const BG_DARK = '#0a0a0f';
  const TEXT_WHITE = '#FFFFFF';
  const TEXT_GRAY = '#888888';
  const ACCENT_PURPLE = '#9945FF';

  view.fill(BG_DARK);

  // ZORB Logo container
  const logoContainer = createRef<Node>();
  const logo = createRef<Img>();
  const logoText = createRef<Txt>();
  view.add(
    <Node ref={logoContainer} y={-50} opacity={0}>
      <Img
        ref={logo}
        src="/zorb.svg"
        width={180}
        height={180}
        y={-40}
      />
      <Txt
        ref={logoText}
        text="ZORB"
        fontSize={64}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={700}
        fill={ZORB_CYAN}
        y={100}
      />
    </Node>
  );

  // Main title
  const title = createRef<Txt>();
  view.add(
    <Txt
      ref={title}
      text="Exploring Programmable Privacy"
      fontSize={58}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={TEXT_WHITE}
      y={-280}
      opacity={0}
    />
  );

  // Subtitle with key concept
  const subtitle = createRef<Txt>();
  view.add(
    <Txt
      ref={subtitle}
      text="Native private payments using commitments + nullifiers"
      fontSize={28}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={500}
      fill={ZORB_CYAN}
      y={-220}
      opacity={0}
    />
  );

  // ZEXE reference (subtle)
  const zexeRef = createRef<Txt>();
  view.add(
    <Txt
      ref={zexeRef}
      text="Based on ZEXE model — not Token 2022 confidential transfers"
      fontSize={18}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={400}
      fill={TEXT_GRAY}
      y={-175}
      opacity={0}
    />
  );

  // Problem statement box
  const problemBox = createRef<Rect>();
  view.add(
    <Rect
      ref={problemBox}
      width={700}
      height={80}
      radius={16}
      fill={'#1a1a2e'}
      stroke={RENT_RED}
      lineWidth={2}
      y={-80}
      opacity={0}
    >
      <Txt
        text="Current approach is broken"
        fontSize={28}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={600}
        fill={RENT_RED}
        y={-15}
      />
      <Txt
        text="Every nullifier = $0.13 rent locked forever"
        fontSize={18}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={400}
        fill={TEXT_GRAY}
        y={18}
      />
    </Rect>
  );

  // Transaction counter
  const txCount = createSignal(0);
  const txLabel = createRef<Txt>();
  view.add(
    <Txt
      ref={txLabel}
      text={() => `${Math.floor(txCount())} transactions`}
      fontSize={42}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={500}
      fill={TEXT_GRAY}
      y={30}
      opacity={0}
    />
  );

  // Rent cost (competitors)
  const rentCost = createSignal(0);
  const rentLabel = createRef<Txt>();
  const rentValue = createRef<Txt>();
  view.add(
    <Txt
      ref={rentLabel}
      text="Rent Locked (Other Protocols)"
      fontSize={24}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={500}
      fill={TEXT_GRAY}
      y={100}
      opacity={0}
    />
  );
  view.add(
    <Txt
      ref={rentValue}
      text={() => `$${rentCost().toFixed(2)}`}
      fontSize={72}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={RENT_RED}
      y={170}
      opacity={0}
    />
  );

  // ZORB solution box
  const zorbBox = createRef<Rect>();
  view.add(
    <Rect
      ref={zorbBox}
      width={500}
      height={90}
      radius={20}
      fill={'#0a1a2a'}
      stroke={ZORB_CYAN}
      lineWidth={3}
      y={290}
      opacity={0}
    >
      <Txt
        text="ZORB: Amortizable Rent → $0"
        fontSize={32}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={700}
        fill={ZORB_CYAN}
      />
    </Rect>
  );

  // Research statement
  const researchNote = createRef<Txt>();
  view.add(
    <Txt
      ref={researchNote}
      text="This problem space is unexplored on Solana"
      fontSize={20}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={500}
      fill={ACCENT_PURPLE}
      y={360}
      opacity={0}
    />
  );

  // ========== ANIMATION SEQUENCE (20 seconds total) ==========

  // 0-2s: ZORB logo entrance
  yield* all(
    logoContainer().opacity(1, 0.6),
    logoContainer().scale(0.8, 0).to(1, 0.6),
  );
  yield* waitFor(0.8);

  // 2-3s: Logo moves up, title appears
  yield* all(
    logoContainer().y(-320, 0.5),
    logoContainer().scale(0.4, 0.5),
    title().opacity(1, 0.5),
  );
  yield* waitFor(0.3);
  yield* subtitle().opacity(1, 0.5);
  yield* waitFor(0.3);
  yield* zexeRef().opacity(1, 0.4);
  yield* waitFor(0.5);

  // 3-6s: Problem statement
  yield* problemBox().opacity(1, 0.5);
  yield* problemBox().scale(1.02, 0.15).to(1, 0.15);
  yield* waitFor(1.5);

  // 6-12s: Transaction counter and rent accumulation
  yield* all(
    txLabel().opacity(1, 0.3),
    rentLabel().opacity(1, 0.3),
    rentValue().opacity(1, 0.3),
  );

  // Count up transactions and rent
  yield* all(
    txCount(1000, 4),
    rentCost(130, 4), // $0.13 * 1000 = $130
  );

  yield* waitFor(0.5);

  // 12-16s: Reveal ZORB solution
  yield* all(
    zorbBox().opacity(1, 0.6),
    zorbBox().scale(1.05, 0.3).to(1, 0.2),
  );

  yield* waitFor(0.5);

  // 16-18s: Flash emphasis on contrast
  yield* all(
    rentValue().fill('#FF6666', 0.3),
    zorbBox().stroke('#00FFFF', 0.3),
  );

  yield* waitFor(0.5);

  // 18-20s: Research note
  yield* researchNote().opacity(1, 0.4);

  yield* waitFor(2);
});
