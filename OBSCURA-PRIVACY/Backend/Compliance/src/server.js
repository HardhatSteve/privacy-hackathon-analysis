import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import addressRoutes from './routes/addressRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'obscura-compliance' });
});

app.use('/api/v1/addresses', addressRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Compliance server running on port ${PORT}`);
});
