import {makeScene2D, Txt, Rect, Circle, Line, Node} from '@motion-canvas/2d';
import {all, chain, createRef, waitFor, sequence, createSignal, easeOutExpo} from '@motion-canvas/core';

/**
 * SCENE 3: THE SOLUTION - CONCURRENT NULLIFIER TREE SCHEME
 *
 * Duration: 35 seconds (0:45-1:20)
 *
 * Key concepts:
 * - Global epoch cursors: "Earliest Provable" vs "Current"
 * - When epoch < earliest provable → PDA closable
 * - Amortizable rent tending to zero
 *
 * References:
 * - eprint.iacr.org/2021/1263.pdf (ZEXE)
 * - docs.aztec.network/.../indexed_merkle_tree
 */
export default makeScene2D(function* (view) {
  const ZORB_CYAN = '#00D1FF';
  const TREE_GREEN = '#44FF88';
  const PDA_ORANGE = '#FF8844';
  const RENT_GREEN = '#44FF88';
  const BACKGROUND_BLUE = '#4488FF';
  const BG_DARK = '#0a0a0f';
  const TEXT_WHITE = '#FFFFFF';
  const TEXT_GRAY = '#888888';
  const EPOCH_PURPLE = '#9945FF';
  const CLOSABLE_GREEN = '#22FF88';

  view.fill(BG_DARK);

  // ========== TITLE ==========
  const title = createRef<Txt>();
  view.add(
    <Txt
      ref={title}
      text="Concurrent Nullifier Tree Scheme"
      fontSize={48}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={ZORB_CYAN}
      y={-340}
      opacity={0}
    />
  );

  // Subtitle
  const subtitle = createRef<Txt>();
  view.add(
    <Txt
      ref={subtitle}
      text="Aztec-style Indexed Merkle Tree + Reclaimable PDAs"
      fontSize={22}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={500}
      fill={TEXT_GRAY}
      y={-295}
      opacity={0}
    />
  );

  // ========== EPOCH CURSORS (TOP) ==========
  const epochCursorContainer = createRef<Node>();
  view.add(<Node ref={epochCursorContainer} y={-220} opacity={0} />);

  // Earliest Provable Epoch box
  const earliestEpochBox = createRef<Rect>();
  const earliestEpochValue = createSignal(42);
  epochCursorContainer().add(
    <Rect
      ref={earliestEpochBox}
      width={240}
      height={70}
      radius={12}
      fill={'#1a2a3a'}
      stroke={EPOCH_PURPLE}
      lineWidth={2}
      x={-180}
    >
      <Txt
        text="Earliest Provable"
        fontSize={14}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={500}
        fill={TEXT_GRAY}
        y={-18}
      />
      <Txt
        text={() => `Epoch: ${Math.floor(earliestEpochValue())}`}
        fontSize={24}
        fontFamily="monospace"
        fontWeight={700}
        fill={EPOCH_PURPLE}
        y={12}
      />
    </Rect>
  );

  // Current Nullifier Epoch box
  const currentEpochBox = createRef<Rect>();
  const currentEpochValue = createSignal(42);
  epochCursorContainer().add(
    <Rect
      ref={currentEpochBox}
      width={240}
      height={70}
      radius={12}
      fill={'#1a2a3a'}
      stroke={ZORB_CYAN}
      lineWidth={2}
      x={180}
    >
      <Txt
        text="Current Nullifier"
        fontSize={14}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={500}
        fill={TEXT_GRAY}
        y={-18}
      />
      <Txt
        text={() => `Epoch: ${Math.floor(currentEpochValue())}`}
        fontSize={24}
        fontFamily="monospace"
        fontWeight={700}
        fill={ZORB_CYAN}
        y={12}
      />
    </Rect>
  );

  // Arrow between epochs
  const epochArrow = createRef<Line>();
  epochCursorContainer().add(
    <Line
      ref={epochArrow}
      points={[[-40, 0], [40, 0]]}
      stroke={TEXT_GRAY}
      lineWidth={2}
      endArrow
      opacity={0}
    />
  );

  // Gap label
  const gapLabel = createRef<Txt>();
  epochCursorContainer().add(
    <Txt
      ref={gapLabel}
      text={() => `Gap: ${Math.floor(currentEpochValue()) - Math.floor(earliestEpochValue())} epochs`}
      fontSize={14}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={500}
      fill={TEXT_GRAY}
      y={50}
      opacity={0}
    />
  );

  // Main container for three columns
  const mainContainer = createRef<Node>();
  view.add(<Node ref={mainContainer} y={20} />);

  // ========== LEFT SIDE: Layer 1 - Immediate PDA Coverage ==========
  const layer1 = createRef<Node>();
  mainContainer().add(<Node ref={layer1} x={-420} y={-60} opacity={0} />);

  const layer1Title = createRef<Txt>();
  layer1().add(
    <Txt
      ref={layer1Title}
      text="Layer 1: Immediate"
      fontSize={26}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={PDA_ORANGE}
      y={-100}
    />
  );

  const layer1Subtitle = createRef<Txt>();
  layer1().add(
    <Txt
      ref={layer1Subtitle}
      text="PDA created on spend"
      fontSize={16}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={500}
      fill={TEXT_GRAY}
      y={-75}
    />
  );

  // User action
  const userBox = createRef<Rect>();
  layer1().add(
    <Rect
      ref={userBox}
      width={130}
      height={45}
      radius={10}
      fill={'#333355'}
      y={-30}
      opacity={0}
    >
      <Txt
        text="User Spends"
        fontSize={15}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={600}
        fill={TEXT_WHITE}
      />
    </Rect>
  );

  // Arrow down
  const arrow1 = createRef<Line>();
  layer1().add(
    <Line
      ref={arrow1}
      points={[[0, 0], [0, 30]]}
      stroke={PDA_ORANGE}
      lineWidth={3}
      endArrow
      opacity={0}
    />
  );

  // PDAs with epoch labels
  const pdaRects: Rect[] = [];
  const pdaEpochLabels: Txt[] = [];
  const pdaEpochs = [44, 45, 46, 47];
  for (let i = 0; i < 4; i++) {
    const pda = createRef<Rect>();
    const epochLabel = createRef<Txt>();
    layer1().add(
      <Rect
        ref={pda}
        width={75}
        height={42}
        radius={8}
        fill={PDA_ORANGE}
        x={-55 + (i % 2) * 110}
        y={65 + Math.floor(i / 2) * 55}
        opacity={0}
      >
        <Txt
          text={`E${pdaEpochs[i]}`}
          fontSize={14}
          fontFamily="monospace"
          fontWeight={600}
          fill={TEXT_WHITE}
        />
      </Rect>
    );
    layer1().add(
      <Txt
        ref={epochLabel}
        text="$0.13"
        fontSize={11}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={500}
        fill={'#FF6666'}
        x={-55 + (i % 2) * 110}
        y={98 + Math.floor(i / 2) * 55}
        opacity={0}
      />
    );
    pdaRects.push(pda());
    pdaEpochLabels.push(epochLabel());
  }

  // ========== CENTER: Layer 2 - Background ZK Batch ==========
  const layer2 = createRef<Node>();
  mainContainer().add(<Node ref={layer2} x={0} y={-60} opacity={0} />);

  const layer2Title = createRef<Txt>();
  layer2().add(
    <Txt
      ref={layer2Title}
      text="Layer 2: Background"
      fontSize={26}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={BACKGROUND_BLUE}
      y={-100}
    />
  );

  const layer2Subtitle = createRef<Txt>();
  layer2().add(
    <Txt
      ref={layer2Subtitle}
      text="ZK batch insertion"
      fontSize={16}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={500}
      fill={TEXT_GRAY}
      y={-75}
    />
  );

  // Sequencer box
  const sequencerBox = createRef<Rect>();
  layer2().add(
    <Rect
      ref={sequencerBox}
      width={130}
      height={45}
      radius={10}
      fill={'#224466'}
      y={-30}
      opacity={0}
    >
      <Txt
        text="Sequencer"
        fontSize={15}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={600}
        fill={TEXT_WHITE}
      />
    </Rect>
  );

  // ZK proof generation
  const zkProofBox = createRef<Rect>();
  layer2().add(
    <Rect
      ref={zkProofBox}
      width={150}
      height={55}
      radius={12}
      fill={'#1a2a3a'}
      stroke={ZORB_CYAN}
      lineWidth={2}
      y={40}
      opacity={0}
    >
      <Txt
        text="ZK Proof"
        fontSize={16}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={700}
        fill={ZORB_CYAN}
        y={-10}
      />
      <Txt
        text="(4/16/64 batch)"
        fontSize={11}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={500}
        fill={TEXT_GRAY}
        y={10}
      />
    </Rect>
  );

  // Tree visualization
  const treeBox = createRef<Rect>();
  layer2().add(
    <Rect
      ref={treeBox}
      width={170}
      height={90}
      radius={12}
      fill={'#1a2a1a'}
      stroke={TREE_GREEN}
      lineWidth={2}
      y={130}
      opacity={0}
    >
      <Txt
        text="Indexed Merkle Tree"
        fontSize={13}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={700}
        fill={TREE_GREEN}
        y={-25}
      />
      <Txt
        text="67M capacity"
        fontSize={11}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={500}
        fill={TEXT_GRAY}
        y={-5}
      />
      <Txt
        text="~1KB account"
        fontSize={11}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={500}
        fill={TEXT_GRAY}
        y={12}
      />
    </Rect>
  );

  // Arrow from ZK to tree
  const arrow2 = createRef<Line>();
  layer2().add(
    <Line
      ref={arrow2}
      points={[[0, 72], [0, 82]]}
      stroke={TREE_GREEN}
      lineWidth={3}
      endArrow
      opacity={0}
    />
  );

  // ========== RIGHT SIDE: The Payoff - Rent Reclamation ==========
  const payoff = createRef<Node>();
  mainContainer().add(<Node ref={payoff} x={420} y={-60} opacity={0} />);

  const payoffTitle = createRef<Txt>();
  payoff().add(
    <Txt
      ref={payoffTitle}
      text="The Payoff"
      fontSize={26}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={RENT_GREEN}
      y={-100}
    />
  );

  const payoffSubtitle = createRef<Txt>();
  payoff().add(
    <Txt
      ref={payoffSubtitle}
      text="epoch < earliest → closable"
      fontSize={16}
      fontFamily="monospace"
      fontWeight={500}
      fill={TEXT_GRAY}
      y={-75}
    />
  );

  // Condition box
  const conditionBox = createRef<Rect>();
  payoff().add(
    <Rect
      ref={conditionBox}
      width={200}
      height={45}
      radius={10}
      fill={'#1a3a2a'}
      stroke={CLOSABLE_GREEN}
      lineWidth={2}
      y={-30}
      opacity={0}
    >
      <Txt
        text="44 < 45 ✓ Closable"
        fontSize={14}
        fontFamily="monospace"
        fontWeight={600}
        fill={CLOSABLE_GREEN}
      />
    </Rect>
  );

  // Closed PDAs visualization
  const closedPdas: Rect[] = [];
  for (let i = 0; i < 4; i++) {
    const pda = createRef<Rect>();
    payoff().add(
      <Rect
        ref={pda}
        width={75}
        height={42}
        radius={8}
        fill={'#333333'}
        stroke={RENT_GREEN}
        lineWidth={2}
        lineDash={[5, 5]}
        x={-55 + (i % 2) * 110}
        y={50 + Math.floor(i / 2) * 55}
        opacity={0}
      >
        <Txt
          text="CLOSED"
          fontSize={11}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={700}
          fill={RENT_GREEN}
        />
      </Rect>
    );
    closedPdas.push(pda());
  }

  // Rent returned
  const rentReturned = createSignal(0);
  const rentReturnedLabel = createRef<Txt>();
  payoff().add(
    <Txt
      ref={rentReturnedLabel}
      text={() => `+$${rentReturned().toFixed(2)} returned`}
      fontSize={26}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={RENT_GREEN}
      y={180}
      opacity={0}
    />
  );

  // ========== PAPER REFERENCES (flash briefly) ==========
  const paperRefs = createRef<Node>();
  view.add(<Node ref={paperRefs} y={250} opacity={0} />);

  const paper1 = createRef<Txt>();
  paperRefs().add(
    <Txt
      ref={paper1}
      text="eprint.iacr.org/2021/1263.pdf"
      fontSize={14}
      fontFamily="monospace"
      fontWeight={500}
      fill={TEXT_GRAY}
      y={0}
    />
  );

  const paper2 = createRef<Txt>();
  paperRefs().add(
    <Txt
      ref={paper2}
      text="docs.aztec.network/.../indexed_merkle_tree"
      fontSize={14}
      fontFamily="monospace"
      fontWeight={500}
      fill={TEXT_GRAY}
      y={20}
    />
  );

  // ========== BOTTOM: Final Message ==========
  const finalMessage = createRef<Rect>();
  view.add(
    <Rect
      ref={finalMessage}
      width={620}
      height={65}
      radius={32}
      fill={null}
      stroke={ZORB_CYAN}
      lineWidth={3}
      y={320}
      opacity={0}
    >
      <Txt
        text="Amortizable Rent → Tending to Zero"
        fontSize={24}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={700}
        fill={ZORB_CYAN}
      />
    </Rect>
  );

  // ========== ANIMATION SEQUENCE (35 seconds total) ==========

  // 0-2s: Titles appear
  yield* all(
    title().opacity(1, 0.6),
    subtitle().opacity(1, 0.6),
  );
  yield* waitFor(1);

  // 2-5s: Show epoch cursors
  yield* epochCursorContainer().opacity(1, 0.5);
  yield* waitFor(0.5);
  yield* epochArrow().opacity(1, 0.3);

  // Animate current epoch advancing from 42 to 47
  yield* all(
    currentEpochValue(47, 2),
    gapLabel().opacity(1, 0.5),
  );
  yield* waitFor(0.5);

  // 5-10s: Layer 1 - Immediate PDA coverage
  yield* layer1().opacity(1, 0.4);
  yield* userBox().opacity(1, 0.3);
  yield* arrow1().opacity(1, 0.2);

  // PDAs appear one by one with epoch labels
  yield* sequence(
    0.2,
    ...pdaRects.map((p, i) => all(
      p.opacity(1, 0.2),
      p.y(p.y() - 10, 0.1).to(p.y(), 0.1),
      pdaEpochLabels[i].opacity(1, 0.2),
    )),
  );

  yield* waitFor(0.8);

  // 10-15s: Layer 2 - Background ZK batch
  yield* layer2().opacity(1, 0.4);
  yield* sequencerBox().opacity(1, 0.3);
  yield* zkProofBox().opacity(1, 0.3);
  yield* all(
    arrow2().opacity(1, 0.2),
    treeBox().opacity(1, 0.4),
  );

  // Flash to show batch processing
  yield* zkProofBox().fill('#2a4a5a', 0.2).to('#1a2a3a', 0.2);

  // Advance earliest epoch as tree gets updated
  yield* all(
    earliestEpochValue(45, 1.5),
    gapLabel().opacity(1, 0.3),
  );

  yield* waitFor(0.8);

  // 15-22s: Show the payoff
  yield* payoff().opacity(1, 0.4);
  yield* conditionBox().opacity(1, 0.4);

  // PDAs close one by one
  yield* sequence(
    0.25,
    ...closedPdas.map(p => all(
      p.opacity(1, 0.2),
      p.scale(1.1, 0.1).to(1, 0.1),
    )),
  );

  // Show rent returning
  yield* rentReturnedLabel().opacity(1, 0.3);
  yield* rentReturned(0.52, 1.8, easeOutExpo);

  yield* waitFor(0.8);

  // 22-27s: Flash paper references
  yield* paperRefs().opacity(0.7, 0.5);
  yield* waitFor(2);
  yield* paperRefs().opacity(0, 0.5);

  yield* waitFor(0.5);

  // 27-32s: Final message
  yield* all(
    finalMessage().opacity(1, 0.6),
    finalMessage().scale(1.05, 0.25).to(1, 0.25),
  );

  yield* waitFor(3);
});
