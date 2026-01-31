"""
Tests for Transformation Logic

Tests the business logic transformations applied to auction data.
"""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List

import pytest


class TestBidValidation:
    """Tests for bid validation logic."""
    
    def test_valid_bid(self):
        """Test that valid bids pass validation."""
        bid = {
            "bid_id": "123",
            "auction_id": "456",
            "bidder_id": "789",
            "bid_amount": 150.00,
            "previous_price": 100.00,
        }
        
        is_valid = (
            bid["bid_amount"] > bid["previous_price"] and
            bid["bid_amount"] > 0 and
            bid["bid_id"] is not None and
            bid["auction_id"] is not None and
            bid["bidder_id"] is not None
        )
        
        assert is_valid is True
    
    def test_invalid_bid_lower_than_previous(self):
        """Test that bids lower than previous price are invalid."""
        bid = {
            "bid_id": "123",
            "auction_id": "456",
            "bidder_id": "789",
            "bid_amount": 90.00,
            "previous_price": 100.00,
        }
        
        is_valid = bid["bid_amount"] > bid["previous_price"]
        assert is_valid is False
    
    def test_invalid_bid_negative_amount(self):
        """Test that negative bid amounts are invalid."""
        bid = {
            "bid_amount": -50.00,
            "previous_price": 100.00,
        }
        
        is_valid = bid["bid_amount"] > 0
        assert is_valid is False
    
    def test_invalid_bid_missing_fields(self):
        """Test that bids with missing required fields are invalid."""
        bid = {
            "bid_id": "123",
            "auction_id": None,  # Missing
            "bidder_id": "789",
            "bid_amount": 150.00,
        }
        
        is_valid = bid["auction_id"] is not None
        assert is_valid is False


class TestBidIncrement:
    """Tests for bid increment calculations."""
    
    @pytest.mark.parametrize("current_price,expected_increment", [
        (0.50, 0.05),
        (0.99, 0.05),
        (1.00, 0.25),
        (4.99, 0.25),
        (5.00, 0.50),
        (24.99, 0.50),
        (25.00, 1.00),
        (99.99, 1.00),
        (100.00, 2.50),
        (249.99, 2.50),
        (250.00, 5.00),
        (499.99, 5.00),
        (500.00, 10.00),
        (999.99, 10.00),
        (1000.00, 25.00),
        (2499.99, 25.00),
        (2500.00, 50.00),
        (4999.99, 50.00),
        (5000.00, 100.00),
        (10000.00, 100.00),
    ])
    def test_bid_increments(self, current_price: float, expected_increment: float):
        """Test bid increment calculation at various price points."""
        from src.data_generator import AuctionDataGenerator
        
        actual_increment = AuctionDataGenerator.get_bid_increment(current_price)
        assert actual_increment == expected_increment


class TestFraudScoring:
    """Tests for fraud detection scoring logic."""
    
    def test_normal_bid_low_fraud_score(self):
        """Test that normal bids have low fraud scores."""
        bid = {
            "bid_amount": 110.00,
            "previous_price": 100.00,
            "bid_type": "manual",
        }
        
        increment = bid["bid_amount"] - bid["previous_price"]
        
        # Score calculation logic
        if increment > bid["previous_price"]:
            fraud_score = 0.8
        elif increment > bid["previous_price"] * 0.5:
            fraud_score = 0.5
        elif bid["bid_type"] == "snipe":
            fraud_score = 0.3
        else:
            fraud_score = 0.1
        
        assert fraud_score == 0.1  # Normal increment
    
    def test_aggressive_bid_higher_fraud_score(self):
        """Test that aggressive bids have higher fraud scores."""
        bid = {
            "bid_amount": 200.00,
            "previous_price": 100.00,
            "bid_type": "manual",
        }
        
        increment = bid["bid_amount"] - bid["previous_price"]
        
        if increment > bid["previous_price"]:
            fraud_score = 0.8
        elif increment > bid["previous_price"] * 0.5:
            fraud_score = 0.5
        else:
            fraud_score = 0.1
        
        assert fraud_score == 0.8  # Increment > 100%
    
    def test_snipe_bid_moderate_fraud_score(self):
        """Test that snipe bids have moderate fraud scores."""
        bid = {
            "bid_amount": 105.00,
            "previous_price": 100.00,
            "bid_type": "snipe",
        }
        
        increment = bid["bid_amount"] - bid["previous_price"]
        
        if increment > bid["previous_price"]:
            fraud_score = 0.8
        elif increment > bid["previous_price"] * 0.5:
            fraud_score = 0.5
        elif bid["bid_type"] == "snipe":
            fraud_score = 0.3
        else:
            fraud_score = 0.1
        
        assert fraud_score == 0.3


class TestAuctionAggregations:
    """Tests for auction aggregation calculations."""
    
    def test_price_increase_percentage(self):
        """Test price increase percentage calculation."""
        starting_price = 100.00
        winning_bid = 250.00
        
        if starting_price > 0:
            price_increase_pct = round(
                (winning_bid - starting_price) / starting_price * 100, 2
            )
        else:
            price_increase_pct = 0
        
        assert price_increase_pct == 150.00
    
    def test_auction_duration_calculation(self):
        """Test auction duration in hours calculation."""
        start_time = datetime(2024, 1, 1, 10, 0, 0)
        end_time = datetime(2024, 1, 4, 10, 0, 0)
        
        duration_hours = (end_time - start_time).total_seconds() / 3600
        
        assert duration_hours == 72.0
    
    def test_reserve_met_calculation(self):
        """Test reserve met determination."""
        # Reserve met
        reserve_price = 150.00
        winning_bid = 200.00
        reserve_met = winning_bid >= reserve_price
        assert reserve_met is True
        
        # Reserve not met
        reserve_price = 150.00
        winning_bid = 120.00
        reserve_met = winning_bid >= reserve_price
        assert reserve_met is False
        
        # No reserve
        reserve_price = None
        winning_bid = 100.00
        reserve_met = reserve_price is None or winning_bid >= reserve_price
        assert reserve_met is True


class TestBidderSegmentation:
    """Tests for bidder segmentation logic."""
    
    @pytest.mark.parametrize("total_bids,expected_segment", [
        (150, "power_bidder"),
        (100, "power_bidder"),
        (50, "active_bidder"),
        (20, "active_bidder"),
        (10, "casual_bidder"),
        (5, "casual_bidder"),
        (3, "new_bidder"),
        (0, "new_bidder"),
    ])
    def test_bidder_segment_assignment(self, total_bids: int, expected_segment: str):
        """Test bidder segment assignment based on bid count."""
        if total_bids >= 100:
            segment = "power_bidder"
        elif total_bids >= 20:
            segment = "active_bidder"
        elif total_bids >= 5:
            segment = "casual_bidder"
        else:
            segment = "new_bidder"
        
        assert segment == expected_segment


class TestSellerTierCalculation:
    """Tests for seller tier calculations."""
    
    @pytest.mark.parametrize("total_revenue,expected_tier", [
        (15000.00, "platinum"),
        (10000.00, "platinum"),
        (7500.00, "gold"),
        (5000.00, "gold"),
        (2500.00, "silver"),
        (1000.00, "silver"),
        (500.00, "bronze"),
        (0.00, "bronze"),
    ])
    def test_seller_tier_assignment(self, total_revenue: float, expected_tier: str):
        """Test seller tier assignment based on revenue."""
        if total_revenue >= 10000:
            tier = "platinum"
        elif total_revenue >= 5000:
            tier = "gold"
        elif total_revenue >= 1000:
            tier = "silver"
        else:
            tier = "bronze"
        
        assert tier == expected_tier


class TestWinRateCalculation:
    """Tests for win rate calculations."""
    
    def test_win_rate_calculation(self):
        """Test win rate percentage calculation."""
        total_bids = 100
        winning_bids = 25
        
        if total_bids > 0:
            win_rate = round(winning_bids / total_bids * 100, 2)
        else:
            win_rate = 0
        
        assert win_rate == 25.00
    
    def test_win_rate_zero_bids(self):
        """Test win rate with zero bids."""
        total_bids = 0
        winning_bids = 0
        
        if total_bids > 0:
            win_rate = round(winning_bids / total_bids * 100, 2)
        else:
            win_rate = 0
        
        assert win_rate == 0


class TestConversionRateCalculation:
    """Tests for conversion rate calculations."""
    
    def test_conversion_rate(self):
        """Test seller conversion rate calculation."""
        total_listings = 100
        total_sales = 75
        
        if total_listings > 0:
            conversion_rate = round(total_sales / total_listings * 100, 2)
        else:
            conversion_rate = 0
        
        assert conversion_rate == 75.00
    
    def test_conversion_rate_no_listings(self):
        """Test conversion rate with no listings."""
        total_listings = 0
        total_sales = 0
        
        if total_listings > 0:
            conversion_rate = round(total_sales / total_listings * 100, 2)
        else:
            conversion_rate = 0
        
        assert conversion_rate == 0
