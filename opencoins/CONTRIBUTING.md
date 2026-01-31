# Contributing to OpenCoins Launchpad

First off, thank you for considering contributing to OpenCoins Launchpad! It's people like you that make this plugin a great tool for the community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to fostering an open and welcoming environment. We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

**Examples of behavior that contributes to a positive environment:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**

- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Deploy token with '...'
2. Create pool with '...'
3. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Environment:**

- OS: [e.g. Windows, macOS, Linux]
- Node version: [e.g. 18.0.0]
- Plugin version: [e.g. 1.0.0]
- Network: [e.g. Sepolia, BSC Testnet]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most users
- **List some examples** of how it would be used

### Your First Code Contribution

Unsure where to begin? You can start by looking through these issue labels:

- `good-first-issue` - Issues which should only require a few lines of code
- `help-wanted` - Issues which should be a bit more involved than beginner issues

## Development Setup

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Git**
- A code editor (we recommend VSCode)

### Installation

1. **Fork the repository** on GitHub

2. **Clone your fork:**

   ```bash
   git clone https://github.com/YOUR_USERNAME/opencoins_mcp.git
   cd opencoins_mcp
   ```

3. **Add upstream remote:**

   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/opencoins_mcp.git
   ```

4. **Install dependencies:**

   ```bash
   npm install
   ```

5. **Build the project:**

   ```bash
   npm run build
   ```

6. **Run tests:**
   ```bash
   npm test
   ```

### Development Workflow

1. **Create a new branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

3. **Test your changes:**

   ```bash
   npm run build
   npm test
   ```

4. **Commit your changes:**

   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork:**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## Coding Standards

### TypeScript Guidelines

- **Use TypeScript** for all new code
- **Type everything** - avoid `any` when possible
- **Use interfaces** for object shapes
- **Use enums** for constants with multiple related values

### Code Style

We use Prettier and ESLint for code formatting:

```bash
npm run lint        # Check for linting errors
npm run format      # Auto-format code
```

**Key Points:**

- **Indentation:** 2 spaces
- **Quotes:** Double quotes for strings
- **Semicolons:** Required
- **Line Length:** Max 100 characters
- **Naming:**
  - `camelCase` for variables and functions
  - `PascalCase` for classes and interfaces
  - `UPPER_SNAKE_CASE` for constants

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
feat(wizard): add liquidity pool creation step
fix(evm): correct Raydium pool URL
docs(readme): update installation instructions
```

## Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- token-factory.test.ts

# Run with coverage
npm run test:coverage
```

### Writing Tests

- **Unit Tests:** Test individual functions and classes
- **Integration Tests:** Test end-to-end workflows
- **Place tests** next to the code they test: `*.test.ts`

**Example Test:**

```typescript
describe('UniswapPoolManager', () => {
  it('should create a pool successfully', async () => {
    // Arrange
    const params = { ... };

    // Act
    const result = await poolManager.createPool(params);

    // Assert
    expect(result.pairAddress).toBeDefined();
  });
});
```

### Test Coverage

- Aim for **>80% code coverage**
- All new features must include tests
- Bug fixes should include regression tests

## Pull Request Process

### Before Submitting

- [ ] Code builds without errors (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] Code follows style guidelines
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention

### PR Template

```markdown
## Description

Brief description of the changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

Describe the tests you ran

## Checklist

- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where needed
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **At least one maintainer** must review
3. **Address feedback** from reviewers
4. **Squash and merge** when approved

## Documentation

### When to Update Documentation

Update documentation when:

- Adding new features
- Changing existing behavior
- Adding configuration options
- Changing API interfaces

### Documentation Files

- **README.md** - Main project overview
- **docs/USAGE.md** - Detailed usage examples
- **docs/GUIDED_LAUNCH.md** - Wizard guide
- **docs/CONTRACTS.md** - Smart contract documentation
- **docs/SECURITY.md** - Security best practices
- **Code comments** - Explain complex logic

### Documentation Style

- Use **clear, concise language**
- Include **code examples** where appropriate
- Use **markdown formatting** for readability
- Add **links** to related documentation
- Keep **line length** reasonable (~80-100 chars)

## Community

### Getting Help

- **GitHub Issues** - For bug reports and feature requests
- **Discussions** - For questions and community chat
- **Documentation** - Check docs folder first

### Contact

- **Project Maintainer:** [Your contact info]
- **GitHub:** https://github.com/yourusername/opencoins_mcp

## Recognition

Contributors will be recognized in:

- README.md Contributors section
- CHANGELOG.md for significant contributions
- GitHub Contributors page

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to OpenCoins Launchpad!** 🚀

Every contribution, no matter how small, makes a difference. We appreciate your time and effort in making this project better.
