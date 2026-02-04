"""
Migration script to add internet_address_display_yn column to properties table.
Run this once if your database was created before this column was added to the model.
"""
import sys
import os
import sqlite3

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


def get_database_url():
    url = os.getenv("DATABASE_PUBLIC_URL") or os.getenv("DATABASE_URL")
    if url:
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url
    return f"sqlite:///{os.path.join(_project_root, 'properties.db')}"


def migrate():
    database_url = get_database_url()
    col_name = "internet_address_display_yn"

    print("=" * 60)
    print("Add internet_address_display_yn to properties")
    print("=" * 60)
    print(f"Database: {database_url.split('@')[-1] if '@' in database_url else database_url}\n")

    if database_url.startswith("sqlite:///"):
        db_path = database_url.replace("sqlite:///", "")
        if not os.path.exists(db_path):
            print(f"✗ Database file not found: {db_path}")
            return False
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(properties)")
        existing = [row[1] for row in cursor.fetchall()]
        if col_name in existing:
            print(f"  ⊘ Column already exists: {col_name}")
            conn.close()
            return True
        try:
            cursor.execute(f"ALTER TABLE properties ADD COLUMN {col_name} BOOLEAN")
            conn.commit()
            print(f"  ✓ Added column: {col_name}")
        except sqlite3.OperationalError as e:
            print(f"  ✗ Failed: {e}")
            conn.close()
            return False
        conn.close()
        print("\n✓ Migration complete!")
        return True

    # PostgreSQL
    from database.models import get_engine
    engine = get_engine(database_url)
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'properties'
            """))
            existing = [row[0] for row in result]
            if col_name in existing:
                print(f"  ⊘ Column already exists: {col_name}")
                return True
            conn.execute(text(f"ALTER TABLE properties ADD COLUMN {col_name} BOOLEAN"))
            conn.commit()
            print(f"  ✓ Added column: {col_name}")
        print("\n✓ Migration complete!")
        return True
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        return False


if __name__ == "__main__":
    success = migrate()
    sys.exit(0 if success else 1)
