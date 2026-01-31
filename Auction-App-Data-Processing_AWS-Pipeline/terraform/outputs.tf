# =============================================================================
# Terraform Outputs
# =============================================================================

output "s3_bronze_bucket" {
  description = "S3 bucket for Bronze layer (raw data)"
  value       = module.s3.bronze_bucket_name
}

output "s3_silver_bucket" {
  description = "S3 bucket for Silver layer (cleaned data)"
  value       = module.s3.silver_bucket_name
}

output "s3_gold_bucket" {
  description = "S3 bucket for Gold layer (aggregated data)"
  value       = module.s3.gold_bucket_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.db_endpoint
}

output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = module.rds.db_port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.db_name
}

output "glue_role_arn" {
  description = "IAM role ARN for Glue jobs"
  value       = module.iam.glue_role_arn
}

output "lambda_role_arn" {
  description = "IAM role ARN for Lambda functions"
  value       = module.iam.lambda_role_arn
}

output "connection_string" {
  description = "PostgreSQL connection string (without password)"
  value       = "postgresql://${var.db_username}@${module.rds.db_endpoint}/${var.db_name}"
  sensitive   = false
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}
