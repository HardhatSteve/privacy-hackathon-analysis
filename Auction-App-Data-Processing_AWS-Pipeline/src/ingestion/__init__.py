"""
Ingestion Module

Handles data ingestion from various sources into the pipeline.
"""

from .kafka_consumer import AuctionKafkaConsumer
from .s3_ingestion import S3Ingestion

__all__ = [
    "AuctionKafkaConsumer",
    "S3Ingestion",
]
