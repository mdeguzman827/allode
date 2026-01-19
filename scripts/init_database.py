"""
Initialize database and create tables
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import init_database

def get_database_url():
    """Get database URL from environment or default to SQLite"""
    # Check for DATABASE_PUBLIC_URL first (preferred for external access)
    database_url = os.getenv("DATABASE_PUBLIC_URL")
    
    # Fallback to DATABASE_URL if DATABASE_PUBLIC_URL is not set
    if not database_url:
        database_url = os.getenv("DATABASE_URL")
    
    if database_url:
        # Railway/Heroku provide postgres:// but SQLAlchemy needs postgresql://
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        return database_url
    
    # Default to SQLite for local development
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return f"sqlite:///{os.path.join(project_root, 'properties.db')}"

def main():
    """Initialize database tables"""
    database_url = get_database_url()
    
    print("=" * 60)
    print("Initializing Database")
    print("=" * 60)
    print(f"Database: {database_url}\n")
    
    try:
        engine = init_database(database_url)
        print("✓ Database tables created successfully!")
        print("\nTables created:")
        print("  - properties")
        print("  - property_media")
        print("\nYou can now populate the database with:")
        print("  python3 scripts/populate_database.py --limit 500")
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())

