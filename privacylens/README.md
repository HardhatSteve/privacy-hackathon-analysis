# PrivacyLens

<p align="center">
  <img src="public/logo.svg" alt="PrivacyLens Logo" width="120" height="120" />
</p>

<p align="center">
  <strong>Privacy Analysis and Scoring for Solana Programs</strong>
</p>

<p align="center">
  <a href="https://github.com/privacylens/privacylens/actions"><img src="https://github.com/privacylens/privacylens/workflows/CI/badge.svg" alt="CI Status" /></a>
  <a href="https://codecov.io/gh/privacylens/privacylens"><img src="https://codecov.io/gh/privacylens/privacylens/branch/main/graph/badge.svg" alt="Coverage" /></a>
  <a href="https://github.com/privacylens/privacylens/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
</p>

---

PrivacyLens is a comprehensive privacy analysis and scoring tool for Solana programs. Think **"Lighthouse for Privacy"** - developers can analyze smart contracts to identify privacy leaks, timing attacks, and PII exposure before deployment.

## Features

- **Automated Privacy Vulnerability Detection**: Detect PII exposure, timing attacks, state leakage, and 20+ other privacy vulnerability types
- **Quantifiable Privacy Score (0-100)**: Get a clear score with detailed breakdowns by category
- **Deep Analysis Engine**: Rust-powered analyzer compiled to WASM examines bytecode for privacy patterns
- **Fast Analysis**: Analyze most programs in under 5 seconds
- **CI/CD Integration**: GitHub Actions, GitLab CI, and CLI support
- **Developer-Friendly CLI**: Full-featured command-line tool for local analysis
- **Public Leaderboard**: Discover and compare the most privacy-conscious programs
- **Historical Tracking**: Track privacy improvements over time

## Quick Start

### Web Application

Visit [https://privacylens.io](https://privacylens.io) to analyze your Solana programs online.

### CLI Installation

```bash
# Using npm
npm install -g @privacylens/cli

# Using Cargo
cargo install privacylens-cli

# Using Homebrew (macOS/Linux)
brew install privacylens
```

### Basic Usage

```bash
# Analyze a program by address
privacylens analyze <PROGRAM_ADDRESS>

# Analyze a local bytecode file
privacylens analyze ./program.so

# Get just the privacy score
privacylens score <PROGRAM_ADDRESS>

# Initialize configuration
privacylens init
```

## Project Structure

```
privacylens/
├── src/                    # Next.js frontend application
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript types
├── analyzer/              # Rust-based analysis engine
│   ├── src/
│   │   ├── detectors/    # Vulnerability detectors
│   │   ├── patterns/     # Privacy patterns library
│   │   └── scorer.rs     # Scoring algorithm
│   └── Cargo.toml
├── cli/                   # Command-line tool
├── prisma/               # Database schema
├── tests/                # Test suites
│   └── e2e/             # Playwright E2E tests
└── .github/             # GitHub Actions workflows
```

## Detection Categories

PrivacyLens detects vulnerabilities across these categories:

| Category | Description |
|----------|-------------|
| **PII Exposure** | Personally identifiable information stored or logged on-chain |
| **Timing Attacks** | Non-constant-time operations that leak information |
| **State Leakage** | Unintended exposure of internal state |
| **Access Control** | Missing or insufficient authorization checks |
| **Cryptographic** | Weak encryption, poor key management, nonce reuse |
| **Side-Channel** | Cache timing, compute unit variations |
| **Data Aggregation** | Patterns enabling correlation attacks |

## Privacy Score

The privacy score (0-100) is calculated based on:

- **Vulnerability Score (50%)**: Deductions for detected issues
  - Critical: -30 points
  - High: -20 points
  - Medium: -10 points
  - Low: -5 points

- **Best Practices Score (30%)**: Points for following best practices
  - Encryption usage: +15 points
  - Access control: +10 points
  - Data minimization: +10 points
  - Key management: +10 points
  - Privacy patterns: +5 points

- **PII Handling Score (20%)**: Based on PII detection and handling

## Development

### Prerequisites

- Node.js 18+
- Rust 1.75+
- pnpm or npm

### Setup

```bash
# Clone the repository
git clone https://github.com/privacylens/privacylens.git
cd privacylens

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Generate Prisma client
npm run db:generate

# Run development server
npm run dev
```

### Building the Analyzer

```bash
# Build native binary
cd analyzer && cargo build --release

# Build WASM for browser
npm run analyzer:wasm
```

### Running Tests

```bash
# Run frontend tests
npm test

# Run E2E tests
npm run test:e2e

# Run analyzer tests
cd analyzer && cargo test
```

## API Reference

### Analyze Program

```
POST /api/analyze
```

```json
{
  "programAddress": "TokenSwap111...",
  "depth": "standard",
  "minSeverity": "low",
  "includeRecommendations": true
}
```

### Get Leaderboard

```
GET /api/leaderboard?category=all&limit=100
```

## CI/CD Integration

### GitHub Action

```yaml
- name: PrivacyLens Analysis
  uses: privacylens/action@v1
  with:
    program: ${{ env.PROGRAM_ADDRESS }}
    threshold: 70
    fail-below: true
```

### GitLab CI

```yaml
privacylens:
  image: privacylens/cli:latest
  script:
    - privacylens analyze $PROGRAM_ADDRESS --threshold 70
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [Website](https://privacylens.io)
- [Documentation](https://docs.privacylens.io)
- [API Reference](https://docs.privacylens.io/api)
- [Discord](https://discord.gg/privacylens)
- [Twitter](https://twitter.com/privacylens)

---

<p align="center">
  Made with care by the PrivacyLens team
</p>
