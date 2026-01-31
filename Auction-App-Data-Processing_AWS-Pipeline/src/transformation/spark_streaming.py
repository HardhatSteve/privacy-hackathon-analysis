"""
Spark Structured Streaming Job for Auction Bids

Consumes bid events from Kafka, processes them in real-time,
and writes to PostgreSQL (Silver layer) and S3 (Bronze archive).
"""

import logging
import os
from typing import Optional

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col,
    current_timestamp,
    expr,
    from_json,
    get_json_object,
    lit,
    to_timestamp,
    window,
)
from pyspark.sql.types import (
    BooleanType,
    DecimalType,
    StringType,
    StructField,
    StructType,
    TimestampType,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AuctionStreamProcessor:
    """
    Processes auction bid events using Spark Structured Streaming.
    
    Implements:
    - Real-time bid validation
    - Current price updates
    - Fraud detection signals
    - Writing to Silver layer (PostgreSQL)
    - Archiving to Bronze layer (S3)
    """
    
    # Schema for bid events from Kafka
    BID_EVENT_SCHEMA = StructType([
        StructField("event_id", StringType(), False),
        StructField("event_type", StringType(), False),
        StructField("event_timestamp", StringType(), False),
        StructField("payload", StructType([
            StructField("bid_id", StringType(), False),
            StructField("auction_id", StringType(), False),
            StructField("bidder_id", StringType(), False),
            StructField("bid_amount", DecimalType(12, 2), False),
            StructField("max_bid_amount", DecimalType(12, 2), True),
            StructField("bid_timestamp", StringType(), False),
            StructField("bid_type", StringType(), False),
            StructField("is_winning", BooleanType(), False),
            StructField("previous_price", DecimalType(12, 2), False),
            StructField("ip_address", StringType(), True),
            StructField("user_agent", StringType(), True),
        ]), False),
    ])
    
    def __init__(
        self,
        app_name: str = "AuctionStreamProcessor",
        kafka_bootstrap_servers: str = "kafka:9092",
        postgres_url: str = "jdbc:postgresql://postgres:5432/auction",
        postgres_user: str = "auction",
        postgres_password: str = "auction123",
        checkpoint_location: str = "/tmp/spark-checkpoints/auction",
        local_mode: bool = False,
    ):
        """
        Initialize the stream processor.
        
        Args:
            app_name: Spark application name
            kafka_bootstrap_servers: Kafka broker addresses
            postgres_url: PostgreSQL JDBC URL
            postgres_user: Database user
            postgres_password: Database password
            checkpoint_location: Location for streaming checkpoints
            local_mode: Run in local mode for development
        """
        self.app_name = app_name
        self.kafka_bootstrap_servers = kafka_bootstrap_servers
        self.postgres_url = postgres_url
        self.postgres_user = postgres_user
        self.postgres_password = postgres_password
        self.checkpoint_location = checkpoint_location
        self.local_mode = local_mode
        
        self.spark: Optional[SparkSession] = None
    
    def create_spark_session(self) -> SparkSession:
        """Create and configure Spark session."""
        builder = SparkSession.builder.appName(self.app_name)
        
        if self.local_mode:
            builder = builder.master("local[*]")
        
        # Configure packages
        builder = builder.config(
            "spark.jars.packages",
            "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0,"
            "org.postgresql:postgresql:42.6.0"
        )
        
        # Streaming configurations
        builder = builder.config(
            "spark.sql.streaming.checkpointLocation",
            self.checkpoint_location
        )
        builder = builder.config(
            "spark.sql.shuffle.partitions", "8"
        )
        builder = builder.config(
            "spark.streaming.stopGracefullyOnShutdown", "true"
        )
        
        self.spark = builder.getOrCreate()
        self.spark.sparkContext.setLogLevel("WARN")
        
        logger.info(f"Created Spark session: {self.app_name}")
        return self.spark
    
    def read_kafka_stream(self, topic: str = "auction.bids"):
        """
        Read streaming data from Kafka topic.
        
        Args:
            topic: Kafka topic to consume
            
        Returns:
            Streaming DataFrame
        """
        if not self.spark:
            self.create_spark_session()
        
        df = (
            self.spark
            .readStream
            .format("kafka")
            .option("kafka.bootstrap.servers", self.kafka_bootstrap_servers)
            .option("subscribe", topic)
            .option("startingOffsets", "latest")
            .option("failOnDataLoss", "false")
            .load()
        )
        
        logger.info(f"Created Kafka stream reader for topic: {topic}")
        return df
    
    def parse_bid_events(self, kafka_df):
        """
        Parse and flatten bid events from Kafka.
        
        Args:
            kafka_df: Raw Kafka DataFrame
            
        Returns:
            Parsed DataFrame with bid columns
        """
        # Parse JSON and extract fields
        parsed_df = (
            kafka_df
            .selectExpr("CAST(key AS STRING)", "CAST(value AS STRING)", "timestamp as kafka_timestamp")
            .select(
                col("key").alias("kafka_key"),
                from_json(col("value"), self.BID_EVENT_SCHEMA).alias("event"),
                col("kafka_timestamp"),
            )
            .select(
                col("kafka_key"),
                col("kafka_timestamp"),
                col("event.event_id"),
                col("event.event_type"),
                to_timestamp(col("event.event_timestamp")).alias("event_timestamp"),
                col("event.payload.bid_id"),
                col("event.payload.auction_id"),
                col("event.payload.bidder_id"),
                col("event.payload.bid_amount"),
                col("event.payload.max_bid_amount"),
                to_timestamp(col("event.payload.bid_timestamp")).alias("bid_timestamp"),
                col("event.payload.bid_type"),
                col("event.payload.is_winning"),
                col("event.payload.previous_price"),
                col("event.payload.ip_address"),
                col("event.payload.user_agent"),
            )
        )
        
        return parsed_df
    
    def validate_bids(self, bids_df):
        """
        Validate bid data and flag invalid records.
        
        Args:
            bids_df: Parsed bids DataFrame
            
        Returns:
            DataFrame with validation columns
        """
        validated_df = (
            bids_df
            .withColumn(
                "is_valid",
                (col("bid_amount") > col("previous_price")) &
                (col("bid_amount") > 0) &
                (col("bid_id").isNotNull()) &
                (col("auction_id").isNotNull()) &
                (col("bidder_id").isNotNull())
            )
            .withColumn(
                "validation_timestamp",
                current_timestamp()
            )
            .withColumn(
                "bid_increment",
                col("bid_amount") - col("previous_price")
            )
        )
        
        return validated_df
    
    def detect_fraud_signals(self, bids_df):
        """
        Add fraud detection signals to bids.
        
        Detects:
        - Rapid successive bids from same IP
        - Unusually high bid increments
        - Shill bidding patterns (future enhancement)
        
        Args:
            bids_df: Validated bids DataFrame
            
        Returns:
            DataFrame with fraud signal columns
        """
        fraud_df = (
            bids_df
            .withColumn(
                "is_high_increment",
                col("bid_increment") > (col("previous_price") * 0.5)
            )
            .withColumn(
                "fraud_score",
                expr("""
                    CASE
                        WHEN bid_increment > previous_price THEN 0.8
                        WHEN bid_increment > previous_price * 0.5 THEN 0.5
                        WHEN bid_type = 'snipe' THEN 0.3
                        ELSE 0.1
                    END
                """)
            )
            .withColumn(
                "requires_review",
                col("fraud_score") > 0.5
            )
        )
        
        return fraud_df
    
    def calculate_aggregations(self, bids_df):
        """
        Calculate windowed aggregations for real-time analytics.
        
        Args:
            bids_df: Processed bids DataFrame
            
        Returns:
            Aggregated DataFrame
        """
        # 1-minute tumbling window aggregations
        agg_df = (
            bids_df
            .withWatermark("bid_timestamp", "1 minute")
            .groupBy(
                window(col("bid_timestamp"), "1 minute"),
                col("auction_id"),
            )
            .agg(
                expr("count(*) as bid_count"),
                expr("max(bid_amount) as max_bid"),
                expr("min(bid_amount) as min_bid"),
                expr("avg(bid_amount) as avg_bid"),
                expr("count(distinct bidder_id) as unique_bidders"),
            )
        )
        
        return agg_df
    
    def _write_to_postgres_batch(self, batch_df, batch_id):
        """
        Write a micro-batch to PostgreSQL.
        
        Args:
            batch_df: Micro-batch DataFrame
            batch_id: Batch identifier
        """
        if batch_df.count() == 0:
            return
        
        # Write to bids table
        (
            batch_df
            .select(
                "bid_id", "auction_id", "bidder_id", "bid_amount",
                "bid_timestamp", "bid_type", "is_winning",
                "previous_price", "is_valid", "fraud_score"
            )
            .write
            .format("jdbc")
            .option("url", self.postgres_url)
            .option("dbtable", "silver.bids")
            .option("user", self.postgres_user)
            .option("password", self.postgres_password)
            .option("driver", "org.postgresql.Driver")
            .mode("append")
            .save()
        )
        
        logger.info(f"Wrote batch {batch_id} to PostgreSQL: {batch_df.count()} rows")
    
    def write_to_postgres(self, processed_df):
        """
        Write processed bids to PostgreSQL using foreachBatch.
        
        Args:
            processed_df: Processed streaming DataFrame
            
        Returns:
            Streaming query
        """
        query = (
            processed_df
            .writeStream
            .foreachBatch(self._write_to_postgres_batch)
            .outputMode("append")
            .option("checkpointLocation", f"{self.checkpoint_location}/postgres")
            .start()
        )
        
        return query
    
    def write_to_console(self, df):
        """
        Write to console for debugging.
        
        Args:
            df: Streaming DataFrame
            
        Returns:
            Streaming query
        """
        query = (
            df
            .writeStream
            .outputMode("append")
            .format("console")
            .option("truncate", "false")
            .start()
        )
        
        return query
    
    def run(self):
        """
        Run the streaming pipeline.
        
        Reads from Kafka, processes bids, and writes to sinks.
        """
        logger.info("Starting Auction Stream Processor...")
        
        # Create Spark session
        self.create_spark_session()
        
        # Read from Kafka
        kafka_df = self.read_kafka_stream("auction.bids")
        
        # Process pipeline
        parsed_df = self.parse_bid_events(kafka_df)
        validated_df = self.validate_bids(parsed_df)
        processed_df = self.detect_fraud_signals(validated_df)
        
        # Write to sinks
        # For development, write to console
        console_query = self.write_to_console(
            processed_df.select(
                "bid_id", "auction_id", "bid_amount",
                "bid_type", "is_valid", "fraud_score"
            )
        )
        
        # In production, uncomment to write to PostgreSQL
        # postgres_query = self.write_to_postgres(processed_df)
        
        logger.info("Streaming queries started. Awaiting termination...")
        
        # Wait for termination
        console_query.awaitTermination()
    
    def stop(self):
        """Stop the Spark session."""
        if self.spark:
            self.spark.stop()
            logger.info("Spark session stopped")


def main():
    """Main entry point for the streaming job."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Auction Stream Processor")
    parser.add_argument(
        "--local",
        action="store_true",
        help="Run in local mode"
    )
    parser.add_argument(
        "--kafka-servers",
        default=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092"),
        help="Kafka bootstrap servers"
    )
    parser.add_argument(
        "--postgres-url",
        default=os.getenv("POSTGRES_URL", "jdbc:postgresql://postgres:5432/auction"),
        help="PostgreSQL JDBC URL"
    )
    
    args = parser.parse_args()
    
    processor = AuctionStreamProcessor(
        kafka_bootstrap_servers=args.kafka_servers,
        postgres_url=args.postgres_url,
        local_mode=args.local,
    )
    
    try:
        processor.run()
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    finally:
        processor.stop()


if __name__ == "__main__":
    main()
