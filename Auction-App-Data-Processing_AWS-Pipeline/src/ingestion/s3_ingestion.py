"""
S3 Ingestion Module

Handles batch data ingestion from S3 to the Bronze layer.
Supports reading various file formats and managing data lake operations.
"""

import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Generator, List, Optional, Union

import boto3
from botocore.exceptions import ClientError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class S3Ingestion:
    """
    S3 data ingestion for the auction pipeline.
    
    Handles:
    - Reading raw data files from S3
    - Uploading processed data to data lake
    - Managing partitioned data structures
    - LocalStack compatibility for development
    """
    
    def __init__(
        self,
        bucket_name: str = "auction-bronze",
        region: str = "us-east-1",
        endpoint_url: Optional[str] = None,
        aws_access_key_id: Optional[str] = None,
        aws_secret_access_key: Optional[str] = None,
    ):
        """
        Initialize S3 client.
        
        Args:
            bucket_name: Default bucket name
            region: AWS region
            endpoint_url: Custom endpoint (for LocalStack)
            aws_access_key_id: AWS access key (optional, uses env/IAM role if not provided)
            aws_secret_access_key: AWS secret key
        """
        self.bucket_name = bucket_name
        self.region = region
        
        # Use environment variables or provided credentials
        self.endpoint_url = endpoint_url or os.getenv("AWS_ENDPOINT_URL")
        
        # Initialize boto3 client
        client_kwargs = {
            "service_name": "s3",
            "region_name": region,
        }
        
        if self.endpoint_url:
            client_kwargs["endpoint_url"] = self.endpoint_url
            # For LocalStack, use test credentials
            client_kwargs["aws_access_key_id"] = aws_access_key_id or "test"
            client_kwargs["aws_secret_access_key"] = aws_secret_access_key or "test"
        
        self.s3_client = boto3.client(**client_kwargs)
        self.s3_resource = boto3.resource(**client_kwargs)
        
        logger.info(f"S3 client initialized for bucket: {bucket_name}")
        if self.endpoint_url:
            logger.info(f"Using custom endpoint: {self.endpoint_url}")
    
    def bucket_exists(self, bucket_name: Optional[str] = None) -> bool:
        """
        Check if a bucket exists.
        
        Args:
            bucket_name: Bucket to check (uses default if not specified)
            
        Returns:
            True if bucket exists
        """
        bucket = bucket_name or self.bucket_name
        
        try:
            self.s3_client.head_bucket(Bucket=bucket)
            return True
        except ClientError:
            return False
    
    def create_bucket(self, bucket_name: Optional[str] = None) -> bool:
        """
        Create an S3 bucket.
        
        Args:
            bucket_name: Bucket to create
            
        Returns:
            True if created successfully
        """
        bucket = bucket_name or self.bucket_name
        
        try:
            if self.region == "us-east-1":
                self.s3_client.create_bucket(Bucket=bucket)
            else:
                self.s3_client.create_bucket(
                    Bucket=bucket,
                    CreateBucketConfiguration={"LocationConstraint": self.region}
                )
            
            logger.info(f"Created bucket: {bucket}")
            return True
            
        except ClientError as e:
            if e.response["Error"]["Code"] == "BucketAlreadyOwnedByYou":
                logger.info(f"Bucket already exists: {bucket}")
                return True
            logger.error(f"Failed to create bucket: {e}")
            return False
    
    def ensure_bucket_exists(self, bucket_name: Optional[str] = None):
        """Ensure bucket exists, create if not."""
        bucket = bucket_name or self.bucket_name
        
        if not self.bucket_exists(bucket):
            self.create_bucket(bucket)
    
    def upload_file(
        self,
        local_path: Union[str, Path],
        s3_key: str,
        bucket_name: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> bool:
        """
        Upload a file to S3.
        
        Args:
            local_path: Local file path
            s3_key: S3 object key
            bucket_name: Target bucket
            metadata: Optional metadata to attach
            
        Returns:
            True if upload successful
        """
        bucket = bucket_name or self.bucket_name
        
        try:
            extra_args = {}
            if metadata:
                extra_args["Metadata"] = metadata
            
            self.s3_client.upload_file(
                str(local_path),
                bucket,
                s3_key,
                ExtraArgs=extra_args if extra_args else None,
            )
            
            logger.info(f"Uploaded {local_path} to s3://{bucket}/{s3_key}")
            return True
            
        except ClientError as e:
            logger.error(f"Failed to upload file: {e}")
            return False
    
    def upload_data(
        self,
        data: Union[str, bytes, dict],
        s3_key: str,
        bucket_name: Optional[str] = None,
    ) -> bool:
        """
        Upload data directly to S3.
        
        Args:
            data: Data to upload (string, bytes, or dict for JSON)
            s3_key: S3 object key
            bucket_name: Target bucket
            
        Returns:
            True if upload successful
        """
        bucket = bucket_name or self.bucket_name
        
        try:
            if isinstance(data, dict):
                body = json.dumps(data).encode('utf-8')
            elif isinstance(data, str):
                body = data.encode('utf-8')
            else:
                body = data
            
            self.s3_client.put_object(
                Bucket=bucket,
                Key=s3_key,
                Body=body,
            )
            
            logger.info(f"Uploaded data to s3://{bucket}/{s3_key}")
            return True
            
        except ClientError as e:
            logger.error(f"Failed to upload data: {e}")
            return False
    
    def download_file(
        self,
        s3_key: str,
        local_path: Union[str, Path],
        bucket_name: Optional[str] = None,
    ) -> bool:
        """
        Download a file from S3.
        
        Args:
            s3_key: S3 object key
            local_path: Local destination path
            bucket_name: Source bucket
            
        Returns:
            True if download successful
        """
        bucket = bucket_name or self.bucket_name
        
        try:
            # Ensure local directory exists
            Path(local_path).parent.mkdir(parents=True, exist_ok=True)
            
            self.s3_client.download_file(bucket, s3_key, str(local_path))
            logger.info(f"Downloaded s3://{bucket}/{s3_key} to {local_path}")
            return True
            
        except ClientError as e:
            logger.error(f"Failed to download file: {e}")
            return False
    
    def read_json(
        self,
        s3_key: str,
        bucket_name: Optional[str] = None,
    ) -> Optional[dict]:
        """
        Read a JSON file from S3.
        
        Args:
            s3_key: S3 object key
            bucket_name: Source bucket
            
        Returns:
            Parsed JSON data or None
        """
        bucket = bucket_name or self.bucket_name
        
        try:
            response = self.s3_client.get_object(Bucket=bucket, Key=s3_key)
            content = response['Body'].read().decode('utf-8')
            return json.loads(content)
            
        except ClientError as e:
            logger.error(f"Failed to read JSON: {e}")
            return None
    
    def read_jsonl(
        self,
        s3_key: str,
        bucket_name: Optional[str] = None,
    ) -> Generator[dict, None, None]:
        """
        Read a JSON Lines file from S3.
        
        Args:
            s3_key: S3 object key
            bucket_name: Source bucket
            
        Yields:
            Parsed JSON objects
        """
        bucket = bucket_name or self.bucket_name
        
        try:
            response = self.s3_client.get_object(Bucket=bucket, Key=s3_key)
            
            for line in response['Body'].iter_lines():
                if line:
                    yield json.loads(line.decode('utf-8'))
                    
        except ClientError as e:
            logger.error(f"Failed to read JSONL: {e}")
    
    def list_objects(
        self,
        prefix: str = "",
        bucket_name: Optional[str] = None,
        max_keys: int = 1000,
    ) -> List[dict]:
        """
        List objects in S3 bucket.
        
        Args:
            prefix: Key prefix to filter by
            bucket_name: Bucket to list
            max_keys: Maximum objects to return
            
        Returns:
            List of object metadata
        """
        bucket = bucket_name or self.bucket_name
        objects = []
        
        try:
            paginator = self.s3_client.get_paginator('list_objects_v2')
            
            for page in paginator.paginate(
                Bucket=bucket,
                Prefix=prefix,
                PaginationConfig={'MaxItems': max_keys}
            ):
                if 'Contents' in page:
                    for obj in page['Contents']:
                        objects.append({
                            'key': obj['Key'],
                            'size': obj['Size'],
                            'last_modified': obj['LastModified'],
                        })
                        
        except ClientError as e:
            logger.error(f"Failed to list objects: {e}")
        
        return objects
    
    def list_partitions(
        self,
        prefix: str,
        bucket_name: Optional[str] = None,
    ) -> List[str]:
        """
        List partition directories (e.g., date=2024-01-01).
        
        Args:
            prefix: Base prefix (e.g., 'bids/')
            bucket_name: Bucket to list
            
        Returns:
            List of partition prefixes
        """
        bucket = bucket_name or self.bucket_name
        partitions = set()
        
        try:
            paginator = self.s3_client.get_paginator('list_objects_v2')
            
            for page in paginator.paginate(Bucket=bucket, Prefix=prefix, Delimiter='/'):
                if 'CommonPrefixes' in page:
                    for cp in page['CommonPrefixes']:
                        partitions.add(cp['Prefix'])
                        
        except ClientError as e:
            logger.error(f"Failed to list partitions: {e}")
        
        return sorted(list(partitions))
    
    def upload_partitioned(
        self,
        data: List[dict],
        base_key: str,
        partition_key: str,
        bucket_name: Optional[str] = None,
    ) -> List[str]:
        """
        Upload data with partitioning.
        
        Args:
            data: List of records to upload
            base_key: Base S3 key prefix
            partition_key: Field to partition by (e.g., 'date')
            bucket_name: Target bucket
            
        Returns:
            List of uploaded S3 keys
        """
        bucket = bucket_name or self.bucket_name
        uploaded_keys = []
        
        # Group data by partition key
        partitions = {}
        for record in data:
            partition_value = record.get(partition_key, "unknown")
            if partition_value not in partitions:
                partitions[partition_value] = []
            partitions[partition_value].append(record)
        
        # Upload each partition
        for partition_value, records in partitions.items():
            s3_key = f"{base_key}/{partition_key}={partition_value}/data.jsonl"
            
            # Convert to JSONL
            jsonl_data = "\n".join(json.dumps(r) for r in records)
            
            if self.upload_data(jsonl_data, s3_key, bucket):
                uploaded_keys.append(s3_key)
        
        return uploaded_keys
    
    def delete_object(
        self,
        s3_key: str,
        bucket_name: Optional[str] = None,
    ) -> bool:
        """
        Delete an object from S3.
        
        Args:
            s3_key: Object key to delete
            bucket_name: Source bucket
            
        Returns:
            True if deletion successful
        """
        bucket = bucket_name or self.bucket_name
        
        try:
            self.s3_client.delete_object(Bucket=bucket, Key=s3_key)
            logger.info(f"Deleted s3://{bucket}/{s3_key}")
            return True
            
        except ClientError as e:
            logger.error(f"Failed to delete object: {e}")
            return False
    
    def get_object_metadata(
        self,
        s3_key: str,
        bucket_name: Optional[str] = None,
    ) -> Optional[dict]:
        """
        Get metadata for an S3 object.
        
        Args:
            s3_key: Object key
            bucket_name: Source bucket
            
        Returns:
            Object metadata or None
        """
        bucket = bucket_name or self.bucket_name
        
        try:
            response = self.s3_client.head_object(Bucket=bucket, Key=s3_key)
            return {
                'content_length': response['ContentLength'],
                'content_type': response.get('ContentType'),
                'last_modified': response['LastModified'],
                'metadata': response.get('Metadata', {}),
            }
            
        except ClientError as e:
            logger.error(f"Failed to get metadata: {e}")
            return None


# Convenience functions
def create_data_lake_structure(
    endpoint_url: Optional[str] = None,
):
    """
    Create the data lake bucket structure.
    
    Creates:
    - auction-bronze (raw data)
    - auction-silver (cleaned data)
    - auction-gold (aggregations)
    """
    buckets = ["auction-bronze", "auction-silver", "auction-gold"]
    
    for bucket in buckets:
        s3 = S3Ingestion(bucket_name=bucket, endpoint_url=endpoint_url)
        s3.create_bucket()


if __name__ == "__main__":
    # Demo with LocalStack
    s3 = S3Ingestion(
        bucket_name="auction-bronze",
        endpoint_url="http://localhost:4566",
    )
    
    # Create bucket
    s3.create_bucket()
    
    # Upload test data
    test_data = {"event_type": "test", "timestamp": datetime.utcnow().isoformat()}
    s3.upload_data(test_data, "test/event.json")
    
    # List objects
    objects = s3.list_objects()
    print(f"Objects in bucket: {objects}")
