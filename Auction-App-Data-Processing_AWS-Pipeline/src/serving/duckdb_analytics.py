"""
DuckDB Analytics Engine

Provides fast OLAP queries on auction data using DuckDB.
Used for development analytics and as a Gold layer alternative.
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import duckdb
import pandas as pd

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DuckDBAnalytics:
    """
    DuckDB analytics engine for auction data.
    
    Features:
    - Fast OLAP queries on Parquet/CSV files
    - In-memory or persistent database
    - Direct PostgreSQL integration
    - Pandas DataFrame support
    """
    
    def __init__(
        self,
        database_path: Optional[str] = None,
        read_only: bool = False,
    ):
        """
        Initialize DuckDB connection.
        
        Args:
            database_path: Path to persistent database (None for in-memory)
            read_only: Open in read-only mode
        """
        self.database_path = database_path
        self.read_only = read_only
        self._conn = None
    
    @property
    def conn(self) -> duckdb.DuckDBPyConnection:
        """Get or create DuckDB connection."""
        if self._conn is None:
            if self.database_path:
                self._conn = duckdb.connect(
                    self.database_path,
                    read_only=self.read_only
                )
            else:
                self._conn = duckdb.connect(":memory:")
            
            # Configure for analytics workloads
            self._conn.execute("SET memory_limit='2GB'")
            self._conn.execute("SET threads=4")
            
            logger.info(f"DuckDB connected: {self.database_path or 'in-memory'}")
        
        return self._conn
    
    def close(self):
        """Close the database connection."""
        if self._conn:
            self._conn.close()
            self._conn = None
    
    def execute(self, query: str, params: Optional[tuple] = None) -> duckdb.DuckDBPyRelation:
        """
        Execute a SQL query.
        
        Args:
            query: SQL query
            params: Query parameters
            
        Returns:
            DuckDB relation
        """
        if params:
            return self.conn.execute(query, params)
        return self.conn.execute(query)
    
    def query_df(self, query: str, params: Optional[tuple] = None) -> pd.DataFrame:
        """
        Execute query and return as DataFrame.
        
        Args:
            query: SQL query
            params: Query parameters
            
        Returns:
            Pandas DataFrame
        """
        result = self.execute(query, params)
        return result.fetchdf()
    
    def load_parquet(
        self,
        path: Union[str, Path],
        table_name: str,
        replace: bool = True,
    ):
        """
        Load Parquet file(s) into a table.
        
        Args:
            path: Parquet file or glob pattern
            table_name: Target table name
            replace: Replace existing table
        """
        mode = "CREATE OR REPLACE" if replace else "CREATE"
        
        query = f"{mode} TABLE {table_name} AS SELECT * FROM read_parquet('{path}')"
        self.execute(query)
        
        count = self.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        logger.info(f"Loaded {count} rows into {table_name} from {path}")
    
    def load_csv(
        self,
        path: Union[str, Path],
        table_name: str,
        replace: bool = True,
        **options,
    ):
        """
        Load CSV file(s) into a table.
        
        Args:
            path: CSV file or glob pattern
            table_name: Target table name
            replace: Replace existing table
            **options: Additional CSV options (header, delimiter, etc.)
        """
        mode = "CREATE OR REPLACE" if replace else "CREATE"
        
        opts = ", ".join([f"{k}={repr(v)}" for k, v in options.items()])
        opts_str = f", {opts}" if opts else ""
        
        query = f"{mode} TABLE {table_name} AS SELECT * FROM read_csv_auto('{path}'{opts_str})"
        self.execute(query)
        
        count = self.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        logger.info(f"Loaded {count} rows into {table_name} from {path}")
    
    def load_from_postgres(
        self,
        postgres_conn_str: str,
        source_table: str,
        target_table: str,
        query: Optional[str] = None,
    ):
        """
        Load data from PostgreSQL into DuckDB.
        
        Args:
            postgres_conn_str: PostgreSQL connection string
            source_table: Source table in PostgreSQL
            target_table: Target table in DuckDB
            query: Optional custom query (uses full table if not provided)
        """
        # Install and load PostgreSQL extension
        self.execute("INSTALL postgres")
        self.execute("LOAD postgres")
        
        if query:
            load_query = f"""
                CREATE OR REPLACE TABLE {target_table} AS
                SELECT * FROM postgres_query('{postgres_conn_str}', '{query}')
            """
        else:
            load_query = f"""
                CREATE OR REPLACE TABLE {target_table} AS
                SELECT * FROM postgres_scan('{postgres_conn_str}', '{source_table}')
            """
        
        self.execute(load_query)
        logger.info(f"Loaded {source_table} from PostgreSQL into {target_table}")
    
    def register_dataframe(self, df: pd.DataFrame, name: str):
        """
        Register a DataFrame as a virtual table.
        
        Args:
            df: Pandas DataFrame
            name: Table name to use in queries
        """
        self.conn.register(name, df)
        logger.info(f"Registered DataFrame as table: {name}")
    
    # =========================================================================
    # AUCTION ANALYTICS QUERIES
    # =========================================================================
    
    def daily_revenue_summary(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> pd.DataFrame:
        """
        Get daily revenue summary.
        
        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            
        Returns:
            DataFrame with daily revenue metrics
        """
        query = """
            SELECT 
                DATE_TRUNC('day', transaction_timestamp) as date,
                COUNT(*) as transactions,
                COUNT(DISTINCT seller_id) as unique_sellers,
                COUNT(DISTINCT buyer_id) as unique_buyers,
                SUM(final_price) as gross_revenue,
                SUM(platform_fee) as platform_revenue,
                AVG(final_price) as avg_transaction,
                MAX(final_price) as max_transaction
            FROM transactions
            WHERE 1=1
        """
        
        if start_date:
            query += f" AND transaction_timestamp >= '{start_date}'"
        if end_date:
            query += f" AND transaction_timestamp <= '{end_date}'"
        
        query += """
            GROUP BY DATE_TRUNC('day', transaction_timestamp)
            ORDER BY date DESC
        """
        
        return self.query_df(query)
    
    def auction_performance_analysis(self) -> pd.DataFrame:
        """
        Analyze auction performance metrics.
        
        Returns:
            DataFrame with auction performance stats
        """
        query = """
            SELECT 
                i.category,
                COUNT(DISTINCT i.item_id) as total_auctions,
                COUNT(DISTINCT CASE WHEN i.status = 'sold' THEN i.item_id END) as sold_auctions,
                ROUND(COUNT(DISTINCT CASE WHEN i.status = 'sold' THEN i.item_id END) * 100.0 / 
                      NULLIF(COUNT(DISTINCT i.item_id), 0), 2) as success_rate,
                COUNT(b.bid_id) as total_bids,
                ROUND(COUNT(b.bid_id) * 1.0 / NULLIF(COUNT(DISTINCT i.item_id), 0), 2) as avg_bids_per_auction,
                AVG(i.current_price - i.starting_price) as avg_price_increase,
                MAX(i.current_price) as highest_sale
            FROM items i
            LEFT JOIN bids b ON i.item_id = b.auction_id
            GROUP BY i.category
            ORDER BY total_auctions DESC
        """
        
        return self.query_df(query)
    
    def bidder_segmentation(self) -> pd.DataFrame:
        """
        Segment bidders by behavior.
        
        Returns:
            DataFrame with bidder segments
        """
        query = """
            WITH bidder_stats AS (
                SELECT 
                    bidder_id,
                    COUNT(*) as total_bids,
                    COUNT(DISTINCT auction_id) as auctions_participated,
                    SUM(CASE WHEN is_winning THEN 1 ELSE 0 END) as wins,
                    AVG(bid_amount) as avg_bid,
                    MAX(bid_timestamp) as last_active
                FROM bids
                GROUP BY bidder_id
            )
            SELECT 
                CASE 
                    WHEN total_bids >= 100 THEN 'Power Bidder'
                    WHEN total_bids >= 20 THEN 'Active Bidder'
                    WHEN total_bids >= 5 THEN 'Casual Bidder'
                    ELSE 'New Bidder'
                END as segment,
                COUNT(*) as bidder_count,
                SUM(total_bids) as total_bids,
                ROUND(AVG(wins * 100.0 / NULLIF(total_bids, 0)), 2) as avg_win_rate,
                AVG(avg_bid) as avg_bid_value
            FROM bidder_stats
            GROUP BY 1
            ORDER BY bidder_count DESC
        """
        
        return self.query_df(query)
    
    def hourly_activity_pattern(self) -> pd.DataFrame:
        """
        Analyze bidding activity by hour of day.
        
        Returns:
            DataFrame with hourly patterns
        """
        query = """
            SELECT 
                EXTRACT(HOUR FROM bid_timestamp) as hour,
                COUNT(*) as bid_count,
                COUNT(DISTINCT bidder_id) as unique_bidders,
                COUNT(DISTINCT auction_id) as active_auctions,
                AVG(bid_amount) as avg_bid
            FROM bids
            GROUP BY EXTRACT(HOUR FROM bid_timestamp)
            ORDER BY hour
        """
        
        return self.query_df(query)
    
    def top_sellers(self, limit: int = 20) -> pd.DataFrame:
        """
        Get top sellers by revenue.
        
        Args:
            limit: Number of sellers to return
            
        Returns:
            DataFrame with top sellers
        """
        query = f"""
            SELECT 
                t.seller_id,
                COUNT(*) as total_sales,
                SUM(t.final_price) as gross_revenue,
                SUM(t.seller_revenue) as net_revenue,
                AVG(t.final_price) as avg_sale,
                MAX(t.final_price) as highest_sale
            FROM transactions t
            GROUP BY t.seller_id
            ORDER BY gross_revenue DESC
            LIMIT {limit}
        """
        
        return self.query_df(query)
    
    def fraud_analysis(self) -> pd.DataFrame:
        """
        Analyze fraud detection metrics.
        
        Returns:
            DataFrame with fraud analysis
        """
        query = """
            SELECT 
                DATE_TRUNC('day', bid_timestamp) as date,
                COUNT(*) as total_bids,
                SUM(CASE WHEN fraud_score > 0.5 THEN 1 ELSE 0 END) as flagged_bids,
                ROUND(SUM(CASE WHEN fraud_score > 0.5 THEN 1 ELSE 0 END) * 100.0 / 
                      NULLIF(COUNT(*), 0), 2) as flagged_rate,
                AVG(fraud_score) as avg_fraud_score,
                MAX(fraud_score) as max_fraud_score
            FROM bids
            GROUP BY DATE_TRUNC('day', bid_timestamp)
            ORDER BY date DESC
        """
        
        return self.query_df(query)
    
    def bid_timing_analysis(self) -> pd.DataFrame:
        """
        Analyze bid timing patterns (sniping detection).
        
        Returns:
            DataFrame with timing analysis
        """
        query = """
            WITH bid_timing AS (
                SELECT 
                    b.bid_id,
                    b.auction_id,
                    b.bid_type,
                    i.end_time,
                    b.bid_timestamp,
                    EXTRACT(EPOCH FROM (i.end_time - b.bid_timestamp)) as seconds_before_end
                FROM bids b
                JOIN items i ON b.auction_id = i.item_id
            )
            SELECT 
                CASE 
                    WHEN seconds_before_end <= 60 THEN 'Last Minute'
                    WHEN seconds_before_end <= 300 THEN '1-5 Minutes'
                    WHEN seconds_before_end <= 3600 THEN '5-60 Minutes'
                    ELSE 'Early Bid'
                END as timing_category,
                COUNT(*) as bid_count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
                AVG(CASE WHEN bid_type = 'snipe' THEN 1 ELSE 0 END) * 100 as snipe_rate
            FROM bid_timing
            WHERE seconds_before_end > 0
            GROUP BY 1
            ORDER BY 
                CASE timing_category
                    WHEN 'Last Minute' THEN 1
                    WHEN '1-5 Minutes' THEN 2
                    WHEN '5-60 Minutes' THEN 3
                    ELSE 4
                END
        """
        
        return self.query_df(query)
    
    def export_to_parquet(
        self,
        query: str,
        output_path: Union[str, Path],
        compression: str = "zstd",
    ):
        """
        Export query results to Parquet file.
        
        Args:
            query: SQL query
            output_path: Output file path
            compression: Compression codec
        """
        export_query = f"""
            COPY ({query}) TO '{output_path}'
            (FORMAT PARQUET, COMPRESSION '{compression}')
        """
        
        self.execute(export_query)
        logger.info(f"Exported results to {output_path}")
    
    def table_stats(self, table_name: str) -> Dict[str, Any]:
        """
        Get statistics for a table.
        
        Args:
            table_name: Table name
            
        Returns:
            Dictionary with table statistics
        """
        count = self.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        
        columns = self.query_df(f"DESCRIBE {table_name}")
        
        return {
            "table_name": table_name,
            "row_count": count,
            "columns": columns.to_dict('records'),
        }


def run_analytics_demo():
    """Run a demo of the analytics capabilities."""
    db = DuckDBAnalytics()
    
    # Create sample data
    sample_bids = pd.DataFrame({
        'bid_id': range(1000),
        'auction_id': [i % 100 for i in range(1000)],
        'bidder_id': [i % 50 for i in range(1000)],
        'bid_amount': [100 + i * 0.5 for i in range(1000)],
        'bid_timestamp': pd.date_range('2024-01-01', periods=1000, freq='h'),
        'bid_type': ['manual'] * 900 + ['snipe'] * 100,
        'is_winning': [i % 10 == 0 for i in range(1000)],
        'fraud_score': [0.1 + (i % 10) * 0.05 for i in range(1000)],
    })
    
    db.register_dataframe(sample_bids, 'bids')
    
    print("Bidder Segmentation:")
    print(db.bidder_segmentation())
    
    print("\nHourly Activity:")
    print(db.hourly_activity_pattern())
    
    db.close()


if __name__ == "__main__":
    run_analytics_demo()
