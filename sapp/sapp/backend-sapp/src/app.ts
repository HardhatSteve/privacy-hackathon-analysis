import express, { type Request, type Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrivyClient } from '@privy-io/server-auth';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cryptoRoutes from './routes/cryptoRoutes.js';
import silentSwapRoutes from './routes/silentSwapRoutes.js';
import luloRoutes from './routes/luloRoutes.js';
import starpayRoutes from './routes/starpayRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { sanitizeRequest } from './middleware/validation.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  // Trust proxy for rate limiting behind reverse proxy (Render, etc.)
  app.set('trust proxy', 1);

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  // Sanitize all incoming requests
  app.use(sanitizeRequest);

  // Apply global rate limiting
  app.use(apiLimiter);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'sapp-backend', timestamp: new Date().toISOString() });
  });

  // Privy configuration test endpoint
  app.get('/health/privy', async (_req: Request, res: Response) => {
    console.log('[Health/Privy] Testing Privy configuration...');
    console.log(`[Health/Privy] App ID: ${env.PRIVY_APP_ID}`);
    console.log(`[Health/Privy] App Secret: ${env.PRIVY_APP_SECRET?.substring(0, 30)}...`);

    try {
      const privy = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);
      // Try to get a non-existent user - this validates credentials work
      // Will throw "user not found" (good) or 403 (bad credentials)
      try {
        await privy.getUser('test-nonexistent-user-id');
      } catch (userError) {
        const status = (userError as { status?: number })?.status;
        // 404 or "user not found" is expected and means credentials are valid
        if (status === 403) {
          throw userError; // Re-throw 403 as it means invalid credentials
        }
        // Any other error (404, etc.) means credentials are valid
      }

      res.json({
        status: 'ok',
        privy: 'configured',
        appId: env.PRIVY_APP_ID,
        secretPrefix: env.PRIVY_APP_SECRET?.substring(0, 20),
        message: 'Privy credentials are valid',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorType = (error as { type?: string })?.type;
      const errorStatus = (error as { status?: number })?.status;

      console.error('[Health/Privy] Configuration test failed:', error);

      res.status(500).json({
        status: 'error',
        privy: 'misconfigured',
        appId: env.PRIVY_APP_ID,
        secretPrefix: env.PRIVY_APP_SECRET?.substring(0, 20),
        error: errorMessage,
        errorType,
        errorStatus,
        hint: errorStatus === 403
          ? 'PRIVY_APP_SECRET is incorrect or revoked. Get the correct secret from https://dashboard.privy.io/ → Settings → API Keys'
          : 'Check PRIVY_APP_ID and PRIVY_APP_SECRET in .env file',
      });
    }
  });

  // Auth routes (OTP login/signup)
  app.use('/api/sapp/auth', authRoutes);

  // User routes (lookup, search, profile)
  app.use('/api/sapp/users', userRoutes);

  // Crypto routes (ShadowWire transfers, balance, fees)
  app.use('/api/sapp/crypto', cryptoRoutes);

  // SilentSwap routes (private cross-chain swaps)
  app.use('/api/sapp/silentswap', silentSwapRoutes);

  // Lulo routes (yield farming)
  app.use('/api/sapp/lulo', luloRoutes);

  // StarPay routes (virtual card purchases)
  app.use('/api/sapp/starpay', starpayRoutes);

  // Wallet routes (server-side wallet management via Privy)
  app.use('/api/sapp/wallet', walletRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
