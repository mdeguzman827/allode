"""
Migrate bathrooms_total_integer column from INTEGER to FLOAT to support 1 decimal place (e.g. 1.75).
Run this once if you have an existing database before using the updated populate_database.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text


def get_database_url():
    database_url = os.getenv("DATABASE_PUBLIC_URL") or os.getenv("DATABASE_URL")
    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    if database_url:
        return database_url
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return f"sqlite:///{os.path.join(project_root, 'properties.db')}"


def main():
    database_url = get_database_url()
    print("=" * 60)
    print("Migrate bathrooms_total_integer to Float")
    print("=" * 60)
    print(f"Database: {database_url}\n")

    engine = create_engine(database_url)

    try:
        if database_url.startswith("postgresql"):
            with engine.connect() as conn:
                conn.execute(text(
                    "ALTER TABLE properties ALTER COLUMN bathrooms_total_integer TYPE DOUBLE PRECISION USING bathrooms_total_integer::double precision"
                ))
                conn.commit()
            print("✓ PostgreSQL: bathrooms_total_integer column migrated to FLOAT")
        else:
            # SQLite: column affinity is stored but SQLite is dynamically typed.
            # Float values can be stored. If you get errors, you may need to recreate the table.
            print("ℹ SQLite: Column type change not required (SQLite is dynamically typed).")
            print("  Float values will be accepted. If you see errors, consider re-running init_database on a fresh DB.")
        return 0
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())
