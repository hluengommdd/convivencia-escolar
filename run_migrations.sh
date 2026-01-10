#!/usr/bin/env bash
set -euo pipefail

# run_migrations.sh
# Usage:
#   export DATABASE_URL="postgres://user:pass@host:5432/dbname"
#   ./run_migrations.sh

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set. Export it and retry."
  exit 1
fi

DIR="$(cd "$(dirname "$0")" && pwd)/schema"

echo "Running migration 004..."
psql "$DATABASE_URL" -f "$DIR/004_add_holidays_and_compute_due_date.sql"

echo "Seeding stage_sla and holidays (005)..."
psql "$DATABASE_URL" -f "$DIR/005_seed_stage_sla_and_holidays.sql"

echo "Migrations completed."
