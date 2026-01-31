# OBSCURA Compliance Backend

Compliance service for checking crypto addresses against Range API for malicious activity, sanctions, and blacklists.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env` (already set up with your API key)

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

### Search Addresses
```
GET /api/v1/addresses/search?networks=ethereum,solana&status=malicious
```

### Get Address Statistics
```
GET /api/v1/addresses/stats?network=ethereum&address=0x123...
```

### Check Address Compliance (Batch)
```
POST /api/v1/addresses/check
Content-Type: application/json

{
  "addresses": [
    { "network": "ethereum", "address": "0x123..." },
    { "network": "solana", "address": "9xQeW..." }
  ]
}
```

Response:
```json
{
  "results": [
    {
      "address": "0x123...",
      "network": "ethereum",
      "compliant": true,
      "malicious": false,
      "tags": ["Exchange", "CEX"],
      "entity": "Binance",
      "category": "exchange"
    }
  ]
}
```

## Environment Variables

- `RANGE_API_KEY` - Your Range API key (required)
- `RANGE_BASE_URL` - Range API base URL (default: https://api.range.org)
- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level (default: info)
- `NODE_ENV` - Environment (default: production)
