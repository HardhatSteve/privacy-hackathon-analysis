# 🚀 Using the Interactive Token Launch Wizard

## Quick Start

Simply tell the AI you want to launch a token:

```
"I want to launch a token"
"Help me deploy a token"
"Use the token wizard"
```

That's it! The wizard will guide you through everything.

## The 7-Step Process

### Step 1: Choose Blockchain

```
🚀 Welcome to OpenCoins Launchpad!

Which blockchain do you want to use?
- Type "evm" for Ethereum, BSC, Polygon, Arbitrum, etc.
- Type "solana" for Solana
```

**You respond:** `evm` or `solana`

---

### Step 2: Select Network

```
Available networks:
  - ethereum
  - sepolia
  - bsc
  - polygon
  - arbitrum
  ...

Which network?
```

**You respond:** `sepolia` (for testing) or `ethereum` (for mainnet)

---

### Step 3: Token Name

```
What's your token's full name?
Examples: "My Awesome Token", "SuperCoin"
```

**You respond:** `My Awesome Token`

---

### Step 4: Token Symbol

```
What's your token symbol (ticker)?
Examples: "MAT", "SUPER"
- Usually 3-5 characters
- UPPERCASE only
```

**You respond:** `MAT`

---

### Step 5: Decimals

```
How many decimal places?
Most EVM tokens use 18 decimals

Recommended: 18
```

**You respond:** `18`

---

### Step 6: Total Supply

```
How many tokens do you want to create?
Examples: "1000000" (1 million), "1000000000" (1 billion)

⚠️ This CANNOT be changed after deployment!
```

**You respond:** `1000000`

---

### Step 7: Credentials

**For EVM:**

```
I need your private key to deploy the contract.

⚠️ SECURITY WARNING:
- Your key is used ONLY for this deployment
- It's NOT stored anywhere

Format: 0x...

Paste your private key:
```

**For Solana:**

```
I need your Solana keypair in JSON format.

Find it at: ~/.config/solana/id.json

Format: [1,2,3,...]

Paste your keypair:
```

**You respond:** Your private key or keypair

---

## Success! 🎉

After all steps, you get:

```
🎉 TOKEN DEPLOYED SUCCESSFULLY! 🎉

Your token My Awesome Token (MAT) is now live on Sepolia Testnet!

📋 DEPLOYMENT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Contract Address:
   0x1234567890abcdef...

📝 Transaction Hash:
   0xabcdef123456...

🌐 Network: Sepolia Testnet

👤 Deployer: 0x...

🔗 View on Block Explorer:
   https://sepolia.etherscan.io/address/0x1234...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ LAUNCHPAD SERVICE FEE:
1% of all token transfers will go to:
0x[launchpad address]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 NEXT STEPS:
1. ✅ Verify contract on block explorer
2. ✅ Add token to MetaMask
3. ✅ Set up liquidity (if creating DEX token)
4. ✅ Announce to your community!

🎊 Congratulations on your token launch!
```

## Real Conversation Example

**You:** "I want to launch a token"

**AI:** 🚀 Welcome! Which blockchain? Type "evm" or "solana"

**You:** "evm"

**AI:** ✅ Great! Which network? Available: ethereum, sepolia, bsc, polygon...

**You:** "sepolia"

**AI:** ✅ Network: sepolia. What's your token's full name?

**You:** "Test Token"

**AI:** ✅ Token Name: Test Token. What's your token symbol?

**You:** "TEST"

**AI:** ✅ Symbol: TEST. How many decimals? Recommended: 18

**You:** "18"

**AI:** ✅ Decimals: 18. How many tokens to create?

**You:** "1000000"

**AI:** ✅ Supply: 1000000. I need your private key...

**You:** "0x..."

**AI:** 🎉 TOKEN DEPLOYED! Address: 0x1234... Explorer: https://sepolia.etherscan.io/...

## Features

✅ **Step-by-step guidance** - Never feel lost
✅ **Smart defaults** - Recommends best values
✅ **Validation** - Catches errors early
✅ **Security warnings** - Clear about sensitive data
✅ **Helpful tips** - Explains each choice
✅ **Direct deployment** - Deploys to blockchain automatically
✅ **Complete info** - Contract address + explorer link
✅ **Professional output** - Formatted results

## Tips for Best Experience

### Testing First

Always test on testnet before mainnet:

- **EVM**: Use `sepolia` (get free ETH from faucet)
- **Solana**: Use `devnet` (get free SOL with `solana airdrop`)

### Security

- ✅ Use a dedicated deployment wallet
- ✅ Only fund it with necessary gas
- ✅ Never share private keys
- ❌ Don't use your main wallet

### Common Issues

**"Insufficient funds"**

- Make sure your wallet has native currency (ETH, SOL, etc.)
- Check gas prices and ensure enough for deployment

**"Invalid private key"**

- EVM: Must start with `0x` and be 64 characters
- Solana: Must be valid JSON array from keypair file

**"Network connection failed"**

- Check your internet connection
- Try again in a moment
- Consider using a different RPC (check .env.example)

## What Makes This Different?

### vs Direct Tools

- **Wizard**: Asks each question separately, validates immediately
- **Direct**: Requires all parameters at once, errors at end

### vs Manual Deployment

- **Wizard**: Guides you through everything
- **Manual**: Need to know Solidity/Rust, compile contracts, use CLI tools

### vs Other Launchpads

- **OpenCoins**: AI-powered, conversational, integrated in your dev environment
- **Others**: Separate websites, manual forms, less guidance

## Advanced: Resume After Error

If deployment fails, you can provide just the missing info:

```
"Launch token with blockchain=evm network=sepolia name=MyToken symbol=MTK decimals=18 supply=1000000 credentials=0x..."
```

The wizard is smart enough to skip already-provided parameters!

## Multi-language Support

The wizard works in any language OpenCode.ai supports. Just talk naturally:

- English: "I want to launch a token"
- Spanish: "Quiero lanzar un token"
- Portuguese: "Quero lançar um token"

The AI will guide you in your language!

## Next Steps After Launch

1. **Verify Contract** - Click the block explorer link
2. **Add to Wallet** - Import using contract address
3. **Test Transfers** - Send to another wallet, verify 1% fee works
4. **Set Up Liquidity** - If creating a DEX token, add to Uniswap/Raydium
5. **Market Your Token** - Announce on social media, Discord, Telegram

## Support

If you encounter issues:

- Check the troubleshooting section above
- Review [SECURITY.md](SECURITY.md) for security questions
- See [README.md](../README.md) for general plugin info
- Report bugs on GitHub Issues

---

**Ready to launch?** Just say: `"I want to launch a token"` 🚀
