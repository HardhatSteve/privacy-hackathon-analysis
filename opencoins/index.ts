import "dotenv/config";
import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import { Logger } from "./src/utils/logger.js";
import { EvmTokenFactory } from "./src/evm/token-factory.js";
import { SolanaTokenFactory } from "./src/solana/token-factory.js";
import { UniswapPoolManager } from "./src/evm/uniswap-pool.js";
import { RaydiumPoolManager } from "./src/solana/raydium-pool.js";
import { getAvailableNetworks } from "./src/evm/network-config.js";
import { getAvailableSolanaNetworks } from "./src/solana/network-config.js";
import { PLUGIN_CONFIG } from "./src/config.js";

/**
 * OpenCoins Launchpad Plugin
 * Deploy tokens on EVM and Solana with built-in 1% service fee
 */
export const OpenCoinsLaunchpad: Plugin = async (ctx) => {
  const logger = new Logger(ctx.client, "opencoins-launchpad");

  await logger.info("OpenCoins Launchpad initialized");

  const evmFactory = new EvmTokenFactory(logger);
  const solanaFactory = new SolanaTokenFactory(logger);
  const uniswapPoolManager = new UniswapPoolManager(logger);
  const raydiumPoolManager = new RaydiumPoolManager(logger);

  return {
    tool: {
      // Main wizard - guides users step by step
      "launch-token": tool({
        description: `🚀 Interactive Token Launch Wizard - Guides you through deploying your token step by step

This wizard will ask you:
1. Which blockchain (EVM or Solana)  
2. Which network (Ethereum, BSC, Polygon, Solana mainnet, etc.)
3. Token details (name, symbol, decimals, supply)
4. Deployment credentials

At the end, you'll get:
- Contract/Mint address
- Transaction hash
- Block explorer link

⚠️ Service Fee: ${PLUGIN_CONFIG.FEE_PERCENTAGE}% of all transfers goes to the launchpad service`,

        args: {
          blockchain: tool.schema.string().optional(), // 'evm' or 'solana'
          network: tool.schema.string().optional(),
          name: tool.schema.string().optional(),
          symbol: tool.schema.string().optional(),
          decimals: tool.schema.number().optional(),
          supply: tool.schema.string().optional(),
          credentials: tool.schema.string().optional(), // private key or keypair
          createPool: tool.schema.string().optional(), // 'yes' or 'no'
          solanaDex: tool.schema.string().optional(), // 'raydium', 'meteora', or 'jupiter'
          tokenForPool: tool.schema.string().optional(),
          baseForPool: tool.schema.string().optional(), // ETH or SOL amount
        },

        async execute(args) {
          // Guide through missing information
          if (!args.blockchain) {
            return `🚀 **Welcome to OpenCoins Launchpad!**

Let's deploy your token step by step.

**Step 1/7: Choose Blockchain**

Which blockchain do you want to use?
- Type **"evm"** for Ethereum, BSC, Polygon, Arbitrum, etc.
- Type **"solana"** for Solana

💡 Tip: EVM chains are more common, Solana has lower fees.`;
          }

          if (!args.network) {
            const networks =
              args.blockchain === "evm"
                ? getAvailableNetworks()
                : getAvailableSolanaNetworks();

            return `✅ Great! You chose **${args.blockchain.toUpperCase()}**

**Step 2/7: Choose Network**

Available networks:
${networks.map((n) => `  - ${n}`).join("\n")}

💡 Tip: Use **sepolia** (EVM) or **devnet** (Solana) for testing first!

Which network?`;
          }

          if (!args.name) {
            return `✅ Network: **${args.network}**

**Step 3/7: Token Name**

What's your token's full name?
Examples: "My Awesome Token", "SuperCoin", "Community Token"

This will appear in wallets and explorers.`;
          }

          if (!args.symbol) {
            return `✅ Token Name: **${args.name}**

**Step 4/7: Token Symbol**

What's your token symbol (ticker)?
Examples: "MAT", "SUPER", "COM"

- Usually 3-5 characters
- UPPERCASE only
- This is like "BTC" for Bitcoin

Your symbol?`;
          }

          if (args.decimals === undefined) {
            const defaultDecimals = args.blockchain === "evm" ? 18 : 9;
            return `✅ Symbol: **${args.symbol}**

**Step 5/7: Decimals**

How many decimal places for your token?

- Most ${args.blockchain === "evm" ? "EVM" : "Solana"} tokens use **${defaultDecimals}** decimals
- Decimals work like cents for dollars (1.00 = 1 dollar + 2 decimals)

💡 Recommended: **${defaultDecimals}**

Enter decimals (or press Enter for ${defaultDecimals}):`;
          }

          if (!args.supply) {
            return `✅ Decimals: **${args.decimals}**

**Step 6/7: Total Supply**

How many tokens do you want to create?
Examples: "1000000" (1 million), "1000000000" (1 billion)

⚠️ This CANNOT be changed after deployment!

💡 Tip: Consider your tokenomics carefully

Total supply?`;
          }

          if (!args.credentials) {
            if (args.blockchain === "evm") {
              return `✅ Supply: **${args.supply}** tokens

**Step 7/10: Deployment Credentials**

I need your **private key** to deploy the contract.

⚠️ **SECURITY WARNING:**
- Your key is used ONLY for this deployment
- It's NOT stored anywhere
- Make sure your wallet has ${args.network?.includes("test") || args.network === "sepolia" ? "test ETH" : "native currency"} for gas fees

Format: \`0x...\` (with 0x prefix)

Paste your private key:`;
            } else {
              return `✅ Supply: **${args.supply}** tokens

**Step 7/10: Deployment Credentials**

I need your **Solana keypair** in JSON format.

Find it at: \`~/.config/solana/id.json\`
Or use: \`solana address -k ~/.config/solana/id.json\`

⚠️ **SECURITY WARNING:**
- Your keypair is used ONLY for this deployment
- It's NOT stored anywhere
- Your wallet needs ~0.5 SOL for rent + deployment

Format: \`[1,2,3,...]\` (JSON array)

Paste your keypair:`;
            }
          }

          if (!args.createPool) {
            return `✅ Credentials received

**Step 8/10: Liquidity Pool Creation (Optional)**

Would you like to create a liquidity pool for your token?

💡 **Why create a pool?**
- Allows users to trade your token on DEXes
- Provides initial liquidity for price discovery
- Makes your token more accessible

${args.blockchain === "evm" ? "DEX: Uniswap V2 and compatible forks" : "DEX: Raydium, Meteora, or Jupiter (manual setup via UI)"}

⚠️ **Requirements:**
- Additional funds for liquidity (${args.blockchain === "evm" ? "ETH/BNB/MATIC" : "SOL"})
- You'll need some of your tokens

Do you want to create a liquidity pool?
Type **"yes"** or **"no"`;
          }

          if (args.createPool.toLowerCase() === "no") {
            // Skip pool creation, proceed to deployment
            args.createPool = "no";
          } else if (args.createPool.toLowerCase() === "yes") {
            // For Solana, ask which DEX to use
            if (args.blockchain === "solana" && !args.solanaDex) {
              return `✅ Great! Let's set up your liquidity pool.

**Step 8.5/10: Choose DEX (Solana)**

Which DEX would you like to use for your liquidity pool?

🔹 **Raydium** - Most popular, highest liquidity
   - Best for: Established tokens, high volume
   - Website: https://raydium.io/

🔹 **Meteora** - Dynamic liquidity pools
   - Best for: Flexible fee structures, dynamic pools
   - Website: https://meteora.ag/

🔹 **Jupiter** - Aggregator with pool creation
   - Best for: Best execution, multi-DEX exposure
   - Website: https://jup.ag/

💡 Tip: Raydium is recommended for most users

Which DEX? Type **"raydium"**, **"meteora"**, or **"jupiter"`;
            }
            if (!args.tokenForPool) {
              return `✅ Great! Let's set up your liquidity pool.

**Step 9/10: Token Amount for Pool**

How many tokens do you want to add to the liquidity pool?

Example: If you created 1,000,000 tokens, you might add 500,000 (50%) to the pool

💡 Tip: Common ranges are 30-70% of total supply

⚠️ These tokens will be locked in the pool for liquidity

Token amount for pool?`;
            }

            if (!args.baseForPool) {
              const baseCurrency = args.blockchain === "evm" ? "ETH" : "SOL";
              const currencyName =
                args.network === "bsc" || args.network === "bscTestnet"
                  ? "BNB"
                  : args.network === "polygon" || args.network === "mumbai"
                    ? "MATIC"
                    : baseCurrency;

              return `✅ Pool tokens: **${args.tokenForPool}**

**Step 10/10: ${currencyName} Amount for Pool**

How much ${currencyName} do you want to pair with your tokens?

Example: "0.5" for 0.5 ${currencyName}

💡 This determines the initial price of your token:
- More ${currencyName} = Higher initial price
- Less ${currencyName} = Lower initial price

⚠️ Make sure you have enough ${currencyName} in your wallet!

${currencyName} amount for pool?`;
            }
          }

          // All info collected - deploy!
          try {
            if (args.blockchain === "evm") {
              const result = await evmFactory.deployToken({
                network: args.network!,
                name: args.name!,
                symbol: args.symbol!,
                decimals: args.decimals!,
                totalSupply: args.supply!,
                privateKey: args.credentials!,
                feeCollector: PLUGIN_CONFIG.FEE_COLLECTOR_EVM,
              });

              let outputMessage = `🎉 **TOKEN DEPLOYED SUCCESSFULLY!** 🎉

Your token **${args.name} (${args.symbol})** is now live on **${result.network}**!

📋 **DEPLOYMENT DETAILS:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 **Contract Address:** 
   \`${result.tokenAddress}\`

📝 **Transaction Hash:** 
   \`${result.transactionHash}\`

🌐 **Network:** ${result.network}

👤 **Deployer:** \`${result.deployer}\`

🔗 **View on Block Explorer:**
   ${result.blockExplorer}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **LAUNCHPAD SERVICE FEE:**
${PLUGIN_CONFIG.FEE_PERCENTAGE}% of all token transfers will go to:
\`${PLUGIN_CONFIG.FEE_COLLECTOR_EVM}\`

This is the service fee for using OpenCoins Launchpad.`;

              // Create liquidity pool if requested
              if (
                args.createPool?.toLowerCase() === "yes" &&
                args.tokenForPool &&
                args.baseForPool
              ) {
                try {
                  await logger.info("Creating liquidity pool...");
                  const poolResult = await uniswapPoolManager.createPool({
                    tokenAddress: result.tokenAddress,
                    tokenAmount: args.tokenForPool,
                    ethAmount: args.baseForPool,
                    network: args.network!,
                    privateKey: args.credentials!,
                  });

                  outputMessage += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💧 **LIQUIDITY POOL CREATED!**

📍 **Pair Address:** 
   \`${poolResult.pairAddress}\`

📝 **Transaction:** 
   \`${poolResult.transactionHash}\`

💰 **Pool Composition:**
   - ${poolResult.tokenAmount} ${args.symbol}
   - ${poolResult.ethAmount} ${args.network === "bsc" || args.network === "bscTestnet" ? "BNB" : args.network === "polygon" || args.network === "mumbai" ? "MATIC" : "ETH"}

🔗 **View Pool:**
   ${poolResult.blockExplorer}

✅ Your token is now tradeable on DEXes!`;
                } catch (poolError) {
                  outputMessage += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **POOL CREATION FAILED**

Error: ${(poolError as Error).message}

Your token was deployed successfully, but the pool creation failed.
You can create the pool manually later using a DEX interface.`;
                }
              }

              outputMessage += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 **NEXT STEPS:**
1. ✅ Verify contract on block explorer
2. ✅ Add token to MetaMask/wallets
${args.createPool?.toLowerCase() === "yes" ? "3. ✅ Pool created - Token is tradeable!" : "3. ✅ Set up liquidity (if creating DEX token)"}
4. ✅ Announce to your community!

🎊 **Congratulations on your token launch!**`;

              return outputMessage;
            } else {
              const result = await solanaFactory.deployToken({
                network: args.network!,
                name: args.name!,
                symbol: args.symbol!,
                decimals: args.decimals!,
                supply: args.supply!,
                keypair: args.credentials!,
                feeCollector: PLUGIN_CONFIG.FEE_COLLECTOR_SOLANA,
              });

              let outputMessage = `🎉 **TOKEN DEPLOYED SUCCESSFULLY!** 🎉

Your token **${args.name} (${args.symbol})** is now live on **${result.network}**!

📋 **DEPLOYMENT DETAILS:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 **Mint Address:** 
   \`${result.mintAddress}\`

📝 **Transaction Signature:** 
   \`${result.transactionSignature}\`

🌐 **Network:** ${result.network}

👤 **Authority:** \`${result.authority}\`

🔗 **View on Solana Explorer:**
   ${result.blockExplorer}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **LAUNCHPAD SERVICE FEE:**
${PLUGIN_CONFIG.FEE_PERCENTAGE}% of all token transfers will go to:
\`${PLUGIN_CONFIG.FEE_COLLECTOR_SOLANA}\`

This is the service fee for using OpenCoins Launchpad.`;

              // DEX pool creation guidance for Solana
              if (
                args.createPool?.toLowerCase() === "yes" &&
                args.tokenForPool &&
                args.baseForPool
              ) {
                const dexName = args.solanaDex || "raydium";
                const dexUrls: Record<
                  string,
                  { mainnet: string; devnet: string; name: string }
                > = {
                  raydium: {
                    mainnet: "https://raydium.io/liquidity/create-pool/",
                    devnet: "https://raydium.io/",
                    name: "Raydium",
                  },
                  meteora: {
                    mainnet: "https://app.meteora.ag/pools/create",
                    devnet: "https://app.meteora.ag/",
                    name: "Meteora",
                  },
                  jupiter: {
                    mainnet: "https://jup.ag/",
                    devnet: "https://jup.ag/",
                    name: "Jupiter",
                  },
                };

                const selectedDex =
                  dexUrls[dexName.toLowerCase()] || dexUrls.raydium;
                const dexUrl =
                  args.network === "mainnet"
                    ? selectedDex.mainnet
                    : selectedDex.devnet;

                outputMessage += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💧 **${selectedDex.name.toUpperCase()} POOL - MANUAL SETUP REQUIRED**

⚠️ Automated ${selectedDex.name} pool creation requires complex setup.
Please create your pool manually using the ${selectedDex.name} UI:

🔗 **${selectedDex.name} Pool Creation:**
   ${dexUrl}

📝 **Your Pool Details:**
   - Token: \`${result.mintAddress}\`
   - Token Amount: ${args.tokenForPool} ${args.symbol}
   - SOL Amount: ${args.baseForPool} SOL

💡 Follow ${selectedDex.name}'s guide to complete pool creation.`;
              }

              outputMessage += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 **NEXT STEPS:**
1. ✅ Verify on Solana Explorer
2. ✅ Add token to Phantom/Solflare
${args.createPool?.toLowerCase() === "yes" ? "3. ✅ Create pool on Raydium UI" : "3. ✅ Set up on Raydium/Jupiter (if creating DEX token)"}
4. ✅ Announce to your community!

🎊 **Congratulations on your token launch!**`;

              return outputMessage;
            }
          } catch (error) {
            return `❌ **DEPLOYMENT FAILED**

Error: ${(error as Error).message}

💡 **Common issues:**
- Insufficient gas/SOL in wallet
- Invalid private key/keypair format
- Network connection issues
- Incorrect network selection

Please check and try again.`;
          }
        },
      }),

      // Direct EVM deployment (for advanced users)
      "deploy-evm-token": tool({
        description: `Deploy ERC-20 token on EVM networks (for advanced users who know all parameters)

Available: ${getAvailableNetworks().join(", ")}

⚠️ Service Fee: ${PLUGIN_CONFIG.FEE_PERCENTAGE}% → ${PLUGIN_CONFIG.FEE_COLLECTOR_EVM}`,

        args: {
          network: tool.schema.string(),
          name: tool.schema.string(),
          symbol: tool.schema.string(),
          decimals: tool.schema.number().default(18),
          totalSupply: tool.schema.string(),
          privateKey: tool.schema.string(),
        },

        async execute(args) {
          try {
            const result = await evmFactory.deployToken({
              ...args,
              feeCollector: PLUGIN_CONFIG.FEE_COLLECTOR_EVM,
            });

            return `✅ ${args.name} (${args.symbol}) deployed!

📍 Address: \`${result.tokenAddress}\`
📝 TX: \`${result.transactionHash}\`
🌐 Network: ${result.network}
🔗 Explorer: ${result.blockExplorer}

⚠️ Fee: ${PLUGIN_CONFIG.FEE_PERCENTAGE}% → ${PLUGIN_CONFIG.FEE_COLLECTOR_EVM}`;
          } catch (error) {
            return `❌ Error: ${(error as Error).message}`;
          }
        },
      }),

      // Direct Solana deployment (for advanced users)
      "deploy-solana-token": tool({
        description: `Deploy token on Solana using Token-2022 (for advanced users)

Available: ${getAvailableSolanaNetworks().join(", ")}

⚠️ Service Fee: ${PLUGIN_CONFIG.FEE_PERCENTAGE}% → ${PLUGIN_CONFIG.FEE_COLLECTOR_SOLANA}`,

        args: {
          network: tool.schema.string(),
          name: tool.schema.string(),
          symbol: tool.schema.string(),
          decimals: tool.schema.number().default(9),
          supply: tool.schema.string(),
          keypair: tool.schema.string(),
          metadataUri: tool.schema.string().optional(),
        },

        async execute(args) {
          try {
            const result = await solanaFactory.deployToken({
              ...args,
              feeCollector: PLUGIN_CONFIG.FEE_COLLECTOR_SOLANA,
            });

            return `✅ ${args.name} (${args.symbol}) deployed!

📍 Mint: \`${result.mintAddress}\`
📝 TX: \`${result.transactionSignature}\`
🌐 Network: ${result.network}
🔗 Explorer: ${result.blockExplorer}

⚠️ Fee: ${PLUGIN_CONFIG.FEE_PERCENTAGE}% → ${PLUGIN_CONFIG.FEE_COLLECTOR_SOLANA}`;
          } catch (error) {
            return `❌ Error: ${(error as Error).message}`;
          }
        },
      }),

      // Token info query
      "get-token-info": tool({
        description: "Get information about a deployed token",

        args: {
          address: tool.schema.string(),
          network: tool.schema.string(),
          chain: tool.schema.string(),
        },

        async execute(args) {
          try {
            if (args.chain === "evm") {
              const info = await evmFactory.getTokenInfo(
                args.address,
                args.network,
              );
              return `**${info.name} (${info.symbol})**

📍 Address: \`${info.address}\`
🔢 Decimals: ${info.decimals}
💰 Supply: ${info.totalSupply}
👤 Fee Collector: \`${info.feeCollector}\`
🔗 Explorer: ${info.blockExplorer}`;
            } else {
              const info = await solanaFactory.getTokenInfo(
                args.address,
                args.network,
              );
              return `**Solana Token**

📍 Mint: \`${info.mintAddress}\`
🔢 Decimals: ${info.decimals}
💰 Supply: ${info.supply}
👤 Authority: \`${info.mintAuthority}\`
🔗 Explorer: ${info.blockExplorer}`;
            }
          } catch (error) {
            return `❌ Error: ${(error as Error).message}`;
          }
        },
      }),
    },

    event: async ({ event }) => {
      if (event.type === "session.idle") {
        await logger.info("Session completed");
      }
    },
  };
};

export default OpenCoinsLaunchpad;
