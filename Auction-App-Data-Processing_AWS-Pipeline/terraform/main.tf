# =============================================================================
# Auction Data Pipeline - Terraform Configuration
# =============================================================================
# Infrastructure as Code for AWS deployment
# Designed for AWS Free Tier where possible
# =============================================================================

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment for remote state (recommended for team projects)
  # backend "s3" {
  #   bucket         = "auction-pipeline-tfstate"
  #   key            = "terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "auction-pipeline"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# Local Values
# =============================================================================

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name

  common_tags = {
    Project     = "auction-pipeline"
    Environment = var.environment
  }

  name_prefix = "auction-${var.environment}"
}

# =============================================================================
# VPC Configuration (Optional - for production)
# =============================================================================

resource "aws_vpc" "main" {
  count = var.create_vpc ? 1 : 0

  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${local.name_prefix}-vpc"
  }
}

resource "aws_subnet" "private" {
  count = var.create_vpc ? 2 : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${local.name_prefix}-private-${count.index + 1}"
  }
}

resource "aws_subnet" "public" {
  count = var.create_vpc ? 2 : 0

  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name_prefix}-public-${count.index + 1}"
  }
}

# =============================================================================
# S3 Buckets (Data Lake)
# =============================================================================

module "s3" {
  source = "./modules/s3"

  environment = var.environment
  name_prefix = local.name_prefix
}

# =============================================================================
# RDS PostgreSQL (Free Tier)
# =============================================================================

module "rds" {
  source = "./modules/rds"

  environment     = var.environment
  name_prefix     = local.name_prefix
  db_name         = var.db_name
  db_username     = var.db_username
  db_password     = var.db_password
  vpc_id          = var.create_vpc ? aws_vpc.main[0].id : null
  subnet_ids      = var.create_vpc ? aws_subnet.private[*].id : null
  publicly_accessible = !var.create_vpc
}

# =============================================================================
# IAM Roles and Policies
# =============================================================================

module "iam" {
  source = "./modules/iam"

  environment = var.environment
  name_prefix = local.name_prefix
  s3_bucket_arns = [
    module.s3.bronze_bucket_arn,
    module.s3.silver_bucket_arn,
    module.s3.gold_bucket_arn,
  ]
}

# =============================================================================
# CloudWatch Alarms and Monitoring
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${local.name_prefix}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is high"

  dimensions = {
    DBInstanceIdentifier = module.rds.db_instance_id
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
}

resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "${local.name_prefix}-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 2000000000  # 2 GB in bytes
  alarm_description   = "RDS free storage is low"

  dimensions = {
    DBInstanceIdentifier = module.rds.db_instance_id
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
}

# =============================================================================
# AWS Budgets (Cost Control)
# =============================================================================

resource "aws_budgets_budget" "monthly" {
  name              = "${local.name_prefix}-monthly-budget"
  budget_type       = "COST"
  limit_amount      = var.monthly_budget_limit
  limit_unit        = "USD"
  time_period_start = "2024-01-01_00:00"
  time_unit         = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.budget_alert_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }
}
