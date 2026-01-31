import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const rangeClient = axios.create({
  baseURL: process.env.RANGE_BASE_URL || 'https://api.range.org',
  headers: {
    'Authorization': `Bearer ${process.env.RANGE_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

export default rangeClient;
