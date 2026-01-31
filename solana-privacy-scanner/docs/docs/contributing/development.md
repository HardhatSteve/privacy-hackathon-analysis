# Contributing

## Setup

```bash
git clone https://github.com/yourusername/solana-privacy-scanner
cd solana-privacy-scanner
npm install
npm run build
npm test
```

**Requirements:** Node.js 20+

## Structure

```
packages/
├── core/           # Scanner engine
├── cli/            # CLI tool  
├── ci-tools/       # Testing & CI integration
├── code-analyzer/  # Static code analyzer
└── claude-plugin/  # Claude Code plugin
```

## Making Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Run `npm test` to verify
6. Submit a pull request

## Areas to Contribute

- **Add known entities** - Submit addresses to the database ([guide](./addresses))
- **New heuristics** - Propose privacy detection patterns
- **Documentation** - Improve guides and examples
- **Bug fixes** - Report and fix issues
- **Testing** - Add test coverage

## Code Style

- TypeScript strict mode
- ESM modules (`.js` extensions in imports)
- Descriptive variable names
- Add tests for new features
