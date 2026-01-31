// CRITICAL: Load environment variables FIRST before any other imports
import './config/env.js';

import express from 'express';
import cors from 'cors';
import scanRoutes from './routes/scan.js';
import { heliusService, SolanaNetwork } from './services/helius.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/scan', scanRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        heliusConfigured: !!process.env.HELIUS_API_KEY,
        birdeyeConfigured: !!process.env.BIRDEYE_API_KEY,
    });
});

// Network switch endpoint
app.get('/api/network', (req, res) => {
    res.json({ network: heliusService.getNetwork() });
});

app.post('/api/network', (req, res) => {
    const { network } = req.body as { network: SolanaNetwork };
    if (network !== 'mainnet' && network !== 'devnet') {
        return res.status(400).json({ error: 'Invalid network. Use "mainnet" or "devnet".' });
    }
    heliusService.setNetwork(network);
    console.log(`[Network] Switched to ${network}`);
    res.json({ network, message: `Switched to ${network}` });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Error]', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║         Solana Exposure Scanner - Backend Server          ║
╠═══════════════════════════════════════════════════════════╣
║  🚀 Server running on http://localhost:${PORT}               ║
║  📡 API endpoint: /api/scan/:address                      ║
║  💚 Health check: /api/health                             ║
╠═══════════════════════════════════════════════════════════╣
║  API Keys:                                                ║
║    Helius:  ${process.env.HELIUS_API_KEY ? '✓ Configured' : '✗ Missing'}                                  ║
║    Birdeye: ${process.env.BIRDEYE_API_KEY ? '✓ Configured' : '○ Optional (not set)'}                       ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
