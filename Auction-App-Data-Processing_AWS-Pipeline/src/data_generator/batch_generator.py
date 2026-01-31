"""
Batch Data Generator

Generates batch files (JSON, Parquet) for S3 upload.
Used for initial data loading and batch processing pipelines.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

import click
import pandas as pd
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

from .generator import AuctionDataGenerator

console = Console()


class BatchDataGenerator:
    """
    Generates batch data files for the auction pipeline.
    
    Creates structured data files in various formats:
    - JSON Lines (.jsonl) for streaming ingestion
    - Parquet for efficient batch processing
    - CSV for compatibility
    """
    
    def __init__(
        self,
        output_dir: str = "./data/batch",
        seed: Optional[int] = None,
    ):
        """
        Initialize the batch generator.
        
        Args:
            output_dir: Directory to write output files
            seed: Optional random seed for reproducibility
        """
        self.output_dir = Path(output_dir)
        self.generator = AuctionDataGenerator(seed=seed)
        
        # Create output directories
        self.bronze_dir = self.output_dir / "bronze"
        self.bronze_dir.mkdir(parents=True, exist_ok=True)
    
    def _entities_to_dataframe(self, entities: list) -> pd.DataFrame:
        """Convert list of Pydantic models to DataFrame."""
        return pd.DataFrame([e.to_dict() for e in entities])
    
    def generate_users_file(
        self,
        count: int,
        format: str = "jsonl",
    ) -> Path:
        """
        Generate users data file.
        
        Args:
            count: Number of users to generate
            format: Output format (jsonl, parquet, csv)
            
        Returns:
            Path to generated file
        """
        users = self.generator.generate_users(count)
        df = self._entities_to_dataframe(users)
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        base_name = f"users_{timestamp}"
        
        if format == "jsonl":
            filepath = self.bronze_dir / f"{base_name}.jsonl"
            with open(filepath, 'w') as f:
                for user in users:
                    f.write(json.dumps(user.to_dict()) + '\n')
        elif format == "parquet":
            filepath = self.bronze_dir / f"{base_name}.parquet"
            df.to_parquet(filepath, index=False)
        elif format == "csv":
            filepath = self.bronze_dir / f"{base_name}.csv"
            df.to_csv(filepath, index=False)
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        return filepath
    
    def generate_items_file(
        self,
        count: int,
        format: str = "jsonl",
    ) -> Path:
        """
        Generate items/auctions data file.
        
        Args:
            count: Number of items to generate
            format: Output format (jsonl, parquet, csv)
            
        Returns:
            Path to generated file
        """
        items = self.generator.generate_items(count, ensure_active=int(count * 0.3))
        df = self._entities_to_dataframe(items)
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        base_name = f"items_{timestamp}"
        
        if format == "jsonl":
            filepath = self.bronze_dir / f"{base_name}.jsonl"
            with open(filepath, 'w') as f:
                for item in items:
                    f.write(json.dumps(item.to_dict()) + '\n')
        elif format == "parquet":
            filepath = self.bronze_dir / f"{base_name}.parquet"
            df.to_parquet(filepath, index=False)
        elif format == "csv":
            filepath = self.bronze_dir / f"{base_name}.csv"
            df.to_csv(filepath, index=False)
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        return filepath
    
    def generate_bids_file(
        self,
        count: int,
        format: str = "jsonl",
    ) -> Path:
        """
        Generate bids data file.
        
        Args:
            count: Number of bids to generate
            format: Output format (jsonl, parquet, csv)
            
        Returns:
            Path to generated file
        """
        bids = list(self.generator.generate_bid_stream(count))
        df = self._entities_to_dataframe(bids)
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        base_name = f"bids_{timestamp}"
        
        if format == "jsonl":
            filepath = self.bronze_dir / f"{base_name}.jsonl"
            with open(filepath, 'w') as f:
                for bid in bids:
                    f.write(json.dumps(bid.to_dict()) + '\n')
        elif format == "parquet":
            filepath = self.bronze_dir / f"{base_name}.parquet"
            df.to_parquet(filepath, index=False)
        elif format == "csv":
            filepath = self.bronze_dir / f"{base_name}.csv"
            df.to_csv(filepath, index=False)
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        return filepath
    
    def generate_complete_dataset(
        self,
        num_users: int = 1000,
        num_items: int = 5000,
        num_bids: int = 50000,
        format: str = "parquet",
    ) -> dict:
        """
        Generate a complete dataset with all entity types.
        
        Args:
            num_users: Number of users
            num_items: Number of items
            num_bids: Number of bids
            format: Output format
            
        Returns:
            Dictionary with paths to all generated files
        """
        files = {}
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            # Users
            task = progress.add_task("Generating users...", total=None)
            files["users"] = self.generate_users_file(num_users, format)
            progress.update(task, completed=True)
            
            # Items
            task = progress.add_task("Generating items...", total=None)
            files["items"] = self.generate_items_file(num_items, format)
            progress.update(task, completed=True)
            
            # Bids
            task = progress.add_task("Generating bids...", total=None)
            files["bids"] = self.generate_bids_file(num_bids, format)
            progress.update(task, completed=True)
        
        return files
    
    def generate_partitioned_data(
        self,
        num_bids: int = 100000,
        partition_by: str = "date",
    ) -> list:
        """
        Generate partitioned data files (for S3 partitioning).
        
        Args:
            num_bids: Total number of bids
            partition_by: Partition key (date, hour)
            
        Returns:
            List of generated file paths
        """
        bids = list(self.generator.generate_bid_stream(num_bids))
        df = self._entities_to_dataframe(bids)
        
        # Parse timestamp for partitioning
        df['bid_timestamp'] = pd.to_datetime(df['bid_timestamp'])
        df['date'] = df['bid_timestamp'].dt.date
        df['hour'] = df['bid_timestamp'].dt.hour
        
        files = []
        
        if partition_by == "date":
            for date, group in df.groupby('date'):
                partition_dir = self.bronze_dir / f"bids/date={date}"
                partition_dir.mkdir(parents=True, exist_ok=True)
                
                filepath = partition_dir / "data.parquet"
                group.drop(columns=['date', 'hour']).to_parquet(filepath, index=False)
                files.append(filepath)
        
        elif partition_by == "hour":
            for (date, hour), group in df.groupby(['date', 'hour']):
                partition_dir = self.bronze_dir / f"bids/date={date}/hour={hour:02d}"
                partition_dir.mkdir(parents=True, exist_ok=True)
                
                filepath = partition_dir / "data.parquet"
                group.drop(columns=['date', 'hour']).to_parquet(filepath, index=False)
                files.append(filepath)
        
        return files


@click.command()
@click.option(
    '--output-dir', '-o',
    default='./data/batch',
    help='Output directory for generated files'
)
@click.option(
    '--users', '-u',
    default=1000,
    help='Number of users to generate'
)
@click.option(
    '--items', '-i',
    default=5000,
    help='Number of items to generate'
)
@click.option(
    '--bids', '-b',
    default=50000,
    help='Number of bids to generate'
)
@click.option(
    '--format', '-f',
    type=click.Choice(['jsonl', 'parquet', 'csv']),
    default='parquet',
    help='Output file format'
)
@click.option(
    '--partitioned',
    is_flag=True,
    help='Generate partitioned data for S3'
)
@click.option(
    '--seed', '-s',
    default=None,
    type=int,
    help='Random seed for reproducibility'
)
def main(
    output_dir: str,
    users: int,
    items: int,
    bids: int,
    format: str,
    partitioned: bool,
    seed: Optional[int],
):
    """
    Generate batch data files for the auction pipeline.
    
    Creates synthetic auction data in various formats suitable
    for S3 upload and batch processing.
    """
    console.print("[bold blue]Batch Data Generator[/bold blue]")
    console.print("=" * 40)
    
    generator = BatchDataGenerator(output_dir=output_dir, seed=seed)
    
    if partitioned:
        console.print(f"Generating {bids} partitioned bids...")
        files = generator.generate_partitioned_data(bids)
        console.print(f"[green]Generated {len(files)} partition files[/green]")
    else:
        console.print(f"Generating complete dataset...")
        console.print(f"  Users: {users}")
        console.print(f"  Items: {items}")
        console.print(f"  Bids: {bids}")
        console.print(f"  Format: {format}")
        
        files = generator.generate_complete_dataset(
            num_users=users,
            num_items=items,
            num_bids=bids,
            format=format,
        )
        
        console.print("\n[green]Generated files:[/green]")
        for name, path in files.items():
            size = os.path.getsize(path) / 1024 / 1024  # MB
            console.print(f"  {name}: {path} ({size:.2f} MB)")


if __name__ == "__main__":
    main()
