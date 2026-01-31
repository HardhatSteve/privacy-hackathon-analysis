#  Contributing to SolVoid

First off, thank you for considering contributing to SolVoid! It's people like you that make the open-source community such an amazing place to learn, inspire, and create.

##  Our Code of Conduct
By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

##  How Can I Contribute?

### Reporting Bugs
- **Check for existing issues:** Before opening a new one, see if someone else has already reported it.
- **Provide detail:** Include your OS, browser version, Solana CLI version, and clear steps to reproduce the bug.
- **Attach logs:** If the issue is with the SDK or CLI, provide the terminal output.

### Suggesting Enhancements
We love new ideas! Please open an issue with the "feature request" tag and explain:
- **What** is the feature?
- **Why** is it needed?
- **How** should it work?

### Pull Requests
1. **Fork the repo** and create your branch from `main`.
2. **Setup your environment:** (See [GETTING_STARTED.md](./GETTING_STARTED.md)).
3. **Write tests:** Ensure your changes are covered by unit or integration tests.
4. **Follow the style guide:** We use Prettier for TS and `cargo fmt` for Rust.
5. **Update documentation:** If you change an API or add a feature, update the relevant `.md` files.

---

##  Development Setup

```bash
# Install everything
npm install

# Run tests
anchor test

# Build circuits (if needed)
./scripts/build-zk.sh
```

---

##  Commit Message Conventions
We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification:
- `feat:` for new features.
- `fix:` for bug fixes.
- `docs:` for documentation updates.
- `refactor:` for code changes that neither fix a bug nor add a feature.

---

##  Recognition
All contributors will be featured in our README and are eligible for future token distributions or community rewards if the project transitions to a DAO model.

---
*Questions? Reach out to us on [Twitter/X](https://x.com/solvoid).*
