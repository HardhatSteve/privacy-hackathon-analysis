// ESM compatibility shim for packages that need CommonJS require()
// Required by @radr/shadowwire for WASM loading
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make require() globally available for WASM loaders
globalThis.require = createRequire(import.meta.url);
globalThis.__dirname = __dirname;
globalThis.__filename = __filename;

import { createServer } from 'http';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { createApp } from './app.js';
import { createWebSocketServer } from './services/websocketService.js';

async function start() {
  try {
    // Log Privy configuration (masked for security)
    console.log(`[sapp-backend] Privy App ID: ${env.PRIVY_APP_ID}`);
    console.log(`[sapp-backend] Privy App Secret: ${env.PRIVY_APP_SECRET ? `${env.PRIVY_APP_SECRET.substring(0, 20)}...` : 'NOT SET'}`);

    await connectDatabase();

    const app = createApp();

    // Create HTTP server for both Express and WebSocket
    const httpServer = createServer(app);

    // Initialize WebSocket server
    const io = createWebSocketServer(httpServer);
    console.log('[sapp-backend] WebSocket server initialized');

    httpServer.listen(env.PORT, () => {
      console.log(`[sapp-backend] HTTP + WebSocket listening on port ${env.PORT}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('[sapp-backend] Shutting down...');
      io.close();
      httpServer.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[sapp-backend] Failed to start server', error);
    process.exit(1);
  }
}

void start();
