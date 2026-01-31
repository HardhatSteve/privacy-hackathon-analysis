"""
Database Seeding Script

Seeds the PostgreSQL database with initial synthetic data for testing.
"""

import logging
import os
import sys

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from data_generator import AuctionDataGenerator
from serving.postgres_loader import PostgresLoader

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def seed_database(
    num_users: int = 100,
    num_items: int = 500,
    num_bids: int = 5000,
    seed: int = 42,
):
    """
    Seed the database with synthetic auction data.
    
    Args:
        num_users: Number of users to create
        num_items: Number of items to create
        num_bids: Number of bids to create
        seed: Random seed for reproducibility
    """
    logger.info("Starting database seeding...")
    
    # Initialize generator and loader
    generator = AuctionDataGenerator(seed=seed)
    loader = PostgresLoader.from_env()
    
    # Check database connection
    if not loader.health_check():
        logger.error("Database connection failed!")
        return False
    
    logger.info("Database connection successful")
    
    # Generate data
    logger.info(f"Generating {num_users} users...")
    users, items, bids, transactions = generator.generate_complete_dataset(
        num_users=num_users,
        num_items=num_items,
        num_bids=num_bids,
    )
    
    # Load users
    logger.info(f"Loading {len(users)} users...")
    user_dicts = [u.to_dict() for u in users]
    loaded = loader.load_users(user_dicts)
    logger.info(f"Loaded {loaded} users")
    
    # Load items
    logger.info(f"Loading {len(items)} items...")
    item_dicts = [i.to_dict() for i in items]
    loaded = loader.load_items(item_dicts)
    logger.info(f"Loaded {loaded} items")
    
    # Load bids
    logger.info(f"Loading {len(bids)} bids...")
    bid_dicts = [b.to_dict() for b in bids]
    loaded = loader.load_bids(bid_dicts)
    logger.info(f"Loaded {loaded} bids")
    
    # Load transactions
    logger.info(f"Loading {len(transactions)} transactions...")
    txn_dicts = [t.to_dict() for t in transactions]
    loaded = loader.load_transactions(txn_dicts)
    logger.info(f"Loaded {loaded} transactions")
    
    logger.info("Database seeding complete!")
    return True


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Seed the auction database")
    parser.add_argument("--users", type=int, default=100, help="Number of users")
    parser.add_argument("--items", type=int, default=500, help="Number of items")
    parser.add_argument("--bids", type=int, default=5000, help="Number of bids")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    
    args = parser.parse_args()
    
    success = seed_database(
        num_users=args.users,
        num_items=args.items,
        num_bids=args.bids,
        seed=args.seed,
    )
    
    sys.exit(0 if success else 1)
