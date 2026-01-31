import dotenv from 'dotenv';
import { Keypair } from '@solana/web3.js';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['SOLANA_PRIVATE_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Parse Solana keypair
let solanaKeypair;
try {
  const secretKey = JSON.parse(process.env.SOLANA_PRIVATE_KEY);
  solanaKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
} catch (error) {
  throw new Error('Invalid SOLANA_PRIVATE_KEY format. Expected JSON array of numbers.');
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Solana
  solana: {
    keypair: solanaKeypair,
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    cluster: process.env.SOLANA_CLUSTER || 'devnet',
    commitment: 'confirmed'
  },

  // Arcium
  arcium: {
    clusterOffset: parseInt(process.env.ARCIUM_CLUSTER_OFFSET || '0', 10),
    mxeProgramId: process.env.ARCIUM_MXE_PROGRAM_ID || '',
    callbackServerUrl: process.env.ARCIUM_CALLBACK_SERVER_URL || 'http://localhost:3002'
  },

  // Dark Pool
  darkPool: {
    orderExpirySeconds: parseInt(process.env.ORDER_EXPIRY_SECONDS || '3600', 10),
    minOrderSize: parseFloat(process.env.MIN_ORDER_SIZE || '0.01'),
    maxOrderSize: parseFloat(process.env.MAX_ORDER_SIZE || '1000000'),
    matchingIntervalMs: parseInt(process.env.MATCHING_INTERVAL_MS || '1000', 10),
    maxOrdersPerUser: 100,
    priceTickSize: 0.01,
    amountTickSize: 0.001
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined
  },

  // WebSocket
  websocket: {
    port: parseInt(process.env.WS_PORT || '3003', 10),
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10)
  },

  // Security
  security: {
    apiKey: process.env.API_KEY,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },

  // Monitoring
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
    enableMetrics: process.env.ENABLE_METRICS === 'true'
  }
};

export default config;
