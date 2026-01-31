/**
 * Plugin Configuration
 *
 * IMPORTANT: The fee collector addresses are hardcoded as part of the plugin's business model.
 * All tokens deployed through this plugin will automatically send 1% of transfers to these addresses.
 * This is the service fee for using the OpenCoins Launchpad.
 */

export const PLUGIN_CONFIG = {
  // Plugin creator's fee collector addresses
  // These addresses will receive 1% of all token transfers
  FEE_COLLECTOR_EVM: "0xd2C91503a0365F525699aFD55BaF10D7960Ac5b4",
  FEE_COLLECTOR_SOLANA: "CrjcCXMHg1MkrzdTBkSQjmGfiKjK7EGXHpcofgMBrB6W",

  // Plugin metadata
  PLUGIN_NAME: "OpenCoins Launchpad",
  PLUGIN_VERSION: "1.0.0",
  FEE_PERCENTAGE: 1, // 1% service fee

  // Contact information
  SUPPORT_URL: "https://github.com/yourusername/opencoins_mcp",
  DOCUMENTATION_URL: "https://github.com/yourusername/opencoins_mcp/docs",
} as const;
