"""
Script to migrate existing property images to Cloudflare R2.
Only processes properties that still need migration (primary or media images missing R2 key).
Supports parallel processing with one DB session per worker and a thread-safe rate limiter.
"""
import sys
import os
import time
import argparse
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from sqlalchemy.orm import Session
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from .env file
# Try backend/.env first, then project root .env
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
    load_dotenv()  # Try default location
    print("⚠️  No .env file found, using system environment variables")

from sqlalchemy import or_, and_
from sqlalchemy.sql import exists
from sqlalchemy.pool import NullPool
from sqlalchemy.exc import OperationalError, DBAPIError
from database.models import get_engine, get_session, Property, PropertyMedia
from services.image_processor import ImageProcessor

MAX_CONNECTION_RETRIES = 3


def _is_connection_error(exc: BaseException) -> bool:
    """True if the exception indicates a DB connection failure (e.g. server closed connection)."""
    if isinstance(exc, (OperationalError, DBAPIError)):
        return True
    msg = str(exc).lower()
    return "connection" in msg or "closed the connection" in msg or "server closed" in msg


class ThreadSafeRateLimiter:
    """Thread-safe rate limiter to pause between download requests across workers."""
    
    def __init__(self, max_requests_per_second: float):
        self._lock = threading.Lock()
        self.max_requests_per_second = max_requests_per_second
        self.min_interval = 1.0 / max_requests_per_second if max_requests_per_second > 0 else 0
        self.last_request_time = 0.0
    
    def wait(self):
        if self.min_interval <= 0:
            return
        with self._lock:
            elapsed = time.time() - self.last_request_time
            if elapsed < self.min_interval:
                time.sleep(self.min_interval - elapsed)
            self.last_request_time = time.time()


# Lock for coherent print output from multiple workers
_print_lock = threading.Lock()


def _format_estimated_time(seconds: float) -> str:
    """Format seconds as human-readable string (e.g. '2h 15m' or '45m' or '30s')."""
    if seconds < 60:
        return f"{int(round(seconds))}s"
    if seconds < 3600:
        m = int(seconds // 60)
        s = int(round(seconds % 60))
        return f"{m}m {s}s" if s else f"{m}m"
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    return f"{h}h {m}m" if m else f"{h}h"


def _process_one_property(
    property_id: str,
    engine,
    processor: ImageProcessor,
) -> dict:
    """
    Process one property's images (one session per worker).
    Retries up to MAX_CONNECTION_RETRIES times on DB connection errors (e.g. server closed connection).
    Returns dict with keys: status ('success' | 'skipped' | 'error'), message, property_id.
    """
    last_error: BaseException | None = None
    for attempt in range(1, MAX_CONNECTION_RETRIES + 1):
        session = get_session(engine)
        try:
            results = processor.process_property_images(
                property_id=property_id,
                db=session,
                force_reprocess=False,
            )
            session.commit()

            if results.get("error"):
                return {"status": "error", "message": results["error"], "property_id": property_id}
            if results.get("errors"):
                return {"status": "error", "message": "; ".join(results["errors"]), "property_id": property_id}

            primary_stored = results.get("primary_image", {}).get("status") == "already_stored"
            media_stored = all(
                img.get("status") == "already_stored"
                for img in results.get("media_images", [])
            )
            if primary_stored and media_stored and not results.get("primary_image", {}).get("r2_key"):
                return {"status": "skipped", "message": "already stored", "property_id": property_id}

            primary_info = results.get("primary_image", {})
            media_count = len(results.get("media_images", []))
            msg_parts = []
            if primary_info.get("r2_key"):
                msg_parts.append(f"primary: {primary_info['r2_key']}")
            if media_count > 0:
                msg_parts.append(f"{media_count} media")
            return {"status": "success", "message": "; ".join(msg_parts), "property_id": property_id}
        except Exception as e:
            last_error = e
            try:
                session.rollback()
            except Exception:
                pass
            if _is_connection_error(e) and attempt < MAX_CONNECTION_RETRIES:
                time.sleep(1)
                continue
            return {"status": "error", "message": str(e), "property_id": property_id}
        finally:
            try:
                session.close()
            except Exception:
                pass
    return {"status": "error", "message": str(last_error or "Unknown"), "property_id": property_id}


def migrate_all_properties(
    batch_size: int = 10,
    limit: int = None,
    max_requests_per_second: float = 0,
    workers: int = 8,
    property_ids: list | None = None,
    database_url: str | None = None,
):
    """Migrate property images to R2. If property_ids is given, only those IDs are processed; otherwise all properties needing migration are loaded from the DB."""
    try:
        if not database_url:
            database_url = os.getenv("DATABASE_PUBLIC_URL")
        if not database_url:
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            database_path = os.path.join(project_root, "properties.db")
            database_url = f"sqlite:///{database_path}"
        else:
            if database_url.startswith("postgres://"):
                database_url = database_url.replace("postgres://", "postgresql://", 1)

        print("=" * 60)
        print("Image Migration: Uploading Images to Cloudflare R2")
        print("=" * 60)
        print(f"Database: {database_url}")
        print(f"Workers: {workers}")
        if max_requests_per_second:
            print(f"Rate limiting: max {max_requests_per_second} req/sec (thread-safe)")
        else:
            print("Rate limiting: disabled")
        print()

        # Use NullPool when multiple workers so each worker gets its own connection (avoids QueuePool exhaustion)
        if workers > 1:
            from sqlalchemy import create_engine
            engine = create_engine(database_url, echo=False, poolclass=NullPool)
        else:
            engine = get_engine(database_url)
        limiter = ThreadSafeRateLimiter(max_requests_per_second) if max_requests_per_second else None
        processor = ImageProcessor(rate_limiter=limiter)
    except Exception as e:
        print(f"Error initializing: {str(e)}")
        print("Make sure R2 credentials are configured in environment variables.")
        import traceback
        traceback.print_exc()
        return

    # Load property IDs: either use provided list or query for those needing migration
    session = get_session(engine)
    try:
        primary_needs = and_(
            Property.primary_image_url.isnot(None),
            or_(
                Property.primary_image_r2_key.is_(None),
                Property.primary_image_r2_key == "",
            ),
        )
        media_needs = exists().where(
            and_(
                PropertyMedia.property_id == Property.id,
                PropertyMedia.media_url.isnot(None),
                or_(
                    PropertyMedia.r2_key.is_(None),
                    PropertyMedia.r2_key == "",
                ),
            )
        )
        if property_ids is not None:
            # Only process the given IDs (e.g. after a batch insert in populate_database)
            ids_list = list(property_ids)
        else:
            query = (
                session.query(Property.id)
                .filter(or_(primary_needs, media_needs))
                .distinct()
            )
            if limit:
                query = query.limit(limit)
            ids_list = [row[0] for row in query.all()]

        # Count total images for estimated time (only when we have IDs)
        if ids_list:
            primary_count = (
                session.query(Property)
                .filter(Property.id.in_(ids_list), primary_needs)
                .count()
            )
            media_count = (
                session.query(PropertyMedia)
                .filter(
                    PropertyMedia.property_id.in_(ids_list),
                    PropertyMedia.media_url.isnot(None),
                    or_(
                        PropertyMedia.r2_key.is_(None),
                        PropertyMedia.r2_key == "",
                    ),
                )
                .count()
            )
            total_images = primary_count + media_count
        else:
            total_images = 0
    finally:
        session.close()

    property_ids = ids_list

    total = len(property_ids)
    if total == 0:
        print("No properties need migration (all images already in R2).")
        return

    print(f"Found {total} properties that still need migration")
    print(f"Total images to upload: {total_images} (primary: {primary_count}, media: {media_count})")
    if max_requests_per_second and max_requests_per_second > 0 and total_images > 0:
        estimated_seconds = total_images / max_requests_per_second
        print(f"Estimated time (at {max_requests_per_second} req/sec): {_format_estimated_time(estimated_seconds)}")
    print("=" * 50)

    success_count = 0
    error_count = 0
    skipped_count = 0
    completed = 0

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(_process_one_property, property_id, engine, processor): property_id
            for property_id in property_ids
        }
        for future in as_completed(futures):
            completed += 1
            property_id = futures[future]
            try:
                result = future.result()
            except Exception as e:
                result = {"status": "error", "message": str(e), "property_id": property_id}

            if result["status"] == "success":
                success_count += 1
            elif result["status"] == "skipped":
                skipped_count += 1
            else:
                error_count += 1

            with _print_lock:
                if result["status"] == "error":
                    print(f"[{completed}/{total}] ✗ {result['property_id']}: {result['message']}")
                elif result["status"] == "skipped":
                    print(f"[{completed}/{total}] ⊘ {result['property_id']} (already stored)")
                else:
                    print(f"[{completed}/{total}] ✓ {result['property_id']}: {result['message']}")

            if completed % batch_size == 0:
                with _print_lock:
                    print(f"  → Progress: {success_count} success, {skipped_count} skipped, {error_count} errors")

    print("\n" + "=" * 50)
    print("✓ Migration complete!")
    print(f"  Success: {success_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Errors: {error_count}")
    print(f"  Total: {total}")


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
    parser.add_argument(
        "--max-requests-per-second",
        type=float,
        default=0,
        help="Throttle image downloads (default: 0 = disabled; set e.g. 6 to limit req/sec)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=8,
        help="Number of parallel workers (default: 8)",
    )

    args = parser.parse_args()

    migrate_all_properties(
        batch_size=args.batch_size,
        limit=args.limit,
        max_requests_per_second=args.max_requests_per_second,
        workers=args.workers,
    )

