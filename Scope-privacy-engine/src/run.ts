/**
 * Privacy Engine - Test Runner
 * Run this script to analyze a wallet from the terminal
 * 
 * Usage: npx ts-node src/run.ts [wallet_address]
 */

import * as dotenv from "dotenv";
import { analyzeWallet, formatReportForConsole } from "./engine";

// Load environment variables
dotenv.config();


// Default test wallet (Phantom's example wallet for testing)
const DEFAULT_TEST_WALLET = "vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg";

// Example wallets for different scenarios
const TEST_SCENARIOS = {
  // A random wallet for general testing
  default: "vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg",
  
  // Whale wallet (likely has lots of activity)
  whale: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
  
  // Jupiter aggregator (very active DeFi)
  defi: "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB",
};


async function main(): Promise<void> {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║        SOLANA PRIVACY SCORE ENGINE v1.0.0                  ║");
  console.log("║        Hackathon Edition - Privacy Analysis Tool           ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\n");

  // Check for Helius API key
  if (!process.env.HELIUS_API_KEY) {
    console.log("⚠️  Warning: HELIUS_API_KEY not found in .env file");
    console.log("   The engine will use mock data for demonstration.");
    console.log("   To get real data, add your Helius API key to .env:");
    console.log("   HELIUS_API_KEY=your_key_here\n");
  } else {
    console.log("✅ Helius API key detected");
  }

  // Check for QuickNode RPC URL
  if (process.env.QUICKNODE_RPC_URL) {
    console.log("✅ QuickNode RPC detected\n");
  } else {
    console.log("⚠️  Warning: QUICKNODE_RPC_URL not found in .env file");
    console.log("   The engine will use public Solana RPC for balance fetching.");
    console.log("   To use QuickNode, add your RPC URL to .env:");
    console.log("   QUICKNODE_RPC_URL=your_quicknode_url_here\n");
  }

  // Get wallet address from command line or use default
  const walletAddress = process.argv[2] || DEFAULT_TEST_WALLET;

  console.log(`🎯 Target Wallet: ${walletAddress}`);
  
  // Check if it's one of our test scenarios
  const scenarioKey = Object.entries(TEST_SCENARIOS).find(
    ([_, addr]) => addr === walletAddress
  );
  if (scenarioKey) {
    console.log(`   (Test Scenario: ${scenarioKey[0]})`);
  }

  console.log("\n" + "─".repeat(60) + "\n");

  try {
    // Run the analysis
    console.log("🚀 Starting privacy analysis...\n");
    const startTime = Date.now();
    
    const report = await analyzeWallet(walletAddress);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Analysis completed in ${elapsed}s`);

    // Print formatted report
    console.log(formatReportForConsole(report));

    // Exit with appropriate code based on risk level
    if (report.riskLevel === "CRITICAL") {
      process.exit(2);
    } else if (report.riskLevel === "HIGH") {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error("\n❌ Fatal error during analysis:");
    console.error(error);
    process.exit(1);
  }
}


main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
