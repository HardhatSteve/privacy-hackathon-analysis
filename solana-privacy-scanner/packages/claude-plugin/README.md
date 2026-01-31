# Solana Privacy Scanner - Claude Code Plugin

AI-powered privacy analysis for Solana developers, integrated directly into Claude Code.

## Features

- **Static Code Analysis** - Detect privacy anti-patterns in your source code
- **On-Chain Analysis** - Analyze wallet privacy using blockchain data
- **AI Explanations** - Get detailed explanations of privacy risks
- **Fix Suggestions** - Receive AI-generated code fixes

## Installation

```bash
# From the monorepo root
cd packages/claude-plugin
npm install
npm run build
```

## Skills

### /scan-code

Analyze source code for privacy vulnerabilities.

```
/scan-code src/transactions.ts
/scan-code src/**/*.ts
```

Detects:
- Fee payer reuse patterns
- PII in transaction memos
- And more...

### /scan-wallet

Analyze on-chain wallet privacy.

```
/scan-wallet DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy
```

Provides:
- Overall risk assessment
- Privacy signals with evidence
- Mitigation recommendations

### /explain-risk

Get detailed explanations of specific risks.

```
/explain-risk fee-payer-reuse
/explain-risk memo-pii
```

### /suggest-fix

Generate code fixes for detected issues.

```
/suggest-fix src/transactions.ts:25
```

## Development

```bash
# Watch mode
npm run dev

# Type checking
npm run type-check

# Build
npm run build
```

## Architecture

```
packages/claude-plugin/
├── .claude-plugin/        # Plugin manifest
├── skills/                # Claude Code skills
│   ├── scan-code/
│   ├── scan-wallet/
│   ├── explain-risk/
│   └── suggest-fix/
└── src/                   # TypeScript source
    ├── index.ts
    ├── types.ts
    └── formatter.ts
```

## License

MIT © Taylor Ferran
