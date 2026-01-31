import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import analyzeRoutes from './routes/analyze.js';
import healthRoutes from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
  message: {
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMITED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/health', healthRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ExposureCheck API running on http://localhost:${PORT}`);
  console.log(`  - Health: http://localhost:${PORT}/api/health`);
  console.log(`  - Analyze: http://localhost:${PORT}/api/analyze/:address`);
});
