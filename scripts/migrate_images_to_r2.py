"""
Script to migrate existing property images to Cloudflare R2
"""
import sys
import os
import argparse
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import get_engine, get_session, Property
from services.image_processor import ImageProcessor


def migrate_all_properties(batch_size: int = 10, limit: int = None):
    """Migrate all property images to R2"""
    try:
        engine = get_engine()
        session = get_session(engine)
        processor = ImageProcessor()
    except Exception as e:
        print(f"Error initializing: {str(e)}")
        print("Make sure R2 credentials are configured in environment variables.")
        return
    
    try:
        # Get all properties
        query = session.query(Property)
        if limit:
            query = query.limit(limit)
        properties = query.all()
        total = len(properties)
        
        print(f"Found {total} properties to migrate")
        print("=" * 50)
        
        success_count = 0
        error_count = 0
        skipped_count = 0
        
        for i, property_obj in enumerate(properties, 1):
            print(f"\n[{i}/{total}] Processing {property_obj.id}...")
            
            try:
                results = processor.process_property_images(
                    property_id=property_obj.id,
                    db=session,
                    force_reprocess=False
                )
                
                if results.get("error"):
                    print(f"  ✗ Error: {results['error']}")
                    error_count += 1
                elif results.get("errors"):
                    print(f"  ⚠ Partial success with errors:")
                    for error in results["errors"]:
                        print(f"    - {error}")
                    error_count += 1
                else:
                    # Check if images were processed
                    primary_stored = results.get("primary_image", {}).get("status") == "already_stored"
                    media_stored = all(
                        img.get("status") == "already_stored" 
                        for img in results.get("media_images", [])
                    )
                    
                    if primary_stored and media_stored and not results.get("primary_image", {}).get("r2_key"):
                        print(f"  ⊘ Skipped (already stored)")
                        skipped_count += 1
                    else:
                        primary_info = results.get("primary_image", {})
                        media_count = len(results.get("media_images", []))
                        
                        if primary_info.get("r2_key"):
                            print(f"  ✓ Primary image: {primary_info['r2_key']}")
                        if media_count > 0:
                            print(f"  ✓ Media images: {media_count} processed")
                        
                        success_count += 1
                    
            except Exception as e:
                print(f"  ✗ Failed: {str(e)}")
                error_count += 1
                continue
            
            # Commit every batch
            if i % batch_size == 0:
                session.commit()
                print(f"\n  → Committed batch of {batch_size}")
                print(f"  Progress: {success_count} success, {skipped_count} skipped, {error_count} errors")
        
        # Final commit
        session.commit()
        
        print("\n" + "=" * 50)
        print(f"✓ Migration complete!")
        print(f"  Success: {success_count}")
        print(f"  Skipped: {skipped_count}")
        print(f"  Errors: {error_count}")
        print(f"  Total: {total}")
        
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        session.rollback()
    finally:
        session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate property images to Cloudflare R2")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=10,
        help="Number of properties to process before committing (default: 10)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of properties to process (for testing)"
    )
    
    args = parser.parse_args()
    
    migrate_all_properties(batch_size=args.batch_size, limit=args.limit)

