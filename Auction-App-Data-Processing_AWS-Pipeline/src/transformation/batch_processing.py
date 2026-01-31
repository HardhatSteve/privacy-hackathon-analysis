"""
Spark Batch Processing Job

Processes historical auction data for analytics and reporting.
Runs on a schedule via Airflow for daily aggregations.
"""

import logging
import os
from datetime import datetime, timedelta
from typing import Optional

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    avg,
    col,
    count,
    countDistinct,
    current_timestamp,
    date_format,
    datediff,
    desc,
    expr,
    first,
    hour,
    lit,
    max as spark_max,
    min as spark_min,
    round as spark_round,
    sum as spark_sum,
    to_date,
    when,
)
from pyspark.sql.window import Window

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AuctionBatchProcessor:
    """
    Batch processing for auction analytics.
    
    Implements the Gold layer transformations:
    - Daily revenue aggregations
    - User behavior analytics
    - Auction performance metrics
    - Seller/Buyer rankings
    """
    
    def __init__(
        self,
        app_name: str = "AuctionBatchProcessor",
        postgres_url: str = "jdbc:postgresql://postgres:5432/auction",
        postgres_user: str = "auction",
        postgres_password: str = "auction123",
        local_mode: bool = False,
    ):
        """
        Initialize the batch processor.
        
        Args:
            app_name: Spark application name
            postgres_url: PostgreSQL JDBC URL
            postgres_user: Database user
            postgres_password: Database password
            local_mode: Run in local mode for development
        """
        self.app_name = app_name
        self.postgres_url = postgres_url
        self.postgres_user = postgres_user
        self.postgres_password = postgres_password
        self.local_mode = local_mode
        
        self.spark: Optional[SparkSession] = None
        self.jdbc_props = {
            "user": postgres_user,
            "password": postgres_password,
            "driver": "org.postgresql.Driver",
        }
    
    def create_spark_session(self) -> SparkSession:
        """Create and configure Spark session."""
        builder = SparkSession.builder.appName(self.app_name)
        
        if self.local_mode:
            builder = builder.master("local[*]")
        
        # Configure packages
        builder = builder.config(
            "spark.jars.packages",
            "org.postgresql:postgresql:42.6.0"
        )
        
        # Performance configurations
        builder = builder.config("spark.sql.shuffle.partitions", "200")
        builder = builder.config("spark.sql.adaptive.enabled", "true")
        builder = builder.config("spark.sql.adaptive.coalescePartitions.enabled", "true")
        
        self.spark = builder.getOrCreate()
        self.spark.sparkContext.setLogLevel("WARN")
        
        logger.info(f"Created Spark session: {self.app_name}")
        return self.spark
    
    def read_from_postgres(self, table: str):
        """
        Read data from PostgreSQL table.
        
        Args:
            table: Table name (with schema, e.g., 'silver.bids')
            
        Returns:
            DataFrame
        """
        if not self.spark:
            self.create_spark_session()
        
        df = (
            self.spark
            .read
            .jdbc(
                url=self.postgres_url,
                table=table,
                properties=self.jdbc_props,
            )
        )
        
        logger.info(f"Read {df.count()} rows from {table}")
        return df
    
    def write_to_postgres(self, df, table: str, mode: str = "overwrite"):
        """
        Write DataFrame to PostgreSQL table.
        
        Args:
            df: DataFrame to write
            table: Target table name
            mode: Write mode (overwrite, append)
        """
        (
            df
            .write
            .jdbc(
                url=self.postgres_url,
                table=table,
                mode=mode,
                properties=self.jdbc_props,
            )
        )
        
        logger.info(f"Wrote {df.count()} rows to {table}")
    
    def calculate_daily_revenue(
        self,
        transactions_df,
        process_date: Optional[datetime] = None,
    ):
        """
        Calculate daily revenue metrics.
        
        Args:
            transactions_df: Transactions DataFrame
            process_date: Date to process (default: yesterday)
            
        Returns:
            Daily revenue DataFrame
        """
        if process_date is None:
            process_date = datetime.utcnow() - timedelta(days=1)
        
        date_str = process_date.strftime("%Y-%m-%d")
        
        daily_revenue = (
            transactions_df
            .filter(to_date(col("transaction_timestamp")) == lit(date_str))
            .agg(
                lit(date_str).alias("report_date"),
                count("*").alias("total_transactions"),
                countDistinct("auction_id").alias("unique_auctions"),
                countDistinct("seller_id").alias("unique_sellers"),
                countDistinct("buyer_id").alias("unique_buyers"),
                spark_sum("final_price").alias("gross_revenue"),
                spark_sum("platform_fee").alias("platform_revenue"),
                spark_sum("seller_revenue").alias("seller_payouts"),
                avg("final_price").alias("avg_transaction_value"),
                spark_max("final_price").alias("max_transaction_value"),
                spark_min("final_price").alias("min_transaction_value"),
            )
            .withColumn("processed_at", current_timestamp())
        )
        
        return daily_revenue
    
    def calculate_auction_performance(self, bids_df, items_df):
        """
        Calculate auction performance metrics.
        
        Args:
            bids_df: Bids DataFrame
            items_df: Items DataFrame
            
        Returns:
            Auction performance DataFrame
        """
        # Aggregate bids per auction
        bid_stats = (
            bids_df
            .groupBy("auction_id")
            .agg(
                count("*").alias("total_bids"),
                countDistinct("bidder_id").alias("unique_bidders"),
                spark_max("bid_amount").alias("winning_bid"),
                spark_min("bid_amount").alias("first_bid"),
                avg("bid_amount").alias("avg_bid"),
                spark_max("bid_timestamp").alias("last_bid_time"),
                spark_min("bid_timestamp").alias("first_bid_time"),
            )
        )
        
        # Join with items for full context
        auction_perf = (
            items_df
            .join(bid_stats, items_df.item_id == bid_stats.auction_id, "left")
            .select(
                items_df.item_id.alias("auction_id"),
                items_df.seller_id,
                items_df.title,
                items_df.category,
                items_df.starting_price,
                items_df.reserve_price,
                items_df.status,
                items_df.start_time,
                items_df.end_time,
                col("total_bids").alias("bid_count"),
                col("unique_bidders"),
                col("winning_bid"),
                col("first_bid"),
                col("avg_bid"),
                col("last_bid_time"),
                col("first_bid_time"),
            )
            .withColumn(
                "price_increase_pct",
                when(
                    col("winning_bid").isNotNull() & (col("starting_price") > 0),
                    spark_round(
                        (col("winning_bid") - col("starting_price")) / col("starting_price") * 100,
                        2
                    )
                ).otherwise(lit(0))
            )
            .withColumn(
                "auction_duration_hours",
                when(
                    col("end_time").isNotNull() & col("start_time").isNotNull(),
                    spark_round(
                        (col("end_time").cast("long") - col("start_time").cast("long")) / 3600,
                        2
                    )
                ).otherwise(lit(0))
            )
            .withColumn(
                "reserve_met",
                when(
                    col("reserve_price").isNotNull(),
                    col("winning_bid") >= col("reserve_price")
                ).otherwise(lit(True))
            )
            .withColumn("processed_at", current_timestamp())
        )
        
        return auction_perf
    
    def calculate_bidder_analytics(self, bids_df, users_df):
        """
        Calculate bidder behavior analytics.
        
        Args:
            bids_df: Bids DataFrame
            users_df: Users DataFrame
            
        Returns:
            Bidder analytics DataFrame
        """
        bidder_stats = (
            bids_df
            .groupBy("bidder_id")
            .agg(
                count("*").alias("total_bids"),
                countDistinct("auction_id").alias("auctions_participated"),
                spark_sum(
                    when(col("is_winning"), 1).otherwise(0)
                ).alias("winning_bids"),
                spark_sum("bid_amount").alias("total_bid_value"),
                avg("bid_amount").alias("avg_bid_value"),
                spark_max("bid_timestamp").alias("last_activity"),
            )
        )
        
        # Join with user data
        bidder_analytics = (
            users_df
            .join(bidder_stats, users_df.user_id == bidder_stats.bidder_id, "left")
            .select(
                users_df.user_id.alias("bidder_id"),
                users_df.username,
                users_df.registration_date,
                users_df.rating,
                users_df.is_verified,
                col("total_bids"),
                col("auctions_participated"),
                col("winning_bids"),
                col("total_bid_value"),
                col("avg_bid_value"),
                col("last_activity"),
            )
            .withColumn(
                "win_rate",
                when(
                    col("total_bids") > 0,
                    spark_round(col("winning_bids") / col("total_bids") * 100, 2)
                ).otherwise(lit(0))
            )
            .withColumn(
                "days_since_registration",
                datediff(current_timestamp(), col("registration_date"))
            )
            .withColumn(
                "bidder_segment",
                when(col("total_bids") >= 100, "power_bidder")
                .when(col("total_bids") >= 20, "active_bidder")
                .when(col("total_bids") >= 5, "casual_bidder")
                .otherwise("new_bidder")
            )
            .withColumn("processed_at", current_timestamp())
        )
        
        return bidder_analytics
    
    def calculate_seller_rankings(self, items_df, transactions_df):
        """
        Calculate seller performance rankings.
        
        Args:
            items_df: Items DataFrame
            transactions_df: Transactions DataFrame
            
        Returns:
            Seller rankings DataFrame
        """
        seller_stats = (
            transactions_df
            .groupBy("seller_id")
            .agg(
                count("*").alias("total_sales"),
                spark_sum("final_price").alias("total_revenue"),
                spark_sum("seller_revenue").alias("net_revenue"),
                avg("final_price").alias("avg_sale_price"),
                spark_max("final_price").alias("highest_sale"),
            )
        )
        
        # Calculate listing stats
        listing_stats = (
            items_df
            .groupBy("seller_id")
            .agg(
                count("*").alias("total_listings"),
                countDistinct("category").alias("categories_sold"),
            )
        )
        
        # Combine and rank
        window_spec = Window.orderBy(desc("total_revenue"))
        
        seller_rankings = (
            seller_stats
            .join(listing_stats, "seller_id", "left")
            .withColumn(
                "conversion_rate",
                when(
                    col("total_listings") > 0,
                    spark_round(col("total_sales") / col("total_listings") * 100, 2)
                ).otherwise(lit(0))
            )
            .withColumn("revenue_rank", expr("row_number() over (order by total_revenue desc)"))
            .withColumn("sales_rank", expr("row_number() over (order by total_sales desc)"))
            .withColumn(
                "seller_tier",
                when(col("total_revenue") >= 10000, "platinum")
                .when(col("total_revenue") >= 5000, "gold")
                .when(col("total_revenue") >= 1000, "silver")
                .otherwise("bronze")
            )
            .withColumn("processed_at", current_timestamp())
        )
        
        return seller_rankings
    
    def calculate_hourly_activity(self, bids_df):
        """
        Calculate hourly bidding activity patterns.
        
        Args:
            bids_df: Bids DataFrame
            
        Returns:
            Hourly activity DataFrame
        """
        hourly_activity = (
            bids_df
            .withColumn("bid_hour", hour(col("bid_timestamp")))
            .withColumn("bid_date", to_date(col("bid_timestamp")))
            .groupBy("bid_date", "bid_hour")
            .agg(
                count("*").alias("bid_count"),
                countDistinct("bidder_id").alias("unique_bidders"),
                countDistinct("auction_id").alias("active_auctions"),
                spark_sum("bid_amount").alias("total_bid_value"),
                avg("bid_amount").alias("avg_bid_value"),
            )
            .orderBy("bid_date", "bid_hour")
            .withColumn("processed_at", current_timestamp())
        )
        
        return hourly_activity
    
    def run_daily_batch(self, process_date: Optional[datetime] = None):
        """
        Run the complete daily batch processing job.
        
        Args:
            process_date: Date to process (default: yesterday)
        """
        logger.info("Starting daily batch processing...")
        
        if not self.spark:
            self.create_spark_session()
        
        # Read source data
        logger.info("Reading source data...")
        bids_df = self.read_from_postgres("silver.bids")
        items_df = self.read_from_postgres("silver.items")
        users_df = self.read_from_postgres("silver.users")
        transactions_df = self.read_from_postgres("silver.transactions")
        
        # Calculate and write aggregations
        logger.info("Calculating daily revenue...")
        daily_revenue = self.calculate_daily_revenue(transactions_df, process_date)
        self.write_to_postgres(daily_revenue, "gold.daily_revenue", "append")
        
        logger.info("Calculating auction performance...")
        auction_perf = self.calculate_auction_performance(bids_df, items_df)
        self.write_to_postgres(auction_perf, "gold.auction_performance", "overwrite")
        
        logger.info("Calculating bidder analytics...")
        bidder_analytics = self.calculate_bidder_analytics(bids_df, users_df)
        self.write_to_postgres(bidder_analytics, "gold.bidder_analytics", "overwrite")
        
        logger.info("Calculating seller rankings...")
        seller_rankings = self.calculate_seller_rankings(items_df, transactions_df)
        self.write_to_postgres(seller_rankings, "gold.seller_rankings", "overwrite")
        
        logger.info("Calculating hourly activity...")
        hourly_activity = self.calculate_hourly_activity(bids_df)
        self.write_to_postgres(hourly_activity, "gold.hourly_activity", "overwrite")
        
        logger.info("Daily batch processing complete!")
    
    def stop(self):
        """Stop the Spark session."""
        if self.spark:
            self.spark.stop()
            logger.info("Spark session stopped")


def main():
    """Main entry point for batch processing."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Auction Batch Processor")
    parser.add_argument(
        "--local",
        action="store_true",
        help="Run in local mode"
    )
    parser.add_argument(
        "--date",
        default=None,
        help="Date to process (YYYY-MM-DD)"
    )
    parser.add_argument(
        "--postgres-url",
        default=os.getenv("POSTGRES_URL", "jdbc:postgresql://postgres:5432/auction"),
        help="PostgreSQL JDBC URL"
    )
    
    args = parser.parse_args()
    
    process_date = None
    if args.date:
        process_date = datetime.strptime(args.date, "%Y-%m-%d")
    
    processor = AuctionBatchProcessor(
        postgres_url=args.postgres_url,
        local_mode=args.local,
    )
    
    try:
        processor.run_daily_batch(process_date)
    except Exception as e:
        logger.error(f"Batch processing failed: {e}")
        raise
    finally:
        processor.stop()


if __name__ == "__main__":
    main()
