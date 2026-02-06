"""
Script to populate database with properties from NWMLS API.
Fetches in batches of 100: pull from API -> insert/commit -> migrate images to R2, until no more pages or limit reached.
API config (MLSGRID_BEARER_TOKEN, MLSGRID_API_URL) is read from backend/.env or project root .env.
"""
import sys
import os
import time
from datetime import datetime
from zoneinfo import ZoneInfo
import requests
from typing import List, Dict, Any, Tuple, Optional
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse


def _format_elapsed(seconds: float) -> str:
    """Format seconds as human-readable string (e.g. '2h 15m 30s' or '45m' or '30s')."""
    if seconds < 60:
        return f"{int(round(seconds))}s"
    if seconds < 3600:
        m = int(seconds // 60)
        s = int(round(seconds % 60))
        return f"{m}m {s}s" if s else f"{m}m"
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(round(seconds % 60))
    parts = [f"{h}h", f"{m}m"]
    if s:
        parts.append(f"{s}s")
    return " ".join(parts)

# Add parent directory and scripts directory to path
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_scripts_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _project_root)
sys.path.insert(0, _scripts_dir)

from dotenv import load_dotenv

# Load environment variables (backend/.env or project root .env)
backend_dir = os.path.join(_project_root, "backend")
backend_env = os.path.join(backend_dir, ".env")
root_env = os.path.join(_project_root, ".env")
if os.path.exists(backend_env):
    load_dotenv(dotenv_path=backend_env)
elif os.path.exists(root_env):
    load_dotenv(dotenv_path=root_env)
else:
    load_dotenv()

from database.models import init_database, get_session, Property, PropertyMedia
from services.property_transformer import transform_property, transform_media

def _migrate_batch_to_r2(property_ids: List[str], database_url: str) -> None:
    """Run image migration for the given property IDs (called after each batch insert)."""
    from migrate_images_to_r2 import migrate_all_properties
    migrate_all_properties(
        property_ids=property_ids,
        database_url=database_url,
        batch_size=10,
        max_requests_per_second=0,
        workers=16,
    )

# API Configuration from env
BEARER_TOKEN = os.getenv("MLSGRID_BEARER_TOKEN")
API_URL = os.getenv("MLSGRID_API_URL")

# Batch size for API fetch and insert/commit (then migrate R2 after each batch)
API_BATCH_SIZE = 100
# Max retries for property transform and for batch commit
MAX_INSERT_RETRIES = 3


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


def _first_page_url_with_top(top: int = API_BATCH_SIZE) -> str:
    """Build first API URL with $top=top so we get batches of that size."""
    parsed = urlparse(API_URL)
    query = parse_qs(parsed.query, keep_blank_values=True)
    query["$top"] = [str(top)]
    new_query = urlencode(query, doseq=True)
    return urlunparse(parsed._replace(query=new_query))


def fetch_next_page(next_url: str | None, page_num: int, batch_size: int = API_BATCH_SIZE) -> Tuple[List[Dict[str, Any]], str | None]:
    """Fetch one page from the API. Returns (list of properties, next_link or None). batch_size used only for first page."""
    headers = _get_api_headers()
    url = next_url if next_url is not None else _first_page_url_with_top(batch_size)
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"API request failed: {response.status_code} - {response.text}")
    data = response.json()
    page_properties = data.get("value", [])
    next_link = data.get("@odata.nextLink")
    return page_properties, next_link


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
    return f"sqlite:///{os.path.join(_project_root, 'properties.db')}"

def _id_from_raw(raw_prop: Dict[str, Any]) -> str:
    """Return property id from raw API payload (same as transform_property uses)."""
    return raw_prop.get("ListingId") or raw_prop.get("ListingKey") or ""


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
    batch_size: int = API_BATCH_SIZE,
    skip_r2: bool = False,
):
    """Populate database with properties. No limit applied when limit is None.
    When refresh=True, existing properties are updated (primary_image_url, media, and other API fields).
    When skip_r2=True, images are not uploaded to R2 (database and API data only).
    """
    database_url = get_database_url(database_url)

    _pacific = ZoneInfo("America/Los_Angeles")
    run_started_at = datetime.now(_pacific).isoformat()
    print("=" * 60)
    print("Populating Database with Properties")
    print(f"Run started: {run_started_at}")
    if refresh:
        print("Mode: REFRESH (update existing properties with fresh API data)")
    if skip_r2:
        print("Mode: SKIP R2 (images will not be uploaded to R2)")
    print("=" * 60)

    # Initialize database
    print(f"\n1. Initializing database at: {database_url}")
    engine = init_database(database_url)
    session = get_session(engine)

    # Load existing property IDs so we can skip them (unless refresh) and avoid redundant work
    existing_ids: set = set(row[0] for row in session.query(Property.id).all())
    print(f"  Loaded {len(existing_ids)} existing property IDs from database.")

    try:
        inserted_count = 0
        updated_count = 0
        skipped_count = 0
        error_count = 0
        total_inserted = 0
        next_url: str | None = None
        page_num = 0
        start_time = time.perf_counter()

        while True:
            if limit is not None and total_inserted >= limit:
                break
            page_num += 1
            print(f"\n2. Fetching batch {page_num} (up to {batch_size} from API)...")
            page_properties, next_url = fetch_next_page(next_url, page_num, batch_size)
            if not page_properties:
                print(f"  No more data.")
                break

            to_process = page_properties
            if limit is not None:
                remaining = limit - total_inserted
                to_process = page_properties[:remaining]

            # Remove properties already in DB (unless refresh) to save time
            if not refresh:
                orig_len = len(to_process)
                to_process = [p for p in to_process if _id_from_raw(p) not in existing_ids]
                skipped_count += orig_len - len(to_process)
                if not to_process:
                    print(f"  Fetched {len(page_properties)} properties; all {orig_len} already in DB, skipping batch.")
                    if not next_url:
                        break
                    if limit is not None and total_inserted >= limit:
                        break
                    continue

            print(f"  Fetched {len(page_properties)} properties; processing {len(to_process)} (total so far: {total_inserted})")
            batch_ids: List[str] = []

            if refresh:
                # Refresh path: update existing or insert; per-row existing check required; retry transform/insert up to MAX_INSERT_RETRIES
                for idx, raw_prop in enumerate(to_process, 1):
                    last_error: Optional[Exception] = None
                    for attempt in range(1, MAX_INSERT_RETRIES + 1):
                        try:
                            property_data = transform_property(raw_prop)
                            existing = session.query(Property).filter_by(id=property_data["id"]).first()
                            if existing:
                                _apply_property_data(existing, property_data)
                                session.query(PropertyMedia).filter_by(property_id=property_data["id"]).delete()
                                media_list = transform_media(raw_prop)
                                for media_data in media_list:
                                    session.add(PropertyMedia(**media_data))
                                updated_count += 1
                                batch_ids.append(property_data["id"])
                                if updated_count <= 5 or updated_count % 50 == 0:
                                    print(f"  [{idx}/{len(to_process)}] Refreshed {property_data['id']}")
                            else:
                                property_obj = Property(**property_data)
                                session.add(property_obj)
                                for media_data in transform_media(raw_prop):
                                    session.add(PropertyMedia(**media_data))
                                inserted_count += 1
                                batch_ids.append(property_data["id"])
                            break  # success
                        except Exception as e:
                            last_error = e
                            session.rollback()
                            if attempt < MAX_INSERT_RETRIES:
                                time.sleep(1)
                                continue
                            listing_id = raw_prop.get("ListingId") or raw_prop.get("ListingKey", "unknown")
                            print(f"\n  [{idx}/{len(to_process)}] ✗ Error processing property {listing_id} (after {MAX_INSERT_RETRIES} retries): {e}")
                            error_count += 1
                            if error_count <= 3:
                                import traceback
                                traceback.print_exc()
                            break
            else:
                # Insert-only path: no per-row existing check; collect then bulk insert; retry transform up to MAX_INSERT_RETRIES per property
                property_list: List[Dict[str, Any]] = []
                media_list: List[Dict[str, Any]] = []
                for idx, raw_prop in enumerate(to_process, 1):
                    last_err: Optional[Exception] = None
                    for attempt in range(1, MAX_INSERT_RETRIES + 1):
                        try:
                            property_data = transform_property(raw_prop)
                            property_list.append(property_data)
                            for media_data in transform_media(raw_prop):
                                media_list.append(media_data)
                            batch_ids.append(property_data["id"])
                            inserted_count += 1
                            break  # success
                        except Exception as e:
                            last_err = e
                            if attempt < MAX_INSERT_RETRIES:
                                time.sleep(1)
                                continue
                            listing_id = raw_prop.get("ListingId") or raw_prop.get("ListingKey", "unknown")
                            print(f"\n  [{idx}/{len(to_process)}] ✗ Error processing property {listing_id} (after {MAX_INSERT_RETRIES} retries): {e}")
                            error_count += 1
                            if error_count <= 3:
                                import traceback
                                traceback.print_exc()
                            break
                if property_list:
                    session.bulk_insert_mappings(Property, property_list)
                    session.bulk_insert_mappings(PropertyMedia, media_list)

            # Retry flush/commit up to MAX_INSERT_RETRIES times
            commit_ok = False
            for commit_attempt in range(1, MAX_INSERT_RETRIES + 1):
                try:
                    session.flush()
                    session.commit()
                    existing_ids.update(batch_ids)
                    print(f"  ✓ Committed batch of {len(to_process)} properties.")
                    commit_ok = True
                    break
                except Exception as commit_error:
                    session.rollback()
                    if commit_attempt < MAX_INSERT_RETRIES:
                        print(f"  ⚠ Commit attempt {commit_attempt}/{MAX_INSERT_RETRIES} failed, retrying: {commit_error}")
                        time.sleep(1)
                        continue
                    print(f"  ✗ Commit error (after {MAX_INSERT_RETRIES} retries): {commit_error}")
                    import traceback
                    traceback.print_exc()
                    error_count += len(to_process)
                    total_inserted += len(to_process)
                    break
            if not commit_ok:
                if not next_url:
                    break
                continue

            total_inserted += len(to_process)

            if batch_ids and not skip_r2:
                print(f"  3. Migrating images to R2 for {len(batch_ids)} properties...")
                try:
                    _migrate_batch_to_r2(batch_ids, database_url)
                except Exception as migrate_err:
                    print(f"  ✗ R2 migration error (batch continues): {migrate_err}")
                    import traceback
                    traceback.print_exc()

            elapsed = time.perf_counter() - start_time
            print(f"  ⏱ Elapsed: {_format_elapsed(elapsed)}")
            if limit is not None and next_url and total_inserted > 0 and total_inserted < limit:
                remaining_props = limit - total_inserted
                est_remaining_sec = (elapsed / total_inserted) * remaining_props
                print(f"  ⏱ Est. remaining: {_format_elapsed(est_remaining_sec)}")

            if not next_url:
                print("  No more pages (@odata.nextLink empty).")
                break
            if limit is not None and total_inserted >= limit:
                print(f"  Reached limit {limit}.")
                break

        session.close()
        new_session = get_session(engine)
        try:
            actual_property_count = new_session.query(Property).count()
            actual_media_count = new_session.query(PropertyMedia).count()
        finally:
            new_session.close()

        total_elapsed = time.perf_counter() - start_time
        run_ended_at = datetime.now(_pacific).isoformat()
        print("\n" + "=" * 60)
        print("Database Population Complete!")
        print("=" * 60)
        print(f"Run started: {run_started_at}")
        print(f"Run ended:   {run_ended_at}")
        print(f"⏱ Total time: {_format_elapsed(total_elapsed)}")
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
        # Always update "Data last refreshed" on property pages, even when no properties were inserted/updated or on error
        _last_populate_path = os.path.join(_project_root, "backend", "last_populate_run.txt")
        try:
            with open(_last_populate_path, "w") as f:
                f.write(datetime.now(_pacific).isoformat())
        except OSError as e:
            print(f"  (Could not write last populate timestamp: {e})")


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
    parser.add_argument(
        "--batch-size",
        type=int,
        default=API_BATCH_SIZE,
        metavar="N",
        help=f"Number of properties to fetch per API page (default: {API_BATCH_SIZE})",
    )
    parser.add_argument(
        "--no-r2",
        action="store_true",
        help="Skip uploading images to R2; only insert/update database and API data",
    )
    args = parser.parse_args()

    database_url = get_database_url(args.database)
    populate_database(
        database_url=database_url,
        limit=args.limit,
        refresh=args.refresh,
        batch_size=args.batch_size,
        skip_r2=args.no_r2,
    )

