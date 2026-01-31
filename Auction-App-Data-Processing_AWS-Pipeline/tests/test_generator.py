"""
Tests for Synthetic Data Generator

Tests the AuctionDataGenerator class and related functionality.
"""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import List

import pytest

from src.data_generator import (
    AuctionDataGenerator,
    AuctionStatus,
    Bid,
    BidType,
    Item,
    ItemCategory,
    User,
)


class TestAuctionDataGenerator:
    """Tests for AuctionDataGenerator class."""
    
    def test_generator_initialization(self):
        """Test generator can be initialized."""
        generator = AuctionDataGenerator()
        assert generator is not None
        assert generator.fake is not None
    
    def test_generator_with_seed(self):
        """Test generator produces reproducible results with seed."""
        gen1 = AuctionDataGenerator(seed=42)
        gen2 = AuctionDataGenerator(seed=42)
        
        user1 = gen1.generate_user()
        user2 = gen2.generate_user()
        
        assert user1.username == user2.username
        assert user1.email == user2.email
    
    def test_generate_user(self, generator: AuctionDataGenerator):
        """Test user generation."""
        user = generator.generate_user()
        
        assert user.user_id is not None
        assert len(user.username) >= 3
        assert "@" in user.email
        assert 0 <= user.rating <= 5
        assert user.registration_date <= datetime.utcnow()
        assert user.total_bids >= 0
        assert user.total_sales >= 0
    
    def test_generate_users(self, generator: AuctionDataGenerator):
        """Test bulk user generation."""
        users = generator.generate_users(100)
        
        assert len(users) == 100
        
        # Check all user IDs are unique
        user_ids = [u.user_id for u in users]
        assert len(set(user_ids)) == 100
    
    def test_generate_item(self, generator: AuctionDataGenerator):
        """Test item generation."""
        # Ensure we have users first
        generator.generate_users(5)
        
        item = generator.generate_item()
        
        assert item.item_id is not None
        assert item.seller_id is not None
        assert len(item.title) >= 5
        assert item.starting_price > 0
        assert item.current_price >= item.starting_price
        assert item.start_time < item.end_time
        assert item.status in [s.value for s in AuctionStatus]
    
    def test_generate_item_with_category(self, generator: AuctionDataGenerator):
        """Test item generation with specific category."""
        generator.generate_users(5)
        
        item = generator.generate_item(category=ItemCategory.JEWELRY)
        
        assert item.category == ItemCategory.JEWELRY
        # Jewelry items should have higher price range
        assert item.starting_price >= 75
    
    def test_generate_items_with_active_auctions(self, generator: AuctionDataGenerator):
        """Test generating items with minimum active auctions."""
        generator.generate_users(10)
        
        items = generator.generate_items(50, ensure_active=20)
        
        active_count = sum(1 for i in items if i.status == AuctionStatus.ACTIVE)
        assert active_count >= 20
    
    def test_bid_increment_calculation(self):
        """Test bid increment follows eBay standards."""
        # Test various price points
        assert AuctionDataGenerator.get_bid_increment(0.50) == 0.05
        assert AuctionDataGenerator.get_bid_increment(3.00) == 0.25
        assert AuctionDataGenerator.get_bid_increment(15.00) == 0.50
        assert AuctionDataGenerator.get_bid_increment(75.00) == 1.00
        assert AuctionDataGenerator.get_bid_increment(150.00) == 2.50
        assert AuctionDataGenerator.get_bid_increment(400.00) == 5.00
        assert AuctionDataGenerator.get_bid_increment(800.00) == 10.00
        assert AuctionDataGenerator.get_bid_increment(2000.00) == 25.00
        assert AuctionDataGenerator.get_bid_increment(4000.00) == 50.00
        assert AuctionDataGenerator.get_bid_increment(10000.00) == 100.00
    
    def test_generate_bid(self, generator: AuctionDataGenerator):
        """Test bid generation."""
        generator.generate_users(10)
        generator.generate_items(10, ensure_active=5)
        
        bid = generator.generate_bid()
        
        assert bid.bid_id is not None
        assert bid.auction_id is not None
        assert bid.bidder_id is not None
        assert bid.bid_amount > bid.previous_price
        assert bid.bid_type in [t.value for t in BidType]
        assert bid.bid_timestamp is not None
    
    def test_generate_bid_stream(self, generator: AuctionDataGenerator):
        """Test streaming bid generation."""
        generator.generate_users(20)
        generator.generate_items(20, ensure_active=10)
        
        bids = list(generator.generate_bid_stream(100))
        
        assert len(bids) == 100
        
        # Verify bid IDs are unique
        bid_ids = [b.bid_id for b in bids]
        assert len(set(bid_ids)) == 100
    
    def test_bid_increases_auction_price(self, generator: AuctionDataGenerator):
        """Test that bids update the auction's current price."""
        generator.generate_users(10)
        items = generator.generate_items(5, ensure_active=5)
        
        auction = items[0]
        original_price = auction.current_price
        original_bid_count = auction.bid_count
        
        bid = generator.generate_bid(auction=auction)
        
        assert auction.current_price > original_price
        assert auction.bid_count == original_bid_count + 1
        assert float(auction.current_price) == float(bid.bid_amount)
    
    def test_generate_transaction(self, generator: AuctionDataGenerator):
        """Test transaction generation."""
        users = generator.generate_users(10)
        items = generator.generate_items(5, ensure_active=3)
        
        # Generate some bids to increase price
        for _ in range(5):
            generator.generate_bid(auction=items[0])
        
        winner = users[0]
        transaction = generator.generate_transaction(items[0], winner.user_id)
        
        assert transaction.transaction_id is not None
        assert transaction.auction_id == items[0].item_id
        assert transaction.buyer_id == winner.user_id
        assert transaction.final_price == items[0].current_price
        assert transaction.platform_fee > 0
        assert transaction.seller_revenue == transaction.final_price - transaction.platform_fee
    
    def test_complete_dataset_generation(self, generator: AuctionDataGenerator):
        """Test generating a complete dataset."""
        users, items, bids, transactions = generator.generate_complete_dataset(
            num_users=50,
            num_items=100,
            num_bids=500,
        )
        
        assert len(users) == 50
        assert len(items) == 100
        assert len(bids) == 500
        assert len(transactions) >= 0  # May not have any if no auctions ended


class TestUserModel:
    """Tests for User Pydantic model."""
    
    def test_user_to_dict(self, sample_user: User):
        """Test user serialization."""
        data = sample_user.to_dict()
        
        assert "user_id" in data
        assert "username" in data
        assert "email" in data
        assert isinstance(data["user_id"], str)
        assert isinstance(data["rating"], float)
    
    def test_user_validation(self):
        """Test user validation rules."""
        # Username too short
        with pytest.raises(ValueError):
            User(
                username="ab",  # Min 3 chars
                email="test@example.com",
            )
        
        # Invalid email
        with pytest.raises(ValueError):
            User(
                username="testuser",
                email="invalid-email",
            )
        
        # Rating out of range
        with pytest.raises(ValueError):
            User(
                username="testuser",
                email="test@example.com",
                rating=6.0,  # Max 5.0
            )


class TestItemModel:
    """Tests for Item Pydantic model."""
    
    def test_item_to_dict(self, sample_item: Item):
        """Test item serialization."""
        data = sample_item.to_dict()
        
        assert "item_id" in data
        assert "title" in data
        assert "starting_price" in data
        assert isinstance(data["starting_price"], float)
        assert isinstance(data["category"], str)
    
    def test_item_end_after_start_validation(self):
        """Test that end_time must be after start_time."""
        now = datetime.utcnow()
        
        with pytest.raises(ValueError):
            Item(
                seller_id="00000000-0000-0000-0000-000000000001",
                title="Test Item Title",
                category="collectibles",
                starting_price=Decimal("100.00"),
                current_price=Decimal("100.00"),
                start_time=now,
                end_time=now - timedelta(hours=1),  # Before start
            )


class TestBidModel:
    """Tests for Bid Pydantic model."""
    
    def test_bid_to_dict(self, sample_bid: Bid):
        """Test bid serialization."""
        data = sample_bid.to_dict()
        
        assert "bid_id" in data
        assert "bid_amount" in data
        assert "bid_timestamp" in data
        assert isinstance(data["bid_amount"], float)
    
    def test_bid_must_exceed_previous(self):
        """Test that bid amount must exceed previous price."""
        with pytest.raises(ValueError):
            Bid(
                auction_id="00000000-0000-0000-0000-000000000001",
                bidder_id="00000000-0000-0000-0000-000000000002",
                bid_amount=Decimal("100.00"),
                previous_price=Decimal("150.00"),  # Higher than bid
            )


class TestTransactionModel:
    """Tests for Transaction Pydantic model."""
    
    def test_transaction_to_dict(self, sample_transaction):
        """Test transaction serialization."""
        data = sample_transaction.to_dict()
        
        assert "transaction_id" in data
        assert "final_price" in data
        assert "platform_fee" in data
        assert isinstance(data["final_price"], float)
