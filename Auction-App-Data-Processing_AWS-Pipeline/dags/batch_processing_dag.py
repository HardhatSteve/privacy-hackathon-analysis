"""
Airflow DAG for Daily Batch Processing

Orchestrates the daily ETL pipeline for auction analytics.
Runs at 2 AM UTC to process previous day's data.
"""

from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.sensors.external_task import ExternalTaskSensor
from airflow.utils.dates import days_ago

# =============================================================================
# DAG Configuration
# =============================================================================
default_args = {
    "owner": "data-engineering",
    "depends_on_past": False,
    "email": ["alerts@example.com"],
    "email_on_failure": True,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(hours=2),
}

dag = DAG(
    dag_id="auction_batch_processing",
    default_args=default_args,
    description="Daily batch processing for auction analytics",
    schedule_interval="0 2 * * *",  # 2 AM UTC daily
    start_date=days_ago(1),
    catchup=False,
    max_active_runs=1,
    tags=["auction", "batch", "analytics"],
)

# =============================================================================
# Task Definitions
# =============================================================================

# Refresh materialized views in Silver layer
refresh_materialized_views = PostgresOperator(
    task_id="refresh_materialized_views",
    postgres_conn_id="postgres_auction",
    sql="""
        REFRESH MATERIALIZED VIEW CONCURRENTLY silver.hourly_bid_stats;
    """,
    dag=dag,
)

# Run Spark batch processing job
run_spark_batch = BashOperator(
    task_id="run_spark_batch_processing",
    bash_command="""
        docker exec spark-master spark-submit \
            --master spark://spark-master:7077 \
            --packages org.postgresql:postgresql:42.6.0 \
            --conf spark.executor.memory=2g \
            --conf spark.driver.memory=1g \
            /opt/spark-apps/src/transformation/batch_processing.py \
            --date {{ ds }}
    """,
    dag=dag,
)

# Data quality checks
def run_data_quality_checks(**context):
    """Run data quality validations on processed data."""
    from datetime import datetime
    import psycopg2
    
    conn = psycopg2.connect(
        host="postgres",
        database="auction",
        user="auction",
        password="auction123"
    )
    cursor = conn.cursor()
    
    checks = []
    execution_date = context["ds"]
    
    # Check 1: Daily revenue record exists
    cursor.execute(
        "SELECT COUNT(*) FROM gold.daily_revenue WHERE report_date = %s",
        (execution_date,)
    )
    revenue_count = cursor.fetchone()[0]
    checks.append(("daily_revenue_exists", revenue_count >= 1))
    
    # Check 2: No negative revenues
    cursor.execute(
        "SELECT COUNT(*) FROM gold.daily_revenue WHERE gross_revenue < 0"
    )
    negative_count = cursor.fetchone()[0]
    checks.append(("no_negative_revenue", negative_count == 0))
    
    # Check 3: Bidder analytics populated
    cursor.execute("SELECT COUNT(*) FROM gold.bidder_analytics")
    bidder_count = cursor.fetchone()[0]
    checks.append(("bidder_analytics_populated", bidder_count > 0))
    
    cursor.close()
    conn.close()
    
    # Log results
    for check_name, passed in checks:
        status = "PASSED" if passed else "FAILED"
        print(f"Data Quality Check [{check_name}]: {status}")
        
    # Fail if any check failed
    failed_checks = [c for c in checks if not c[1]]
    if failed_checks:
        raise ValueError(f"Data quality checks failed: {failed_checks}")
    
    return True

data_quality_checks = PythonOperator(
    task_id="data_quality_checks",
    python_callable=run_data_quality_checks,
    provide_context=True,
    dag=dag,
)

# Update category performance
update_category_performance = PostgresOperator(
    task_id="update_category_performance",
    postgres_conn_id="postgres_auction",
    sql="""
        INSERT INTO gold.category_performance (
            category, total_auctions, active_auctions, completed_auctions,
            total_bids, total_revenue, avg_sale_price, avg_bids_per_auction,
            success_rate, processed_at
        )
        SELECT 
            i.category,
            COUNT(DISTINCT i.item_id) as total_auctions,
            COUNT(DISTINCT CASE WHEN i.status = 'active' THEN i.item_id END) as active_auctions,
            COUNT(DISTINCT CASE WHEN i.status IN ('sold', 'ended') THEN i.item_id END) as completed_auctions,
            COUNT(b.bid_id) as total_bids,
            COALESCE(SUM(t.final_price), 0) as total_revenue,
            AVG(t.final_price) as avg_sale_price,
            CASE WHEN COUNT(DISTINCT i.item_id) > 0 
                 THEN COUNT(b.bid_id)::DECIMAL / COUNT(DISTINCT i.item_id) 
                 ELSE 0 END as avg_bids_per_auction,
            CASE WHEN COUNT(DISTINCT i.item_id) > 0
                 THEN COUNT(DISTINCT CASE WHEN i.status = 'sold' THEN i.item_id END)::DECIMAL 
                      / COUNT(DISTINCT i.item_id) * 100
                 ELSE 0 END as success_rate,
            CURRENT_TIMESTAMP
        FROM silver.items i
        LEFT JOIN silver.bids b ON i.item_id = b.auction_id
        LEFT JOIN silver.transactions t ON i.item_id = t.auction_id
        GROUP BY i.category
        ON CONFLICT (category) DO UPDATE SET
            total_auctions = EXCLUDED.total_auctions,
            active_auctions = EXCLUDED.active_auctions,
            completed_auctions = EXCLUDED.completed_auctions,
            total_bids = EXCLUDED.total_bids,
            total_revenue = EXCLUDED.total_revenue,
            avg_sale_price = EXCLUDED.avg_sale_price,
            avg_bids_per_auction = EXCLUDED.avg_bids_per_auction,
            success_rate = EXCLUDED.success_rate,
            processed_at = CURRENT_TIMESTAMP;
    """,
    dag=dag,
)

# Cleanup old data (optional - for data retention)
cleanup_old_data = PostgresOperator(
    task_id="cleanup_old_data",
    postgres_conn_id="postgres_auction",
    sql="""
        -- Archive bids older than 90 days (example)
        -- DELETE FROM silver.bids WHERE bid_timestamp < CURRENT_DATE - INTERVAL '90 days';
        
        -- For now, just analyze tables for query optimization
        ANALYZE silver.bids;
        ANALYZE silver.items;
        ANALYZE silver.transactions;
    """,
    dag=dag,
)

# =============================================================================
# Task Dependencies
# =============================================================================
refresh_materialized_views >> run_spark_batch >> data_quality_checks
data_quality_checks >> update_category_performance >> cleanup_old_data
