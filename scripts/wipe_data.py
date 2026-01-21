#!/usr/bin/env python3
"""
Dangerous helper to wipe database tables and/or Cloudflare R2 objects.
Use at your own risk. Ensure correct environment (prod vs staging) before running.
"""
import argparse
import os
import sys
from typing import Generator, List

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.engine import Engine

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import get_engine  # noqa: E402
from services.r2_storage import R2Storage  # noqa: E402


def load_env() -> None:
    """Load environment from backend/.env or project .env."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backend_env = os.path.join(project_root, "backend", ".env")
    root_env = os.path.join(project_root, ".env")
    if os.path.exists(backend_env):
        load_dotenv(dotenv_path=backend_env)
        return
    if os.path.exists(root_env):
        load_dotenv(dotenv_path=root_env)
        return
    load_dotenv()


def get_database_url() -> str:
    """Resolve database URL with postgres scheme fix and SQLite fallback."""
    url = os.getenv("DATABASE_PUBLIC_URL") or os.getenv("DATABASE_URL")
    if url:
        return url.replace("postgres://", "postgresql://", 1) if url.startswith("postgres://") else url
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return f"sqlite:///{os.path.join(project_root, 'properties.db')}"


def confirm_or_abort(force: bool) -> None:
    """Require user confirmation unless force is set."""
    if force:
        return
    if not sys.stdin.isatty():
        print("Aborted: non-interactive session detected. Re-run with --force to skip prompt.")
        sys.exit(1)
    answer = input("This will permanently delete data. Type 'DELETE' to continue: ").strip()
    if answer != "DELETE":
        print("Aborted.")
        sys.exit(1)


def wipe_database(engine: Engine) -> None:
    """Clear properties tables for SQLite or Postgres."""
    db_url = str(engine.url)
    if db_url.startswith("sqlite:///"):
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM property_media"))
            conn.execute(text("DELETE FROM properties"))
            conn.execute(text("VACUUM"))
        print("✓ SQLite tables cleared.")
        return
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE property_media, properties RESTART IDENTITY CASCADE"))
    print("✓ Postgres tables truncated.")


def chunk_keys(keys: List[str], size: int = 1000) -> Generator[List[str], None, None]:
    """Yield keys in fixed-size chunks."""
    for i in range(0, len(keys), size):
        yield keys[i : i + size]


def wipe_r2(prefix: str, batch_size: int) -> None:
    """Delete R2 objects under optional prefix in batches."""
    storage = R2Storage()
    client = storage.s3_client
    bucket = storage.bucket_name

    deleted = 0
    continuation = None

    print(f"Listing R2 objects in bucket '{bucket}' with prefix '{prefix or ''}' ...")
    while True:
        resp = client.list_objects_v2(
            Bucket=bucket,
            Prefix=prefix or "",
            ContinuationToken=continuation
        )
        contents = resp.get("Contents", [])
        if not contents:
            if continuation:
                print("✓ Finished listing; no more objects.")
            else:
                print("✓ No objects found to delete.")
            break

        keys = [obj["Key"] for obj in contents]
        print(f"Found {len(keys)} objects in current page; deleting in batches of {batch_size}...")
        for batch in chunk_keys(keys, batch_size):
            client.delete_objects(
                Bucket=bucket,
                Delete={"Objects": [{"Key": key} for key in batch]}
            )
            deleted += len(batch)
        print(f"Deleted so far: {deleted}")

        continuation = resp.get("NextContinuationToken")
        if not continuation:
            break

    print(f"✓ R2 objects deleted: {deleted}")


def main() -> int:
    load_env()

    parser = argparse.ArgumentParser(description="Dangerously wipe DB and/or Cloudflare R2 data.")
    parser.add_argument(
        "--target",
        choices=["all", "db", "r2"],
        default="all",
        help="Select what to wipe (default: all)."
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Skip confirmation prompt."
    )
    parser.add_argument(
        "--r2-prefix",
        default="",
        help="Optional prefix to limit R2 deletions (e.g., 'properties/')."
    )
    parser.add_argument(
        "--r2-batch-size",
        type=int,
        default=500,
        help="R2 delete batch size (max 1000, default 500)."
    )
    args = parser.parse_args()

    confirm_or_abort(args.force)

    if args.target in ("all", "db"):
        engine = get_engine(get_database_url())
        wipe_database(engine)

    if args.target in ("all", "r2"):
        wipe_r2(prefix=args.r2_prefix, batch_size=min(args.r2_batch_size, 1000))

    print("✓ Wipe completed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

