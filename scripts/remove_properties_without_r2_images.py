"""
Script to remove properties from the database that have no images in R2.
A property is considered to have "no images in R2" when:
  - primary_image_r2_key is null or empty, AND
  - no PropertyMedia row for that property has a non-empty r2_key.
"""
import argparse
import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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

from sqlalchemy import or_, and_
from sqlalchemy.sql import exists
from database.models import get_engine, get_session, Property, PropertyMedia


def get_database_url() -> str:
    database_url = os.getenv("DATABASE_PUBLIC_URL") or os.getenv("DATABASE_URL")
    if not database_url:
        database_path = os.path.join(project_root, "properties.db")
        database_url = f"sqlite:///{database_path}"
    else:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
    return database_url


def remove_properties_without_r2_images(dry_run: bool = True) -> int:
    """
    Find properties with no images in R2 (no primary_image_r2_key and no media with r2_key),
    delete their PropertyMedia then Property rows. Returns number of properties removed.
    """
    database_url = get_database_url()
    engine = get_engine(database_url)
    session = get_session(engine)

    # No primary R2 key (null or empty)
    no_primary_r2 = or_(
        Property.primary_image_r2_key.is_(None),
        Property.primary_image_r2_key == "",
    )
    # No media row has R2 key for this property
    has_media_with_r2 = exists().where(
        and_(
            PropertyMedia.property_id == Property.id,
            PropertyMedia.r2_key.isnot(None),
            PropertyMedia.r2_key != "",
        )
    )
    query = session.query(Property.id).filter(no_primary_r2).filter(~has_media_with_r2)
    property_ids = [row[0] for row in query.all()]

    if not property_ids:
        print("No properties found with no images in R2.")
        session.close()
        return 0

    print(f"Found {len(property_ids)} properties with no images in R2.")
    if dry_run:
        print("Dry run: no changes made. Run with --confirm to delete.")
        session.close()
        return 0

    # Delete PropertyMedia first (referenced by property_id), then Property
    deleted_media = session.query(PropertyMedia).filter(
        PropertyMedia.property_id.in_(property_ids)
    ).delete(synchronize_session=False)
    deleted_properties = session.query(Property).filter(
        Property.id.in_(property_ids)
    ).delete(synchronize_session=False)
    session.commit()
    session.close()
    print(f"Deleted {deleted_media} media rows and {deleted_properties} properties.")
    return deleted_properties


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Remove properties from the database that have no images in R2."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only report how many would be removed (default).",
    )
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Actually delete properties with no R2 images (prompts for confirmation).",
    )
    args = parser.parse_args()

    dry_run = not args.confirm
    if args.confirm:
        response = input(
            "This will permanently delete properties that have no images in R2. Type 'yes' to confirm: "
        )
        if response.strip().lower() != "yes":
            print("Cancelled.")
            sys.exit(0)

    print("=" * 60)
    print("Remove properties with no images in R2")
    print("=" * 60)
    print(f"Database: {get_database_url()}\n")

    remove_properties_without_r2_images(dry_run=dry_run)
    print("Done.")
