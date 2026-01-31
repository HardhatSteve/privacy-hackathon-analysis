# =============================================================================
# Auction Data Pipeline - Makefile
# =============================================================================
# Convenience commands for development, testing, and deployment
# Usage: make <target>
# =============================================================================

.PHONY: help up down restart logs clean test test-coverage lint format \
        generate-data run-streaming run-batch create-topics \
        terraform-init terraform-plan terraform-apply terraform-destroy \
        build-images push-images

# Default target
.DEFAULT_GOAL := help

# Colors for terminal output
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

# =============================================================================
# HELP
# =============================================================================
help: ## Show this help message
	@echo "$(BLUE)Auction Data Pipeline - Available Commands$(NC)"
	@echo "=============================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# =============================================================================
# DOCKER COMPOSE COMMANDS
# =============================================================================
up: ## Start all services in detached mode
	@echo "$(GREEN)Starting all services...$(NC)"
	docker compose up -d
	@echo "$(GREEN)Services started! Access points:$(NC)"
	@echo "  - Kafka UI:    http://localhost:8080"
	@echo "  - Airflow:     http://localhost:8081 (airflow/airflow)"
	@echo "  - Metabase:    http://localhost:3000"
	@echo "  - Spark UI:    http://localhost:4040"
	@echo "  - PostgreSQL:  localhost:5432"

down: ## Stop all services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	docker compose down

restart: down up ## Restart all services

logs: ## View logs from all services
	docker compose logs -f

logs-kafka: ## View Kafka logs
	docker compose logs -f kafka

logs-spark: ## View Spark logs
	docker compose logs -f spark-master spark-worker

logs-airflow: ## View Airflow logs
	docker compose logs -f airflow-webserver airflow-scheduler

clean: ## Stop services and remove volumes
	@echo "$(RED)Stopping services and removing volumes...$(NC)"
	docker compose down -v
	@echo "$(GREEN)Cleanup complete!$(NC)"

ps: ## Show running containers
	docker compose ps

# =============================================================================
# DEVELOPMENT
# =============================================================================
install: ## Install Python dependencies
	pip install -r requirements.txt

install-dev: ## Install development dependencies
	pip install -r requirements.txt -r requirements-dev.txt

venv: ## Create virtual environment
	python -m venv venv
	@echo "$(GREEN)Virtual environment created. Activate with:$(NC)"
	@echo "  Windows: .\\venv\\Scripts\\activate"
	@echo "  Linux/Mac: source venv/bin/activate"

# =============================================================================
# KAFKA COMMANDS
# =============================================================================
create-topics: ## Create Kafka topics
	@echo "$(GREEN)Creating Kafka topics...$(NC)"
	docker compose exec kafka kafka-topics.sh --create --if-not-exists \
		--bootstrap-server localhost:9092 \
		--topic auction.bids \
		--partitions 3 \
		--replication-factor 1
	docker compose exec kafka kafka-topics.sh --create --if-not-exists \
		--bootstrap-server localhost:9092 \
		--topic auction.items \
		--partitions 3 \
		--replication-factor 1
	docker compose exec kafka kafka-topics.sh --create --if-not-exists \
		--bootstrap-server localhost:9092 \
		--topic auction.users \
		--partitions 3 \
		--replication-factor 1
	docker compose exec kafka kafka-topics.sh --create --if-not-exists \
		--bootstrap-server localhost:9092 \
		--topic auction.transactions \
		--partitions 3 \
		--replication-factor 1
	@echo "$(GREEN)Topics created!$(NC)"

list-topics: ## List all Kafka topics
	docker compose exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092

describe-topics: ## Describe all auction topics
	docker compose exec kafka kafka-topics.sh --describe \
		--bootstrap-server localhost:9092 \
		--topic auction.bids

consume-bids: ## Consume messages from bids topic (Ctrl+C to stop)
	docker compose exec kafka kafka-console-consumer.sh \
		--bootstrap-server localhost:9092 \
		--topic auction.bids \
		--from-beginning

# =============================================================================
# DATA GENERATION
# =============================================================================
generate-data: ## Generate synthetic auction data and send to Kafka
	@echo "$(GREEN)Generating synthetic auction data...$(NC)"
	python -m src.data_generator.kafka_producer \
		--events 10000 \
		--rate 100 \
		--bootstrap-servers localhost:9094
	@echo "$(GREEN)Data generation complete!$(NC)"

generate-batch: ## Generate batch files for S3 upload
	@echo "$(GREEN)Generating batch data files...$(NC)"
	python -m src.data_generator.batch_generator \
		--output-dir ./data/batch \
		--users 1000 \
		--items 5000 \
		--bids 50000
	@echo "$(GREEN)Batch files generated in ./data/batch$(NC)"

seed-database: ## Seed PostgreSQL with initial data
	@echo "$(GREEN)Seeding database...$(NC)"
	python -m src.data_generator.seed_database
	@echo "$(GREEN)Database seeded!$(NC)"

# =============================================================================
# PIPELINE EXECUTION
# =============================================================================
run-streaming: ## Run Spark Structured Streaming job
	@echo "$(GREEN)Starting Spark Streaming job...$(NC)"
	docker compose exec spark-master spark-submit \
		--master spark://spark-master:7077 \
		--packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0,org.postgresql:postgresql:42.6.0 \
		/opt/spark-apps/src/transformation/spark_streaming.py

run-batch: ## Run Spark batch processing job
	@echo "$(GREEN)Running Spark batch job...$(NC)"
	docker compose exec spark-master spark-submit \
		--master spark://spark-master:7077 \
		--packages org.postgresql:postgresql:42.6.0 \
		/opt/spark-apps/src/transformation/batch_processing.py

run-local-streaming: ## Run streaming job locally (for development)
	python -m src.transformation.spark_streaming --local

# =============================================================================
# TESTING
# =============================================================================
test: ## Run all tests
	@echo "$(GREEN)Running tests...$(NC)"
	pytest tests/ -v

test-coverage: ## Run tests with coverage report
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	pytest tests/ -v --cov=src --cov-report=html --cov-report=term-missing
	@echo "$(GREEN)Coverage report generated in htmlcov/$(NC)"

test-unit: ## Run unit tests only
	pytest tests/ -v -m "not integration"

test-integration: ## Run integration tests (requires Docker)
	@echo "$(GREEN)Running integration tests...$(NC)"
	pytest tests/integration/ -v

# =============================================================================
# CODE QUALITY
# =============================================================================
lint: ## Run linting checks
	@echo "$(GREEN)Running linters...$(NC)"
	ruff check src/ tests/
	mypy src/ --ignore-missing-imports

format: ## Format code with black and isort
	@echo "$(GREEN)Formatting code...$(NC)"
	black src/ tests/
	isort src/ tests/

format-check: ## Check code formatting without making changes
	black --check src/ tests/
	isort --check-only src/ tests/

# =============================================================================
# TERRAFORM (AWS INFRASTRUCTURE)
# =============================================================================
terraform-init: ## Initialize Terraform
	@echo "$(GREEN)Initializing Terraform...$(NC)"
	cd terraform && terraform init

terraform-plan: ## Plan Terraform changes
	@echo "$(GREEN)Planning Terraform changes...$(NC)"
	cd terraform && terraform plan

terraform-apply: ## Apply Terraform changes
	@echo "$(YELLOW)Applying Terraform changes...$(NC)"
	cd terraform && terraform apply

terraform-destroy: ## Destroy Terraform infrastructure
	@echo "$(RED)Destroying Terraform infrastructure...$(NC)"
	cd terraform && terraform destroy

terraform-output: ## Show Terraform outputs
	cd terraform && terraform output

# =============================================================================
# LOCALSTACK (LOCAL AWS)
# =============================================================================
localstack-init: ## Initialize LocalStack S3 buckets
	@echo "$(GREEN)Creating LocalStack S3 buckets...$(NC)"
	aws --endpoint-url=http://localhost:4566 s3 mb s3://auction-bronze
	aws --endpoint-url=http://localhost:4566 s3 mb s3://auction-silver
	aws --endpoint-url=http://localhost:4566 s3 mb s3://auction-gold
	@echo "$(GREEN)LocalStack buckets created!$(NC)"

localstack-list: ## List LocalStack S3 buckets
	aws --endpoint-url=http://localhost:4566 s3 ls

# =============================================================================
# DATABASE
# =============================================================================
db-shell: ## Open PostgreSQL shell
	docker compose exec postgres psql -U auction -d auction

db-reset: ## Reset database (drop and recreate)
	@echo "$(RED)Resetting database...$(NC)"
	docker compose exec postgres psql -U auction -d postgres -c "DROP DATABASE IF EXISTS auction;"
	docker compose exec postgres psql -U auction -d postgres -c "CREATE DATABASE auction;"
	docker compose exec postgres psql -U auction -d auction -f /docker-entrypoint-initdb.d/01-init.sql
	docker compose exec postgres psql -U auction -d auction -f /docker-entrypoint-initdb.d/02-silver.sql
	docker compose exec postgres psql -U auction -d auction -f /docker-entrypoint-initdb.d/03-gold.sql
	@echo "$(GREEN)Database reset complete!$(NC)"

# =============================================================================
# UTILITIES
# =============================================================================
shell-kafka: ## Open bash shell in Kafka container
	docker compose exec kafka bash

shell-spark: ## Open bash shell in Spark master container
	docker compose exec spark-master bash

shell-airflow: ## Open bash shell in Airflow container
	docker compose exec airflow-webserver bash

# =============================================================================
# DEMO
# =============================================================================
demo: up create-topics seed-database ## Full demo setup: start services, create topics, seed data
	@echo "$(GREEN)Demo environment ready!$(NC)"
	@echo "Run 'make generate-data' to start producing events"
	@echo "Run 'make run-streaming' to start processing"
