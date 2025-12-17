"""
Initialize database and create tables
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import init_database

def main():
    """Initialize database tables"""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    database_url = f"sqlite:///{os.path.join(project_root, 'properties.db')}"
    
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

