# =============================================================================
# Terraform Variables
# =============================================================================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "create_vpc" {
  description = "Whether to create a VPC (set to false for simpler free tier setup)"
  type        = bool
  default     = false
}

# =============================================================================
# Database Configuration
# =============================================================================

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "auction"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "auction"
}

variable "db_password" {
  description = "PostgreSQL master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class (db.t3.micro for free tier)"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB (20 for free tier)"
  type        = number
  default     = 20
}

# =============================================================================
# Monitoring & Alerts
# =============================================================================

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms (optional)"
  type        = string
  default     = ""
}

variable "budget_alert_emails" {
  description = "Email addresses for budget alerts"
  type        = list(string)
  default     = []
}

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = string
  default     = "10"
}

# =============================================================================
# Tags
# =============================================================================

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
