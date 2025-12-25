"""
Script to populate database with first 500 properties from NWMLS API
"""
import sys
import os
import requests
from typing import List, Dict, Any

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import init_database, get_session, Property, PropertyMedia
from services.property_transformer import transform_property, transform_media

# API Configuration
BEARER_TOKEN = "0ab805914c87f009210f3444be95e11b19e7cf6f"
API_URL = "https://api-demo.mlsgrid.com/v2/Property?$filter=OriginatingSystemName%20eq%20'nwmls'%20and%20MlgCanView%20eq%20true&$expand=Media&$top=500"

headers = {
    "Authorization": f"Bearer {BEARER_TOKEN}",
    "Accept": "application/json",
    "Content-Type": "application/json"
}


def fetch_properties_from_api() -> List[Dict[str, Any]]:
    """Fetch properties from NWMLS API"""
    print("Fetching properties from NWMLS API...")
    response = requests.get(API_URL, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"API request failed: {response.status_code} - {response.text}")
    
    data = response.json()
    properties = data.get("value", [])
    print(f"✓ Fetched {len(properties)} properties from API")
    return properties


def populate_database(database_url: str = None, limit: int = 500):
    """Populate database with properties"""
    if database_url is None:
        # Use absolute path relative to project root
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        database_url = f"sqlite:///{os.path.join(project_root, 'properties.db')}"
    
    print("=" * 60)
    print("Populating Database with Properties")
    print("=" * 60)
    
    # Initialize database
    print(f"\n1. Initializing database at: {database_url}")
    engine = init_database(database_url)
    session = get_session(engine)
    
    try:
        # Fetch properties from API
        print("\n2. Fetching properties from API...")
        raw_properties = fetch_properties_from_api()
        
        # Limit to first N properties
        if limit:
            raw_properties = raw_properties[:limit]
        
        print(f"\n3. Transforming and inserting {len(raw_properties)} properties...")
        
        inserted_count = 0
        skipped_count = 0
        error_count = 0
        
        for idx, raw_prop in enumerate(raw_properties, 1):
            try:
                # Transform property data
                property_data = transform_property(raw_prop)

                # Check if property already exists
                existing = session.query(Property).filter_by(id=property_data["id"]).first()
                if existing:
                    print(f"  [{idx}/{len(raw_properties)}] Skipping {property_data['id']} (already exists)")
                    skipped_count += 1
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
        print(f"✓ Attempted to insert: {inserted_count} properties")
        print(f"✓ Skipped: {skipped_count} properties (already exist)")
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
    parser.add_argument("--database", default="sqlite:///properties.db", help="Database URL")
    parser.add_argument("--limit", type=int, default=500, help="Limit number of properties to insert")
    
    args = parser.parse_args()
    
    populate_database(args.database, args.limit)

