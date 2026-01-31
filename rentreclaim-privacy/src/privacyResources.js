export const tracks = [
  { track: "Private Payments", prize: "$15,000", focus: "Build innovative solutions for confidential or private transfers on Solana" },
  { track: "Privacy Tooling",  prize: "$15,000", focus: "Develop tools and infrastructure that make it easier for developers to build with privacy" },
  { track: "Open Track",       prize: "$18,000", focus: "Build privacy applications on Solana (supported by Light Protocol)" },
];

export const sponsors = [
  {
    name: "Arcium",
    prize: "$10,000",
    blurb: "End-to-end private DeFi using Arcium and the C-SPL token standard. Build fully confidential swaps, lending, borrowing, and more.",
    links: [
      { label: "Website", url: "https://arcium.com/" },
      { label: "Docs", url: "https://docs.arcium.com/" },
      { label: "Quickstart", url: "https://docs.arcium.com/developers/getting-started" },
      { label: "Examples", url: "https://github.com/arcium-hq/examples" },
    ],
  },
  {
    name: "Aztec (Noir)",
    prize: "$10,000",
    blurb: "Build ZK applications using Noir on Solana. Prizes: Best Overall ($5k), Best Non-Financial Use ($2.5k), Most Creative ($2.5k).",
    links: [
      { label: "Noir Docs", url: "https://noir-lang.org/docs/" },
      { label: "Noir on Solana Examples", url: "https://github.com/solana-foundation/noir-examples" },
      { label: "Sunspot Verifier", url: "https://github.com/reilabs/sunspot" },
    ],
  },
  {
    name: "Inco",
    prize: "$6,000",
    blurb: "Best confidential apps using Inco Lightning. Categories: DeFi ($2k), Consumer/Gaming/Prediction Markets ($2k), Payments ($2k).",
    links: [
      { label: "Docs", url: "https://docs.inco.org/svm/home" },
      { label: "Website", url: "https://inco.org/" },
    ],
  },
  {
    name: "Helius",
    prize: "$5,000",
    blurb: "Best privacy project leveraging Helius RPCs and developer tooling.",
    links: [
      { label: "Website", url: "https://helius.dev/" },
      { label: "Docs", url: "https://docs.helius.dev/" },
      { label: "GitHub", url: "https://github.com/helius-labs" },
    ],
  },
  {
    name: "Encrypt.trade",
    prize: "$1,000",
    blurb: "Educate users about privacy. Wallet Surveillance Education ($500), Jargon-Free Privacy Explanation ($500).",
    links: [
      { label: "Website", url: "https://encrypt.trade/" },
    ],
  },
  {
    name: "Privacy Cash",
    prize: "$6,000",
    blurb: "Use Privacy Cash SDK to build privacy-enabled apps on Solana. Ideas include private lending, whale wallets, private bridging, games, and more.",
    links: [
      { label: "GitHub", url: "https://github.com/Privacy-Cash/privacy-cash" },
    ],
  },
  {
    name: "Range",
    prize: "$1,500",
    blurb: "Build compliant-privacy solutions using Range tools for pre-screening and selective disclosure.",
    links: [
      { label: "Website", url: "https://www.range.org/" },
    ],
  },
  {
    name: "Radr Labs",
    prize: "$15,000",
    blurb: "Privacy-First DeFi on Solana: ShadowWire, ShadowSwap, ShadowTrade—powered by ZK.",
    links: [
      { label: "Website", url: "https://radr.fun/" },
      { label: "Radr API", url: "https://registry.scalar.com/@radr/apis/shadowpay-api" },
      { label: "GitHub", url: "https://github.com/radrdotfun" },
    ],
  },
];

export const submissionReqs = [
  "Open source code mandatory",
  "Integrate Solana with privacy-preserving technologies",
  "Deploy to Solana devnet or mainnet",
  "Include demo video (max 3 minutes)",
  "Provide documentation for running/using your project",
];

export const projects = [
  { name: "Arcium", url: "https://www.arcium.com/", blurb: "MPC network allowing for verifiable trustless computation" },
  { name: "encrypt.trade", url: "https://app.encifher.io/", blurb: "Encrypted private DeFi using encryption and TEEs" },
  { name: "Privacy.cash", url: "https://github.com/Privacy-Cash/privacy-cash", blurb: "Private SOL/SPL transfers using ZK proofs and privacy pools" },
  { name: "Umbra", url: "https://umbra.cash/", blurb: "Private transactions via shielded pools (built on Arcium)" },
  { name: "Hush", url: "https://hush.so/", blurb: "Privacy-first wallet stealth addresses" },
  { name: "MagicBlock", url: "https://www.magicblock.gg/", blurb: "Ephemeral rollups with TEEs" },
];

export const education = [
  { label: "Noir examples", url: "https://github.com/solana-foundation/noir-examples", note: "Examples of Noir projects on Solana" },
  { label: "Solana mixer example", url: "https://github.com/catmcgee/solana-mixer-circom", note: "Simple demo-only mixer using Circom" },
  { label: "Confidential transfers guide", url: "https://solana.com/docs/tokens/extensions/confidential-transfer", note: "Token-2022 confidential transfer extension" },
  { label: "Arcium docs", url: "https://docs.arcium.com/", note: "MPC framework similar to Anchor" },
];

export const tooling = [
  { label: "Sunspot", url: "https://github.com/reilabs/sunspot", note: "Noir/Groth16 verifier on Solana" },
  { label: "Light Protocol", url: "https://github.com/Lightprotocol/light-protocol", note: "ZK compression for scalability + privacy" },
  { label: "groth16-solana", url: "https://github.com/Lightprotocol/groth16-solana", note: "Groth16 verifier by Light Protocol" },
  { label: "Arcium SDK", url: "https://docs.arcium.com/", note: "MPC development framework" },
];
