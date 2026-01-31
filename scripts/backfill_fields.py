"""
Backfill home_type and status for existing properties.
- home_type: from property_type/property_sub_type via get_home_type_from_property.
- status: from mls_status via get_status_from_mls_status (For Sale, Pending, Sold).
Run with DATABASE_URL or DATABASE_PUBLIC_URL set to target Railway or local DB.
"""
import argparse
import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables (same pattern as other scripts)
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
backend_env = os.path.join(backend_dir, ".env")
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_env = os.path.join(project_root, ".env")

if os.path.exists(backend_env):
    load_dotenv(dotenv_path=backend_env)
    print(f"✓ Loaded environment from: {backend_env}")
elif os.path.exists(root_env):
    load_dotenv(dotenv_path=root_env)
    print(f"✓ Loaded environment from: {root_env}")
else:
    load_dotenv()
    print("⚠️  No .env found, using system environment")

from sqlalchemy import or_
from database.models import get_engine, get_session, Property
from services.property_transformer import get_home_type_from_property, get_status_from_mls_status


def get_database_url(database_url: str | None = None) -> str:
    """Resolve database URL from arg, env, or SQLite default. Converts postgres:// to postgresql://."""
    if database_url:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        return database_url
    env_url = os.getenv("DATABASE_PUBLIC_URL") or os.getenv("DATABASE_URL")
    if env_url:
        if env_url.startswith("postgres://"):
            env_url = env_url.replace("postgres://", "postgresql://", 1)
        return env_url
    return f"sqlite:///{os.path.join(project_root, 'properties.db')}"


def backfill_home_type(database_url: str | None = None, batch_size: int = 500, dry_run: bool = False) -> None:
    """Update home_type for all properties where home_type is NULL, using property_sub_type."""
    url = get_database_url(database_url)
    print("=" * 60)
    print("Backfill home_type from property_sub_type")
    print("=" * 60)
    print(f"Database: {url.split('@')[-1] if '@' in url else url}")
    if dry_run:
        print("DRY RUN – no changes will be written")
    print()

    engine = get_engine(url)
    session = get_session(engine)

    try:
        # Rows that need backfill: home_type IS NULL or status IS NULL
        query = session.query(Property).filter(
            or_(Property.home_type.is_(None), Property.status.is_(None))
        )
        total = query.count()
        print(f"Found {total} properties with home_type or status NULL")

        if total == 0:
            print("Nothing to backfill.")
            return

        updated = 0
        for offset in range(0, total, batch_size):
            batch = query.limit(batch_size).offset(offset).all()
            for prop in batch:
                new_home_type = get_home_type_from_property(prop.property_type, prop.property_sub_type)
                new_status = get_status_from_mls_status(prop.mls_status)
                if not dry_run:
                    prop.home_type = new_home_type
                    prop.status = new_status
                updated += 1
            if not dry_run and batch:
                session.commit()
            print(f"  Processed {min(offset + batch_size, total)} / {total} ...")

        if dry_run:
            print(f"\nDry run: would update {updated} row(s). Run without --dry-run to apply.")
        else:
            print(f"\n✓ Backfill complete. Updated {updated} row(s).")
    except Exception as e:
        session.rollback()
        print(f"\n✗ Error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Backfill home_type for properties with NULL home_type using property_sub_type."
    )
    parser.add_argument(
        "--database",
        default=None,
        help="Database URL (default: DATABASE_URL / DATABASE_PUBLIC_URL / SQLite)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Commit every N rows (default: 500)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only count and report; do not write changes",
    )
    args = parser.parse_args()

    backfill_home_type(
        database_url=args.database,
        batch_size=args.batch_size,
        dry_run=args.dry_run,
    )
