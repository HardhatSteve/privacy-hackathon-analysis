"""
Serving Module

Handles data serving to downstream consumers (applications, dashboards).
"""

from .postgres_loader import PostgresLoader
from .duckdb_analytics import DuckDBAnalytics

__all__ = [
    "PostgresLoader",
    "DuckDBAnalytics",
]
