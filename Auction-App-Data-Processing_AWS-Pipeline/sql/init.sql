-- =============================================================================
-- Auction Pipeline Database Initialization
-- =============================================================================
-- This script sets up the base database structure for the auction pipeline.
-- Run order: 1. init.sql -> 2. silver_schema.sql -> 3. gold_schema.sql
-- =============================================================================

-- Create schemas for medallion architecture
CREATE SCHEMA IF NOT EXISTS bronze;
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA bronze TO auction;
GRANT ALL PRIVILEGES ON SCHEMA silver TO auction;
GRANT ALL PRIVILEGES ON SCHEMA gold TO auction;

-- =============================================================================
-- Extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- =============================================================================
-- Utility Functions
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- Airflow metadata tables (if not using separate DB)
-- =============================================================================
-- Note: Airflow will create its own tables on first run
-- This is just a placeholder to ensure the schema is ready
