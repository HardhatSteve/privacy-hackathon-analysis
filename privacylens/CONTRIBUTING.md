# Contributing to PrivacyLens

Thank you for your interest in contributing to PrivacyLens! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/privacylens/privacylens/issues)
2. If not, create a new issue using the Bug Report template
3. Include as much detail as possible:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue using the Feature Request template
3. Explain the problem you're trying to solve
4. Describe your proposed solution

### Contributing Code

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Write or update tests
5. Ensure all tests pass: `npm test`
6. Commit your changes with a clear message
7. Push to your fork
8. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18 or higher
- Rust 1.75 or higher
- pnpm or npm

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/privacylens.git
cd privacylens

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Generate Prisma client
npm run db:generate

# Start development server
npm run dev
```

### Project Structure

- `src/` - Next.js frontend application
- `analyzer/` - Rust-based analysis engine
- `cli/` - Command-line tool
- `prisma/` - Database schema
- `tests/` - Test suites

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Rust

- Follow Rust naming conventions
- Add documentation comments
- Use `cargo fmt` before committing
- Run `cargo clippy` and fix warnings

### CSS/Styling

- Use Tailwind CSS classes
- Follow the existing design system
- Ensure responsive design
- Test in both light and dark modes

## Testing

### Frontend Tests

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e
```

### Analyzer Tests

```bash
cd analyzer
cargo test
```

## Pull Request Guidelines

1. **Title**: Use a clear, descriptive title
2. **Description**: Explain what changes you made and why
3. **Tests**: Add tests for new functionality
4. **Documentation**: Update docs if needed
5. **Commits**: Keep commits focused and atomic

### PR Template

```markdown
## Description
[Describe your changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing done

## Screenshots (if applicable)
[Add screenshots]
```

## Adding New Detectors

To add a new vulnerability detector:

1. Create a new file in `analyzer/src/detectors/`
2. Implement the `Detector` trait
3. Add your detector to `DetectorRegistry`
4. Add tests for the detector
5. Update documentation

Example:

```rust
pub struct MyDetector;

impl Detector for MyDetector {
    fn id(&self) -> &'static str {
        "MY_DETECTOR"
    }

    fn name(&self) -> &'static str {
        "My Detector"
    }

    fn description(&self) -> &'static str {
        "Detects XYZ vulnerabilities"
    }

    fn detect(&self, program: &ParsedProgram, config: &AnalysisConfig) -> Vec<Vulnerability> {
        // Your detection logic
        vec![]
    }

    fn categories(&self) -> Vec<VulnerabilityCategory> {
        vec![VulnerabilityCategory::Other]
    }
}
```

## Questions?

Feel free to:
- Open an issue for questions
- Join our Discord community
- Reach out on Twitter

Thank you for contributing!
