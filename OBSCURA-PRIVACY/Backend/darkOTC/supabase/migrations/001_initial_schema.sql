-- Obscura Dark OTC RFQ MVP - Initial Database Schema
-- This migration creates all tables, indexes, RLS policies, and real-time subscriptions
-- Requirements: 1.1, 2.1, 3.1, 26.1, 33.1, 35.5

-- ============================================================================
-- TABLE: quote_requests
-- Stores private quote requests from takers
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_requests (
  id TEXT PRIMARY KEY,
  asset_pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
  amount_commitment TEXT NOT NULL,
  stealth_address TEXT NOT NULL,
  taker_public_key TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'filled', 'cancelled')),
  nullifier TEXT,
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Indexes for quote_requests
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_expires_at ON quote_requests(expires_at);
-- Use hash index for large public keys (WOTS+ addresses are 4416 chars in hex)
CREATE INDEX IF NOT EXISTS idx_quote_requests_taker_public_key ON quote_requests USING HASH (taker_public_key);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_quote_requests_asset_pair ON quote_requests(asset_pair);

-- ============================================================================
-- TABLE: quotes
-- Stores quotes submitted by market makers
-- ============================================================================
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  quote_request_id TEXT NOT NULL,
  price_commitment TEXT NOT NULL,
  market_maker_public_key TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'accepted')),
  CONSTRAINT fk_quote_request 
    FOREIGN KEY (quote_request_id) 
    REFERENCES quote_requests(id) 
    ON DELETE CASCADE,
  CONSTRAINT valid_quote_expiration CHECK (expires_at > created_at)
);

-- Indexes for quotes
CREATE INDEX IF NOT EXISTS idx_quotes_quote_request_id ON quotes(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_expires_at ON quotes(expires_at);
-- Use hash index for large public keys (WOTS+ addresses are 4416 chars in hex)
CREATE INDEX IF NOT EXISTS idx_quotes_market_maker_public_key ON quotes USING HASH (market_maker_public_key);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

-- ============================================================================
-- TABLE: messages
-- Stores encrypted messages between takers and market makers
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  quote_request_id TEXT NOT NULL,
  sender_public_key TEXT NOT NULL,
  recipient_stealth_address TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  CONSTRAINT fk_message_quote_request 
    FOREIGN KEY (quote_request_id) 
    REFERENCES quote_requests(id) 
    ON DELETE CASCADE
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_quote_request_id ON messages(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
-- Use hash index for large public keys (WOTS+ addresses are 4416 chars in hex)
CREATE INDEX IF NOT EXISTS idx_messages_sender_public_key ON messages USING HASH (sender_public_key);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_stealth_address ON messages(recipient_stealth_address);

-- ============================================================================
-- TABLE: whitelist
-- Stores authorized market maker addresses
-- ============================================================================
CREATE TABLE IF NOT EXISTS whitelist (
  address TEXT PRIMARY KEY,
  added_at BIGINT NOT NULL,
  added_by TEXT NOT NULL
);

-- Indexes for whitelist
CREATE INDEX IF NOT EXISTS idx_whitelist_added_at ON whitelist(added_at);
CREATE INDEX IF NOT EXISTS idx_whitelist_added_by ON whitelist(added_by);

-- ============================================================================
-- TABLE: used_signatures
-- Tracks used WOTS+ signatures to prevent reuse attacks
-- ============================================================================
CREATE TABLE IF NOT EXISTS used_signatures (
  signature_hash TEXT PRIMARY KEY,
  used_at BIGINT NOT NULL,
  operation_type TEXT NOT NULL,
  public_key TEXT NOT NULL
);

-- Indexes for used_signatures
CREATE INDEX IF NOT EXISTS idx_used_signatures_used_at ON used_signatures(used_at);
-- Use hash index for large public keys (WOTS+ addresses are 4416 chars in hex)
CREATE INDEX IF NOT EXISTS idx_used_signatures_public_key ON used_signatures USING HASH (public_key);
CREATE INDEX IF NOT EXISTS idx_used_signatures_operation_type ON used_signatures(operation_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS for all tables to ensure data security
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quote_requests
-- Allow service role to do everything (for backend operations)
CREATE POLICY "Service role has full access to quote_requests"
  ON quote_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon users to read active quote requests (for market makers to see requests)
CREATE POLICY "Anyone can read active quote_requests"
  ON quote_requests
  FOR SELECT
  TO anon
  USING (status = 'active');

-- RLS Policies for quotes
-- Allow service role to do everything
CREATE POLICY "Service role has full access to quotes"
  ON quotes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon users to read quotes (for takers to see quotes)
CREATE POLICY "Anyone can read quotes"
  ON quotes
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for messages
-- Allow service role to do everything
CREATE POLICY "Service role has full access to messages"
  ON messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon users to read messages (encryption provides privacy)
CREATE POLICY "Anyone can read messages"
  ON messages
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for whitelist
-- Allow service role to do everything
CREATE POLICY "Service role has full access to whitelist"
  ON whitelist
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon users to read whitelist (for verification)
CREATE POLICY "Anyone can read whitelist"
  ON whitelist
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for used_signatures
-- Allow service role to do everything
CREATE POLICY "Service role has full access to used_signatures"
  ON used_signatures
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon users to read used_signatures (for verification)
CREATE POLICY "Anyone can read used_signatures"
  ON used_signatures
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- REAL-TIME SUBSCRIPTIONS
-- Enable real-time updates for quote-related tables
-- ============================================================================

-- Enable real-time for quote_requests (takers can see when their request gets quotes)
ALTER PUBLICATION supabase_realtime ADD TABLE quote_requests;

-- Enable real-time for quotes (takers can see new quotes in real-time)
ALTER PUBLICATION supabase_realtime ADD TABLE quotes;

-- Enable real-time for messages (both parties can see new messages)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- Utility functions for automatic status updates
-- ============================================================================

-- Function to automatically mark expired quote requests
CREATE OR REPLACE FUNCTION mark_expired_quote_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE quote_requests
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < EXTRACT(EPOCH FROM NOW()) * 1000;
END;
$$;

-- Function to automatically mark expired quotes
CREATE OR REPLACE FUNCTION mark_expired_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE quotes
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < EXTRACT(EPOCH FROM NOW()) * 1000;
END;
$$;

-- Function to clean up old used signatures (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_signatures()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM used_signatures
  WHERE used_at < (EXTRACT(EPOCH FROM NOW()) * 1000) - (30 * 24 * 60 * 60 * 1000);
END;
$$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE quote_requests IS 'Stores private quote requests from takers with Pedersen commitments for amounts';
COMMENT ON TABLE quotes IS 'Stores quotes submitted by whitelisted market makers with Pedersen commitments for prices';
COMMENT ON TABLE messages IS 'Stores encrypted messages between takers and market makers';
COMMENT ON TABLE whitelist IS 'Stores authorized market maker addresses';
COMMENT ON TABLE used_signatures IS 'Tracks used WOTS+ signatures to prevent reuse attacks';

COMMENT ON COLUMN quote_requests.amount_commitment IS 'Pedersen commitment hiding the actual amount';
COMMENT ON COLUMN quote_requests.stealth_address IS 'One-time address for unlinkable responses';
COMMENT ON COLUMN quote_requests.nullifier IS 'Nullifier to prevent double-acceptance (set when filled)';
COMMENT ON COLUMN quotes.price_commitment IS 'Pedersen commitment hiding the actual price';
COMMENT ON COLUMN messages.encrypted_content IS 'Message encrypted using recipient stealth address';
COMMENT ON COLUMN used_signatures.signature_hash IS 'SHA256 hash of WOTS+ signature to detect reuse';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to anon role (used by backend with anon key)
GRANT SELECT ON quote_requests TO anon;
GRANT SELECT ON quotes TO anon;
GRANT SELECT ON messages TO anon;
GRANT SELECT ON whitelist TO anon;
GRANT SELECT ON used_signatures TO anon;

-- Grant all permissions to service_role (used by backend with service role key)
GRANT ALL ON quote_requests TO service_role;
GRANT ALL ON quotes TO service_role;
GRANT ALL ON messages TO service_role;
GRANT ALL ON whitelist TO service_role;
GRANT ALL ON used_signatures TO service_role;

-- ============================================================================
-- INITIAL DATA (Optional)
-- Add any initial whitelist entries or configuration here
-- ============================================================================

-- Example: Add initial admin to whitelist (replace with actual admin address)
-- INSERT INTO whitelist (address, added_at, added_by)
-- VALUES ('ADMIN_PUBLIC_KEY_HERE', EXTRACT(EPOCH FROM NOW()) * 1000, 'system')
-- ON CONFLICT (address) DO NOTHING;
