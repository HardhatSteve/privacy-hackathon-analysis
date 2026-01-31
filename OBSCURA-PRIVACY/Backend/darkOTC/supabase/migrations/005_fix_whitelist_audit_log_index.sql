-- Fix whitelist_audit_log table to handle large WOTS+ addresses
-- WOTS+ addresses are 2208 bytes (4416 hex chars), which exceeds btree index limit

-- Drop existing btree index on address column
DROP INDEX IF EXISTS idx_whitelist_audit_log_address;

-- Add address_hash column for efficient lookups
ALTER TABLE whitelist_audit_log
ADD COLUMN IF NOT EXISTS address_hash TEXT;

-- Create function to generate SHA256 hash of address
CREATE OR REPLACE FUNCTION generate_address_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.address_hash := encode(digest(NEW.address, 'sha256'), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate address_hash on insert/update
DROP TRIGGER IF EXISTS trigger_generate_address_hash ON whitelist_audit_log;
CREATE TRIGGER trigger_generate_address_hash
BEFORE INSERT OR UPDATE ON whitelist_audit_log
FOR EACH ROW
EXECUTE FUNCTION generate_address_hash();

-- Create index on address_hash for efficient lookups
CREATE INDEX IF NOT EXISTS idx_whitelist_audit_log_address_hash
ON whitelist_audit_log(address_hash);

-- Backfill address_hash for existing rows
UPDATE whitelist_audit_log
SET address_hash = encode(digest(address, 'sha256'), 'hex')
WHERE address_hash IS NULL;
