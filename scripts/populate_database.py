"""
Script to populate database with properties from NWMLS API.
Pages through all results using @odata.nextLink until no more pages.
API config (MLSGRID_BEARER_TOKEN, MLSGRID_API_URL) is read from backend/.env or project root .env.
"""
import sys
import os
import requests
from typing import List, Dict, Any

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

# Load environment variables (backend/.env or project root .env)
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
backend_env = os.path.join(backend_dir, ".env")
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_env = os.path.join(project_root, ".env")
if os.path.exists(backend_env):
    load_dotenv(dotenv_path=backend_env)
elif os.path.exists(root_env):
    load_dotenv(dotenv_path=root_env)
else:
    load_dotenv()

from database.models import init_database, get_session, Property, PropertyMedia
from services.property_transformer import transform_property, transform_media

# API Configuration from env
BEARER_TOKEN = os.getenv("MLSGRID_BEARER_TOKEN")
API_URL = os.getenv("MLSGRID_API_URL")


def _get_api_headers() -> dict:
    """Build request headers; raises if API config is missing."""
    if not BEARER_TOKEN or not API_URL:
        raise ValueError(
            "MLS Grid API config missing. Set MLSGRID_BEARER_TOKEN and MLSGRID_API_URL in backend/.env"
        )
    return {
        "Authorization": f"Bearer {BEARER_TOKEN}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def fetch_properties_from_api() -> List[Dict[str, Any]]:
    """Fetch all properties from NWMLS API by following @odata.nextLink until no more pages."""
    headers = _get_api_headers()
    all_properties: List[Dict[str, Any]] = []
    next_url: str | None = API_URL
    page_num = 1

    print("Fetching properties from NWMLS API...")

    while next_url:
        response = requests.get(next_url, headers=headers)

        if response.status_code != 200:
            raise Exception(f"API request failed: {response.status_code} - {response.text}")

        data = response.json()
        page_properties = data.get("value", [])
        all_properties.extend(page_properties)
        print(f"  Page {page_num}: fetched {len(page_properties)} properties (total so far: {len(all_properties)})")

        # OData responses include @odata.nextLink when more pages exist
        next_url = data.get("@odata.nextLink")
        page_num += 1

    print(f"✓ Fetched {len(all_properties)} properties from API across {page_num - 1} page(s)")
    return all_properties


def get_database_url(database_url: str = None):
    """Get database URL from parameter, environment, or default to SQLite"""
    # If provided as parameter, use it
    if database_url:
        # Handle postgres:// to postgresql:// conversion
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        return database_url
    
    # Check for DATABASE_PUBLIC_URL first (preferred for external access)
    env_database_url = os.getenv("DATABASE_PUBLIC_URL")
    
    # Fallback to DATABASE_URL if DATABASE_PUBLIC_URL is not set
    if not env_database_url:
        env_database_url = os.getenv("DATABASE_URL")
    
    if env_database_url:
        # Railway/Heroku provide postgres:// but SQLAlchemy needs postgresql://
        if env_database_url.startswith("postgres://"):
            env_database_url = env_database_url.replace("postgres://", "postgresql://", 1)
        return env_database_url
    
    # Default to SQLite for local development
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return f"sqlite:///{os.path.join(project_root, 'properties.db')}"

def _apply_property_data(existing: Property, property_data: dict) -> None:
    """Update existing Property with transformed API data. Skips id and R2-only columns."""
    skip_keys = {"id", "primary_image_r2_key", "primary_image_r2_url", "primary_image_stored_at"}
    for key, value in property_data.items():
        if key in skip_keys:
            continue
        if hasattr(Property, key):
            setattr(existing, key, value)


def populate_database(
    database_url: str = None,
    limit: int | None = None,
    refresh: bool = False,
):
    """Populate database with properties. No limit applied when limit is None.
    When refresh=True, existing properties are updated (primary_image_url, media, and other API fields).
    """
    database_url = get_database_url(database_url)

    print("=" * 60)
    print("Populating Database with Properties")
    if refresh:
        print("Mode: REFRESH (update existing properties with fresh API data)")
    print("=" * 60)

    # Initialize database
    print(f"\n1. Initializing database at: {database_url}")
    engine = init_database(database_url)
    session = get_session(engine)

    try:
        # Fetch properties from API
        print("\n2. Fetching properties from API...")
        raw_properties = fetch_properties_from_api()

        if limit is not None:
            raw_properties = raw_properties[:limit]
            print(f"\n3. Transforming and inserting up to {limit} properties ({len(raw_properties)} available)...")
        else:
            print(f"\n3. Transforming and inserting all {len(raw_properties)} properties...")

        inserted_count = 0
        updated_count = 0
        skipped_count = 0
        error_count = 0

        for idx, raw_prop in enumerate(raw_properties, 1):
            try:
                # Transform property data
                property_data = transform_property(raw_prop)

                # Check if property already exists
                existing = session.query(Property).filter_by(id=property_data["id"]).first()
                if existing:
                    if refresh:
                        # Update existing: refresh primary_image_url, media URLs, and other API fields
                        _apply_property_data(existing, property_data)
                        session.query(PropertyMedia).filter_by(property_id=property_data["id"]).delete()
                        media_list = transform_media(raw_prop)
                        for media_data in media_list:
                            session.add(PropertyMedia(**media_data))
                        updated_count += 1
                        if updated_count <= 5 or updated_count % 50 == 0:
                            print(f"  [{idx}/{len(raw_properties)}] Refreshed {property_data['id']}")
                    else:
                        print(f"  [{idx}/{len(raw_properties)}] Skipping {property_data['id']} (already exists)")
                        skipped_count += 1
                    # Batch commit for refresh path too
                    if (inserted_count + updated_count) % 50 == 0 and (inserted_count + updated_count) > 0:
                        try:
                            session.flush()
                            session.commit()
                            print(f"  [{idx}/{len(raw_properties)}] Committed batch of 50...")
                        except Exception as commit_error:
                            print(f"  [{idx}/{len(raw_properties)}] Commit error: {commit_error}")
                            session.rollback()
                            error_count += 50
                            import traceback
                            traceback.print_exc()
                            if refresh:
                                updated_count -= 50
                            else:
                                inserted_count -= 50
                            continue
                    continue

                # Create property object
                property_obj = Property(**property_data)
                session.add(property_obj)

                # Transform and add media
                media_list = transform_media(raw_prop)
                for media_data in media_list:
                    media_obj = PropertyMedia(**media_data)
                    session.add(media_obj)
                
                # Commit every 50 properties to avoid memory issues
                if idx % 50 == 0:
                    try:
                        session.flush()  # Flush before commit to catch any errors early
                        session.commit()
                        print(f"  [{idx}/{len(raw_properties)}] Committed batch of 50 properties...")
                    except Exception as commit_error:
                        print(f"  [{idx}/{len(raw_properties)}] Commit error: {commit_error}")
                        session.rollback()
                        error_count += 50  # Approximate, since we don't know which ones failed
                        import traceback
                        traceback.print_exc()
                        # Don't increment inserted_count for failed batch
                        inserted_count -= 50
                        continue
                
                inserted_count += 1
                
            except Exception as e:
                listing_id = raw_prop.get('ListingId') or raw_prop.get('ListingKey', 'unknown')
                print(f"\n  [{idx}/{len(raw_properties)}] ✗ Error processing property {listing_id}:")
                print(f"     Error type: {type(e).__name__}")
                print(f"     Error message: {str(e)}")
                error_count += 1
                session.rollback()
                # Only show full traceback for first few errors to avoid spam
                if error_count <= 3:
                    import traceback
                    traceback.print_exc()
                continue
        
        # Final commit for remaining properties
        try:
            session.flush()  # Flush before commit to catch any errors early
            session.commit()
            print(f"\n✓ Final commit successful")
        except Exception as commit_error:
            print(f"\n✗ Final commit error: {commit_error}")
            session.rollback()
            import traceback
            traceback.print_exc()
            # Adjust inserted_count for failed final commit
            remaining = inserted_count % 50
            if remaining > 0:
                error_count += remaining
                inserted_count -= remaining
        
        # Close current session and create new one to get accurate counts
        session.close()
        new_session = get_session(engine)
        
        try:
            # Get actual counts from database using fresh session
            actual_property_count = new_session.query(Property).count()
            actual_media_count = new_session.query(PropertyMedia).count()
        finally:
            new_session.close()
        
        print("\n" + "=" * 60)
        print("Database Population Complete!")
        print("=" * 60)
        print(f"✓ Inserted: {inserted_count} properties")
        if refresh:
            print(f"✓ Refreshed: {updated_count} properties (primary_image_url, media, and other API fields)")
        print(f"✓ Skipped: {skipped_count} properties (already exist, no refresh)")
        print(f"✗ Errors: {error_count} properties")
        print(f"\n📊 Actual Database Counts:")
        print(f"✓ Total properties in database: {actual_property_count}")
        print(f"✓ Total media items in database: {actual_media_count}")

        if actual_property_count == 0 and inserted_count > 0:
            print("\n⚠️  WARNING: No properties were actually inserted despite attempts!")
            print("   This suggests commit failures. Check error messages above.")
        
    except Exception as e:
        session.rollback()
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Populate database with NWMLS properties")
    parser.add_argument("--database", default=None, help="Database URL (overrides DATABASE_URL env var)")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of properties to insert (default: no limit)")
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Refresh existing properties: update primary_image_url, media URLs, and other API fields (for re-running migrate_images_to_r2 with fresh signed URLs)",
    )
    args = parser.parse_args()

    database_url = get_database_url(args.database)
    populate_database(database_url=database_url, limit=args.limit, refresh=args.refresh)

