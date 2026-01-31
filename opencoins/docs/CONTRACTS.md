# Smart Contract Documentation

This document provides detailed information about the smart contracts used in the OpenCoins Launchpad MCP plugin.

## Overview

The plugin deploys tokens with built-in fee mechanisms:

- **EVM**: Custom ERC-20 contract with 1% transfer fee
- **Solana**: Token-2022 with Transfer Fee Extension

## EVM Contract: LaunchpadToken

### Contract Details

- **Standard**: ERC-20 compatible
- **Solidity Version**: ^0.8.20
- **Fee Mechanism**: 1% on transfers
- **License**: MIT

### Features

✅ **ERC-20 Compliance**

- Standard `transfer`, `approve`, `transferFrom` functions
- Emission of `Transfer` and `Approval` events
- Full compatibility with wallets and DEXs

✅ **Automated Fee Collection**

- 1% fee automatically deducted on transfers
- Fees sent directly to immutable fee collector address
- Additional `FeeCollected` event for tracking

✅ **Fee Exclusions**

- Owner can exclude addresses from fees
- Fee collector and deployer excluded by default
- Useful for liquidity pools and protocol contracts

✅ **Ownership Management**

- Transfer ownership to new address
- Renounce ownership for true decentralization
- Owner-only functions for fee exclusion management

### Contract Architecture

```solidity
contract LaunchpadToken {
    // State Variables
    string public name;              // Token name
    string public symbol;            // Token symbol
    uint8 public decimals;           // Usually 18
    uint256 public totalSupply;      // Total token supply
    address public immutable feeCollector;  // Fee recipient (immutable)
    address public owner;            // Contract owner

    // Mappings
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public isExcludedFromFee;

    // Constants
    uint256 public constant FEE_PERCENTAGE = 1;
    uint256 public constant FEE_DENOMINATOR = 100;
}
```

### Function Reference

#### Core ERC-20 Functions

**transfer**

```solidity
function transfer(address to, uint256 value) public returns (bool)
```

- Transfers tokens with 1% fee deduction
- Emits `Transfer` event for amount received
- Emits additional `Transfer` and `FeeCollected` events for fee

**approve**

```solidity
function approve(address spender, uint256 value) public returns (bool)
```

- Standard ERC-20 approval function
- No fee on approval

**transferFrom**

```solidity
function transferFrom(address from, address to, uint256 value) public returns (bool)
```

- Transfers tokens on behalf of another address
- Applies 1% fee (if not excluded)
- Requires sufficient allowance

#### Owner Functions

**setFeeExclusion**

```solidity
function setFeeExclusion(address account, bool excluded) external onlyOwner
```

- Exclude or include an address from fees
- Useful for:
  - DEX liquidity pools
  - Staking contracts
  - Vesting contracts
  - Team wallets (if desired)

**transferOwnership**

```solidity
function transferOwnership(address newOwner) external onlyOwner
```

- Transfer contract ownership
- New owner can manage fee exclusions

**renounceOwnership**

```solidity
function renounceOwnership() external onlyOwner
```

- Permanently remove owner
- Makes contract fully decentralized
- **Warning**: Cannot be reversed

### Fee Mechanism

#### How It Works

1. User initiates transfer of 100 tokens
2. Contract calculates fee: 100 \* 1 / 100 = 1 token
3. Recipient receives: 100 - 1 = 99 tokens
4. Fee collector receives: 1 token
5. Events emitted:
   - `Transfer(sender, recipient, 99)`
   - `Transfer(sender, feeCollector, 1)`
   - `FeeCollected(sender, feeCollector, 1)`

#### Fee Calculation

```solidity
uint256 fee = (value * FEE_PERCENTAGE) / FEE_DENOMINATOR;
uint256 amountAfterFee = value - fee;
```

#### Fee Exclusion Logic

```solidity
if (!isExcludedFromFee[from] && !isExcludedFromFee[to]) {
    fee = (value * FEE_PERCENTAGE) / FEE_DENOMINATOR;
    amountAfterFee = value - fee;
}
```

**Excluded automatically:**

- Fee collector address
- Deployer address

### Events

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
event Approval(address indexed owner, address indexed spender, uint256 value);
event FeeCollected(address indexed from, address indexed to, uint256 amount);
event ExcludedFromFee(address indexed account, bool isExcluded);
```

### Security Considerations

#### Immutable Fee Collector

> [!WARNING]
> The fee collector address **CANNOT be changed** after deployment.

**Recommendation**: Use a multi-sig wallet or DAO treasury as fee collector.

#### Integer Overflow Protection

Solidity 0.8+ includes built-in overflow protection. All arithmetic operations are safe.

#### Reentrancy

The contract follows checks-effects-interactions pattern and is not vulnerable to reentrancy attacks.

#### Front-Running

Fee is constant (1%), so front-running has minimal impact. No AMM-style slippage.

### Gas Costs

Approximate gas usage (vary by network conditions):

| Operation           | Gas Used   | Cost @ 50 gwei | Cost @ 100 gwei |
| ------------------- | ---------- | -------------- | --------------- |
| Deployment          | ~1,200,000 | ~0.06 ETH      | ~0.12 ETH       |
| Transfer (with fee) | ~65,000    | ~0.00325 ETH   | ~0.0065 ETH     |
| Transfer (excluded) | ~52,000    | ~0.0026 ETH    | ~0.0052 ETH     |
| Approve             | ~45,000    | ~0.00225 ETH   | ~0.0045 ETH     |
| setFeeExclusion     | ~30,000    | ~0.0015 ETH    | ~0.003 ETH      |

### Verification

After deployment, verify your contract on block explorers:

**Etherscan:**

```bash
# Using Hardhat
npx hardhat verify --network mainnet DEPLOYED_ADDRESS "TokenName" "SYMBOL" 18 1000000000000000000 0xFeeCollector

# Or use the block explorer UI
```

**Verification Parameters:**

- Compiler version: 0.8.20
- Optimization: Yes (200 runs)
- Constructor arguments (ABI-encoded)

## Solana: Token-2022 with Transfer Fee

### Overview

Solana tokens use the Token-2022 program (next-gen SPL Token) with the Transfer Fee Extension.

### Features

✅ **Transfer Fee Extension**

- Built into the token at creation
- Cannot be removed or modified
- 1% (100 basis points) fee

✅ **Withheld Fees**

- Fees are "withheld" in token accounts
- Fee collector can withdraw accumulated fees
- Transparent on-chain tracking

✅ **Standard Compliance**

- Works with all Solana wallets
- Compatible with DEXs and DeFi protocols
- Follows SPL Token-2022 specification

### Token Configuration

```typescript
{
  // Token-2022 Program
  programId: TOKEN_2022_PROGRAM_ID,

  // Transfer Fee Config
  transferFeeConfigAuthority: feeCollectorPubkey,
  withdrawWithheldAuthority: feeCollectorPubkey,
  transferFeeBasisPoints: 100,  // 1%
  maximumFee: 10^decimals,       // Max fee per transaction
}
```

### Fee Mechanism

#### How It Works

1. User transfers 100 tokens
2. Fee withheld: 100 \* 100 / 10000 = 1 token
3. Recipient receives: 99 tokens (available)
4. Withheld account holds: 1 token (for fee collector)
5. Fee collector withdraws accumulated fees periodically

#### Withdrawing Fees

The fee collector must manually withdraw withheld fees:

```typescript
import { withdrawWithheldTokensFromAccounts } from '@solana/spl-token';

await withdrawWithheldTokensFromAccounts(
  connection,
  payer,
  mint,
  feeCollectorTokenAccount,
  feeCollectorAuthority,
  [],
  [sourceAccount1, sourceAccount2, ...]
);
```

### Extensions Used

```typescript
[ExtensionType.TransferFeeConfig];
```

Additional extensions can be added:

- `MetadataPointer`: For on-chain metadata
- `MintCloseAuthority`: Allow closing the mint
- `TransferHook`: Custom transfer logic

### Program Addresses

- **Token Program**: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
- **Token-2022 Program**: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`

### Security Considerations

#### Immutable Configuration

Once deployed, the transfer fee configuration **cannot be changed**. This includes:

- Fee basis points (1%)
- Maximum fee
- Fee collector address (unless transferred by authority)

#### Authority Management

**Key Roles:**

- **Mint Authority**: Can mint new tokens
- **Transfer Fee Authority**: Can modify fee config (if not renounced)
- **Withdraw Withheld Authority**: Can withdraw fees

**Recommendation**: Use a multi-sig or DAO for authorities.

#### Account Rent

Solana requires rent for accounts. Ensure:

- Mint account is rent-exempt
- Token accounts are rent-exempt
- Budget for account creation costs

### Tools & Resources

**Solana Explorer:**

- Mainnet: https://explorer.solana.com
- Devnet: https://explorer.solana.com/?cluster=devnet

**Token Programs:**

- [SPL Token Documentation](https://spl.solana.com/token)
- [Token-2022 Extensions](https://spl.solana.com/token-2022)
- [Transfer Fee Extension Guide](https://spl.solana.com/token-2022/extensions#transfer-fee)

## Comparison: EVM vs Solana

| Feature             | EVM                    | Solana                    |
| ------------------- | ---------------------- | ------------------------- |
| **Fee Collection**  | Automatic on transfer  | Withheld, manual withdraw |
| **Fee Exclusion**   | Yes, owner can exclude | No native exclusion       |
| **Modifiable Fee**  | No (hardcoded 1%)      | No (set at creation)      |
| **Deployment Cost** | ~$50-200               | ~$0.01                    |
| **Transfer Cost**   | ~$1-10                 | ~$0.0001                  |
| **Finality**        | 12 seconds - 2 min     | ~400ms                    |
| **Standard**        | ERC-20                 | SPL Token-2022            |

## Testing Contracts

### EVM Testing

```bash
# Deploy to testnet
npm run deploy:testnet

# Test transfers
# Test fee collection
# Test exclusions
# Verify on block explorer
```

### Solana Testing

```bash
# Deploy to devnet
npm run deploy:solana:devnet

# Test transfers
# Test fee withheld
# Withdraw fees
# Verify on explorer
```

## Audit Recommendations

Before mainnet deployment:

1. **Code Review**: Have multiple developers review
2. **Static Analysis**: Use Slither, Mythril (EVM) or Anchor (Solana)
3. **Testing**: Achieve >90% code coverage
4. **Professional Audit**: For significant deployments
5. **Bug Bounty**: Consider post-launch bug bounty

## Support & Questions

For contract-specific questions:

- Review [Solidity documentation](https://docs.soliditylang.org/)
- Review [Solana documentation](https://docs.solana.com/)
- Check [OpenZeppelin contracts](https://docs.openzeppelin.com/contracts/)
- Ask in GitHub issues

## License

All contracts are provided under MIT License. You are free to modify and use them as needed, but:

> [!CAUTION]
> **You are responsible for auditing and securing your modifications.**

We recommend professional security audits before deploying to mainnet with real funds.
