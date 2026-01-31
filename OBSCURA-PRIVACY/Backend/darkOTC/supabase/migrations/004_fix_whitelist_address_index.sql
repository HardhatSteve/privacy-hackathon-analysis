-- Fix whitelist table to support large WOTS+ addresses
-- WOTS+ addresses are 2208 bytes (4416 hex characters)
-- btree indexes have a maximum size of 2704 bytes
-- We need to use HASH index instead

-- Drop the existing primary key constraint (which uses btree)
ALTER TABLE whitelist DROP CONSTRAINT IF EXISTS whitelist_pkey;

-- Create a HASH index on address column
CREATE INDEX IF NOT EXISTS idx_whitelist_address_hash ON whitelist USING HASH (address);

-- Add a unique constraint using the hash index
-- Note: PostgreSQL doesn't support UNIQUE with HASH indexes directly,
-- so we'll use a unique btree index on a hash of the address instead

-- Add a column to store the hash of the address
ALTER TABLE whitelist ADD COLUMN IF NOT EXISTS address_hash TEXT;

-- Create a function to generate address hash
CREATE OR REPLACE FUNCTION generate_address_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.address_hash := encode(digest(NEW.address, 'sha256'), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate address hash
DROP TRIGGER IF EXISTS whitelist_address_hash_trigger ON whitelist;
CREATE TRIGGER whitelist_address_hash_trigger
  BEFORE INSERT OR UPDATE ON whitelist
  FOR EACH ROW
  EXECUTE FUNCTION generate_address_hash();

-- Update existing rows to have address_hash
UPDATE whitelist SET address_hash = encode(digest(address, 'sha256'), 'hex') WHERE address_hash IS NULL;

-- Create unique constraint on address_hash (this will be our "primary key")
ALTER TABLE whitelist ADD CONSTRAINT whitelist_address_hash_unique UNIQUE (address_hash);

-- Create btree index on address_hash for fast lookups
CREATE INDEX IF NOT EXISTS idx_whitelist_address_hash_btree ON whitelist(address_hash);

-- Comment
COMMENT ON COLUMN whitelist.address_hash IS 'SHA256 hash of address for unique constraint (WOTS+ addresses are too large for btree primary key)';
