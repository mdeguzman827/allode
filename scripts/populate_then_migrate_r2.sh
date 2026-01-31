#!/usr/bin/env bash
# Run populate_database.py with increasing limits, then migrate_images_to_r2.py after each run.
# Limits: 1000, 2000, 3000, ... up to 11000.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

limit=1000
max_limit=11000

while [ "$limit" -le "$max_limit" ]; do
  echo "=========================================="
  echo "Step: populate_database.py --limit $limit"
  echo "=========================================="
  python3 scripts/populate_database.py --limit "$limit"

  echo ""
  echo "=========================================="
  echo "Step: migrate_images_to_r2.py"
  echo "=========================================="
  python3 scripts/migrate_images_to_r2.py

  limit=$((limit + 1000))
  echo ""
done

echo "Done. Completed all steps up to limit $max_limit."
