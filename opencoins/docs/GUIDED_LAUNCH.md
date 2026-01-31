# 🚀 Using the Guided Token Launch Wizard

## Overview

The **Guided Launch** tool is an interactive wizard that walks you through the entire token deployment process step by step. Perfect for beginners or anyone who wants a conversational, guided experience!

## How to Use

### Option 1: Simple Natural Language (Recommended)

Just tell the AI you want to launch a token:

```
"I want to launch a token"
"Help me create a new token"
"Start the token deployment wizard"
```

The AI will automatically use the `guided-launch` tool and guide you through the process!

### Option 2: Direct Tool Call

If you prefer to be explicit:

```
Use the guided-launch tool to start
```

## The Wizard Flow

### Step 1: Choose Blockchain

```
🚀 Welcome to OpenCoins Launchpad!

Which blockchain do you want to deploy on?
- Type "evm" for Ethereum, BSC, Polygon, Arbitrum, etc.
- Type "solana" for Solana
```

**You respond:** `evm` or `solana`

---

### Step 2: Select Network

```
Available EVM networks:
  - ethereum
  - sepolia
  - bsc
  - polygon
  - ...

💡 Tip: Start with a testnet (sepolia, devnet) to test before mainnet.

Which network?
```

**You respond:** `sepolia` (for testing) or `ethereum` (for production)

---

### Step 3: Token Name

```
What's your token name? (e.g., "My Awesome Token")

This is the full name that will appear in wallets and explorers.
```

**You respond:** `My Awesome Token`

---

### Step 4: Token Symbol

```
What's your token symbol? (e.g., "MAT")

- Must be UPPERCASE
- Usually 3-5 characters
```

**You respond:** `MAT`

---

### Step 5: Decimals

```
How many decimals should your token have?

- Most EVM tokens use 18
- Decimals determine the smallest unit (like cents for dollars)

Recommended: 18
```

**You respond:** `18`

---

### Step 6: Total Supply

```
How many tokens do you want to create in total?

💡 Tip: Consider your tokenomics carefully. This cannot be changed after deployment!
```

**You respond:** `1000000` (for 1 million tokens)

---

### Step 7: Deployment Credentials

**For EVM:**

```
For sepolia, I need your PRIVATE KEY to deploy the contract.

⚠️ SECURITY WARNING:
- Your private key will be used ONLY to deploy the contract
- It's NOT stored anywhere

Paste your private key (with 0x prefix):
```

**You respond:** `0x...your private key...`

**For Solana:**

```
For Solana, I need your KEYPAIR in JSON format.

You can find it at: ~/.config/solana/id.json
Copy the entire JSON array (looks like [1,2,3,...])
```

**You respond:** `[1,2,3,4,...]` (your keypair array)

---

### Step 8: Review & Deploy

```
📋 **DEPLOYMENT SUMMARY**

Blockchain: EVM
Network: sepolia
Token Name: My Awesome Token
Token Symbol: MAT
Decimals: 18
Total Supply: 1000000

⚠️ LAUNCHPAD SERVICE FEE:
1% of all token transfers will go to [plugin creator address]

Everything looks good? Ready to deploy to blockchain!

Type "deploy" to launch your token! 🚀
```

**You respond:** `deploy`

---

### 🎉 Success!

```
🎉 TOKEN LAUNCHED SUCCESSFULLY! 🎉

Your token My Awesome Token (MAT) is now live on Sepolia Testnet!

📋 **DEPLOYMENT DETAILS**
Token Address: 0x1234...
Transaction: 0xabcd...
Network: Sepolia Testnet

🔗 View on Explorer: https://sepolia.etherscan.io/address/0x1234...

⚠️ Service Fee: 1% of transfers → [plugin creator address]

🎊 Congratulations on your token launch!
```

## Example Conversation

Here's a complete example of how the conversation looks:

**You:** "I want to launch a token"

**AI:** 🚀 Welcome to OpenCoins Launchpad! Which blockchain? Type "evm" or "solana"

**You:** "evm"

**AI:** Great! Which network? Available: ethereum, sepolia, bsc, polygon...

**You:** "sepolia"

**AI:** Perfect! What's your token name?

**You:** "Test Token"

**AI:** ✅ Token name: "Test Token". What's your token symbol?

**You:** "TEST"

**AI:** ✅ Symbol: TEST. How many decimals?

**You:** "18"

**AI:** ✅ Decimals: 18. Total supply?

**You:** "1000000"

**AI:** ✅ Total supply: 1000000. I need your private key...

**You:** "0x..."

**AI:** ✅ Everything ready! Type "deploy" to launch!

**You:** "deploy"

**AI:** 🎉 TOKEN LAUNCHED! Address: 0x1234...

## Features

✅ **Beginner Friendly**: No need to know all parameters upfront
✅ **Step-by-Step**: One question at a time
✅ **Validation**: Each input is validated immediately
✅ **Helpful Tips**: Get guidance at each step
✅ **Smart Defaults**: Suggests recommended values
✅ **Security Warnings**: Clear warnings about private keys
✅ **Direct Deployment**: Deploys to blockchain automatically
✅ **Transaction Details**: Get complete deployment info

## Safety Tips

### Testing First

Always test on testnet before mainnet:

1. Use `sepolia` for EVM testing (get free test ETH from faucet)
2. Use `devnet` for Solana testing (get free SOL with `solana airdrop`)

### Private Key Security

- ✅ Use a dedicated deployment wallet
- ✅ Only fund it with necessary gas fees
- ✅ Never share private keys publicly
- ❌ Don't use your main wallet for deployment

### Common Mistakes to Avoid

1. **Wrong network**: Make sure you're on testnet for testing!
2. **Insufficient gas**: Ensure your wallet has native currency
3. **Total supply too large**: Keep it reasonable (< 1 trillion)
4. **Wrong decimals**: Most tokens use 18 (EVM) or 9 (Solana)

## What Happens Behind the Scenes

1. **Validation**: Each answer is validated immediately
2. **State Management**: The wizard remembers all your answers
3. **Smart Contract Compilation**: Contract is prepared with your parameters
4. **Blockchain Deployment**: Transaction is sent to the network
5. **Confirmation**: Waits for blockchain confirmation
6. **Results**: Returns all deployment details

## Comparison: Wizard vs Direct Tools

| Feature          | Guided Wizard | Direct Tools       |
| ---------------- | ------------- | ------------------ |
| **Ease of Use**  | Very Easy     | Requires knowledge |
| **Step-by-Step** | Yes           | No                 |
| **Validation**   | Immediate     | At deployment      |
| **Learning**     | Educational   | Quick              |
| **Best For**     | Beginners     | Advanced users     |

## Getting Help

If something goes wrong:

1. **Read the error message** - it usually explains the problem
2. **Start over** - type "I want to launch a token" again
3. **Check wallet balance** - ensure you have gas fees
4. **Use testnet first** - always test before mainnet
5. **Check documentation** - see README.md and docs/

## Next Steps After Launch

Once your token is deployed:

1. ✅ **Verify contract** on block explorer
2. ✅ **Add liquidity** to a DEX (if creating a trading token)
3. ✅ **Set up token website**
4. ✅ **Announce to community**
5. ✅ **Monitor transactions** and fee collection

Remember: The 1% service fee is your payment for using this launchpad service. It's built into every token deployed through this wizard!
