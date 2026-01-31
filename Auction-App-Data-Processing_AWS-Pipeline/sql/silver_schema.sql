-- =============================================================================
-- Silver Layer Schema - Cleaned and Validated Data
-- =============================================================================
-- The Silver layer contains cleaned, validated, and enriched data.
-- This is the primary operational data store for the application.
-- =============================================================================

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS silver.users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    total_bids INTEGER DEFAULT 0 CHECK (total_bids >= 0),
    total_sales INTEGER DEFAULT 0 CHECK (total_sales >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_username ON silver.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON silver.users(email);
CREATE INDEX IF NOT EXISTS idx_users_rating ON silver.users(rating DESC);
CREATE INDEX IF NOT EXISTS idx_users_registration ON silver.users(registration_date);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON silver.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON silver.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ITEMS TABLE (Auction Listings)
-- =============================================================================
CREATE TABLE IF NOT EXISTS silver.items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES silver.users(user_id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    starting_price DECIMAL(12,2) NOT NULL CHECK (starting_price > 0),
    reserve_price DECIMAL(12,2) CHECK (reserve_price IS NULL OR reserve_price >= 0),
    current_price DECIMAL(12,2) NOT NULL CHECK (current_price >= 0),
    buy_now_price DECIMAL(12,2) CHECK (buy_now_price IS NULL OR buy_now_price > 0),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled', 'sold')),
    bid_count INTEGER DEFAULT 0 CHECK (bid_count >= 0),
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_end_after_start CHECK (end_time > start_time)
);

-- Indexes for items
CREATE INDEX IF NOT EXISTS idx_items_seller ON silver.items(seller_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON silver.items(category);
CREATE INDEX IF NOT EXISTS idx_items_status ON silver.items(status);
CREATE INDEX IF NOT EXISTS idx_items_end_time ON silver.items(end_time);
CREATE INDEX IF NOT EXISTS idx_items_active ON silver.items(status, end_time) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_items_title_search ON silver.items USING gin(title gin_trgm_ops);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_items_updated_at ON silver.items;
CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON silver.items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- BIDS TABLE (Core Streaming Data)
-- =============================================================================
CREATE TABLE IF NOT EXISTS silver.bids (
    bid_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES silver.items(item_id),
    bidder_id UUID NOT NULL REFERENCES silver.users(user_id),
    bid_amount DECIMAL(12,2) NOT NULL CHECK (bid_amount > 0),
    max_bid_amount DECIMAL(12,2) CHECK (max_bid_amount IS NULL OR max_bid_amount > 0),
    bid_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    bid_type VARCHAR(20) DEFAULT 'manual' CHECK (bid_type IN ('manual', 'proxy', 'snipe')),
    is_winning BOOLEAN DEFAULT FALSE,
    previous_price DECIMAL(12,2) NOT NULL CHECK (previous_price >= 0),
    ip_address INET,
    user_agent TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    fraud_score DECIMAL(3,2) DEFAULT 0.00 CHECK (fraud_score >= 0 AND fraud_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_bid_increment CHECK (bid_amount > previous_price)
);

-- Indexes for bids (optimized for high-volume queries)
CREATE INDEX IF NOT EXISTS idx_bids_auction ON silver.bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder ON silver.bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_timestamp ON silver.bids(bid_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bids_auction_time ON silver.bids(auction_id, bid_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bids_winning ON silver.bids(auction_id, is_winning) WHERE is_winning = TRUE;
CREATE INDEX IF NOT EXISTS idx_bids_fraud ON silver.bids(fraud_score DESC) WHERE fraud_score > 0.5;

-- Partition bids by month for better performance (optional, for very large datasets)
-- Note: Uncomment and modify if you need partitioning
-- CREATE TABLE silver.bids_partitioned (LIKE silver.bids INCLUDING ALL)
--     PARTITION BY RANGE (bid_timestamp);

-- =============================================================================
-- TRANSACTIONS TABLE (Completed Sales)
-- =============================================================================
CREATE TABLE IF NOT EXISTS silver.transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES silver.items(item_id),
    seller_id UUID NOT NULL REFERENCES silver.users(user_id),
    buyer_id UUID NOT NULL REFERENCES silver.users(user_id),
    final_price DECIMAL(12,2) NOT NULL CHECK (final_price > 0),
    platform_fee DECIMAL(12,2) NOT NULL CHECK (platform_fee >= 0),
    seller_revenue DECIMAL(12,2) NOT NULL CHECK (seller_revenue >= 0),
    payment_method VARCHAR(50) DEFAULT 'credit_card',
    transaction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    shipping_address TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_revenue_calculation CHECK (seller_revenue = final_price - platform_fee)
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_auction ON silver.transactions(auction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON silver.transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON silver.transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON silver.transactions(transaction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON silver.transactions(DATE(transaction_timestamp));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_transactions_updated_at ON silver.transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON silver.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Active auctions with current highest bid
CREATE OR REPLACE VIEW silver.active_auctions AS
SELECT 
    i.item_id,
    i.title,
    i.category,
    i.starting_price,
    i.current_price,
    i.end_time,
    i.bid_count,
    u.username as seller_name,
    i.end_time - CURRENT_TIMESTAMP as time_remaining
FROM silver.items i
JOIN silver.users u ON i.seller_id = u.user_id
WHERE i.status = 'active'
  AND i.end_time > CURRENT_TIMESTAMP
ORDER BY i.end_time ASC;

-- Recent bids with auction info
CREATE OR REPLACE VIEW silver.recent_bids AS
SELECT 
    b.bid_id,
    b.bid_amount,
    b.bid_timestamp,
    b.bid_type,
    b.is_winning,
    i.title as auction_title,
    i.current_price,
    u.username as bidder_name
FROM silver.bids b
JOIN silver.items i ON b.auction_id = i.item_id
JOIN silver.users u ON b.bidder_id = u.user_id
ORDER BY b.bid_timestamp DESC
LIMIT 100;

-- =============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- =============================================================================

-- Hourly bid statistics (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS silver.hourly_bid_stats AS
SELECT 
    DATE_TRUNC('hour', bid_timestamp) as hour,
    COUNT(*) as bid_count,
    COUNT(DISTINCT bidder_id) as unique_bidders,
    COUNT(DISTINCT auction_id) as active_auctions,
    SUM(bid_amount) as total_bid_value,
    AVG(bid_amount) as avg_bid_value
FROM silver.bids
WHERE bid_timestamp > CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', bid_timestamp)
ORDER BY hour DESC;

-- Index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_hourly_bid_stats_hour 
ON silver.hourly_bid_stats(hour);

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================
COMMENT ON TABLE silver.users IS 'User accounts for bidders and sellers';
COMMENT ON TABLE silver.items IS 'Auction listings/items for sale';
COMMENT ON TABLE silver.bids IS 'Individual bid events from streaming pipeline';
COMMENT ON TABLE silver.transactions IS 'Completed auction transactions';
COMMENT ON COLUMN silver.bids.fraud_score IS 'ML-derived fraud probability (0-1)';
COMMENT ON COLUMN silver.items.status IS 'Auction lifecycle: scheduled -> active -> ended/sold/cancelled';
