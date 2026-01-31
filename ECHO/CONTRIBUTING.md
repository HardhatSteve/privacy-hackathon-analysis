# Contributing to ECHO Gossip Chain

First off, thank you for considering contributing to ECHO! 🎉

This document provides guidelines for contributing to the project. By participating, you agree to abide by our code of conduct.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We are committed to providing a friendly, safe, and welcoming environment for all contributors, regardless of experience level, gender identity, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

### Our Standards

**Examples of behavior that contributes to a positive environment:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Project maintainers will remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned to this Code of Conduct.

---

## Getting Started

### Prerequisites

Before contributing, make sure you have:

- **Node.js 18+** installed
- **npm** or **yarn** package manager
- **Git** for version control
- **Python 3.8+** for running tests
- Basic understanding of:
  - TypeScript
  - React / Next.js
  - Solana blockchain concepts

### First Time Contributors

If this is your first time contributing to open source, welcome! Here are some resources:
- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [First Contributions](https://github.com/firstcontributions/first-contributions)
- [Understanding the GitHub Flow](https://guides.github.com/introduction/flow/)

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating a bug report:
1. Check the [existing issues](https://github.com/Shawnchee/ECHO/issues) to avoid duplicates
2. Collect information about the bug:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser/OS information

**Bug Report Template:**
```markdown
## Bug Description
A clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots
If applicable, add screenshots.

## Environment
- OS: [e.g., Windows 11, macOS 14]
- Browser: [e.g., Chrome 120, Firefox 121]
- Node.js version: [e.g., 18.19.0]
```

### 💡 Suggesting Features

We love feature suggestions! Please:
1. Check existing issues/discussions for similar ideas
2. Provide clear use cases
3. Explain how it benefits users

**Feature Request Template:**
```markdown
## Feature Summary
A brief description of the feature.

## Problem it Solves
What problem does this feature address?

## Proposed Solution
How would you implement this?

## Alternatives Considered
Any alternative solutions you've thought about.

## Additional Context
Screenshots, mockups, or examples.
```

### 📝 Documentation Improvements

Documentation is crucial! You can help by:
- Fixing typos or grammar
- Adding examples
- Clarifying confusing sections
- Adding JSDoc comments to code
- Updating outdated information

### 💻 Code Contributions

Ready to code? Here's how:

1. **Find an issue** labeled `good first issue` or `help wanted`
2. **Comment** on the issue to claim it
3. **Fork** the repository
4. **Create a branch** for your feature/fix
5. **Make changes** following our style guidelines
6. **Test** your changes
7. **Submit** a pull request

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork via GitHub UI, then:
git clone https://github.com/Shawnchee/ECHO.git
cd ECHO
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys (see README for setup)
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Run Tests

```bash
# Install test dependencies
pip install -r tests/requirements.txt

# Run tests
pytest tests/test_api.py -v
```

### 6. Verify Build

```bash
npm run build
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Self-review of code completed
- [ ] Comments added for complex logic
- [ ] Documentation updated if needed
- [ ] All tests pass
- [ ] No new warnings introduced
- [ ] Branch is up-to-date with main

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## How Has This Been Tested?
Describe tests run to verify changes.

## Checklist
- [ ] My code follows the project style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] All tests pass locally

## Screenshots (if applicable)
Add screenshots for UI changes.
```

### Review Process

1. **Automated checks** run (linting, tests)
2. **Maintainer review** within 3-5 business days
3. **Address feedback** if requested
4. **Approval and merge** once all checks pass

---

## Style Guidelines

### TypeScript

```typescript
// ✅ Good: Use explicit types
function analyzeWallet(address: string): Promise<WalletAnalysis> {
  // ...
}

// ❌ Bad: Implicit any
function analyzeWallet(address) {
  // ...
}

// ✅ Good: Use interfaces for complex types
interface WalletAnalysis {
  address: string;
  privacyScore: number;
  risks: PrivacyRisk[];
}

// ✅ Good: Descriptive variable names
const transactionHistory = await fetchTransactions(address);

// ❌ Bad: Cryptic names
const txs = await fetch(addr);
```

### React Components

```tsx
// ✅ Good: Functional components with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// ✅ Good: Use hooks appropriately
const [isLoading, setIsLoading] = useState(false);

// ✅ Good: Memoize expensive computations
const sortedRisks = useMemo(() => 
  risks.sort((a, b) => b.severity - a.severity), 
  [risks]
);
```

### File Organization

```
components/
├── feature-name/
│   ├── index.tsx         # Main component
│   ├── FeatureName.tsx   # Component implementation
│   ├── hooks.ts          # Custom hooks
│   └── types.ts          # TypeScript types
```

### CSS / Tailwind

```tsx
// ✅ Good: Use Tailwind utilities
<div className="flex items-center gap-4 p-4 bg-black/60 rounded-lg">

// ✅ Good: Extract repeated patterns
const cardClasses = "bg-black/60 border border-blue-500/30 rounded-xl p-4";

// ❌ Bad: Inline styles (except for dynamic values)
<div style={{ display: 'flex', padding: '16px' }}>
```

---

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change, no new feature or fix |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### Examples

```bash
# Feature
feat(analysis): add MEV detection for sandwich attacks

# Bug fix
fix(graph): prevent duplicate node rendering

# Documentation
docs(readme): add API key setup instructions

# Refactor
refactor(privacy-engine): extract risk detection into separate functions

# Multiple changes
feat(simulation): add timing randomization option

- Add 0-24hr delay slider
- Update privacy score calculation
- Add tooltip explaining the feature

Closes #42
```

---

## Testing

### Running Tests

```bash
# All tests
pytest tests/test_api.py -v

# Specific test
pytest tests/test_api.py::TestAnalyzeEndpoint::test_analyze_valid_address -v

# With coverage
pytest tests/test_api.py -v --cov=app
```

### Writing Tests

```python
# tests/test_api.py

class TestNewFeature:
    """Tests for the new feature"""
    
    def test_feature_happy_path(self):
        """Test that feature works with valid input"""
        response = requests.post(
            f"{BASE_URL}/api/new-feature",
            json={"param": "valid_value"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "expected_field" in data
    
    def test_feature_error_handling(self):
        """Test that feature handles errors gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/new-feature",
            json={"param": "invalid_value"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 400
        assert "error" in response.json()
```

### Test Categories

| Category | Purpose | Location |
|----------|---------|----------|
| Unit | Individual functions | `tests/unit/` |
| Integration | API endpoints | `tests/test_api.py` |
| E2E | Full user flows | `tests/e2e/` (future) |

---

## Documentation

### Code Comments

```typescript
/**
 * Analyzes a wallet's privacy exposure across 8 risk categories.
 * 
 * @param address - The Solana wallet address to analyze
 * @returns Promise<WalletAnalysis> containing privacy score and risks
 * 
 * @example
 * ```typescript
 * const analysis = await analyzeWalletPrivacy("DRpb...");
 * console.log(analysis.privacyScore); // 0-100
 * ```
 * 
 * @throws Error if address is invalid or API calls fail
 */
export async function analyzeWalletPrivacy(
  address: string
): Promise<WalletAnalysis> {
  // Implementation
}
```

### README Updates

When adding features, update:
1. Feature list in README
2. Architecture diagram if applicable
3. Configuration options
4. API documentation

---

## Questions?

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Twitter/X**: [@shawnchee](https://twitter.com/shawnchee)

---

## Recognition

Contributors will be:
- Listed in the README acknowledgments
- Credited in release notes
- Given contributor badge on GitHub

---

Thank you for contributing to ECHO! Together, we're making blockchain privacy accessible to everyone. 🔮

