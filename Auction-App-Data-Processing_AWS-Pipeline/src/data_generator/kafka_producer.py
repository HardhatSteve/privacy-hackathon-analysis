"""
Kafka Producer for Auction Events

Streams synthetic auction data to Kafka topics in real-time.
Simulates the event flow from a production auction application.
"""

import json
import logging
import signal
import sys
import time
from datetime import datetime
from typing import Optional
from uuid import uuid4

import click
from kafka import KafkaProducer
from kafka.errors import KafkaError
from rich.console import Console
from rich.live import Live
from rich.table import Table

from .generator import AuctionDataGenerator
from .schemas import BidEvent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rich console for nice output
console = Console()


class AuctionEventProducer:
    """
    Produces auction events to Kafka topics.
    
    Topics:
    - auction.bids: Real-time bid events
    - auction.items: Item/auction listings
    - auction.users: User registration events
    - auction.transactions: Completed sale events
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
        client_id: str = "auction-producer",
    ):
        """
        Initialize the Kafka producer.
        
        Args:
            bootstrap_servers: Kafka broker addresses
            client_id: Client identifier for Kafka
        """
        self.bootstrap_servers = bootstrap_servers
        self.client_id = client_id
        self.producer: Optional[KafkaProducer] = None
        self.generator = AuctionDataGenerator()
        self._running = True
        
        # Statistics
        self.stats = {
            "bids_sent": 0,
            "items_sent": 0,
            "users_sent": 0,
            "transactions_sent": 0,
            "errors": 0,
            "start_time": None,
        }
        
        # Handle graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully."""
        console.print("\n[yellow]Shutdown signal received. Finishing...[/yellow]")
        self._running = False
    
    def connect(self) -> bool:
        """
        Establish connection to Kafka.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                client_id=self.client_id,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                acks='all',  # Wait for all replicas
                retries=3,
                max_in_flight_requests_per_connection=5,
                linger_ms=10,  # Batch messages for efficiency
                batch_size=16384,
                compression_type='gzip',
            )
            
            # Test connection by getting metadata
            self.producer.partitions_for(self.TOPICS["bids"])
            logger.info(f"Connected to Kafka at {self.bootstrap_servers}")
            return True
            
        except KafkaError as e:
            logger.error(f"Failed to connect to Kafka: {e}")
            return False
    
    def _on_send_success(self, record_metadata):
        """Callback for successful message delivery."""
        logger.debug(
            f"Message delivered to {record_metadata.topic} "
            f"partition {record_metadata.partition} "
            f"offset {record_metadata.offset}"
        )
    
    def _on_send_error(self, excp):
        """Callback for failed message delivery."""
        logger.error(f"Message delivery failed: {excp}")
        self.stats["errors"] += 1
    
    def send_bid(self, bid) -> bool:
        """
        Send a bid event to Kafka.
        
        Args:
            bid: Bid object to send
            
        Returns:
            True if sent successfully
        """
        if not self.producer:
            raise RuntimeError("Producer not connected")
        
        # Wrap bid in event envelope
        event = BidEvent(
            event_id=uuid4(),
            event_type="bid_placed",
            event_timestamp=datetime.utcnow(),
            payload=bid,
        )
        
        try:
            # Use auction_id as key for partitioning
            # This ensures all bids for same auction go to same partition
            future = self.producer.send(
                topic=self.TOPICS["bids"],
                key=str(bid.auction_id),
                value=event.to_dict(),
            )
            
            future.add_callback(self._on_send_success)
            future.add_errback(self._on_send_error)
            
            self.stats["bids_sent"] += 1
            return True
            
        except KafkaError as e:
            logger.error(f"Failed to send bid: {e}")
            self.stats["errors"] += 1
            return False
    
    def send_item(self, item) -> bool:
        """Send an item/auction listing event."""
        if not self.producer:
            raise RuntimeError("Producer not connected")
        
        try:
            future = self.producer.send(
                topic=self.TOPICS["items"],
                key=str(item.item_id),
                value=item.to_dict(),
            )
            
            future.add_callback(self._on_send_success)
            future.add_errback(self._on_send_error)
            
            self.stats["items_sent"] += 1
            return True
            
        except KafkaError as e:
            logger.error(f"Failed to send item: {e}")
            self.stats["errors"] += 1
            return False
    
    def send_user(self, user) -> bool:
        """Send a user registration event."""
        if not self.producer:
            raise RuntimeError("Producer not connected")
        
        try:
            future = self.producer.send(
                topic=self.TOPICS["users"],
                key=str(user.user_id),
                value=user.to_dict(),
            )
            
            future.add_callback(self._on_send_success)
            future.add_errback(self._on_send_error)
            
            self.stats["users_sent"] += 1
            return True
            
        except KafkaError as e:
            logger.error(f"Failed to send user: {e}")
            self.stats["errors"] += 1
            return False
    
    def send_transaction(self, transaction) -> bool:
        """Send a transaction event."""
        if not self.producer:
            raise RuntimeError("Producer not connected")
        
        try:
            future = self.producer.send(
                topic=self.TOPICS["transactions"],
                key=str(transaction.transaction_id),
                value=transaction.to_dict(),
            )
            
            future.add_callback(self._on_send_success)
            future.add_errback(self._on_send_error)
            
            self.stats["transactions_sent"] += 1
            return True
            
        except KafkaError as e:
            logger.error(f"Failed to send transaction: {e}")
            self.stats["errors"] += 1
            return False
    
    def _create_stats_table(self) -> Table:
        """Create a Rich table showing current statistics."""
        table = Table(title="Auction Event Producer Statistics")
        
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")
        
        elapsed = 0
        rate = 0
        if self.stats["start_time"]:
            elapsed = (datetime.utcnow() - self.stats["start_time"]).total_seconds()
            total_sent = sum([
                self.stats["bids_sent"],
                self.stats["items_sent"],
                self.stats["users_sent"],
                self.stats["transactions_sent"],
            ])
            rate = total_sent / elapsed if elapsed > 0 else 0
        
        table.add_row("Bids Sent", str(self.stats["bids_sent"]))
        table.add_row("Items Sent", str(self.stats["items_sent"]))
        table.add_row("Users Sent", str(self.stats["users_sent"]))
        table.add_row("Transactions Sent", str(self.stats["transactions_sent"]))
        table.add_row("Errors", str(self.stats["errors"]))
        table.add_row("Elapsed Time", f"{elapsed:.1f}s")
        table.add_row("Events/Second", f"{rate:.1f}")
        
        return table
    
    def produce_events(
        self,
        total_events: int = 10000,
        rate_per_second: int = 100,
        include_users: bool = True,
        include_items: bool = True,
        show_progress: bool = True,
    ):
        """
        Produce a stream of auction events.
        
        Args:
            total_events: Total number of bid events to produce
            rate_per_second: Target events per second
            include_users: Also send user events
            include_items: Also send item events
            show_progress: Show live progress table
        """
        if not self.connect():
            console.print("[red]Failed to connect to Kafka[/red]")
            return
        
        console.print(f"[green]Starting event production...[/green]")
        console.print(f"Target: {total_events} events at {rate_per_second}/sec")
        
        self.stats["start_time"] = datetime.utcnow()
        
        # Generate initial users and items
        if include_users:
            console.print("[blue]Generating users...[/blue]")
            users = self.generator.generate_users(100)
            for user in users:
                self.send_user(user)
                if not self._running:
                    break
        
        if include_items:
            console.print("[blue]Generating items...[/blue]")
            items = self.generator.generate_items(200, ensure_active=100)
            for item in items:
                self.send_item(item)
                if not self._running:
                    break
        
        # Calculate delay between events
        delay = 1.0 / rate_per_second
        
        console.print("[blue]Producing bid events...[/blue]")
        
        events_sent = 0
        
        if show_progress:
            with Live(self._create_stats_table(), refresh_per_second=4) as live:
                while events_sent < total_events and self._running:
                    start_time = time.time()
                    
                    # Generate and send a bid
                    bid = self.generator.generate_bid()
                    self.send_bid(bid)
                    events_sent += 1
                    
                    # Update display
                    live.update(self._create_stats_table())
                    
                    # Rate limiting
                    elapsed = time.time() - start_time
                    if elapsed < delay:
                        time.sleep(delay - elapsed)
        else:
            while events_sent < total_events and self._running:
                start_time = time.time()
                
                bid = self.generator.generate_bid()
                self.send_bid(bid)
                events_sent += 1
                
                if events_sent % 1000 == 0:
                    logger.info(f"Sent {events_sent}/{total_events} events")
                
                elapsed = time.time() - start_time
                if elapsed < delay:
                    time.sleep(delay - elapsed)
        
        # Flush any remaining messages
        if self.producer:
            self.producer.flush()
        
        console.print(f"\n[green]Production complete![/green]")
        console.print(self._create_stats_table())
    
    def close(self):
        """Close the producer connection."""
        if self.producer:
            self.producer.flush()
            self.producer.close()
            logger.info("Producer closed")


@click.command()
@click.option(
    '--events', '-e',
    default=10000,
    help='Number of bid events to produce'
)
@click.option(
    '--rate', '-r',
    default=100,
    help='Events per second'
)
@click.option(
    '--bootstrap-servers', '-b',
    default='localhost:9094',
    help='Kafka bootstrap servers'
)
@click.option(
    '--no-users',
    is_flag=True,
    help='Skip user event generation'
)
@click.option(
    '--no-items',
    is_flag=True,
    help='Skip item event generation'
)
@click.option(
    '--quiet', '-q',
    is_flag=True,
    help='Disable progress display'
)
def main(
    events: int,
    rate: int,
    bootstrap_servers: str,
    no_users: bool,
    no_items: bool,
    quiet: bool,
):
    """
    Produce synthetic auction events to Kafka.
    
    This tool generates realistic auction data including users, items,
    and bids, streaming them to Kafka topics for pipeline testing.
    """
    console.print("[bold blue]Auction Event Producer[/bold blue]")
    console.print("=" * 40)
    
    producer = AuctionEventProducer(
        bootstrap_servers=bootstrap_servers,
    )
    
    try:
        producer.produce_events(
            total_events=events,
            rate_per_second=rate,
            include_users=not no_users,
            include_items=not no_items,
            show_progress=not quiet,
        )
    finally:
        producer.close()


if __name__ == "__main__":
    main()
