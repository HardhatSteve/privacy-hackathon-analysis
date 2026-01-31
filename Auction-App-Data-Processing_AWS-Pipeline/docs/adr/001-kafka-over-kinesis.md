# ADR-001: Apache Kafka over AWS Kinesis

## Status

Accepted

## Context

We need a streaming platform to handle real-time auction events including bids, item updates, and transactions. The system must handle thousands of events per second with low latency.

### Options Considered

1. **AWS Kinesis Data Streams**
2. **Apache Kafka (Self-hosted)**
3. **Amazon MSK (Managed Kafka)**
4. **Apache Pulsar**

## Decision

We chose **Apache Kafka (Self-hosted with KRaft mode)** for the following reasons:

### Cost Analysis

| Option | Monthly Cost (Estimated) |
|--------|-------------------------|
| Kinesis (10K events/sec) | $200-400 |
| MSK (3 brokers) | $400-600 |
| Self-hosted Kafka | $0 (local) / $50-100 (EC2) |

### Technical Factors

1. **Replay Capability**: Kafka's log-based architecture allows replaying events from any offset, essential for:
   - Debugging production issues
   - Rebuilding state after failures
   - Testing with production-like data

2. **Ecosystem**: Rich ecosystem of tools:
   - Kafka Connect for integrations
   - Schema Registry for schema evolution
   - Kafka Streams for lightweight processing

3. **Portability**: Not locked into AWS; can run anywhere

4. **Learning Value**: Industry-standard skill for data engineering

### Trade-offs Accepted

- **Operational Overhead**: Must manage Kafka ourselves
- **No Serverless**: Requires running containers/instances
- **Monitoring Setup**: Need to configure our own monitoring

## Consequences

### Positive

- Zero streaming costs in development
- Full control over configuration
- Transferable skills to any employer
- Better debugging with offset replay

### Negative

- Must handle Kafka upgrades ourselves
- Need to understand KRaft configuration
- More complex initial setup than Kinesis

## References

- [Kafka vs Kinesis Comparison](https://www.confluent.io/blog/apache-kafka-vs-amazon-kinesis/)
- [KRaft Mode Documentation](https://kafka.apache.org/documentation/#kraft)
