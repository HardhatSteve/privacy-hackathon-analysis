# 🚀 CONFIGURATION INSTRUCTIONS

## For Plugin Creator (You)

**IMPORTANT**: Before distributing this plugin, you MUST configure your wallet addresses:

1. Open `src/config.ts`
2. Replace the placeholder addresses with YOUR real addresses:

```typescript
export const PLUGIN_CONFIG = {
  // ⚠️ REPLACE THESE WITH YOUR ACTUAL ADDRESSES ⚠️
  FEE_COLLECTOR_EVM: "0xYourEvmWalletAddress", // Your Ethereum/BSC/Polygon address
  FEE_COLLECTOR_SOLANA: "YourSolanaWalletAddress", // Your Solana address

  PLUGIN_NAME: "OpenCoins Launchpad",
  PLUGIN_VERSION: "1.0.0",
  FEE_PERCENTAGE: 1, // 1% service fee

  SUPPORT_URL: "https://github.com/yourusername/opencoins_mcp",
  DOCUMENTATION_URL: "https://github.com/yourusername/opencoins_mcp/docs",
} as const;
```

3. Build the plugin:

```bash
npm run build
```

## How the Launchpad Works

### Business Model

**You provide a token deployment service**. Users use your plugin to deploy tokens easily through OpenCode.ai, and in exchange:

1. **Every token deployed** through your plugin automatically includes a 1% transfer fee
2. **The 1% goes to YOUR wallet addresses** (configured above)
3. **Users CANNOT change this** - the fee addresses are hardcoded in the compiled plugin
4. **This is disclosed** to users in the tool descriptions and documentation

### Revenue Generation

For each token deployed:

- ✅ Users get: Easy AI-assisted deployment, professional smart contracts, multi-chain support
- ✅ You get: 1% of every transfer of every token deployed through your service
- ✅ Win-win: Users save time and get quality, you get paid for providing infrastructure

### Example Revenue

If someone deploys a token with:

- 1,000,000 total supply
- 10,000 transfers per month
- Average transfer size: 1,000 tokens

**Your monthly fee collection**: ~100,000 tokens (1% of 10M transferred)

If the token has value, this becomes recurring passive income!

## For Plugin Users

**Users DON'T need to configure anything**:

- Fee collector addresses are already set (by you)
- They just install the plugin and start deploying tokens
- They know upfront that 1% goes to the launchpad service (disclosed in tool descriptions)
- This is their payment for using your professional launchpad service

## Security Notes

### Keep Your Addresses Safe

- ✅ Hardcode addresses in `src/config.ts`
- ✅ Build and distribute the compiled version
- ✅ Don't share your private keys
- ✅ Test on testnets first
- ❌ Don't commit `.env` files with private keys

### Multi-Sig Recommended

For production, consider using multi-signature wallets:

- **EVM**: Use Gnosis Safe or similar
- **Solana**: Use Squads or similar

This adds security for your fee collection addresses.

## Next Steps

1. **Configure your addresses** in `src/config.ts`
2. **Test on testnets** (Sepolia, Devnet)
3. **Deploy a test token** and verify fees work
4. **Build for distribution**: `npm run build`
5. **Share with users** or publish to npm
6. **Collect fees** from every token deployed! 🎉

## Support

For questions about configuring the plugin:

- Check `docs/` folder for detailed documentation
- Review `README.md` for usage instructions
- Update SUPPORT_URL in config to your support channel
