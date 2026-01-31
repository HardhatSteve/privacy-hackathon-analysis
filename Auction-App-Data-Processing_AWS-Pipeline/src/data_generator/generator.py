"""
Synthetic Auction Data Generator

Generates realistic auction data including users, items, and bids.
Implements auction-specific patterns like sniping behavior and
realistic bid increments based on research.
"""

import random
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Generator, List, Optional, Tuple
from uuid import UUID, uuid4

from faker import Faker

from .schemas import (
    AuctionStatus,
    Bid,
    BidType,
    Item,
    ItemCategory,
    Transaction,
    User,
)


class AuctionDataGenerator:
    """
    Generates realistic synthetic auction data.
    
    Implements patterns observed in real auction platforms:
    - 57% of auctions have bids in final 60 minutes
    - 31.72% of late bids occur in final minute (sniping)
    - Realistic bid increments following eBay standards
    """
    
    # Item templates for realistic auction items
    ITEM_TEMPLATES = {
        ItemCategory.ANTIQUES: [
            "Victorian {} Antique", "19th Century {} Collection", 
            "Vintage {} from 1920s", "Rare Antique {} circa 1850",
            "Estate Sale {} Lot", "Restored {} Antique"
        ],
        ItemCategory.ART: [
            "Original {} Oil Painting", "Limited Edition {} Print",
            "Signed {} Artwork", "Abstract {} Canvas",
            "Vintage {} Poster", "Hand-painted {} Sculpture"
        ],
        ItemCategory.ELECTRONICS: [
            "Vintage {} Console", "Retro {} Player",
            "Classic {} System", "Rare {} Device",
            "Collectible {} Electronics", "Working {} Unit"
        ],
        ItemCategory.JEWELRY: [
            "14K Gold {} Necklace", "Diamond {} Ring",
            "Vintage {} Brooch", "Sterling Silver {} Bracelet",
            "Estate {} Earrings", "Antique {} Pendant"
        ],
        ItemCategory.COLLECTIBLES: [
            "Rare {} Trading Card", "Limited {} Figure",
            "Vintage {} Memorabilia", "Signed {} Collectible",
            "First Edition {} Set", "Mint Condition {}"
        ],
    }
    
    ITEM_SUBJECTS = [
        "Mahogany", "Bronze", "Crystal", "Porcelain", "Leather",
        "Silk", "Oak", "Marble", "Brass", "Silver", "Gold",
        "Cherry Wood", "Walnut", "Copper", "Ivory", "Pearl"
    ]
    
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36",
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    ]
    
    def __init__(self, seed: Optional[int] = None):
        """
        Initialize the generator with optional seed for reproducibility.
        
        Args:
            seed: Random seed for reproducible data generation
        """
        self.fake = Faker()
        if seed:
            Faker.seed(seed)
            random.seed(seed)
        
        # Cache for maintaining relationships
        self._users: List[User] = []
        self._items: List[Item] = []
        self._active_auctions: List[Item] = []
    
    def generate_user(self) -> User:
        """Generate a realistic user profile."""
        registration_date = self.fake.date_time_between(
            start_date="-3y",
            end_date="now"
        )
        
        # Users with longer history tend to have higher ratings
        days_since_registration = (datetime.utcnow() - registration_date).days
        base_rating = min(2.0 + (days_since_registration / 365), 4.5)
        rating = round(base_rating + random.uniform(-0.5, 0.5), 2)
        rating = max(0.0, min(5.0, rating))
        
        user = User(
            user_id=uuid4(),
            username=self.fake.user_name()[:50],
            email=self.fake.email(),
            rating=rating,
            registration_date=registration_date,
            location_city=self.fake.city(),
            location_country=self.fake.country(),
            is_verified=random.random() < 0.3,  # 30% verified
            total_bids=random.randint(0, 500),
            total_sales=random.randint(0, 100) if random.random() < 0.2 else 0,
        )
        
        self._users.append(user)
        return user
    
    def generate_users(self, count: int) -> List[User]:
        """Generate multiple users."""
        return [self.generate_user() for _ in range(count)]
    
    def generate_item(
        self,
        seller_id: Optional[UUID] = None,
        category: Optional[ItemCategory] = None,
    ) -> Item:
        """
        Generate a realistic auction item.
        
        Args:
            seller_id: Optional seller UUID, randomly selected if not provided
            category: Optional category, randomly selected if not provided
        """
        if seller_id is None:
            if not self._users:
                self.generate_users(10)
            seller_id = random.choice(self._users).user_id
        
        if category is None:
            category = random.choice(list(ItemCategory))
        
        # Generate title from templates
        templates = self.ITEM_TEMPLATES.get(
            category,
            ["Vintage {} Item", "Rare {} Piece", "Collectible {}"]
        )
        template = random.choice(templates)
        subject = random.choice(self.ITEM_SUBJECTS)
        title = template.format(subject)
        
        # Price generation based on category
        price_ranges = {
            ItemCategory.ANTIQUES: (50, 5000),
            ItemCategory.ART: (100, 10000),
            ItemCategory.ELECTRONICS: (25, 500),
            ItemCategory.JEWELRY: (75, 15000),
            ItemCategory.COLLECTIBLES: (10, 2000),
            ItemCategory.VEHICLES: (1000, 50000),
            ItemCategory.FASHION: (20, 500),
        }
        
        min_price, max_price = price_ranges.get(category, (10, 1000))
        starting_price = Decimal(str(round(random.uniform(min_price, max_price), 2)))
        
        # Reserve price (60% of items have reserve)
        reserve_price = None
        if random.random() < 0.6:
            reserve_multiplier = random.uniform(1.5, 3.0)
            reserve_price = Decimal(str(round(float(starting_price) * reserve_multiplier, 2)))
        
        # Buy now price (30% of items)
        buy_now_price = None
        if random.random() < 0.3:
            buy_now_multiplier = random.uniform(2.0, 5.0)
            buy_now_price = Decimal(str(round(float(starting_price) * buy_now_multiplier, 2)))
        
        # Auction timing
        start_offset = random.randint(-7, 0)  # Started up to 7 days ago
        duration_days = random.choice([1, 3, 5, 7, 10])
        
        start_time = datetime.utcnow() + timedelta(days=start_offset)
        end_time = start_time + timedelta(days=duration_days)
        
        # Determine status based on timing
        now = datetime.utcnow()
        if start_time > now:
            status = AuctionStatus.SCHEDULED
        elif end_time < now:
            status = random.choices(
                [AuctionStatus.ENDED, AuctionStatus.SOLD],
                weights=[0.3, 0.7]
            )[0]
        else:
            status = AuctionStatus.ACTIVE
        
        item = Item(
            item_id=uuid4(),
            seller_id=seller_id,
            title=title,
            description=self.fake.paragraph(nb_sentences=3),
            category=category,
            starting_price=starting_price,
            reserve_price=reserve_price,
            current_price=starting_price,
            buy_now_price=buy_now_price,
            start_time=start_time,
            end_time=end_time,
            status=status,
            bid_count=0,
            view_count=random.randint(10, 1000),
        )
        
        self._items.append(item)
        if status == AuctionStatus.ACTIVE:
            self._active_auctions.append(item)
        
        return item
    
    def generate_items(
        self,
        count: int,
        ensure_active: int = 0
    ) -> List[Item]:
        """
        Generate multiple auction items.
        
        Args:
            count: Total number of items to generate
            ensure_active: Minimum number of active auctions to ensure
        """
        items = []
        active_count = 0
        
        for _ in range(count):
            item = self.generate_item()
            items.append(item)
            if item.status == AuctionStatus.ACTIVE:
                active_count += 1
        
        # Ensure minimum active auctions
        while active_count < ensure_active and len(items) < count + ensure_active:
            item = self.generate_item()
            # Force active status
            item.status = AuctionStatus.ACTIVE
            item.start_time = datetime.utcnow() - timedelta(hours=random.randint(1, 48))
            item.end_time = datetime.utcnow() + timedelta(hours=random.randint(1, 72))
            items.append(item)
            self._active_auctions.append(item)
            active_count += 1
        
        return items
    
    @staticmethod
    def get_bid_increment(current_price: float) -> float:
        """
        Calculate minimum bid increment based on current price.
        Follows eBay's standard bid increment table.
        
        Args:
            current_price: Current highest bid price
            
        Returns:
            Minimum bid increment amount
        """
        if current_price < 1:
            return 0.05
        elif current_price < 5:
            return 0.25
        elif current_price < 25:
            return 0.50
        elif current_price < 100:
            return 1.00
        elif current_price < 250:
            return 2.50
        elif current_price < 500:
            return 5.00
        elif current_price < 1000:
            return 10.00
        elif current_price < 2500:
            return 25.00
        elif current_price < 5000:
            return 50.00
        else:
            return 100.00
    
    def _calculate_bid_timing(
        self,
        auction_start: datetime,
        auction_end: datetime
    ) -> datetime:
        """
        Calculate realistic bid timing based on auction research.
        
        Implements observed patterns:
        - 57% of auctions have bids in final 60 minutes
        - 31.72% of late bids occur in final minute (sniping)
        - 17% in 1-5 minutes before end
        """
        duration = (auction_end - auction_start).total_seconds()
        r = random.random()
        
        if r < 0.32:  # 32% in final minute (snipers)
            seconds_before_end = random.randint(1, 60)
        elif r < 0.49:  # 17% in 1-5 minutes before end
            seconds_before_end = random.randint(60, 300)
        elif r < 0.57:  # 8% in 5-60 minutes before end
            seconds_before_end = random.randint(300, 3600)
        else:  # 43% throughout auction
            seconds_before_end = random.randint(3600, int(duration))
        
        bid_time = auction_end - timedelta(seconds=seconds_before_end)
        
        # Ensure bid is within auction period
        if bid_time < auction_start:
            bid_time = auction_start + timedelta(
                seconds=random.randint(0, int(duration * 0.5))
            )
        
        return bid_time
    
    def generate_bid(
        self,
        auction: Optional[Item] = None,
        bidder_id: Optional[UUID] = None,
        force_timestamp: Optional[datetime] = None,
    ) -> Bid:
        """
        Generate a realistic bid for an auction.
        
        Args:
            auction: Item to bid on, randomly selected if not provided
            bidder_id: Bidder UUID, randomly selected if not provided
            force_timestamp: Optional specific timestamp for the bid
        """
        # Select auction
        if auction is None:
            if not self._active_auctions:
                self.generate_items(10, ensure_active=5)
            auction = random.choice(self._active_auctions)
        
        # Select bidder (ensure not the seller)
        if bidder_id is None:
            if not self._users:
                self.generate_users(10)
            available_bidders = [
                u for u in self._users
                if u.user_id != auction.seller_id
            ]
            if not available_bidders:
                self.generate_users(5)
                available_bidders = self._users
            bidder_id = random.choice(available_bidders).user_id
        
        # Calculate bid amount
        current_price = float(auction.current_price)
        increment = self.get_bid_increment(current_price)
        
        # Most bids are near minimum increment, some are aggressive
        if random.random() < 0.7:
            # Standard bid (1-2x increment)
            bid_amount = current_price + increment * random.uniform(1, 2)
        else:
            # Aggressive bid (2-5x increment)
            bid_amount = current_price + increment * random.uniform(2, 5)
        
        bid_amount = round(bid_amount, 2)
        
        # Determine bid timing
        if force_timestamp:
            bid_timestamp = force_timestamp
        else:
            bid_timestamp = self._calculate_bid_timing(
                auction.start_time,
                auction.end_time
            )
        
        # Bid type distribution
        bid_type = random.choices(
            [BidType.MANUAL, BidType.PROXY, BidType.SNIPE],
            weights=[0.6, 0.3, 0.1]
        )[0]
        
        # Max bid for proxy bidding
        max_bid = None
        if bid_type == BidType.PROXY:
            max_bid = Decimal(str(round(bid_amount * random.uniform(1.2, 2.0), 2)))
        
        bid = Bid(
            bid_id=uuid4(),
            auction_id=auction.item_id,
            bidder_id=bidder_id,
            bid_amount=Decimal(str(bid_amount)),
            max_bid_amount=max_bid,
            bid_timestamp=bid_timestamp,
            bid_type=bid_type,
            is_winning=True,  # New bid is always winning
            previous_price=auction.current_price,
            ip_address=self.fake.ipv4(),
            user_agent=random.choice(self.USER_AGENTS),
        )
        
        # Update auction state
        auction.current_price = Decimal(str(bid_amount))
        auction.bid_count += 1
        
        return bid
    
    def generate_bid_stream(
        self,
        count: int,
        auctions: Optional[List[Item]] = None,
    ) -> Generator[Bid, None, None]:
        """
        Generate a stream of bids.
        
        Args:
            count: Number of bids to generate
            auctions: Optional list of auctions to bid on
            
        Yields:
            Bid objects
        """
        if auctions:
            self._active_auctions = [
                a for a in auctions
                if a.status == AuctionStatus.ACTIVE
            ]
        
        for _ in range(count):
            yield self.generate_bid()
    
    def generate_transaction(
        self,
        auction: Item,
        winner_id: UUID,
        platform_fee_rate: float = 0.10,
    ) -> Transaction:
        """
        Generate a transaction for a completed auction.
        
        Args:
            auction: The completed auction item
            winner_id: UUID of the winning bidder
            platform_fee_rate: Platform fee percentage (default 10%)
        """
        final_price = auction.current_price
        platform_fee = Decimal(str(round(float(final_price) * platform_fee_rate, 2)))
        seller_revenue = final_price - platform_fee
        
        return Transaction(
            transaction_id=uuid4(),
            auction_id=auction.item_id,
            seller_id=auction.seller_id,
            buyer_id=winner_id,
            final_price=final_price,
            platform_fee=platform_fee,
            seller_revenue=seller_revenue,
            payment_method=random.choice([
                "credit_card", "paypal", "bank_transfer", "crypto"
            ]),
            transaction_timestamp=auction.end_time + timedelta(minutes=random.randint(5, 60)),
            shipping_address=self.fake.address(),
            is_completed=random.random() < 0.95,  # 95% completed
        )
    
    def generate_complete_dataset(
        self,
        num_users: int = 100,
        num_items: int = 500,
        num_bids: int = 5000,
    ) -> Tuple[List[User], List[Item], List[Bid], List[Transaction]]:
        """
        Generate a complete dataset with all entity types.
        
        Args:
            num_users: Number of users to generate
            num_items: Number of auction items to generate
            num_bids: Number of bids to generate
            
        Returns:
            Tuple of (users, items, bids, transactions)
        """
        # Generate users
        users = self.generate_users(num_users)
        
        # Generate items
        items = self.generate_items(num_items, ensure_active=int(num_items * 0.3))
        
        # Generate bids
        bids = list(self.generate_bid_stream(num_bids))
        
        # Generate transactions for ended auctions
        transactions = []
        for item in items:
            if item.status in [AuctionStatus.ENDED, AuctionStatus.SOLD]:
                if item.bid_count > 0:
                    # Pick a random bidder as winner
                    winner = random.choice([
                        u for u in users if u.user_id != item.seller_id
                    ])
                    txn = self.generate_transaction(item, winner.user_id)
                    transactions.append(txn)
        
        return users, items, bids, transactions


# Convenience functions for quick data generation
def generate_sample_data(
    users: int = 100,
    items: int = 500,
    bids: int = 5000,
    seed: Optional[int] = None
) -> Tuple[List[User], List[Item], List[Bid], List[Transaction]]:
    """
    Quick function to generate sample auction data.
    
    Args:
        users: Number of users
        items: Number of items
        bids: Number of bids
        seed: Optional random seed
        
    Returns:
        Tuple of (users, items, bids, transactions)
    """
    generator = AuctionDataGenerator(seed=seed)
    return generator.generate_complete_dataset(users, items, bids)


if __name__ == "__main__":
    # Demo usage
    users, items, bids, transactions = generate_sample_data(
        users=10, items=20, bids=100, seed=42
    )
    
    print(f"Generated {len(users)} users")
    print(f"Generated {len(items)} items")
    print(f"Generated {len(bids)} bids")
    print(f"Generated {len(transactions)} transactions")
    
    # Sample output
    print("\nSample Bid:")
    print(bids[0].to_dict())
