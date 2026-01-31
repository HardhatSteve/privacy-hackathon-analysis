# Contributing to AuroraZK

Thank you for your interest in contributing to AuroraZK! This document provides guidelines for contributing.

## Code of Conduct

Be respectful and constructive. We're all here to build something amazing.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Open an issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and its use case
3. Explain why it would benefit the project

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages: `git commit -m "Add amazing feature"`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Development Setup

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup instructions.

### Quick Start

```bash
git clone https://github.com/yourusername/AuroraZK.git
cd AuroraZK
npm run setup
```

## Code Style

- **TypeScript**: Use strict types, avoid `any`
- **React**: Functional components with hooks
- **CSS**: TailwindCSS utility classes
- **Formatting**: Prettier with default settings

## Testing

```bash
# Run Anchor tests
anchor test

# Run frontend type check
cd app && npm run build
```

## Questions?

Open an issue or reach out on Twitter.
