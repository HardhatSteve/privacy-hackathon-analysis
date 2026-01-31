# Supabase Database Setup

This directory contains the database schema and migrations for the Obscura Dark OTC RFQ MVP.

## Overview

The database schema includes:
- **quote_requests**: Private quote requests from takers
- **quotes**: Quotes submitted by market makers
- **messages**: Encrypted messages between parties
- **whitelist**: Authorized market maker addresses
- **used_signatures**: WOTS+ signature tracking for reuse prevention

## Setup Methods

### Method 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `migrations/001_initial_schema.sql`
5. Paste into the SQL editor
6. Click **Run** to execute

### Method 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Method 3: Automated Script (Requires RPC Function)

```bash
# Run the setup script
npm run setup-db

# Or directly with tsx
npx tsx src/scripts/setup-database.ts
```

**Note**: This method requires a custom RPC function in Supabase. If not available, use Method 1 or 2.

## Schema Details

### Tables

#### quote_requests
Stores private quote requests with Pedersen commitments for amounts.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| asset_pair | TEXT | Trading pair (e.g., "SOL/USDC") |
| direction | TEXT | "buy" or "sell" |
| amount_commitment | TEXT | Pedersen commitment hiding amount |
| stealth_address | TEXT | One-time address for responses |
| taker_public_key | TEXT | Taker's public key |
| created_at | BIGINT | Creation timestamp (ms) |
| expires_at | BIGINT | Expiration timestamp (ms) |
| status | TEXT | "active", "expired", "filled", "cancelled" |
| nullifier | TEXT | Nullifier (set when filled) |

**Indexes**:
- `idx_quote_requests_status` on `status`
- `idx_quote_requests_expires_at` on `expires_at`
- `idx_quote_requests_taker_public_key` on `taker_public_key`
- `idx_quote_requests_created_at` on `created_at`
- `idx_quote_requests_asset_pair` on `asset_pair`

#### quotes
Stores quotes from market makers with Pedersen commitments for prices.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| quote_request_id | TEXT | Foreign key to quote_requests |
| price_commitment | TEXT | Pedersen commitment hiding price |
| market_maker_public_key | TEXT | Market maker's public key |
| created_at | BIGINT | Creation timestamp (ms) |
| expires_at | BIGINT | Expiration timestamp (ms) |
| status | TEXT | "active", "expired", "accepted" |

**Indexes**:
- `idx_quotes_quote_request_id` on `quote_request_id`
- `idx_quotes_status` on `status`
- `idx_quotes_expires_at` on `expires_at`
- `idx_quotes_market_maker_public_key` on `market_maker_public_key`
- `idx_quotes_created_at` on `created_at`

#### messages
Stores encrypted messages between takers and market makers.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| quote_request_id | TEXT | Foreign key to quote_requests |
| sender_public_key | TEXT | Sender's public key |
| recipient_stealth_address | TEXT | Recipient's stealth address |
| encrypted_content | TEXT | Encrypted message content |
| timestamp | BIGINT | Message timestamp (ms) |

**Indexes**:
- `idx_messages_quote_request_id` on `quote_request_id`
- `idx_messages_timestamp` on `timestamp`
- `idx_messages_sender_public_key` on `sender_public_key`
- `idx_messages_recipient_stealth_address` on `recipient_stealth_address`

#### whitelist
Stores authorized market maker addresses.

| Column | Type | Description |
|--------|------|-------------|
| address | TEXT | Primary key (public key) |
| added_at | BIGINT | Addition timestamp (ms) |
| added_by | TEXT | Admin who added the address |

**Indexes**:
- `idx_whitelist_added_at` on `added_at`
- `idx_whitelist_added_by` on `added_by`

#### used_signatures
Tracks used WOTS+ signatures to prevent reuse attacks.

| Column | Type | Description |
|--------|------|-------------|
| signature_hash | TEXT | Primary key (SHA256 hash) |
| used_at | BIGINT | Usage timestamp (ms) |
| operation_type | TEXT | Type of operation |
| public_key | TEXT | Public key that signed |

**Indexes**:
- `idx_used_signatures_used_at` on `used_at`
- `idx_used_signatures_public_key` on `public_key`
- `idx_used_signatures_operation_type` on `operation_type`

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- **Service Role**: Full access (used by backend with service role key)
- **Anon Role**: Read-only access (used by backend with anon key)

This ensures that:
1. Backend operations use the service role key for write operations
2. Privacy is maintained through encryption (not RLS restrictions)
3. All data is accessible for verification but protected by cryptography

### Real-Time Subscriptions

Real-time updates are enabled for:
- `quote_requests` - Takers can see status updates
- `quotes` - Takers can see new quotes in real-time
- `messages` - Both parties can see new messages

To subscribe to real-time updates in your application:

```typescript
import { supabaseConfig } from './config/supabase.config';

// Subscribe to new quotes for a specific quote request
const subscription = supabaseConfig.client
  .channel('quotes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'quotes',
      filter: `quote_request_id=eq.${quoteRequestId}`
    },
    (payload) => {
      console.log('New quote received:', payload.new);
    }
  )
  .subscribe();

// Unsubscribe when done
subscription.unsubscribe();
```

### Utility Functions

The schema includes utility functions for maintenance:

- `mark_expired_quote_requests()` - Automatically marks expired quote requests
- `mark_expired_quotes()` - Automatically marks expired quotes
- `cleanup_old_signatures()` - Removes signatures older than 30 days

These can be called manually or scheduled via Supabase cron jobs.

## Verification

After setup, verify the schema:

```bash
npm run verify-db
```

Or manually check in Supabase Dashboard:
1. Go to **Table Editor**
2. Verify all 5 tables exist
3. Check that indexes are created
4. Verify RLS policies are enabled

## Maintenance

### Cleaning Up Expired Data

Run these functions periodically (e.g., via cron):

```sql
-- Mark expired quote requests
SELECT mark_expired_quote_requests();

-- Mark expired quotes
SELECT mark_expired_quotes();

-- Clean up old signatures (30+ days)
SELECT cleanup_old_signatures();
```

### Monitoring

Monitor database performance:
1. Check query performance in Supabase Dashboard > Database > Query Performance
2. Monitor index usage
3. Check connection pool usage
4. Review slow queries

## Security Considerations

1. **RLS Policies**: All tables have RLS enabled
2. **Service Role Key**: Keep service role key secure (never expose to frontend)
3. **Anon Key**: Safe to use in frontend (read-only access)
4. **Encryption**: All sensitive data (amounts, prices, messages) is encrypted
5. **Signature Tracking**: WOTS+ signatures are tracked to prevent reuse

## Troubleshooting

### Tables Not Created

If tables don't appear after running the migration:
1. Check Supabase logs for errors
2. Verify your service role key is correct
3. Try running the SQL manually in the dashboard

### RLS Blocking Queries

If queries are blocked by RLS:
1. Ensure you're using the service role key for write operations
2. Check that RLS policies are correctly configured
3. Verify the user role (service_role vs anon)

### Real-Time Not Working

If real-time subscriptions don't work:
1. Verify real-time is enabled in Supabase Dashboard > Database > Replication
2. Check that tables are added to the `supabase_realtime` publication
3. Ensure your subscription filter is correct

## Requirements Mapping

This schema satisfies the following requirements:

- **Requirement 1.1**: Quote request storage with commitments
- **Requirement 2.1**: Quote storage with price commitments
- **Requirement 3.1**: Quote retrieval and selection
- **Requirement 26.1**: Message storage and retrieval
- **Requirement 33.1**: Market maker whitelist management
- **Requirement 35.5**: WOTS+ signature reuse prevention

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-Time Subscriptions](https://supabase.com/docs/guides/realtime)
