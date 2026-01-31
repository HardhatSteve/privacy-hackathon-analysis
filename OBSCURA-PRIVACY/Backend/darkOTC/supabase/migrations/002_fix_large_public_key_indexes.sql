-- Fix indexes for large WOTS+ public keys
-- WOTS+ addresses are 2208 bytes (4416 hex characters), which exceeds btree index limits
-- Solution: Use HASH indexes for equality lookups on public key columns

-- Drop existing btree indexes that are too large
DROP INDEX IF EXISTS idx_quote_requests_taker_public_key;
DROP INDEX IF EXISTS idx_quotes_market_maker_public_key;
DROP INDEX IF EXISTS idx_messages_sender_public_key;
DROP INDEX IF EXISTS idx_used_signatures_public_key;

-- Create HASH indexes for large public key columns
-- HASH indexes are perfect for equality lookups and don't have size limits
CREATE INDEX IF NOT EXISTS idx_quote_requests_taker_public_key ON quote_requests USING HASH (taker_public_key);
CREATE INDEX IF NOT EXISTS idx_quotes_market_maker_public_key ON quotes USING HASH (market_maker_public_key);
CREATE INDEX IF NOT EXISTS idx_messages_sender_public_key ON messages USING HASH (sender_public_key);
CREATE INDEX IF NOT EXISTS idx_used_signatures_public_key ON used_signatures USING HASH (public_key);
