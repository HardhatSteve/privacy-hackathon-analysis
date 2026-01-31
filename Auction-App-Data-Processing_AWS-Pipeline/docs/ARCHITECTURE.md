# Architecture Documentation

## Overview

The Auction Data Pipeline implements a **Modified Kappa Architecture** optimized for auction systems, combining real-time stream processing with batch analytics while maintaining a single codebase for data transformations.

## Architecture Decision

### Why Modified Kappa over Lambda?

| Aspect | Lambda Architecture | Modified Kappa (Chosen) |
|--------|--------------------|-----------------------|
| Codebase | Dual (batch + stream) | Single unified |
| Complexity | Higher maintenance | Simpler operations |
| Consistency | Eventual | Strong (via Kafka) |
| Reprocessing | Complex | Native replay |
| Use Case Fit | General | Auction-optimized |

For auction systems where real-time bid processing is critical and historical reprocessing is occasional, Modified Kappa provides:
- Simpler operational model
- Native event replay from Kafka
- Single transformation logic
- Lower development overhead

## System Components

### Data Flow

```
                                    ┌─────────────────┐
                                    │   Data Sources  │
                                    │  ───────────── │
                                    │  • Web App API  │
                                    │  • IoT/POS      │
                                    │  • Batch Files  │
                                    └────────┬────────┘
                                             │
                                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         INGESTION LAYER                                   │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    Apache Kafka (KRaft Mode)                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐    │  │
│  │  │  Bids    │  │  Items   │  │  Users   │  │  Transactions   │    │  │
│  │  │ (3 part) │  │ (3 part) │  │ (3 part) │  │    (3 part)     │    │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────────────┘    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                                             │
                        ┌────────────────────┴───────────────────┐
                        ▼                                        ▼
         ┌──────────────────────────┐             ┌──────────────────────────┐
         │    STREAM PROCESSING     │             │    BATCH PROCESSING      │
         │  ────────────────────── │             │  ──────────────────────  │
         │  Spark Structured        │             │  Spark Batch Jobs        │
         │  Streaming               │             │  (Airflow Scheduled)     │
         │                          │             │                          │
         │  • Bid validation        │             │  • Daily aggregations    │
         │  • Price updates         │             │  • Historical analytics  │
         │  • Fraud scoring         │             │  • ML feature eng.       │
         └────────────┬─────────────┘             └────────────┬─────────────┘
                      │                                        │
                      └───────────────┬────────────────────────┘
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         STORAGE LAYER                                     │
│                      (Medallion Architecture)                             │
│                                                                           │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐              │
│  │   BRONZE    │ ───► │   SILVER    │ ───► │    GOLD     │              │
│  │   (S3)      │      │ (PostgreSQL)│      │  (DuckDB)   │              │
│  │             │      │             │      │             │              │
│  │ Raw Events  │      │ Validated   │      │ Aggregated  │              │
│  │ JSON/Parquet│      │ Normalized  │      │ Analytics   │              │
│  └─────────────┘      └─────────────┘      └─────────────┘              │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         SERVING LAYER                                     │
│                                                                           │
│  ┌─────────────────────────┐      ┌─────────────────────────────────┐   │
│  │       Metabase          │      │       Application API           │   │
│  │    (BI Dashboards)      │      │    (Real-time queries)          │   │
│  └─────────────────────────┘      └─────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

## Medallion Architecture

### Bronze Layer (Raw)
- **Storage**: AWS S3 / LocalStack
- **Format**: JSON Lines, Parquet
- **Purpose**: Immutable raw event archive
- **Retention**: 90+ days

### Silver Layer (Cleaned)
- **Storage**: PostgreSQL
- **Purpose**: Validated, deduplicated, enriched data
- **Schema**: Normalized relational tables
- **Use Case**: Application queries, operational reporting

### Gold Layer (Aggregated)
- **Storage**: DuckDB / PostgreSQL views
- **Purpose**: Business-level metrics and KPIs
- **Schema**: Denormalized, pre-aggregated
- **Use Case**: Executive dashboards, analytics

## Real-Time Requirements

| Operation | Latency Target | Achieved |
|-----------|---------------|----------|
| Bid Placement | < 100ms | ✓ (Kafka + Streaming) |
| Auction Closing | < 1s | ✓ (Spark micro-batch) |
| Price Update | < 500ms | ✓ (PostgreSQL write) |
| Fraud Detection | Real-time | ✓ (Streaming rules) |
| Dashboard Refresh | < 5s | ✓ (Metabase caching) |

## Scalability

### Horizontal Scaling Points

1. **Kafka**: Add partitions, brokers
2. **Spark**: Add workers to cluster
3. **PostgreSQL**: Read replicas, connection pooling
4. **S3**: Unlimited object storage

### Capacity Estimates

| Metric | Current Design | Scalable To |
|--------|---------------|-------------|
| Bids/second | 10,000 | 100,000+ |
| Concurrent Auctions | 100,000 | 1,000,000+ |
| Data Retention | 1 year | Unlimited (S3) |

## Security Considerations

- **Kafka**: SASL/SSL for production
- **PostgreSQL**: Encrypted connections, role-based access
- **S3**: Server-side encryption, bucket policies
- **Secrets**: Environment variables, AWS Secrets Manager

## Monitoring & Observability

### Key Metrics

- Kafka consumer lag
- Spark job duration and failures
- PostgreSQL connection pool usage
- End-to-end latency percentiles

### Tools

- Kafka UI: Topic/consumer monitoring
- Spark UI: Job execution details
- Metabase: Business metrics dashboards
- CloudWatch: AWS resource monitoring

## Disaster Recovery

| Component | Strategy | RPO | RTO |
|-----------|----------|-----|-----|
| Kafka | Topic replication | 0 | Minutes |
| PostgreSQL | Daily backups, WAL | 1 hour | 1 hour |
| S3 | Cross-region replication | 0 | Minutes |
| Spark Jobs | Checkpointing | Minutes | Minutes |

## Cost Optimization (Free Tier)

| Service | Free Tier Limit | Our Usage |
|---------|----------------|-----------|
| S3 | 5 GB | < 5 GB |
| RDS | 750 hrs/month | 720 hrs |
| Lambda | 1M requests | < 100K |
| Data Transfer | 100 GB out | < 10 GB |

**Total Monthly Cost**: $0-5 with careful management
