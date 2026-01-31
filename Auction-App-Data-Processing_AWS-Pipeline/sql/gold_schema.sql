-- =============================================================================
-- Gold Layer Schema - Aggregated Analytics Data
-- =============================================================================
-- The Gold layer contains business-level aggregations and metrics.
-- Optimized for dashboard queries and reporting.
-- =============================================================================

-- =============================================================================
-- DAILY REVENUE
-- =============================================================================
CREATE TABLE IF NOT EXISTS gold.daily_revenue (
    report_date DATE PRIMARY KEY,
    total_transactions INTEGER NOT NULL DEFAULT 0,
    unique_auctions INTEGER NOT NULL DEFAULT 0,
    unique_sellers INTEGER NOT NULL DEFAULT 0,
    unique_buyers INTEGER NOT NULL DEFAULT 0,
    gross_revenue DECIMAL(14,2) NOT NULL DEFAULT 0,
    platform_revenue DECIMAL(14,2) NOT NULL DEFAULT 0,
    seller_payouts DECIMAL(14,2) NOT NULL DEFAULT 0,
    avg_transaction_value DECIMAL(12,2),
    max_transaction_value DECIMAL(12,2),
    min_transaction_value DECIMAL(12,2),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_revenue_date ON gold.daily_revenue(report_date DESC);

-- =============================================================================
-- AUCTION PERFORMANCE
-- =============================================================================
CREATE TABLE IF NOT EXISTS gold.auction_performance (
    auction_id UUID PRIMARY KEY,
    seller_id UUID NOT NULL,
    title VARCHAR(200),
    category VARCHAR(50),
    starting_price DECIMAL(12,2),
    reserve_price DECIMAL(12,2),
    status VARCHAR(20),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    bid_count INTEGER DEFAULT 0,
    unique_bidders INTEGER DEFAULT 0,
    winning_bid DECIMAL(12,2),
    first_bid DECIMAL(12,2),
    avg_bid DECIMAL(12,2),
    last_bid_time TIMESTAMP WITH TIME ZONE,
    first_bid_time TIMESTAMP WITH TIME ZONE,
    price_increase_pct DECIMAL(8,2) DEFAULT 0,
    auction_duration_hours DECIMAL(8,2) DEFAULT 0,
    reserve_met BOOLEAN DEFAULT TRUE,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auction_perf_seller ON gold.auction_performance(seller_id);
CREATE INDEX IF NOT EXISTS idx_auction_perf_category ON gold.auction_performance(category);
CREATE INDEX IF NOT EXISTS idx_auction_perf_status ON gold.auction_performance(status);

-- =============================================================================
-- BIDDER ANALYTICS
-- =============================================================================
CREATE TABLE IF NOT EXISTS gold.bidder_analytics (
    bidder_id UUID PRIMARY KEY,
    username VARCHAR(50),
    registration_date TIMESTAMP WITH TIME ZONE,
    rating DECIMAL(3,2),
    is_verified BOOLEAN,
    total_bids INTEGER DEFAULT 0,
    auctions_participated INTEGER DEFAULT 0,
    winning_bids INTEGER DEFAULT 0,
    total_bid_value DECIMAL(14,2) DEFAULT 0,
    avg_bid_value DECIMAL(12,2),
    last_activity TIMESTAMP WITH TIME ZONE,
    win_rate DECIMAL(5,2) DEFAULT 0,
    days_since_registration INTEGER DEFAULT 0,
    bidder_segment VARCHAR(20) DEFAULT 'new_bidder',
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bidder_segment ON gold.bidder_analytics(bidder_segment);
CREATE INDEX IF NOT EXISTS idx_bidder_activity ON gold.bidder_analytics(last_activity DESC);

-- =============================================================================
-- SELLER RANKINGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS gold.seller_rankings (
    seller_id UUID PRIMARY KEY,
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(14,2) DEFAULT 0,
    net_revenue DECIMAL(14,2) DEFAULT 0,
    avg_sale_price DECIMAL(12,2),
    highest_sale DECIMAL(12,2),
    total_listings INTEGER DEFAULT 0,
    categories_sold INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    revenue_rank INTEGER,
    sales_rank INTEGER,
    seller_tier VARCHAR(20) DEFAULT 'bronze',
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seller_tier ON gold.seller_rankings(seller_tier);
CREATE INDEX IF NOT EXISTS idx_seller_revenue_rank ON gold.seller_rankings(revenue_rank);

-- =============================================================================
-- HOURLY ACTIVITY
-- =============================================================================
CREATE TABLE IF NOT EXISTS gold.hourly_activity (
    bid_date DATE NOT NULL,
    bid_hour INTEGER NOT NULL CHECK (bid_hour >= 0 AND bid_hour <= 23),
    bid_count INTEGER DEFAULT 0,
    unique_bidders INTEGER DEFAULT 0,
    active_auctions INTEGER DEFAULT 0,
    total_bid_value DECIMAL(14,2) DEFAULT 0,
    avg_bid_value DECIMAL(12,2),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (bid_date, bid_hour)
);

CREATE INDEX IF NOT EXISTS idx_hourly_date ON gold.hourly_activity(bid_date DESC);

-- =============================================================================
-- CATEGORY PERFORMANCE
-- =============================================================================
CREATE TABLE IF NOT EXISTS gold.category_performance (
    category VARCHAR(50) PRIMARY KEY,
    total_auctions INTEGER DEFAULT 0,
    active_auctions INTEGER DEFAULT 0,
    completed_auctions INTEGER DEFAULT 0,
    total_bids INTEGER DEFAULT 0,
    total_revenue DECIMAL(14,2) DEFAULT 0,
    avg_sale_price DECIMAL(12,2),
    avg_bids_per_auction DECIMAL(8,2),
    success_rate DECIMAL(5,2) DEFAULT 0,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- DASHBOARD SUMMARY VIEW
-- =============================================================================
CREATE OR REPLACE VIEW gold.dashboard_summary AS
SELECT
    (SELECT COUNT(*) FROM silver.users) as total_users,
    (SELECT COUNT(*) FROM silver.items WHERE status = 'active') as active_auctions,
    (SELECT COUNT(*) FROM silver.bids WHERE bid_timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours') as bids_24h,
    (SELECT COALESCE(SUM(final_price), 0) FROM silver.transactions WHERE transaction_timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours') as revenue_24h,
    (SELECT COALESCE(SUM(gross_revenue), 0) FROM gold.daily_revenue WHERE report_date > CURRENT_DATE - INTERVAL '30 days') as revenue_30d,
    (SELECT COUNT(DISTINCT bidder_id) FROM silver.bids WHERE bid_timestamp > CURRENT_TIMESTAMP - INTERVAL '7 days') as active_bidders_7d;

COMMENT ON TABLE gold.daily_revenue IS 'Daily aggregated revenue metrics';
COMMENT ON TABLE gold.auction_performance IS 'Per-auction performance metrics';
COMMENT ON TABLE gold.bidder_analytics IS 'Bidder behavior and segmentation';
COMMENT ON TABLE gold.seller_rankings IS 'Seller performance rankings and tiers';
COMMENT ON TABLE gold.hourly_activity IS 'Hourly bidding activity patterns';
