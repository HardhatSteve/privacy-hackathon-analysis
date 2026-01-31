"""
Kafka Consumer for Auction Events

Base consumer implementation for reading auction events from Kafka.
Used for custom processing outside of Spark Structured Streaming.
"""

import json
import logging
import signal
from typing import Callable, Dict, List, Optional

from kafka import KafkaConsumer
from kafka.errors import KafkaError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AuctionKafkaConsumer:
    """
    Kafka consumer for auction event topics.
    
    Provides a clean interface for consuming messages with:
    - Automatic deserialization
    - Graceful shutdown handling
    - Message processing callbacks
    - Error handling and retries
    """
    
    TOPICS = {
        "bids": "auction.bids",
        "items": "auction.items",
        "users": "auction.users",
        "transactions": "auction.transactions",
    }
    
    def __init__(
        self,
        bootstrap_servers: str = "localhost:9094",
        group_id: str = "auction-consumer-group",
        auto_offset_reset: str = "earliest",
    ):
        """
        Initialize the Kafka consumer.
        
        Args:
            bootstrap_servers: Kafka broker addresses
            group_id: Consumer group ID
            auto_offset_reset: Where to start reading (earliest/latest)
        """
        self.bootstrap_servers = bootstrap_servers
        self.group_id = group_id
        self.auto_offset_reset = auto_offset_reset
        self.consumer: Optional[KafkaConsumer] = None
        self._running = True
        self._handlers: Dict[str, Callable] = {}
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals."""
        logger.info("Shutdown signal received")
        self._running = False
    
    def connect(self, topics: List[str]) -> bool:
        """
        Connect to Kafka and subscribe to topics.
        
        Args:
            topics: List of topic names to subscribe to
            
        Returns:
            True if connection successful
        """
        try:
            self.consumer = KafkaConsumer(
                *topics,
                bootstrap_servers=self.bootstrap_servers,
                group_id=self.group_id,
                auto_offset_reset=self.auto_offset_reset,
                enable_auto_commit=True,
                auto_commit_interval_ms=5000,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                key_deserializer=lambda k: k.decode('utf-8') if k else None,
                max_poll_records=500,
                session_timeout_ms=30000,
                heartbeat_interval_ms=10000,
            )
            
            logger.info(f"Connected to Kafka, subscribed to: {topics}")
            return True
            
        except KafkaError as e:
            logger.error(f"Failed to connect to Kafka: {e}")
            return False
    
    def register_handler(self, topic: str, handler: Callable):
        """
        Register a message handler for a specific topic.
        
        Args:
            topic: Topic name
            handler: Callback function(message) -> None
        """
        self._handlers[topic] = handler
        logger.info(f"Registered handler for topic: {topic}")
    
    def _process_message(self, message):
        """
        Process a single message.
        
        Args:
            message: Kafka message object
        """
        topic = message.topic
        
        if topic in self._handlers:
            try:
                self._handlers[topic](message.value)
            except Exception as e:
                logger.error(f"Error processing message from {topic}: {e}")
        else:
            logger.debug(f"No handler for topic: {topic}")
    
    def consume(
        self,
        topics: Optional[List[str]] = None,
        handler: Optional[Callable] = None,
        max_messages: Optional[int] = None,
    ):
        """
        Start consuming messages.
        
        Args:
            topics: Topics to consume (uses TOPICS.values() if not specified)
            handler: Default handler for all topics
            max_messages: Maximum messages to consume (None = infinite)
        """
        if topics is None:
            topics = list(self.TOPICS.values())
        
        if not self.connect(topics):
            raise RuntimeError("Failed to connect to Kafka")
        
        if handler:
            for topic in topics:
                self.register_handler(topic, handler)
        
        logger.info("Starting message consumption...")
        
        message_count = 0
        
        try:
            while self._running:
                # Poll for messages
                messages = self.consumer.poll(timeout_ms=1000)
                
                for topic_partition, records in messages.items():
                    for record in records:
                        self._process_message(record)
                        message_count += 1
                        
                        if max_messages and message_count >= max_messages:
                            logger.info(f"Reached max messages: {max_messages}")
                            self._running = False
                            break
                    
                    if not self._running:
                        break
                
        except KeyboardInterrupt:
            logger.info("Consumer interrupted")
        finally:
            self.close()
        
        logger.info(f"Consumed {message_count} messages")
        return message_count
    
    def consume_batch(
        self,
        topics: List[str],
        batch_size: int = 100,
        timeout_ms: int = 5000,
    ) -> List[dict]:
        """
        Consume a batch of messages and return them.
        
        Args:
            topics: Topics to consume from
            batch_size: Maximum messages to return
            timeout_ms: Timeout for polling
            
        Returns:
            List of message values
        """
        if not self.consumer:
            if not self.connect(topics):
                raise RuntimeError("Failed to connect to Kafka")
        
        messages = []
        
        while len(messages) < batch_size:
            records = self.consumer.poll(timeout_ms=timeout_ms, max_records=batch_size - len(messages))
            
            if not records:
                break
            
            for topic_partition, batch in records.items():
                for record in batch:
                    messages.append({
                        "topic": record.topic,
                        "partition": record.partition,
                        "offset": record.offset,
                        "key": record.key,
                        "value": record.value,
                        "timestamp": record.timestamp,
                    })
        
        return messages
    
    def get_topic_lag(self) -> Dict[str, int]:
        """
        Get consumer lag for subscribed topics.
        
        Returns:
            Dictionary of topic -> lag
        """
        if not self.consumer:
            return {}
        
        lag = {}
        
        try:
            # Get assigned partitions
            partitions = self.consumer.assignment()
            
            # Get end offsets
            end_offsets = self.consumer.end_offsets(partitions)
            
            # Get current positions
            for partition in partitions:
                topic = partition.topic
                current = self.consumer.position(partition)
                end = end_offsets[partition]
                
                if topic not in lag:
                    lag[topic] = 0
                lag[topic] += end - current
                
        except Exception as e:
            logger.error(f"Error getting consumer lag: {e}")
        
        return lag
    
    def seek_to_beginning(self):
        """Seek all partitions to the beginning."""
        if self.consumer:
            self.consumer.seek_to_beginning()
            logger.info("Seeked to beginning of all partitions")
    
    def seek_to_end(self):
        """Seek all partitions to the end."""
        if self.consumer:
            self.consumer.seek_to_end()
            logger.info("Seeked to end of all partitions")
    
    def close(self):
        """Close the consumer connection."""
        if self.consumer:
            self.consumer.close()
            logger.info("Consumer closed")


# Example usage
if __name__ == "__main__":
    def print_message(msg):
        print(f"Received: {msg}")
    
    consumer = AuctionKafkaConsumer()
    consumer.consume(
        topics=["auction.bids"],
        handler=print_message,
        max_messages=10,
    )
