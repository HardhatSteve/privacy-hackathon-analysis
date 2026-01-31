// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root (two levels up from server/config/)
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
