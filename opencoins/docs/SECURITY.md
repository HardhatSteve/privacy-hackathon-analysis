# Security Best Practices

Security is paramount when dealing with cryptocurrency and smart contracts. This document outlines best practices for using the OpenCoins Launchpad MCP plugin safely.

## Private Key Management

### EVM Private Keys

> [!CAUTION]
> **NEVER** commit private keys to version control or share them publicly.

**Best Practices:**

1. **Use Environment Variables**

   ```bash
   # .env (add to .gitignore)
   DEPLOYER_PRIVATE_KEY=0x...
   ```

2. **Hardware Wallets** (Recommended for Production)
   - Use Ledger or Trezor for mainnet deployments
   - Sign transactions offline when possible

3. **Separate Wallets**
   - Testnet wallet: Can have lower security
   - Mainnet deployer: High security, limited funds
   - Fee collector: Separate from deployer

4. **Key Rotation**
   - Regularly rotate deployment keys
   - Transfer ownership after deployment
   - Revoke old keys

### Solana Keypairs

**Secure Storage:**

```bash
# Protect your keypair file
chmod 600 ~/.config/solana/id.json

# Use different keypairs for different purposes
solana-keygen new -o ~/.config/solana/mainnet-deployer.json
```

**When Using the Plugin:**

```typescript
// Read keypair securely
import fs from "fs";
const keypair = fs.readFileSync("/secure/path/keypair.json", "utf-8");
```

## Environment Configuration

### .env File Security

**Required Configuration:**

```env
# .env
FEE_COLLECTOR_EVM=0x...
FEE_COLLECTOR_SOLANA=...

# Optional: Deployment keys (for automated deployments)
DEPLOYER_PRIVATE_KEY_EVM=0x...
DEPLOYER_KEYPAIR_SOLANA=[...]
```

**Protection:**

1. Add to `.gitignore`:

   ```gitignore
   .env
   .env.local
   .env.*.local
   ```

2. Set file permissions:

   ```bash
   chmod 600 .env
   ```

3. Never log environment variables

## RPC Endpoint Security

### Use Secure RPC Providers

**Public RPCs** (OK for testing):

- Potentially slower
- May have rate limits
- Could track requests

**Private RPCs** (Recommended for production):

- Alchemy
- Infura
- QuickNode
- Your own node

**Configuration:**

```env
# Use authenticated endpoints
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR-API-KEY
```

### API Key Protection

- Use different API keys for different environments
- Rotate API keys regularly
- Monitor API key usage
- Set spending limits when available

## Smart Contract Security

### Pre-Deployment Checklist

- [ ] Code reviewed by multiple developers
- [ ] Tested extensively on testnets
- [ ] Parameters validated
- [ ] Fee mechanism tested
- [ ] Contract verified on block explorer
- [ ] Consider professional audit for large deployments

### Fee Collector Address

> [!IMPORTANT]
> The fee collector address is **immutable** after deployment on EVM.

**Verification:**

```typescript
// Before deployment, verify the fee collector address
const feeCollector = process.env.FEE_COLLECTOR_EVM;
console.log("Fee collector:", feeCollector);
// Double-check this is YOUR address
```

**Best Practices:**

1. Use a **multi-sig wallet** for fee collection
2. Test fee collection on testnet first
3. Have a plan for fee distribution
4. Document fee usage for transparency

### Ownership Management

**EVM Contracts:**

The deployed token includes ownership functions:

```solidity
function transferOwnership(address newOwner) external onlyOwner
function renounceOwnership() external onlyOwner
```

**Recommendations:**

1. **Transfer to multi-sig** after deployment
2. **Renounce ownership** if no admin functions needed
3. **Time-lock** critical functions
4. **Document** ownership transfer in README

## Deployment Security

### Pre-Deployment Verification

```typescript
// Verify all parameters before deployment
{
  network: 'sepolia',  // Start with testnet
  name: 'MyToken',
  symbol: 'MTK',
  decimals: 18,
  totalSupply: '1000000',
  privateKey: process.env.DEPLOYER_PRIVATE_KEY,
  feeCollector: process.env.FEE_COLLECTOR_EVM
}
```

### Testnet Testing Workflow

1. **Deploy on testnet** (Sepolia, BSC Testnet, Devnet)
2. **Test all functions**:
   - Transfer
   - Fee collection
   - Approve/TransferFrom
   - Ownership functions
3. **Verify contract** on block explorer
4. **Review gas costs**
5. **Only then deploy on mainnet**

### Mainnet Deployment

> [!WARNING]
> Mainnet deployments are **permanent** and **irreversible**.

**Checklist:**

- [ ] Tested on testnet
- [ ] All parameters validated
- [ ] Fee collector address verified
- [ ] Sufficient balance for gas
- [ ] Contract code reviewed
- [ ] Team notified
- [ ] Block explorer verification planned

## Operational Security

### Access Control

**Limit Access:**

1. Only necessary personnel have deployment keys
2. Use role-based access control
3. Audit all deployments
4. Log all administrative actions

### Monitoring

**Set Up Alerts:**

```javascript
// Monitor fee collection
// Monitor large transfers
// Monitor ownership changes
```

**Tools:**

- Etherscan/BscScan alerts
- On-chain analytics (Dune, Nansen)
- Custom monitoring scripts

### Incident Response

**Prepare for:**

1. **Leaked private key**
   - Immediately transfer funds to new wallet
   - Transfer token ownership if possible
   - Notify users

2. **Contract vulnerability**
   - Pause contract if possible
   - Notify users immediately
   - Prepare migration plan

3. **Fee collector compromise**
   - Change fee collector (if contract allows)
   - Notify users
   - Secure new collector address

## Auditing

### When to Audit

**Required:**

- Mainnet deployments with significant funds
- Public token sales
- Tokens with novel mechanisms

**Recommended:**

- Any production deployment
- Modifications to standard contracts
- Complex tokenomics

### Audit Providers

- CertiK
- OpenZeppelin
- Trail of Bits
- Quantstamp
- Hacken

**Budget:**

- Simple ERC-20: $5,000 - $15,000
- Complex tokens: $15,000 - $50,000+

## Compliance

### Legal Considerations

> [!WARNING]
> This plugin is a tool. **You** are responsible for legal compliance.

**Consider:**

1. **Securities laws** in your jurisdiction
2. **KYC/AML** requirements
3. **Tax implications**
4. **Consumer protection** laws
5. **Fee disclosure** requirements

**Recommendations:**

- Consult legal counsel before token launch
- Clearly communicate fee structure
- Document tokenomics and fee usage
- Maintain compliance records

## Emergency Procedures

### Emergency Contacts

Prepare a list of:

- Team members with deployment access
- Security auditors
- Legal counsel
- Community managers

### Emergency Actions

**If Private Key Compromised:**

```bash
# Immediate actions:
# 1. Transfer all funds from compromised wallet
# 2. Transfer token ownership if possible
# 3. Notify team
# 4. Notify users if necessary
# 5. Investigate how compromise occurred
```

**If Contract Vulnerability Found:**

```bash
# 1. Assess severity
# 2. Pause contract if possible (requires pausable implementation)
# 3. Notify users
# 4. Prepare fix or migration
# 5. Coordinate with auditors
```

## Security Checklist

Before deploying to mainnet:

- [ ] Private keys stored securely
- [ ] Environment variables configured correctly
- [ ] Fee collector address verified
- [ ] Tested on testnet
- [ ] Contract code reviewed
- [ ] Ownership plan documented
- [ ] Fee exclusions configured
- [ ] Multi-sig setup for critical functions
- [ ] Monitoring alerts configured
- [ ] Incident response plan prepared
- [ ] Legal compliance reviewed
- [ ] Audit completed (if needed)
- [ ] Team trained on security practices

## Resources

- [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/security)
- [Solidity Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Solana Security Best Practices](https://docs.solana.com/developing/programming-model/security-best-practices)
- [OWASP Smart Contract Top 10](https://owasp.org/www-project-smart-contract-top-10/)

## Reporting Vulnerabilities

If you discover a security vulnerability in this plugin:

1. **DO NOT** open a public issue
2. Email: [security@example.com](mailto:security@example.com)
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Disclaimer

This plugin is provided "as is" without warranty. Users are responsible for:

- Securing their private keys
- Testing thoroughly before mainnet deployment
- Understanding smart contract risks
- Complying with applicable laws
- Conducting security audits when appropriate

**Use at your own risk.**
