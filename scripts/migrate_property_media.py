"""
Migration script to add optimized image URL columns to property_media table
"""
import sqlite3
import os
import sys

def migrate_property_media(database_path: str = None):
    """Add optimized image URL columns to property_media table if they don't exist"""
    if database_path is None:
        # Use absolute path relative to project root
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        database_path = os.path.join(project_root, 'properties.db')
    
    if not os.path.exists(database_path):
        print(f"Database not found at {database_path}")
        return False
    
    conn = sqlite3.connect(database_path)
    cursor = conn.cursor()
    
    try:
        # Check which columns exist
        cursor.execute("PRAGMA table_info(property_media)")
        existing_columns = [row[1] for row in cursor.fetchall()]
        
        columns_to_add = [
            ('thumbnail_url', 'TEXT'),
            ('small_url', 'TEXT'),
            ('medium_url', 'TEXT'),
            ('large_url', 'TEXT'),
        ]
        
        added_count = 0
        for column_name, column_type in columns_to_add:
            if column_name not in existing_columns:
                try:
                    cursor.execute(f"ALTER TABLE property_media ADD COLUMN {column_name} {column_type}")
                    print(f"✓ Added column: {column_name}")
                    added_count += 1
                except sqlite3.OperationalError as e:
                    print(f"✗ Error adding column {column_name}: {e}")
            else:
                print(f"  Column {column_name} already exists")
        
        conn.commit()
        
        if added_count > 0:
            print(f"\n✓ Migration complete: Added {added_count} column(s)")
        else:
            print("\n✓ Migration complete: No changes needed")
        
        return True
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Migrate property_media table')
    parser.add_argument('--database', type=str, help='Path to database file')
    args = parser.parse_args()
    
    success = migrate_property_media(args.database)
    sys.exit(0 if success else 1)

