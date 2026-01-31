# OpenCoins Launchpad - Usage Guide

This guide provides detailed instructions on using the OpenCoins Launchpad MCP plugin with OpenCode.ai.

## Table of Contents

- [Getting Started](#getting-started)
- [EVM Token Deployment](#evm-token-deployment)
- [Solana Token Deployment](#solana-token-deployment)
- [Querying Token Information](#querying-token-information)
- [Example Workflows](#example-workflows)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

1. **OpenCode.ai installed** and configured
2. **Plugin installed** and added to OpenCode config
3. **Environment variables configured** in `.env` file
4. **Wallet setup**:
   - EVM: Private key with funds for gas
   - Solana: Keypair file with SOL for rent and fees

### Configuration Check

Before deploying, ensure your `.env` file is properly configured:

```env
FEE_COLLECTOR_EVM=0xYourAddress
FEE_COLLECTOR_SOLANA=YourSolanaAddress
```

## EVM Token Deployment

### Basic Deployment

**Prompt to OpenCode.ai:**

```
Deploy a token called "TestCoin" with symbol "TEST" and 1 million supply on Sepolia testnet
```

**The AI will:**

1. Use the `deploy-evm-token` tool
2. Validate all parameters
3. Deploy the contract
4. Return the token address and transaction details

### Advanced Deployment with Custom Parameters

**Prompt:**

```
Create an ERC-20 token:
- Name: "Premium Token"
- Symbol: "PREM"
- Decimals: 6
- Total Supply: 100,000,000
- Network: BSC Testnet
- Private Key: 0x...
```

### Supported EVM Networks

| Network      | Network ID | Use Case              |
| ------------ | ---------- | --------------------- |
| `ethereum`   | Mainnet    | Production deployment |
| `sepolia`    | Testnet    | Testing               |
| `bsc`        | Mainnet    | Production on BSC     |
| `bscTestnet` | Testnet    | BSC testing           |
| `polygon`    | Mainnet    | Production on Polygon |
| `mumbai`     | Testnet    | Polygon testing       |
| `arbitrum`   | Mainnet    | L2 production         |
| `optimism`   | Mainnet    | L2 production         |
| `base`       | Mainnet    | Base production       |

### Gas Estimation

The plugin automatically estimates gas for deployments. For custom gas settings, you'll need to:

1. Test on testnet first
2. Monitor gas prices on mainnet
3. Ensure sufficient balance for deployment

**Typical Gas Costs (approximate):**

- Ethereum: 2-5M gas (~$50-200 depending on gas price)
- BSC: 2-5M gas (~$1-5)
- Polygon: 2-5M gas (~$0.10-1)

## Solana Token Deployment

### Basic Deployment

**Prompt:**

```
Deploy a Solana token named "SolTest" with symbol "SOLT" and 1 million supply on devnet
```

### Getting Your Keypair

Solana deployment requires your keypair in JSON format:

```bash
# View your keypair
cat ~/.config/solana/id.json
```

This will show something like:

```json
[123,45,67,89,...]
```

Copy this entire array and use it as the `keypair` parameter.

### Example with Metadata

**Prompt:**

```
Create a Solana token:
- Name: "My NFT Token"
- Symbol: "MNFT"
- Decimals: 0
- Supply: 10000
- Network: mainnet
- Keypair: [paste your keypair array]
- Metadata URI: https://arweave.net/your-metadata-hash
```

### Token-2022 Features

The plugin uses Solana's Token-2022 program which includes:

- **Transfer Fees**: Automatic 1% fee on transfers
- **Fee Withdrawal**: Collect accumulated fees to your wallet
- **Modern Standard**: Latest Solana token standard

### SOL Requirements

For Solana deployments, ensure you have:

- **Devnet**: ~0.5 SOL (get from faucet)
- **Mainnet**: ~0.01 SOL for rent + fees

**Get Devnet SOL:**

```bash
solana airdrop 2 --url devnet
```

## Querying Token Information

### Check EVM Token

**Prompt:**

```
Show me information about the token at 0x1234... on Ethereum
```

**Returns:**

- Token name and symbol
- Decimals
- Total supply
- Fee collector address
- Block explorer link

### Check Solana Token

**Prompt:**

```
Get info for the Solana token at ABC123... on mainnet
```

## Example Workflows

### Workflow 1: Create and Verify on Testnet

```
1. Deploy token on Sepolia
   "Deploy TestToken (TST) with 1000000 supply on Sepolia"

2. Wait for confirmation

3. Get token info
   "Show me info for token 0x... on Sepolia"

4. Verify on block explorer
   "Open the block explorer link"
```

### Workflow 2: Multi-Chain Deployment

```
1. Deploy on BSC testnet first
   "Create MyToken (MTK) with 10M supply on BSC testnet"

2. Test transfers and fees

3. Deploy on BSC mainnet
   "Deploy the same token on BSC mainnet with my key 0x..."

4. Deploy on Polygon
   "Deploy MTK on Polygon mainnet"
```

### Workflow 3: Launchpad Setup

```
1. Deploy token on mainnet
   "Deploy LaunchToken (LNCH) with 100M supply on Ethereum"

2. Set up liquidity pool (manual)

3. Exclude pool from fees
   "I need to exclude address 0xpool... from fees"

4. Configure marketing wallets (manual)

5. Launch marketing campaign
```

## Troubleshooting

### Common Issues

#### "Insufficient balance for deployment"

**Solution:**

- Ensure your wallet has enough native currency (ETH, BNB, SOL)
- Check gas prices and increase balance

#### "Invalid private key"

**Solution:**

- Ensure private key includes `0x` prefix for EVM
- Ensure keypair is valid JSON array for Solana
- Check for extra spaces or line breaks

#### "Fee collector not set"

**Solution:**

- Add `FEE_COLLECTOR_EVM` or `FEE_COLLECTOR_SOLANA` to `.env`
- Or provide `feeCollector` parameter in tool call

#### "Network not supported"

**Solution:**

- Check available networks in README
- Ensure network name is lowercase
- Verify RPC endpoint is accessible

#### "Transaction failed"

**Solutions:**

- **EVM**: Check gas price, nonce, and balance
- **Solana**: Ensure sufficient SOL for rent
- Check network status on status pages
- Try again with higher gas price

### Debug Mode

Enable detailed logging:

```env
LOG_LEVEL=debug
```

This will show:

- Network connections
- Parameter validation
- Transaction details
- Error stack traces

### Testing Deployments

Always test on testnets first:

1. **Sepolia** (Ethereum) - Get test ETH from faucet
2. **BSC Testnet** - Get test BNB from faucet
3. **Solana Devnet** - Use `solana airdrop`

### Getting Help

If you encounter issues:

1. Check the logs in OpenCode.ai
2. Review transaction on block explorer
3. Verify all parameters are correct
4. Check GitHub issues for similar problems
5. Create a new issue with:
   - Network used
   - Parameters provided
   - Error message
   - Transaction hash (if available)

## Best Practices

### Security

✅ **DO:**

- Test on testnets first
- Use hardware wallets for large deployments
- Keep private keys secure
- Audit contracts before mainnet

❌ **DON'T:**

- Commit `.env` files to git
- Share private keys
- Deploy without testing
- Skip parameter validation

### Token Economics

When designing your token:

1. **Consider the 1% fee** in your tokenomics
2. **Exclude necessary addresses** (DEX pools, staking contracts)
3. **Communicate fees clearly** to holders
4. **Plan fee usage** (burns, rewards, development)

### Gas Optimization

- Deploy during low gas periods
- Use L2s (Arbitrum, Optimism) for lower costs
- Batch multiple operations when possible
- Monitor gas prices before deployment

## Next Steps

After successful deployment:

1. **Verify contract** on block explorer
2. **Add liquidity** to DEX
3. **Set up token website**
4. **Configure fee exclusions** if needed
5. **Launch marketing**

For more information:

- [Security Best Practices](SECURITY.md)
- [Smart Contract Documentation](CONTRACTS.md)
