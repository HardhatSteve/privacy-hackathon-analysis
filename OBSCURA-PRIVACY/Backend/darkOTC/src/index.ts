import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { config, validateConfig } from './config';
import { solanaConfig } from './config/solana.config';
import { evmConfig } from './config/evm.config';
import { supabaseConfig } from './config/supabase.config';
import { obscuraLLMSClient } from './clients/obscura-llms.client';
import routes from './routes';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/error-handler.middleware';

/**
 * Obscura Dark OTC RFQ MVP Backend
 * 
 * Privacy-preserving Request for Quote system built on Obscura infrastructure.
 * 
 * CRITICAL: All implementations use REAL infrastructure:
 * - Solana Devnet (verifiable on Solana Explorer)
 * - Sepolia Testnet (verifiable on Sepolia Etherscan)
 * - Arcium SDK v0.6.3 (real MPC operations)
 * - Light Protocol ZK Compression (real ZK proofs)
 * - WOTS+ signatures (real post-quantum crypto)
 * - Obscura-LLMS BE integration (real relayer network)
 * 
 * NO mocks, stubs, or simulations.
 */

const app: Application = express();

// Middleware
// Parse CORS origins (supports comma-separated list)
const corsOrigins = config.server.corsOrigin.split(',').map(origin => origin.trim());
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware (without sensitive data)
app.use((req: Request, _res: Response, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  // Don't log request body as it may contain signatures/keys
  next();
});

// Mount all routes
app.use('/', routes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize and start server
async function startServer() {
  try {
    // Validate configuration
    console.log('Validating configuration...');
    validateConfig();
    
    // Verify connections
    console.log('Verifying infrastructure connections...');
    
    const solanaConnected = await solanaConfig.verifyConnection();
    if (!solanaConnected) {
      console.warn('Warning: Solana connection failed');
    }
    
    const evmConnected = await evmConfig.verifyConnection();
    if (!evmConnected) {
      console.warn('Warning: EVM connection failed');
    }
    
    const supabaseConnected = await supabaseConfig.verifyConnection();
    if (!supabaseConnected) {
      console.warn('Warning: Supabase connection failed');
    }
    
    const obscuraConnected = await obscuraLLMSClient.verifyConnection();
    if (!obscuraConnected) {
      console.warn('Warning: Obscura-LLMS connection failed');
    }
    
    // Start server
    const port = config.server.port;
    app.listen(port, () => {
      console.log('');
      console.log('='.repeat(60));
      console.log('🚀 Obscura Dark OTC RFQ MVP Backend');
      console.log('='.repeat(60));
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${config.server.nodeEnv}`);
      console.log('');
      console.log('🌐 Frontend Demo:');
      console.log(`  http://localhost:${port}/`);
      console.log('');
      console.log('Infrastructure Status:');
      console.log(`  ✓ Solana Devnet: ${solanaConnected ? 'Connected' : 'Disconnected'}`);
      console.log(`  ✓ Sepolia Testnet: ${evmConnected ? 'Connected' : 'Disconnected'}`);
      console.log(`  ✓ Supabase: ${supabaseConnected ? 'Connected' : 'Disconnected'}`);
      console.log(`  ✓ Obscura-LLMS: ${obscuraConnected ? 'Connected' : 'Disconnected'}`);
      console.log('');
      console.log('Endpoints:');
      console.log(`  GET  http://localhost:${port}/`);
      console.log(`  GET  http://localhost:${port}/health`);
      console.log(`  GET  http://localhost:${port}/api/v1/privacy/status`);
      console.log(`  GET  http://localhost:${port}/api/v1/solana/status`);
      console.log(`  GET  http://localhost:${port}/api/v1/evm/status`);
      console.log('');
      console.log('RFQ Endpoints:');
      console.log(`  POST http://localhost:${port}/api/v1/rfq/quote-request`);
      console.log(`  POST http://localhost:${port}/api/v1/rfq/quote`);
      console.log(`  GET  http://localhost:${port}/api/v1/rfq/quote-request/:id/quotes`);
      console.log(`  POST http://localhost:${port}/api/v1/rfq/quote/:id/accept`);
      console.log(`  POST http://localhost:${port}/api/v1/rfq/quote-request/:id/cancel`);
      console.log(`  POST http://localhost:${port}/api/v1/rfq/message`);
      console.log(`  GET  http://localhost:${port}/api/v1/rfq/quote-request/:id/messages`);
      console.log('');
      console.log('Admin Endpoints:');
      console.log(`  POST http://localhost:${port}/api/v1/admin/whitelist/add`);
      console.log(`  POST http://localhost:${port}/api/v1/admin/whitelist/remove`);
      console.log(`  GET  http://localhost:${port}/api/v1/admin/whitelist`);
      console.log('='.repeat(60));
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
