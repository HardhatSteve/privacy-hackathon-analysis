# Contributing to Privacy Execution Layer

Thank you for your interest in contributing! 🎉

## How to Contribute

### 1. Find an Issue
- Look for issues labeled `good-first-issue`
- Check `help-wanted` issues
- Review open discussions

### 2. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/protocol
cd protocol
git remote add upstream https://github.com/privacy-execution-layer/protocol
```

### 3. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

### 4. Make Changes
Follow our code standards (see below).

### 5. Test
```bash
./scripts/test_all.sh
```

### 6. Commit
```bash
git commit -m "feat: add amazing feature"
```

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `refactor:` Code refactoring
- `chore:` Maintenance

### 7. Push & PR
```bash
git push origin feature/your-feature-name
```
Then open a Pull Request.

## Code Standards

### Rust
- Run `cargo fmt` before committing
- Pass `cargo clippy -- -D warnings`
- Add tests for new functionality
- Document public APIs

### Circom
- Comment all signals
- Explain constraints
- Test with edge cases

### TypeScript
- Use TypeScript strict mode
- Run linter before commit

## Pull Request Process

1. **Title**: Use conventional commit format
2. **Description**: Explain what and why
3. **Tests**: All tests must pass
4. **Review**: Minimum 2 approvals required
5. **Merge**: Squash and merge

## Review Criteria

PRs are reviewed for:
- [ ] Correctness
- [ ] Security implications
- [ ] Test coverage
- [ ] Documentation
- [ ] Code style

## Security Contributions

For security issues, see [SECURITY.md](SECURITY.md).

**DO NOT** create public issues for vulnerabilities.

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md
- Release notes
- Protocol documentation

## Questions?

Open a [Discussion Issue](../../issues/new?template=discussion.yml).

---

*All contributions are subject to our [Code of Conduct](CODE_OF_CONDUCT.md).*
