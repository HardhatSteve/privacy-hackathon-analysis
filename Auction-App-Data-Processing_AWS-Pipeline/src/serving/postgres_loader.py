"""
PostgreSQL Data Loader

Handles loading data into PostgreSQL for the Silver layer.
Provides utilities for bulk inserts, upserts, and data management.
"""

import logging
import os
from contextlib import contextmanager
from typing import Any, Dict, Generator, List, Optional

import psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_batch, execute_values

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PostgresLoader:
    """
    PostgreSQL data loader for the auction pipeline.
    
    Features:
    - Bulk insert/upsert operations
    - Transaction management
    - Connection pooling support
    - Schema management utilities
    """
    
    def __init__(
        self,
        host: str = "localhost",
        port: int = 5432,
        database: str = "auction",
        user: str = "auction",
        password: str = "auction123",
    ):
        """
        Initialize PostgreSQL connection parameters.
        
        Args:
            host: Database host
            port: Database port
            database: Database name
            user: Database user
            password: Database password
        """
        self.connection_params = {
            "host": host,
            "port": port,
            "database": database,
            "user": user,
            "password": password,
        }
        self._connection = None
    
    @classmethod
    def from_env(cls) -> "PostgresLoader":
        """Create loader from environment variables."""
        return cls(
            host=os.getenv("POSTGRES_HOST", "localhost"),
            port=int(os.getenv("POSTGRES_PORT", "5432")),
            database=os.getenv("POSTGRES_DB", "auction"),
            user=os.getenv("POSTGRES_USER", "auction"),
            password=os.getenv("POSTGRES_PASSWORD", "auction123"),
        )
    
    @contextmanager
    def connection(self) -> Generator:
        """
        Context manager for database connections.
        
        Yields:
            Database connection
        """
        conn = None
        try:
            conn = psycopg2.connect(**self.connection_params)
            yield conn
        except psycopg2.Error as e:
            logger.error(f"Database connection error: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    @contextmanager
    def cursor(self, commit: bool = True) -> Generator:
        """
        Context manager for database cursors with auto-commit.
        
        Args:
            commit: Whether to commit on success
            
        Yields:
            Database cursor
        """
        with self.connection() as conn:
            cursor = conn.cursor()
            try:
                yield cursor
                if commit:
                    conn.commit()
            except Exception as e:
                conn.rollback()
                logger.error(f"Database operation failed: {e}")
                raise
            finally:
                cursor.close()
    
    def execute(self, query: str, params: Optional[tuple] = None) -> int:
        """
        Execute a single SQL statement.
        
        Args:
            query: SQL query
            params: Query parameters
            
        Returns:
            Number of affected rows
        """
        with self.cursor() as cur:
            cur.execute(query, params)
            return cur.rowcount
    
    def fetch_one(
        self,
        query: str,
        params: Optional[tuple] = None,
    ) -> Optional[tuple]:
        """
        Fetch a single row.
        
        Args:
            query: SQL query
            params: Query parameters
            
        Returns:
            Single row or None
        """
        with self.cursor(commit=False) as cur:
            cur.execute(query, params)
            return cur.fetchone()
    
    def fetch_all(
        self,
        query: str,
        params: Optional[tuple] = None,
    ) -> List[tuple]:
        """
        Fetch all rows.
        
        Args:
            query: SQL query
            params: Query parameters
            
        Returns:
            List of rows
        """
        with self.cursor(commit=False) as cur:
            cur.execute(query, params)
            return cur.fetchall()
    
    def bulk_insert(
        self,
        table: str,
        columns: List[str],
        data: List[tuple],
        schema: str = "silver",
        batch_size: int = 1000,
    ) -> int:
        """
        Bulk insert data into a table.
        
        Args:
            table: Table name
            columns: Column names
            data: List of tuples to insert
            schema: Schema name
            batch_size: Rows per batch
            
        Returns:
            Number of inserted rows
        """
        if not data:
            return 0
        
        full_table = f"{schema}.{table}"
        cols = ", ".join(columns)
        placeholders = ", ".join(["%s"] * len(columns))
        
        query = f"INSERT INTO {full_table} ({cols}) VALUES ({placeholders})"
        
        total_inserted = 0
        
        with self.cursor() as cur:
            for i in range(0, len(data), batch_size):
                batch = data[i:i + batch_size]
                execute_batch(cur, query, batch, page_size=batch_size)
                total_inserted += len(batch)
                logger.debug(f"Inserted batch: {len(batch)} rows")
        
        logger.info(f"Bulk inserted {total_inserted} rows into {full_table}")
        return total_inserted
    
    def bulk_insert_values(
        self,
        table: str,
        columns: List[str],
        data: List[tuple],
        schema: str = "silver",
    ) -> int:
        """
        Bulk insert using execute_values (faster for large datasets).
        
        Args:
            table: Table name
            columns: Column names
            data: List of tuples to insert
            schema: Schema name
            
        Returns:
            Number of inserted rows
        """
        if not data:
            return 0
        
        full_table = f"{schema}.{table}"
        cols = ", ".join(columns)
        
        query = f"INSERT INTO {full_table} ({cols}) VALUES %s"
        
        with self.cursor() as cur:
            execute_values(cur, query, data)
        
        logger.info(f"Bulk inserted {len(data)} rows into {full_table}")
        return len(data)
    
    def upsert(
        self,
        table: str,
        columns: List[str],
        data: List[tuple],
        conflict_columns: List[str],
        update_columns: Optional[List[str]] = None,
        schema: str = "silver",
    ) -> int:
        """
        Upsert (INSERT ... ON CONFLICT UPDATE) data.
        
        Args:
            table: Table name
            columns: All column names
            data: List of tuples to upsert
            conflict_columns: Columns that define uniqueness
            update_columns: Columns to update on conflict (all non-conflict if None)
            schema: Schema name
            
        Returns:
            Number of affected rows
        """
        if not data:
            return 0
        
        if update_columns is None:
            update_columns = [c for c in columns if c not in conflict_columns]
        
        full_table = f"{schema}.{table}"
        cols = ", ".join(columns)
        conflict_cols = ", ".join(conflict_columns)
        
        # Build UPDATE SET clause
        update_set = ", ".join([f"{c} = EXCLUDED.{c}" for c in update_columns])
        
        query = f"""
            INSERT INTO {full_table} ({cols})
            VALUES %s
            ON CONFLICT ({conflict_cols})
            DO UPDATE SET {update_set}
        """
        
        with self.cursor() as cur:
            execute_values(cur, query, data)
        
        logger.info(f"Upserted {len(data)} rows into {full_table}")
        return len(data)
    
    def load_users(self, users: List[Dict[str, Any]]) -> int:
        """
        Load user records into silver.users table.
        
        Args:
            users: List of user dictionaries
            
        Returns:
            Number of loaded rows
        """
        columns = [
            "user_id", "username", "email", "rating",
            "registration_date", "location_city", "location_country",
            "is_verified", "total_bids", "total_sales"
        ]
        
        data = [
            (
                u["user_id"], u["username"], u["email"], u.get("rating", 0),
                u.get("registration_date"), u.get("location_city"),
                u.get("location_country"), u.get("is_verified", False),
                u.get("total_bids", 0), u.get("total_sales", 0)
            )
            for u in users
        ]
        
        return self.upsert(
            table="users",
            columns=columns,
            data=data,
            conflict_columns=["user_id"],
        )
    
    def load_items(self, items: List[Dict[str, Any]]) -> int:
        """
        Load item records into silver.items table.
        
        Args:
            items: List of item dictionaries
            
        Returns:
            Number of loaded rows
        """
        columns = [
            "item_id", "seller_id", "title", "description", "category",
            "starting_price", "reserve_price", "current_price", "buy_now_price",
            "start_time", "end_time", "status", "bid_count", "view_count"
        ]
        
        data = [
            (
                i["item_id"], i["seller_id"], i["title"], i.get("description", ""),
                i["category"], i["starting_price"], i.get("reserve_price"),
                i["current_price"], i.get("buy_now_price"), i["start_time"],
                i["end_time"], i.get("status", "scheduled"),
                i.get("bid_count", 0), i.get("view_count", 0)
            )
            for i in items
        ]
        
        return self.upsert(
            table="items",
            columns=columns,
            data=data,
            conflict_columns=["item_id"],
        )
    
    def load_bids(self, bids: List[Dict[str, Any]]) -> int:
        """
        Load bid records into silver.bids table.
        
        Args:
            bids: List of bid dictionaries
            
        Returns:
            Number of loaded rows
        """
        columns = [
            "bid_id", "auction_id", "bidder_id", "bid_amount",
            "max_bid_amount", "bid_timestamp", "bid_type", "is_winning",
            "previous_price", "ip_address", "user_agent", "is_valid", "fraud_score"
        ]
        
        data = [
            (
                b["bid_id"], b["auction_id"], b["bidder_id"], b["bid_amount"],
                b.get("max_bid_amount"), b["bid_timestamp"], b.get("bid_type", "manual"),
                b.get("is_winning", False), b["previous_price"],
                b.get("ip_address"), b.get("user_agent"),
                b.get("is_valid", True), b.get("fraud_score", 0.0)
            )
            for b in bids
        ]
        
        return self.bulk_insert_values(
            table="bids",
            columns=columns,
            data=data,
        )
    
    def load_transactions(self, transactions: List[Dict[str, Any]]) -> int:
        """
        Load transaction records into silver.transactions table.
        
        Args:
            transactions: List of transaction dictionaries
            
        Returns:
            Number of loaded rows
        """
        columns = [
            "transaction_id", "auction_id", "seller_id", "buyer_id",
            "final_price", "platform_fee", "seller_revenue",
            "payment_method", "transaction_timestamp", "shipping_address", "is_completed"
        ]
        
        data = [
            (
                t["transaction_id"], t["auction_id"], t["seller_id"], t["buyer_id"],
                t["final_price"], t["platform_fee"], t["seller_revenue"],
                t.get("payment_method", "credit_card"), t["transaction_timestamp"],
                t.get("shipping_address"), t.get("is_completed", False)
            )
            for t in transactions
        ]
        
        return self.upsert(
            table="transactions",
            columns=columns,
            data=data,
            conflict_columns=["transaction_id"],
        )
    
    def update_auction_price(
        self,
        auction_id: str,
        new_price: float,
        bid_count_increment: int = 1,
    ) -> bool:
        """
        Update auction current price after a bid.
        
        Args:
            auction_id: Auction ID
            new_price: New current price
            bid_count_increment: How much to increment bid count
            
        Returns:
            True if updated successfully
        """
        query = """
            UPDATE silver.items
            SET current_price = %s,
                bid_count = bid_count + %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE item_id = %s
        """
        
        rows = self.execute(query, (new_price, bid_count_increment, auction_id))
        return rows > 0
    
    def get_active_auctions(self, limit: int = 100) -> List[Dict]:
        """
        Get currently active auctions.
        
        Args:
            limit: Maximum auctions to return
            
        Returns:
            List of auction dictionaries
        """
        query = """
            SELECT item_id, title, category, current_price, end_time, bid_count
            FROM silver.items
            WHERE status = 'active' AND end_time > NOW()
            ORDER BY end_time ASC
            LIMIT %s
        """
        
        rows = self.fetch_all(query, (limit,))
        
        return [
            {
                "item_id": str(row[0]),
                "title": row[1],
                "category": row[2],
                "current_price": float(row[3]),
                "end_time": row[4].isoformat() if row[4] else None,
                "bid_count": row[5],
            }
            for row in rows
        ]
    
    def get_auction_bids(
        self,
        auction_id: str,
        limit: int = 50,
    ) -> List[Dict]:
        """
        Get recent bids for an auction.
        
        Args:
            auction_id: Auction ID
            limit: Maximum bids to return
            
        Returns:
            List of bid dictionaries
        """
        query = """
            SELECT bid_id, bidder_id, bid_amount, bid_timestamp, bid_type, is_winning
            FROM silver.bids
            WHERE auction_id = %s
            ORDER BY bid_timestamp DESC
            LIMIT %s
        """
        
        rows = self.fetch_all(query, (auction_id, limit))
        
        return [
            {
                "bid_id": str(row[0]),
                "bidder_id": str(row[1]),
                "bid_amount": float(row[2]),
                "bid_timestamp": row[3].isoformat() if row[3] else None,
                "bid_type": row[4],
                "is_winning": row[5],
            }
            for row in rows
        ]
    
    def health_check(self) -> bool:
        """
        Check database connectivity.
        
        Returns:
            True if database is accessible
        """
        try:
            result = self.fetch_one("SELECT 1")
            return result is not None
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


if __name__ == "__main__":
    # Demo usage
    loader = PostgresLoader()
    
    if loader.health_check():
        print("Database connection successful!")
        
        # Get active auctions
        auctions = loader.get_active_auctions(limit=5)
        print(f"Active auctions: {len(auctions)}")
    else:
        print("Database connection failed!")
