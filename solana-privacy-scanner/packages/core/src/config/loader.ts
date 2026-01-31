import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PrivacyConfigSchema, DEFAULT_CONFIG, type PrivacyConfig } from './schema.js';

/**
 * Load privacy configuration from various sources
 * 
 * Priority order:
 * 1. .privacyrc
 * 2. .privacyrc.json
 * 3. privacy.config.json
 * 4. package.json (privacy field)
 * 5. Default config
 * 
 * @param cwd - Current working directory (defaults to process.cwd())
 * @returns Loaded and validated configuration
 */
export function loadConfig(cwd: string = process.cwd()): PrivacyConfig {
  const configPaths = [
    '.privacyrc',
    '.privacyrc.json',
    'privacy.config.json',
  ];

  // Try each config file
  for (const configPath of configPaths) {
    const fullPath = join(cwd, configPath);
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        const parsed = JSON.parse(content);
        return validateConfig(parsed);
      } catch (error) {
        console.warn(
          `Failed to load config from ${configPath}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  // Try package.json
  const packageJsonPath = join(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const content = readFileSync(packageJsonPath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.privacy) {
        return validateConfig(parsed.privacy);
      }
    } catch (error) {
      // Ignore package.json errors
    }
  }

  // Return default config
  return DEFAULT_CONFIG;
}

/**
 * Validate configuration against schema
 */
function validateConfig(config: unknown): PrivacyConfig {
  try {
    return PrivacyConfigSchema.parse(config);
  } catch (error) {
    console.error('Invalid privacy configuration:', error);
    console.warn('Using default configuration');
    return DEFAULT_CONFIG;
  }
}

/**
 * Get configuration for a specific environment
 */
export function getEnvironmentConfig(
  config: PrivacyConfig,
  environment: string
): PrivacyConfig {
  if (!config.environments || !config.environments[environment]) {
    return config;
  }

  const envConfig = config.environments[environment];

  // Merge environment-specific config with base config
  const merged: PrivacyConfig = {
    ...config,
    maxRiskLevel: envConfig.maxRiskLevel || config.maxRiskLevel,
  };

  return merged;
}

/**
 * Check if current environment should enforce privacy checks
 */
export function shouldEnforce(config: PrivacyConfig): boolean {
  const isCI = process.env.CI === 'true' || process.env.CI === '1';
  return config.enforceInCI && isCI;
}

/**
 * Get test wallet for current environment
 */
export function getTestWallet(config: PrivacyConfig): string | undefined {
  if (!config.testWallets) return undefined;

  // Try to detect environment
  const env = process.env.SOLANA_ENV || 'devnet';

  switch (env.toLowerCase()) {
    case 'mainnet':
    case 'mainnet-beta':
      return config.testWallets.mainnet;
    case 'testnet':
      return config.testWallets.testnet;
    case 'devnet':
    default:
      return config.testWallets.devnet;
  }
}
