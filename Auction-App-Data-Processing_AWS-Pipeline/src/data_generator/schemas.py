"""
Data Models for Auction Pipeline

Pydantic models defining the schema for all auction entities.
These models ensure data validation and provide serialization/deserialization.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, field_validator


class AuctionStatus(str, Enum):
    """Possible states for an auction."""
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    ENDED = "ended"
    CANCELLED = "cancelled"
    SOLD = "sold"


class BidType(str, Enum):
    """Types of bids that can be placed."""
    MANUAL = "manual"      # User manually placed bid
    PROXY = "proxy"        # Automatic bid up to max
    SNIPE = "snipe"        # Last-minute bid


class ItemCategory(str, Enum):
    """Categories for auction items."""
    ANTIQUES = "antiques"
    ART = "art"
    ELECTRONICS = "electronics"
    FASHION = "fashion"
    JEWELRY = "jewelry"
    COLLECTIBLES = "collectibles"
    VEHICLES = "vehicles"
    HOME_GARDEN = "home_garden"
    SPORTS = "sports"
    OTHER = "other"


class User(BaseModel):
    """User entity representing bidders and sellers."""
    
    user_id: UUID = Field(default_factory=uuid4)
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    rating: float = Field(default=0.0, ge=0.0, le=5.0)
    registration_date: datetime = Field(default_factory=datetime.utcnow)
    location_city: str = Field(default="Unknown")
    location_country: str = Field(default="Unknown")
    is_verified: bool = Field(default=False)
    total_bids: int = Field(default=0, ge=0)
    total_sales: int = Field(default=0, ge=0)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for serialization."""
        return {
            "user_id": str(self.user_id),
            "username": self.username,
            "email": self.email,
            "rating": self.rating,
            "registration_date": self.registration_date.isoformat(),
            "location_city": self.location_city,
            "location_country": self.location_country,
            "is_verified": self.is_verified,
            "total_bids": self.total_bids,
            "total_sales": self.total_sales,
        }


class Item(BaseModel):
    """Auction item/listing entity."""
    
    item_id: UUID = Field(default_factory=uuid4)
    seller_id: UUID
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(default="", max_length=5000)
    category: ItemCategory = Field(default=ItemCategory.OTHER)
    starting_price: Decimal = Field(..., gt=0, decimal_places=2)
    reserve_price: Optional[Decimal] = Field(default=None, ge=0)
    current_price: Decimal = Field(..., ge=0, decimal_places=2)
    buy_now_price: Optional[Decimal] = Field(default=None, gt=0)
    start_time: datetime
    end_time: datetime
    status: AuctionStatus = Field(default=AuctionStatus.SCHEDULED)
    bid_count: int = Field(default=0, ge=0)
    view_count: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    @field_validator('end_time')
    @classmethod
    def end_after_start(cls, v: datetime, info) -> datetime:
        """Ensure end_time is after start_time."""
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('end_time must be after start_time')
        return v
    
    def to_dict(self) -> dict:
        """Convert to dictionary for serialization."""
        return {
            "item_id": str(self.item_id),
            "seller_id": str(self.seller_id),
            "title": self.title,
            "description": self.description,
            "category": self.category.value,
            "starting_price": float(self.starting_price),
            "reserve_price": float(self.reserve_price) if self.reserve_price else None,
            "current_price": float(self.current_price),
            "buy_now_price": float(self.buy_now_price) if self.buy_now_price else None,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "status": self.status.value,
            "bid_count": self.bid_count,
            "view_count": self.view_count,
            "created_at": self.created_at.isoformat(),
        }


class Bid(BaseModel):
    """Bid event entity - the core streaming data."""
    
    bid_id: UUID = Field(default_factory=uuid4)
    auction_id: UUID
    bidder_id: UUID
    bid_amount: Decimal = Field(..., gt=0, decimal_places=2)
    max_bid_amount: Optional[Decimal] = Field(default=None, gt=0)
    bid_timestamp: datetime = Field(default_factory=datetime.utcnow)
    bid_type: BidType = Field(default=BidType.MANUAL)
    is_winning: bool = Field(default=False)
    previous_price: Decimal = Field(..., ge=0, decimal_places=2)
    ip_address: Optional[str] = Field(default=None)
    user_agent: Optional[str] = Field(default=None)
    
    @field_validator('bid_amount')
    @classmethod
    def bid_higher_than_previous(cls, v: Decimal, info) -> Decimal:
        """Ensure bid is higher than previous price."""
        if 'previous_price' in info.data and v <= info.data['previous_price']:
            raise ValueError('bid_amount must be higher than previous_price')
        return v
    
    def to_dict(self) -> dict:
        """Convert to dictionary for Kafka serialization."""
        return {
            "bid_id": str(self.bid_id),
            "auction_id": str(self.auction_id),
            "bidder_id": str(self.bidder_id),
            "bid_amount": float(self.bid_amount),
            "max_bid_amount": float(self.max_bid_amount) if self.max_bid_amount else None,
            "bid_timestamp": self.bid_timestamp.isoformat(),
            "bid_type": self.bid_type.value,
            "is_winning": self.is_winning,
            "previous_price": float(self.previous_price),
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
        }


class Transaction(BaseModel):
    """Completed auction transaction entity."""
    
    transaction_id: UUID = Field(default_factory=uuid4)
    auction_id: UUID
    seller_id: UUID
    buyer_id: UUID
    final_price: Decimal = Field(..., gt=0, decimal_places=2)
    platform_fee: Decimal = Field(..., ge=0, decimal_places=2)
    seller_revenue: Decimal = Field(..., ge=0, decimal_places=2)
    payment_method: str = Field(default="credit_card")
    transaction_timestamp: datetime = Field(default_factory=datetime.utcnow)
    shipping_address: Optional[str] = Field(default=None)
    is_completed: bool = Field(default=False)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for serialization."""
        return {
            "transaction_id": str(self.transaction_id),
            "auction_id": str(self.auction_id),
            "seller_id": str(self.seller_id),
            "buyer_id": str(self.buyer_id),
            "final_price": float(self.final_price),
            "platform_fee": float(self.platform_fee),
            "seller_revenue": float(self.seller_revenue),
            "payment_method": self.payment_method,
            "transaction_timestamp": self.transaction_timestamp.isoformat(),
            "shipping_address": self.shipping_address,
            "is_completed": self.is_completed,
        }


class BidEvent(BaseModel):
    """Kafka event wrapper for bids with metadata."""
    
    event_id: UUID = Field(default_factory=uuid4)
    event_type: str = Field(default="bid_placed")
    event_timestamp: datetime = Field(default_factory=datetime.utcnow)
    payload: Bid
    
    def to_dict(self) -> dict:
        """Convert to dictionary for Kafka serialization."""
        return {
            "event_id": str(self.event_id),
            "event_type": self.event_type,
            "event_timestamp": self.event_timestamp.isoformat(),
            "payload": self.payload.to_dict(),
        }
