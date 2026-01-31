"""
Pytest Configuration and Fixtures

Shared fixtures for all tests in the auction pipeline.
"""

import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Generator, List
from uuid import uuid4

import pytest

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from data_generator import AuctionDataGenerator, User, Item, Bid, Transaction


@pytest.fixture(scope="session")
def generator() -> AuctionDataGenerator:
    """Create a seeded data generator for reproducible tests."""
    return AuctionDataGenerator(seed=42)


@pytest.fixture
def sample_user() -> User:
    """Create a sample user for testing."""
    return User(
        user_id=uuid4(),
        username="testuser",
        email="test@example.com",
        rating=4.5,
        registration_date=datetime.utcnow() - timedelta(days=365),
        location_city="New York",
        location_country="USA",
        is_verified=True,
        total_bids=100,
        total_sales=25,
    )


@pytest.fixture
def sample_users(generator: AuctionDataGenerator) -> List[User]:
    """Create a list of sample users."""
    return generator.generate_users(10)


@pytest.fixture
def sample_item(sample_user: User) -> Item:
    """Create a sample auction item."""
    return Item(
        item_id=uuid4(),
        seller_id=sample_user.user_id,
        title="Vintage Test Item",
        description="A test item for unit testing",
        category="collectibles",
        starting_price=Decimal("100.00"),
        reserve_price=Decimal("150.00"),
        current_price=Decimal("100.00"),
        buy_now_price=Decimal("500.00"),
        start_time=datetime.utcnow() - timedelta(hours=24),
        end_time=datetime.utcnow() + timedelta(hours=48),
        status="active",
        bid_count=0,
        view_count=50,
    )


@pytest.fixture
def sample_items(generator: AuctionDataGenerator) -> List[Item]:
    """Create a list of sample items."""
    return generator.generate_items(20, ensure_active=10)


@pytest.fixture
def sample_bid(sample_item: Item, sample_user: User) -> Bid:
    """Create a sample bid."""
    return Bid(
        bid_id=uuid4(),
        auction_id=sample_item.item_id,
        bidder_id=sample_user.user_id,
        bid_amount=Decimal("110.00"),
        bid_timestamp=datetime.utcnow(),
        bid_type="manual",
        is_winning=True,
        previous_price=Decimal("100.00"),
        ip_address="192.168.1.1",
        user_agent="Mozilla/5.0 Test Browser",
    )


@pytest.fixture
def sample_bids(generator: AuctionDataGenerator) -> List[Bid]:
    """Create a list of sample bids."""
    return list(generator.generate_bid_stream(100))


@pytest.fixture
def sample_transaction(sample_item: Item, sample_user: User) -> Transaction:
    """Create a sample transaction."""
    return Transaction(
        transaction_id=uuid4(),
        auction_id=sample_item.item_id,
        seller_id=sample_item.seller_id,
        buyer_id=sample_user.user_id,
        final_price=Decimal("250.00"),
        platform_fee=Decimal("25.00"),
        seller_revenue=Decimal("225.00"),
        payment_method="credit_card",
        transaction_timestamp=datetime.utcnow(),
        shipping_address="123 Test St, Test City, TC 12345",
        is_completed=True,
    )


# Kafka-related fixtures (for integration tests)
@pytest.fixture(scope="session")
def kafka_bootstrap_servers() -> str:
    """Get Kafka bootstrap servers from environment or default."""
    return os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9094")


@pytest.fixture(scope="session")
def postgres_connection_params() -> dict:
    """Get PostgreSQL connection parameters."""
    return {
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": int(os.getenv("POSTGRES_PORT", "5432")),
        "database": os.getenv("POSTGRES_DB", "auction"),
        "user": os.getenv("POSTGRES_USER", "auction"),
        "password": os.getenv("POSTGRES_PASSWORD", "auction123"),
    }


# Markers
def pytest_configure(config):
    """Configure custom markers."""
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "slow: marks tests as slow running"
    )
    config.addinivalue_line(
        "markers", "kafka: marks tests that require Kafka"
    )
    config.addinivalue_line(
        "markers", "postgres: marks tests that require PostgreSQL"
    )
