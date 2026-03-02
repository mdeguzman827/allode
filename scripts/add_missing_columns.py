"""
Add missing columns to the database if they don't exist.
Use this after adding new columns to the SQLAlchemy models so existing databases
(e.g. production) get the new columns without recreating tables.

Run from project root:
  python scripts/add_missing_columns.py
  python scripts/add_missing_columns.py --database "postgresql://..."

Uses DATABASE_PUBLIC_URL or DATABASE_URL from backend/.env or project root .env.
"""
import sys
import os

_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _project_root)

from dotenv import load_dotenv

backend_dir = os.path.join(_project_root, "backend")
backend_env = os.path.join(backend_dir, ".env")
root_env = os.path.join(_project_root, ".env")
if os.path.exists(backend_env):
    load_dotenv(dotenv_path=backend_env)
elif os.path.exists(root_env):
    load_dotenv(dotenv_path=root_env)
else:
    load_dotenv()

from sqlalchemy import text
from database.models import get_engine


def get_database_url(database_url: str | None = None) -> str:
    """Get database URL from parameter, environment, or default to SQLite."""
    if database_url:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        return database_url

    env_database_url = os.getenv("DATABASE_PUBLIC_URL") or os.getenv("DATABASE_URL")
    if env_database_url:
        if env_database_url.startswith("postgres://"):
            env_database_url = env_database_url.replace("postgres://", "postgresql://", 1)
        return env_database_url

    return f"sqlite:///{os.path.join(_project_root, 'properties.db')}"


# Columns to add if missing: (table_name, column_name, type_for_postgresql, type_for_sqlite)
COLUMNS_TO_ADD = [
    ("properties", "unit_types", "TEXT", "TEXT"),
]


def column_exists(engine, table: str, column: str, is_sqlite: bool) -> bool:
    """Return True if the column exists on the table."""
    with engine.connect() as conn:
        if is_sqlite:
            # PRAGMA table_info doesn't support bound params for table name
            result = conn.execute(text(f'PRAGMA table_info("{table}")'))
            rows = result.fetchall()
            return any(row[1] == column for row in rows)
        else:
            result = conn.execute(
                text("""
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = :table AND column_name = :column
                """),
                {"table": table, "column": column}
            )
            return result.fetchone() is not None


def add_column(engine, table: str, column: str, type_sql: str) -> None:
    """Execute ALTER TABLE to add the column."""
    with engine.connect() as conn:
        sql = text(f'ALTER TABLE "{table}" ADD COLUMN "{column}" {type_sql}')
        conn.execute(sql)
        conn.commit()


def main(database_url: str | None = None) -> None:
    database_url = get_database_url(database_url)
    is_sqlite = database_url.startswith("sqlite")

    print(f"Database: {'SQLite' if is_sqlite else 'PostgreSQL'}")
    print(f"URL: {database_url.split('@')[-1] if '@' in database_url else database_url}")
    print()

    engine = get_engine(database_url)

    for table, column, type_pg, type_sqlite in COLUMNS_TO_ADD:
        type_sql = type_sqlite if is_sqlite else type_pg
        if column_exists(engine, table, column, is_sqlite):
            print(f"  [SKIP] {table}.{column} already exists")
        else:
            try:
                add_column(engine, table, column, type_sql)
                print(f"  [ADDED] {table}.{column} ({type_sql})")
            except Exception as e:
                print(f"  [ERROR] {table}.{column}: {e}")
                raise

    print("\nDone.")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Add missing columns to the database if they don't exist.")
    parser.add_argument("--database", default=None, help="Database URL (overrides env)")
    args = parser.parse_args()
    main(database_url=args.database)
