# =============================================================================
# RDS Module - PostgreSQL Database
# =============================================================================
# Configured for AWS Free Tier (db.t3.micro, 20GB gp2)
# =============================================================================

variable "environment" {
  type = string
}

variable "name_prefix" {
  type = string
}

variable "db_name" {
  type = string
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "vpc_id" {
  type    = string
  default = null
}

variable "subnet_ids" {
  type    = list(string)
  default = null
}

variable "publicly_accessible" {
  type    = bool
  default = true
}

# Security Group
resource "aws_security_group" "rds" {
  name        = "${var.name_prefix}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.publicly_accessible ? ["0.0.0.0/0"] : []
    description = "PostgreSQL access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.name_prefix}-rds-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# DB Subnet Group (only if VPC is provided)
resource "aws_db_subnet_group" "main" {
  count = var.subnet_ids != null ? 1 : 0

  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "${var.name_prefix}-db-subnet-group"
  }
}

# Parameter Group
resource "aws_db_parameter_group" "postgres" {
  family = "postgres15"
  name   = "${var.name_prefix}-postgres-params"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  tags = {
    Name = "${var.name_prefix}-postgres-params"
  }
}

# RDS Instance
resource "aws_db_instance" "postgres" {
  identifier = "${var.name_prefix}-postgres"

  # Engine
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t3.micro"  # Free tier eligible

  # Storage - IMPORTANT: Use gp2, not gp3 for free tier
  allocated_storage     = 20
  max_allocated_storage = 20  # Disable autoscaling for cost control
  storage_type          = "gp2"  # gp2 is free tier, gp3 is NOT
  storage_encrypted     = true

  # Database
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Network
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = var.subnet_ids != null ? aws_db_subnet_group.main[0].name : null
  publicly_accessible    = var.publicly_accessible

  # Parameters
  parameter_group_name = aws_db_parameter_group.postgres.name

  # Backup
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  # Monitoring
  performance_insights_enabled = false  # Not free tier

  # Other
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.name_prefix}-final-snapshot" : null
  deletion_protection       = var.environment == "prod"
  auto_minor_version_upgrade = true
  copy_tags_to_snapshot     = true

  tags = {
    Name = "${var.name_prefix}-postgres"
  }
}

# Outputs
output "db_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "db_port" {
  value = aws_db_instance.postgres.port
}

output "db_name" {
  value = aws_db_instance.postgres.db_name
}

output "db_instance_id" {
  value = aws_db_instance.postgres.id
}

output "db_arn" {
  value = aws_db_instance.postgres.arn
}
