# Starpay HD Wallet Payment System - Setup Guide

## Overview
This system allows you to accept SOL payments for card issuance with on-chain verification. Each user gets a unique deposit address derived from your master wallet using HD derivation.

## Setup Steps

### 1. Generate Master Wallet
Run the wallet generation script to create your master keypair:

```bash
node scripts/generate-wallet.js
```

This will output:
- **Public Key**: Your wallet address (where users send SOL)
- **Private Key**: Base64 encoded secret key (KEEP SECURE!)

### 2. Add Environment Variables
Add these to your environment (either `.env.local` or Vercel's Vars section):

```
MASTER_WALLET_PRIVATE_KEY=<paste-base64-from-step-1>
STARPAY_API_KEY=11725ee3e1891393802f2f7f79220b3fc31557ef72a684b3
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

### 3. Create Database Schema
Run the SQL migrations in Supabase to create necessary tables:

```sql
-- Create payment requests table
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_address TEXT NOT NULL,
  expected_amount BIGINT NOT NULL,
  card_value DECIMAL(10, 2) NOT NULL,
  sol_amount DECIMAL(10, 2) NOT NULL,
  user_id TEXT NOT NULL,
  payment_verified BOOLEAN DEFAULT FALSE,
  card_queued BOOLEAN DEFAULT FALSE,
  card_issued BOOLEAN DEFAULT FALSE,
  card_id TEXT,
  derivation_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP
);

CREATE TABLE card_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id UUID NOT NULL REFERENCES payment_requests(id),
  card_value DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending_balance',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. How It Works

**User Flow:**
1. User clicks "Create Card Now" on landing page
2. Enters desired card value and SOL amount to pay
3. Clicks "Generate Deposit Address"
4. System generates unique address (HD derivation index: 0, 1, 2, ...)
5. QR code + address displayed
6. User scans and sends SOL to that address
7. Backend monitors blockchain every 3 seconds
8. When payment detected → Card issued or queued if balance insufficient

**Admin/Backend:**
- Each transaction gets unique derived address
- All derived from single master private key
- Blockchain verified automatically
- Starpay balance checked before issuance
- Queued cards processed when balance available

### 5. Testing

**Solana Devnet (Optional):**
To test without spending real SOL, you can modify `lib/solana-verify.ts`:
```ts
const SOLANA_RPC = "https://api.devnet.solana.com" // Change from mainnet-beta
```

Get free devnet SOL from: https://faucet.solana.com

### 6. Security Notes

⚠️ **CRITICAL:**
- Never expose `MASTER_WALLET_PRIVATE_KEY` in client code
- Only use in server-side API routes
- Rotate the key periodically
- Monitor your wallet for suspicious activity
- Use RLS policies in Supabase to protect payment data

### 7. Monitoring

Check admin dashboard to:
- See your current Starpay balance
- View issued and queued cards
- Monitor payment requests
- Process queued cards when balance available

## Troubleshooting

**"MASTER_WALLET_PRIVATE_KEY environment variable not set"**
- Run `node scripts/generate-wallet.js`
- Add the MASTER_WALLET_PRIVATE_KEY to Vars

**"Invalid base64" error**
- Make sure you copied the entire base64 string
- No spaces or line breaks

**Payments not detected**
- Check blockchain explorer for your wallet address
- Verify deposit address is correct (QR code)
- Ensure SOL amount matches exactly
- Check Solana RPC connection

**Cards not issuing**
- Check Starpay balance in admin dashboard
- Verify STARPAY_API_KEY is correct
- Check database for queued cards

## Support

For issues with:
- **Solana**: Check solana-verify.ts and blockchain connection
- **Starpay**: Contact Starpay team or check API docs
- **Supabase**: Verify database schema and RLS policies
