import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getOptionalEnv = (key: string): string | undefined => {
  return process.env[key];
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '4002', 10),
  MONGODB_URI: getEnv('MONGODB_URI'),

  // Privy Configuration
  PRIVY_APP_ID: getEnv('PRIVY_APP_ID'),
  PRIVY_APP_SECRET: getEnv('PRIVY_APP_SECRET'),
  // Authorization private key for signing wallet operations (starts with wallet-auth:)
  PRIVY_AUTHORIZATION_KEY: getOptionalEnv('PRIVY_AUTHORIZATION_KEY'),
  // Authorization public key for creating wallets (PEM format, get from Dashboard)
  // This is the public key corresponding to PRIVY_AUTHORIZATION_KEY
  PRIVY_AUTHORIZATION_PUBLIC_KEY: getOptionalEnv('PRIVY_AUTHORIZATION_PUBLIC_KEY'),
  // Optional: JWT verification key to avoid API calls during token verification
  // Get this from Privy Dashboard -> Configuration -> App settings
  PRIVY_VERIFICATION_KEY: getOptionalEnv('PRIVY_VERIFICATION_KEY'),
};

// Validate Privy configuration at startup
export function validatePrivyConfig(): void {
  const errors: string[] = [];

  if (!env.PRIVY_APP_ID) {
    errors.push('PRIVY_APP_ID is required');
  }
  if (!env.PRIVY_APP_SECRET) {
    errors.push('PRIVY_APP_SECRET is required');
  }

  if (errors.length > 0) {
    console.error('[Config] Privy configuration errors:', errors.join(', '));
    throw new Error(`Privy configuration invalid: ${errors.join(', ')}`);
  }

  console.log('[Config] Privy configuration validated successfully');
}
