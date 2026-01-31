# =============================================================================
# S3 Module - Data Lake Buckets
# =============================================================================

variable "environment" {
  type = string
}

variable "name_prefix" {
  type = string
}

# Bronze Layer - Raw Data
resource "aws_s3_bucket" "bronze" {
  bucket = "${var.name_prefix}-bronze-${data.aws_caller_identity.current.account_id}"

  tags = {
    Layer = "bronze"
  }
}

resource "aws_s3_bucket_versioning" "bronze" {
  bucket = aws_s3_bucket.bronze.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "bronze" {
  bucket = aws_s3_bucket.bronze.id

  rule {
    id     = "archive-old-data"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 180
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# Silver Layer - Cleaned Data
resource "aws_s3_bucket" "silver" {
  bucket = "${var.name_prefix}-silver-${data.aws_caller_identity.current.account_id}"

  tags = {
    Layer = "silver"
  }
}

resource "aws_s3_bucket_versioning" "silver" {
  bucket = aws_s3_bucket.silver.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Gold Layer - Aggregated Data
resource "aws_s3_bucket" "gold" {
  bucket = "${var.name_prefix}-gold-${data.aws_caller_identity.current.account_id}"

  tags = {
    Layer = "gold"
  }
}

# Block public access for all buckets
resource "aws_s3_bucket_public_access_block" "bronze" {
  bucket = aws_s3_bucket.bronze.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "silver" {
  bucket = aws_s3_bucket.silver.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "gold" {
  bucket = aws_s3_bucket.gold.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_caller_identity" "current" {}

# Outputs
output "bronze_bucket_name" {
  value = aws_s3_bucket.bronze.id
}

output "bronze_bucket_arn" {
  value = aws_s3_bucket.bronze.arn
}

output "silver_bucket_name" {
  value = aws_s3_bucket.silver.id
}

output "silver_bucket_arn" {
  value = aws_s3_bucket.silver.arn
}

output "gold_bucket_name" {
  value = aws_s3_bucket.gold.id
}

output "gold_bucket_arn" {
  value = aws_s3_bucket.gold.arn
}
