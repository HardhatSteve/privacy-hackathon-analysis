# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-17

### Added

- Initial release of OpenCoins Launchpad MCP plugin
- EVM token deployment with 1% transfer fee
  - Support for Ethereum, BSC, Polygon, Arbitrum, Optimism, Base
  - Testnet support (Sepolia, BSC Testnet, Mumbai)
  - Fee exclusion functionality
  - Ownership management
- Solana token deployment with Token-2022
  - Transfer Fee Extension (1% fee)
  - Mainnet, Devnet, Testnet support
  - Withheld fee collection
- OpenCode.ai custom tools integration
  - `deploy-evm-token` tool
  - `deploy-solana-token` tool
  - `get-token-info` tool
- Comprehensive documentation
  - README with installation and usage
  - USAGE.md with detailed examples
  - SECURITY.md with best practices
  - CONTRACTS.md with technical details
- Validation and security features
  - Input validation for all parameters
  - Secure logging with OpenCode client
  - Error handling and reporting
- Testing infrastructure
  - Jest configuration
  - Unit tests for validation
  - Example integration tests

### Security

- Immutable fee collector addresses
- Private key validation
- Address validation for both chains
- Supply limits and overflow protection

## [Unreleased]

### Planned

- Additional network support (Avalanche, Fantom)
- Enhanced metadata support for Solana tokens
- Integration tests for testnet deployments
- CI/CD pipeline
- NPM package publication
- Web dashboard for token management
- Multi-language support
