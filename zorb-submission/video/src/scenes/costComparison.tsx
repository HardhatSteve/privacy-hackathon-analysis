import {makeScene2D, Txt, Rect, Line, Node} from '@motion-canvas/2d';
import {all, chain, createRef, waitFor, createSignal, easeOutExpo} from '@motion-canvas/core';

/**
 * SCENE 4: COST COMPARISON (2:00-2:30)
 * Side-by-side: ZORB ($0) vs competitors ($0.13/tx)
 *
 * Animation: Two bars growing, one stays at 0, other climbs to $130
 */
export default makeScene2D(function* (view) {
  const ZORB_CYAN = '#00D1FF';
  const RENT_RED = '#FF4444';
  const BG_DARK = '#0a0a0f';
  const TEXT_WHITE = '#FFFFFF';
  const TEXT_GRAY = '#888888';

  view.fill(BG_DARK);

  // Title
  const title = createRef<Txt>();
  view.add(
    <Txt
      ref={title}
      text="Cost After 1,000 Private Transactions"
      fontSize={52}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={TEXT_WHITE}
      y={-300}
      opacity={0}
    />
  );

  // Chart container
  const chartContainer = createRef<Node>();
  view.add(<Node ref={chartContainer} y={50} />);

  // Y-axis
  const yAxis = createRef<Line>();
  chartContainer().add(
    <Line
      ref={yAxis}
      points={[[-350, 200], [-350, -200]]}
      stroke={TEXT_GRAY}
      lineWidth={2}
      opacity={0}
    />
  );

  // Y-axis labels
  const yLabels = ['$0', '$50', '$100', '$150'];
  const yLabelRefs: Txt[] = [];
  for (let i = 0; i < 4; i++) {
    const label = createRef<Txt>();
    chartContainer().add(
      <Txt
        ref={label}
        text={yLabels[i]}
        fontSize={20}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={500}
        fill={TEXT_GRAY}
        x={-400}
        y={200 - i * 133}
        opacity={0}
      />
    );
    yLabelRefs.push(label());
  }

  // Competitor bar
  const competitorBarHeight = createSignal(0);
  const competitorBar = createRef<Rect>();
  chartContainer().add(
    <Rect
      ref={competitorBar}
      width={180}
      height={() => competitorBarHeight()}
      fill={RENT_RED}
      x={-150}
      y={() => 200 - competitorBarHeight() / 2}
      radius={[12, 12, 0, 0]}
      opacity={0}
    />
  );

  // Competitor label
  const competitorLabel = createRef<Txt>();
  chartContainer().add(
    <Txt
      ref={competitorLabel}
      text="Other Protocols"
      fontSize={24}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={600}
      fill={TEXT_WHITE}
      x={-150}
      y={250}
      opacity={0}
    />
  );

  // Competitor value
  const competitorValue = createSignal(0);
  const competitorValueLabel = createRef<Txt>();
  chartContainer().add(
    <Txt
      ref={competitorValueLabel}
      text={() => `$${competitorValue().toFixed(0)}`}
      fontSize={36}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={TEXT_WHITE}
      x={-150}
      y={() => 200 - competitorBarHeight() - 30}
      opacity={0}
    />
  );

  // ZORB bar
  const zorbBarHeight = createSignal(4); // Minimum visible height
  const zorbBar = createRef<Rect>();
  chartContainer().add(
    <Rect
      ref={zorbBar}
      width={180}
      height={() => zorbBarHeight()}
      fill={ZORB_CYAN}
      x={150}
      y={() => 200 - zorbBarHeight() / 2}
      radius={[12, 12, 0, 0]}
      opacity={0}
    />
  );

  // ZORB label
  const zorbLabel = createRef<Txt>();
  chartContainer().add(
    <Txt
      ref={zorbLabel}
      text="ZORB"
      fontSize={24}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={600}
      fill={TEXT_WHITE}
      x={150}
      y={250}
      opacity={0}
    />
  );

  // ZORB value
  const zorbValueLabel = createRef<Txt>();
  chartContainer().add(
    <Txt
      ref={zorbValueLabel}
      text="$0"
      fontSize={36}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={ZORB_CYAN}
      x={150}
      y={160}
      opacity={0}
    />
  );

  // "Locked Forever" label for competitor
  const lockedLabel = createRef<Txt>();
  chartContainer().add(
    <Txt
      ref={lockedLabel}
      text="Locked Forever"
      fontSize={20}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={500}
      fill={RENT_RED}
      x={-150}
      y={290}
      opacity={0}
    />
  );

  // Savings callout
  const savingsBox = createRef<Rect>();
  view.add(
    <Rect
      ref={savingsBox}
      width={350}
      height={80}
      radius={16}
      fill={null}
      stroke={ZORB_CYAN}
      lineWidth={3}
      x={300}
      y={-150}
      opacity={0}
    >
      <Txt
        text="100% Savings"
        fontSize={32}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={700}
        fill={ZORB_CYAN}
      />
    </Rect>
  );

  // Animation sequence
  yield* title().opacity(1, 0.5);
  yield* waitFor(0.3);

  // Show axes
  yield* all(
    yAxis().opacity(1, 0.3),
    ...yLabelRefs.map(l => l.opacity(1, 0.3)),
  );

  // Show labels
  yield* all(
    competitorLabel().opacity(1, 0.3),
    zorbLabel().opacity(1, 0.3),
  );

  // Show bars
  yield* all(
    competitorBar().opacity(1, 0.2),
    zorbBar().opacity(1, 0.2),
    competitorValueLabel().opacity(1, 0.2),
    zorbValueLabel().opacity(1, 0.2),
  );

  yield* waitFor(0.3);

  // Grow competitor bar (to $130)
  yield* all(
    competitorBarHeight(346, 3, easeOutExpo), // 346px = $130 on scale
    competitorValue(130, 3, easeOutExpo),
  );

  yield* waitFor(0.3);

  // Flash the difference
  yield* all(
    lockedLabel().opacity(1, 0.3),
    competitorBar().fill('#FF6666', 0.3).to(RENT_RED, 0.3),
  );

  yield* waitFor(0.3);

  // Show savings
  yield* all(
    savingsBox().opacity(1, 0.5),
    savingsBox().scale(1.1, 0.2).to(1, 0.2),
    zorbBar().fill('#00FFFF', 0.3).to(ZORB_CYAN, 0.3),
  );

  yield* waitFor(2);
});
