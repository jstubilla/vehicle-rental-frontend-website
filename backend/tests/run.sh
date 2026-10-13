#!/usr/bin/env bash
# Applies every migration to a throwaway Postgres database and runs the business-rule tests.
#
# Needs a Postgres server you can drop and create databases on (no Docker or Supabase needed):
#   PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres ./tests/run.sh
# The database named by TEST_DB (default "rental_test") is dropped and recreated each run.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
db="${TEST_DB:-rental_test}"
psql_cmd=(psql -X -q -v ON_ERROR_STOP=1)

"${psql_cmd[@]}" -d postgres -c "drop database if exists \"$db\"" -c "create database \"$db\"" 2>&1 | grep -v "does not exist, skipping" || true
"${psql_cmd[@]}" -d "$db" -f "$here/supabase-stub.sql"
for migration in "$here"/../supabase/migrations/*.sql; do
  echo "Applying $(basename "$migration")"
  "${psql_cmd[@]}" -d "$db" -f "$migration"
done

"${psql_cmd[@]}" -d "$db" -At -f "$here/business-rules.test.sql" 2>&1 | grep -E "ok - |ERROR|FAILED|ALL TESTS PASSED"
