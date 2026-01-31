import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import config from './config/index.js';
import logger from './utils/logger.js';
import orderbook from './services/orderbook.js';
import matchingEngine from './services/matchingEngine.js';
import arciumService from './services/arciumService.js';
import errorHandler from './middleware/errorHandler.js';

// Import routes
import orderRoutes from './routes/orders.js';
import marketRoutes from './routes/market.js';
import healthRoutes from './routes/health.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/market', marketRoutes);

// Error handling
app.use(errorHandler);

// WebSocket server
const wss = new WebSocketServer({ port: config.websocket.port });

const clients = new Map();
const subscriptions = new Map();

wss.on('connection', (ws, req) => {
  const clientId = Math.random().toString(36).substring(7);
  clients.set(clientId, ws);
  subscriptions.set(clientId, new Set());

  logger.info('WebSocket client connected', { clientId, ip: req.socket.remoteAddress });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      await handleWebSocketMessage(clientId, message, ws);
    } catch (error) {
      logger.error('WebSocket message error', { error: error.message, clientId });
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    subscriptions.delete(clientId);
    logger.info('WebSocket client disconnected', { clientId });
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error', { error: error.message, clientId });
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId,
    timestamp: Date.now()
  }));
});

async function handleWebSocketMessage(clientId, message, ws) {
  const { action, channel, tokenPair, userAddress } = message;

  switch (action) {
    case 'subscribe':
      handleSubscribe(clientId, channel, tokenPair, userAddress, ws);
      break;
    case 'unsubscribe':
      handleUnsubscribe(clientId, channel, tokenPair, ws);
      break;
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    default:
      ws.send(JSON.stringify({ error: 'Unknown action' }));
  }
}

function handleSubscribe(clientId, channel, tokenPair, userAddress, ws) {
  const subscription = `${channel}:${tokenPair || userAddress || 'global'}`;
  subscriptions.get(clientId).add(subscription);

  logger.info('Client subscribed', { clientId, subscription });

  ws.send(JSON.stringify({
    type: 'subscribed',
    channel,
    tokenPair,
    userAddress,
    timestamp: Date.now()
  }));
}

function handleUnsubscribe(clientId, channel, tokenPair, ws) {
  const subscription = `${channel}:${tokenPair || 'global'}`;
  subscriptions.get(clientId).delete(subscription);

  logger.info('Client unsubscribed', { clientId, subscription });

  ws.send(JSON.stringify({
    type: 'unsubscribed',
    channel,
    tokenPair,
    timestamp: Date.now()
  }));
}

// Broadcast to subscribed clients
export function broadcast(channel, tokenPair, data) {
  const subscription = `${channel}:${tokenPair}`;
  
  for (const [clientId, clientSubs] of subscriptions.entries()) {
    if (clientSubs.has(subscription)) {
      const ws = clients.get(clientId);
      if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: channel,
          tokenPair,
          data,
          timestamp: Date.now()
        }));
      }
    }
  }
}

// Heartbeat to keep connections alive
setInterval(() => {
  for (const [clientId, ws] of clients.entries()) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
    }
  }
}, config.websocket.heartbeatInterval);

// Initialize services
async function initialize() {
  try {
    logger.info('Initializing Dark Pool backend...');

    // Initialize Redis orderbook
    await orderbook.initialize();

    // Initialize Arcium service
    await arciumService.initialize();

    // Start matching engine
    matchingEngine.start();

    logger.info('Dark Pool backend initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize backend', { error: error.message });
    process.exit(1);
  }
}

// Start server
async function start() {
  await initialize();

  app.listen(config.port, config.host, () => {
    logger.info('Dark Pool API server started', {
      host: config.host,
      port: config.port,
      env: config.nodeEnv
    });
  });

  logger.info('WebSocket server started', {
    port: config.websocket.port
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  matchingEngine.stop();
  await orderbook.close();
  
  wss.close(() => {
    logger.info('WebSocket server closed');
  });

  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  
  matchingEngine.stop();
  await orderbook.close();
  
  wss.close(() => {
    logger.info('WebSocket server closed');
  });

  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

start();

export default app;
