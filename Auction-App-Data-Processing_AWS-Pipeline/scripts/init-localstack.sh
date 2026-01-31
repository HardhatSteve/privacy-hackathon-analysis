#!/bin/bash
# =============================================================================
# LocalStack Initialization Script
# =============================================================================
# This script runs automatically when LocalStack starts.
# It creates the S3 buckets needed for the data lake.
# =============================================================================

set -e

echo "Initializing LocalStack resources..."

# Wait for LocalStack to be ready
sleep 5

# Create S3 buckets for medallion architecture
echo "Creating S3 buckets..."

awslocal s3 mb s3://auction-bronze --region us-east-1 || true
awslocal s3 mb s3://auction-silver --region us-east-1 || true
awslocal s3 mb s3://auction-gold --region us-east-1 || true

# Verify buckets were created
echo "Verifying buckets..."
awslocal s3 ls

# Create initial folder structure in bronze bucket
echo "Creating folder structure..."
awslocal s3api put-object --bucket auction-bronze --key bids/ || true
awslocal s3api put-object --bucket auction-bronze --key items/ || true
awslocal s3api put-object --bucket auction-bronze --key users/ || true
awslocal s3api put-object --bucket auction-bronze --key transactions/ || true

echo "LocalStack initialization complete!"
