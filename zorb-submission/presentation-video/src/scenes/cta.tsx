import {makeScene2D, Txt, Rect, Circle, Line, Node, Img} from '@motion-canvas/2d';
import {all, chain, createRef, waitFor, sequence, easeOutExpo} from '@motion-canvas/core';

/**
 * SCENE 6: CALL TO ACTION (2:50-3:00)
 * Duration: 10 seconds
 *
 * Key elements:
 * - ZORB logo animation (SVG)
 * - Team credentials ("ZK team with Polygon experience")
 * - Vision ("Programmable privacy on Solana coming Q2")
 * - GitHub link
 * - Final tagline: "Privacy should be free. ZORB makes it possible."
 */
export default makeScene2D(function* (view) {
  const ZORB_CYAN = '#00D1FF';
  const BG_DARK = '#0a0a0f';
  const TEXT_WHITE = '#FFFFFF';
  const TEXT_GRAY = '#888888';
  const ACCENT_PURPLE = '#9945FF';
  const ACCENT_GREEN = '#44FF88';

  view.fill(BG_DARK);

  // ========== ZORB LOGO ==========
  const logoContainer = createRef<Node>();
  view.add(<Node ref={logoContainer} y={-180} opacity={0} />);

  // ZORB SVG Logo
  const logo = createRef<Img>();
  logoContainer().add(
    <Img
      ref={logo}
      src="/zorb.svg"
      width={140}
      height={140}
      y={-30}
    />
  );

  // ZORB text below logo
  const zorbText = createRef<Txt>();
  logoContainer().add(
    <Txt
      ref={zorbText}
      text="ZORB"
      fontSize={72}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={900}
      fill={ZORB_CYAN}
      letterSpacing={8}
      y={70}
    />
  );

  // Orbital circle around the logo
  const orbit = createRef<Circle>();
  logoContainer().add(
    <Circle
      ref={orbit}
      width={220}
      height={220}
      stroke={ZORB_CYAN}
      lineWidth={2}
      opacity={0.3}
      y={-30}
    />
  );

  // Small orbiting dot
  const orbitDot = createRef<Circle>();
  logoContainer().add(
    <Circle
      ref={orbitDot}
      width={12}
      height={12}
      fill={ZORB_CYAN}
      x={110}
      y={-30}
      opacity={0}
    />
  );

  // ========== TEAM CREDENTIALS ==========
  const teamBox = createRef<Rect>();
  view.add(
    <Rect
      ref={teamBox}
      width={450}
      height={55}
      radius={27}
      fill={'#1a1a2e'}
      stroke={ACCENT_PURPLE}
      lineWidth={2}
      y={-60}
      opacity={0}
    >
      <Txt
        text="ZK team with Polygon experience"
        fontSize={22}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={600}
        fill={TEXT_WHITE}
      />
    </Rect>
  );

  // ========== VISION ==========
  const visionBox = createRef<Rect>();
  view.add(
    <Rect
      ref={visionBox}
      width={520}
      height={55}
      radius={27}
      fill={'#0a1a2a'}
      stroke={ZORB_CYAN}
      lineWidth={2}
      y={20}
      opacity={0}
    >
      <Txt
        text="Programmable privacy on Solana — Q2 2026"
        fontSize={22}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={600}
        fill={ZORB_CYAN}
      />
    </Rect>
  );

  // ========== GITHUB LINK ==========
  const githubBox = createRef<Rect>();
  view.add(
    <Rect
      ref={githubBox}
      width={400}
      height={45}
      radius={22}
      fill={'#1a1a1a'}
      stroke={TEXT_GRAY}
      lineWidth={1}
      y={100}
      opacity={0}
    >
      <Txt
        text="github.com/zorb-labs/solana-privacy-hackathon-2026"
        fontSize={18}
        fontFamily="monospace"
        fontWeight={500}
        fill={TEXT_GRAY}
      />
    </Rect>
  );

  // ========== TAGLINE ==========
  const taglineContainer = createRef<Node>();
  view.add(<Node ref={taglineContainer} y={220} opacity={0} />);

  const tagline1 = createRef<Txt>();
  taglineContainer().add(
    <Txt
      ref={tagline1}
      text="Privacy should be free."
      fontSize={36}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={600}
      fill={TEXT_WHITE}
      y={-25}
    />
  );

  const tagline2 = createRef<Txt>();
  taglineContainer().add(
    <Txt
      ref={tagline2}
      text="ZORB makes it possible."
      fontSize={40}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight={700}
      fill={ZORB_CYAN}
      y={25}
    />
  );

  // ========== DECORATIVE ELEMENTS ==========
  // Bottom accent line
  const accentLine = createRef<Line>();
  view.add(
    <Line
      ref={accentLine}
      points={[[-200, 0], [200, 0]]}
      stroke={ZORB_CYAN}
      lineWidth={3}
      y={320}
      opacity={0}
    />
  );

  // ========== ANIMATION SEQUENCE (10 seconds total) ==========

  // 0-2s: Logo appears with orbit
  yield* logoContainer().opacity(1, 0.5);
  yield* all(
    logo().scale(1.1, 0.3).to(1, 0.2),
    zorbText().scale(1.05, 0.3).to(1, 0.2),
    orbitDot().opacity(1, 0.3),
  );

  // Animate orbit dot
  yield* orbitDot().x(-110, 0.8);

  // 2-4s: Team credentials
  yield* all(
    teamBox().opacity(1, 0.4),
    teamBox().y(-60, 0.3, easeOutExpo),
  );

  yield* waitFor(0.3);

  // 4-5s: Vision
  yield* all(
    visionBox().opacity(1, 0.4),
    visionBox().y(20, 0.3, easeOutExpo),
  );

  yield* waitFor(0.3);

  // 5-6s: GitHub link
  yield* githubBox().opacity(1, 0.3);

  yield* waitFor(0.3);

  // 6-9s: Tagline
  yield* taglineContainer().opacity(1, 0.5);
  yield* all(
    tagline1().opacity(1, 0.3),
    tagline2().opacity(1, 0.4),
    tagline2().scale(1.08, 0.25).to(1, 0.2),
  );

  // 9-10s: Accent line and final hold
  yield* accentLine().opacity(1, 0.3);

  // Continue orbit animation
  yield* orbitDot().x(110, 1);

  yield* waitFor(1);
});
