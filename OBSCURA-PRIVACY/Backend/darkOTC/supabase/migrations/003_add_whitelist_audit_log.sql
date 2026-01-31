-- Migration: Add whitelist_audit_log table
-- Description: Creates audit log table for tracking whitelist changes
-- Requirements: 33.6 - Log whitelist changes for audit

-- Create whitelist_audit_log table
CREATE TABLE IF NOT EXISTS whitelist_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('add', 'remove')),
  address TEXT NOT NULL,
  admin_address TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_whitelist_audit_log_timestamp ON whitelist_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whitelist_audit_log_address ON whitelist_audit_log(address);
CREATE INDEX IF NOT EXISTS idx_whitelist_audit_log_admin ON whitelist_audit_log(admin_address);
CREATE INDEX IF NOT EXISTS idx_whitelist_audit_log_action ON whitelist_audit_log(action);

-- Enable Row Level Security
ALTER TABLE whitelist_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (audit log is read-only for most users)
CREATE POLICY "Allow all operations on whitelist_audit_log" ON whitelist_audit_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE whitelist_audit_log IS 'Audit log for whitelist changes (Requirement 33.6)';

