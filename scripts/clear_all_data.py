"""
Script to clear all data from database and Cloudflare R2
⚠️ WARNING: This will delete ALL properties, media, and images!
"""
import argparse
import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
backend_env = os.path.join(backend_dir, '.env')
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_env = os.path.join(project_root, '.env')

if os.path.exists(backend_env):
    load_dotenv(dotenv_path=backend_env)
    print(f"✓ Loaded environment variables from: {backend_env}")
elif os.path.exists(root_env):
    load_dotenv(dotenv_path=root_env)
    print(f"✓ Loaded environment variables from: {root_env}")
else:
    load_dotenv()
    print("⚠️  No .env file found, using system environment variables")

from database.models import get_engine, get_session, Property, PropertyMedia
from services.r2_storage import R2Storage

def clear_all_data(skip_r2: bool = False):
    """Clear all data from database and R2"""
    # Get database URL
    database_url = os.getenv("DATABASE_PUBLIC_URL") or os.getenv("DATABASE_URL")
    if not database_url:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        database_path = os.path.join(project_root, 'properties.db')
        database_url = f"sqlite:///{database_path}"
    else:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
    
    print("=" * 60)
    print("⚠️  CLEARING ALL DATA")
    print("=" * 60)
    print(f"Database: {database_url}\n")
    
    # Confirm
    response = input("⚠️  This will delete ALL data. Type 'DELETE ALL' to confirm: ")
    if response != "DELETE ALL":
        print("❌ Cancelled. Data not deleted.")
        return
    
    r2_storage = None
    if skip_r2:
        print("↷ Skipping R2 initialization (flag provided)")
    else:
        try:
            # Initialize R2 storage
            r2_storage = R2Storage()
            print("✓ R2 storage initialized")
        except Exception as e:
            print(f"⚠️  R2 storage not configured: {str(e)}")
            print("   Will only clear database data.")
    
    engine = get_engine(database_url)
    session = get_session(engine)
    
    try:
        # Step 1: Collect all R2 keys only if R2 deletion is enabled
        r2_keys_to_delete = []
        if not skip_r2:
            property_keys = session.query(Property.primary_image_r2_key).all()
            media_keys = session.query(PropertyMedia.r2_key).all()
            r2_keys_to_delete = [
                key for (key,) in property_keys if key
            ] + [
                key for (key,) in media_keys if key
            ]
            
            print(f"\n📦 Found {len(property_keys)} properties")
            print(f"📸 Found {len(r2_keys_to_delete)} images in R2")
        else:
            property_count = session.query(Property).count()
            print(f"\n📦 Found {property_count} properties (R2 skip enabled)")
            print("↷ Skipping R2 key collection")
        
        # Step 2: Delete from R2
        if r2_storage and r2_keys_to_delete:
            print("\n🗑️  Deleting images from Cloudflare R2...")
            deleted_count = 0
            failed_count = 0
            for r2_key in r2_keys_to_delete:
                try:
                    if r2_storage.delete_image(r2_key):
                        deleted_count += 1
                        if deleted_count % 10 == 0:
                            print(f"  Deleted {deleted_count}/{len(r2_keys_to_delete)} images...")
                    else:
                        failed_count += 1
                except Exception as e:
                    failed_count += 1
                    print(f"  ⚠️  Failed to delete {r2_key}: {str(e)}")
            print(f"✓ Deleted {deleted_count} images from R2")
            if failed_count > 0:
                print(f"⚠️  Failed to delete {failed_count} images")
        elif r2_keys_to_delete and not r2_storage:
            print("⚠️  Skipping R2 deletion (R2 not configured)")
        
        # Step 3: Clear database
        print("\n🗑️  Clearing database...")
        old_property_count = session.query(Property).count()
        old_media_count = session.query(PropertyMedia).count()
        
        session.query(PropertyMedia).delete()
        session.query(Property).delete()
        session.commit()
        
        print("=" * 60)
        print("✓ All data cleared successfully!")
        print(f"  Database: {old_property_count} properties, {old_media_count} media items deleted")
        if r2_storage:
            print(f"  R2: {len(r2_keys_to_delete)} images processed")
        print("=" * 60)
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        session.close()
    
    return 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clear all data from database and Cloudflare R2")
    parser.add_argument("--skip-r2", action="store_true", help="Skip deleting images from R2")
    args = parser.parse_args()
    exit(clear_all_data(skip_r2=args.skip_r2))

