"""
Migration script to add R2 storage columns to existing database
"""
import sys
import os
import sqlite3

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import get_engine, get_session
from sqlalchemy import text

def migrate_database():
    """Add R2 storage columns to existing database"""
    # Get database URL
    database_url = os.getenv("DATABASE_PUBLIC_URL")
    if not database_url:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        database_path = os.path.join(project_root, 'properties.db')
        database_url = f"sqlite:///{database_path}"
    else:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
    
    print("=" * 60)
    print("Database Migration: Adding R2 Storage Columns")
    print("=" * 60)
    print(f"Database: {database_url}\n")
    
    # For SQLite, use direct connection
    if database_url.startswith("sqlite:///"):
        db_path = database_url.replace("sqlite:///", "")
        
        if not os.path.exists(db_path):
            print(f"✗ Database file not found: {db_path}")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check and add columns to property_media table
        print("Checking property_media table...")
        cursor.execute("PRAGMA table_info(property_media)")
        existing_columns = [row[1] for row in cursor.fetchall()]
        
        columns_to_add = [
            ("r2_key", "VARCHAR"),
            ("r2_url", "TEXT"),
            ("stored_at", "DATETIME"),
            ("file_size", "INTEGER"),
            ("content_type", "VARCHAR")
        ]
        
        for col_name, col_type in columns_to_add:
            if col_name not in existing_columns:
                try:
                    cursor.execute(f"ALTER TABLE property_media ADD COLUMN {col_name} {col_type}")
                    print(f"  ✓ Added column: {col_name}")
                except sqlite3.OperationalError as e:
                    print(f"  ✗ Failed to add {col_name}: {str(e)}")
            else:
                print(f"  ⊘ Column already exists: {col_name}")
        
        # Check and add columns to properties table
        print("\nChecking properties table...")
        cursor.execute("PRAGMA table_info(properties)")
        existing_columns = [row[1] for row in cursor.fetchall()]
        
        property_columns_to_add = [
            ("primary_image_r2_key", "VARCHAR"),
            ("primary_image_r2_url", "TEXT"),
            ("primary_image_stored_at", "DATETIME")
        ]
        
        for col_name, col_type in property_columns_to_add:
            if col_name not in existing_columns:
                try:
                    cursor.execute(f"ALTER TABLE properties ADD COLUMN {col_name} {col_type}")
                    print(f"  ✓ Added column: {col_name}")
                except sqlite3.OperationalError as e:
                    print(f"  ✗ Failed to add {col_name}: {str(e)}")
            else:
                print(f"  ⊘ Column already exists: {col_name}")
        
        conn.commit()
        conn.close()
        print("\n✓ Migration complete!")
        return True
        
    else:
        # For PostgreSQL, use SQLAlchemy
        try:
            engine = get_engine(database_url)
            with engine.connect() as conn:
                # Check and add columns to property_media
                print("Checking property_media table...")
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'property_media'
                """))
                existing_columns = [row[0] for row in result]
                
                columns_to_add = [
                    ("r2_key", "VARCHAR"),
                    ("r2_url", "TEXT"),
                    ("stored_at", "TIMESTAMP"),
                    ("file_size", "INTEGER"),
                    ("content_type", "VARCHAR")
                ]
                
                for col_name, col_type in columns_to_add:
                    if col_name not in existing_columns:
                        try:
                            conn.execute(text(f"ALTER TABLE property_media ADD COLUMN {col_name} {col_type}"))
                            conn.commit()
                            print(f"  ✓ Added column: {col_name}")
                        except Exception as e:
                            print(f"  ✗ Failed to add {col_name}: {str(e)}")
                    else:
                        print(f"  ⊘ Column already exists: {col_name}")
                
                # Check and add columns to properties
                print("\nChecking properties table...")
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'properties'
                """))
                existing_columns = [row[0] for row in result]
                
                property_columns_to_add = [
                    ("primary_image_r2_key", "VARCHAR"),
                    ("primary_image_r2_url", "TEXT"),
                    ("primary_image_stored_at", "TIMESTAMP")
                ]
                
                for col_name, col_type in property_columns_to_add:
                    if col_name not in existing_columns:
                        try:
                            conn.execute(text(f"ALTER TABLE properties ADD COLUMN {col_name} {col_type}"))
                            conn.commit()
                            print(f"  ✓ Added column: {col_name}")
                        except Exception as e:
                            print(f"  ✗ Failed to add {col_name}: {str(e)}")
                    else:
                        print(f"  ⊘ Column already exists: {col_name}")
            
            print("\n✓ Migration complete!")
            return True
            
        except Exception as e:
            print(f"\n✗ Migration failed: {str(e)}")
            return False


if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)

