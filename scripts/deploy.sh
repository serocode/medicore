#!/usr/bin/env bash
# One entry point for the production stack on the server, instead of
# remembering long `docker compose -f docker-compose.prod.yml ...` lines.
#
#   bash scripts/deploy.sh <command> [args]
#
# Run `bash scripts/deploy.sh help` for the list.
set -euo pipefail

# Works from any directory: everything below is relative to the repo root.
cd "$(dirname "${BASH_SOURCE[0]}")/.."

COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="backups"
# How many dumps `backup` keeps; older ones are deleted.
BACKUP_KEEP="${BACKUP_KEEP:-14}"

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

die() {
  echo "error: $*" >&2
  exit 1
}

confirm() {
  local answer
  read -r -p "$1 [y/N] " answer
  [[ "$answer" == "y" || "$answer" == "Y" ]] || die "cancelled"
}

preflight() {
  command -v docker >/dev/null || die "docker is not installed"
  [[ -f .env ]] || die "no .env in $(pwd) - copy .env.example to .env and fill it in"
}

# Runs psql inside the postgres container as the app's own user. The
# credentials come from the container's environment, so this script never
# reads or parses .env itself.
pg() {
  compose exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" "$@"' psql "$@"
}

db_name() {
  compose exec -T postgres sh -c 'printf %s "$POSTGRES_DB"'
}

# The migrate container (the API image's `tools` target), rebuilt from the
# current checkout first: an image left over from an older pull would apply
# that pull's migrations instead.
#   run_migrate <db script> [docker compose run options...]
run_migrate() {
  local script="$1"
  shift
  compose --profile tools run --rm --build "$@" migrate "$script"
}

# How many committed migrations the live database hasn't applied, or
# "unknown" when it has no migration history at all.
pending_migrations() {
  local total applied
  total=$(grep -c '"tag"' packages/dal/drizzle/meta/_journal.json)
  applied=$(pg -d "$(db_name)" -At -c "select count(*) from drizzle.__drizzle_migrations" 2>/dev/null || true)
  if [[ -z "$applied" ]]; then
    echo "unknown"
  else
    echo $((total - applied))
  fi
}

# Row counts per table, so a migration can be checked against the dump it ran on.
counts_in() {
  # Exact counts, table by table - pg_stat's row numbers are only estimates.
  local tables
  tables=$(pg -d "$1" -At -c "
    select format('%I.%I', schemaname, relname) from pg_stat_user_tables
    where schemaname = 'public' order by relname")
  local table
  for table in $tables; do
    printf '%-28s %s\n' "$table" "$(pg -d "$1" -At -c "select count(*) from $table")"
  done
}

cmd_help() {
  cat <<'EOF'
Usage: bash scripts/deploy.sh <command> [args]

Stack
  build [service]       Build images (all, or one service)
  up                    Start everything in the background
  update                git pull, build, apply pending migrations (backup first, asks),
                        restart, prune old images (refuses a dirty tree)
  down                  Stop everything (asks first; data volumes are kept)
  restart [service]     Restart all services, or one
  ps                    Containers and their health
  logs [service] [-f]   Logs (all, or one service); -f to follow

Database
  backup                Dump the database to backups/<db>-<date>.sql.gz (keeps the last 14)
  restore <file>        Replace the database with a dump (asks you to type its name)
  migrate               Back up, then apply pending migrations (asks first)
  rehearse [file]       Apply pending migrations to a throwaway copy of a dump (the
                        newest backup by default) and compare row counts - prod untouched
  counts                Row counts per table
  psql                  Interactive psql

Data
  seed                  Doctor picklist + lab test catalog (re-runnable; skips existing rows)

Other
  shell <service>       A shell inside a running service
EOF
}

cmd_build() {
  compose build "$@"
}

cmd_up() {
  compose up -d
}

cmd_update() {
  [[ -z "$(git status --porcelain)" ]] || die "the working tree has local changes - commit or stash them first"
  git pull --ff-only
  compose build

  # New code must not start on the old schema, so migrations come first.
  local pending
  pending=$(pending_migrations)
  if [[ "$pending" == "unknown" ]]; then
    die "this database has no migration history - run 'deploy.sh migrate' once to build it, then 'deploy.sh update' again"
  fi
  if ((pending > 0)); then
    echo "$pending migration(s) to apply."
    cmd_migrate
  fi

  compose up -d
  docker image prune -f
}

cmd_down() {
  confirm "Stop every service? (volumes are kept)"
  compose down
}

cmd_restart() {
  compose restart "$@"
}

cmd_ps() {
  compose ps --format 'table {{.Service}}\t{{.State}}\t{{.Health}}\t{{.Status}}'
}

cmd_logs() {
  compose logs --tail=200 "$@"
}

cmd_backup() {
  mkdir -p "$BACKUP_DIR"
  local db file
  db=$(db_name)
  file="$BACKUP_DIR/$db-$(date +%Y%m%d-%H%M%S).sql.gz"
  # Written to a temp name first, so a failed dump never looks like a good one.
  compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip >"$file.partial"
  mv "$file.partial" "$file"
  echo "Backed up to $file ($(du -h "$file" | cut -f1))"

  # Keep the newest $BACKUP_KEEP.
  ls -1t "$BACKUP_DIR"/"$db"-*.sql.gz 2>/dev/null | tail -n +"$((BACKUP_KEEP + 1))" | xargs -r rm --
}

cmd_restore() {
  local file="${1:-}"
  [[ -n "$file" ]] || die "usage: deploy.sh restore <backups/file.sql.gz>"
  [[ -f "$file" ]] || die "no such file: $file"

  local db typed
  db=$(db_name)
  echo "This drops every table in '$db' and loads $file in its place."
  read -r -p "Type the database name to confirm: " typed
  [[ "$typed" == "$db" ]] || die "cancelled"

  # The API would write to half-restored tables otherwise.
  compose stop api
  pg -d "$db" -c "drop schema public cascade; drop schema if exists drizzle cascade; create schema public;"
  gunzip -c "$file" | pg -d "$db" -q
  compose start api
  echo "Restored $file into $db."
}

cmd_migrate() {
  cmd_backup
  confirm "Apply pending migrations to the live database?"
  run_migrate db:migrate
}

cmd_rehearse() {
  local file="${1:-}"
  if [[ -z "$file" ]]; then
    file=$(ls -1t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -n 1 || true)
    [[ -n "$file" ]] || die "no backups yet - run 'deploy.sh backup' first"
  fi
  [[ -f "$file" ]] || die "no such file: $file"

  local db copy password
  db=$(db_name)
  # A second database on the same server, so the migrate container reaches it
  # exactly the way it reaches the real one.
  copy="${db}_rehearsal"
  password=$(compose exec -T postgres sh -c 'printf %s "$POSTGRES_PASSWORD"')

  echo "Loading $file into $copy..."
  pg -d "$db" -c "drop database if exists \"$copy\"" -c "create database \"$copy\""
  gunzip -c "$file" | pg -d "$copy" -q

  local before after
  before=$(mktemp)
  after=$(mktemp)
  trap 'rm -f "$before" "$after"' RETURN

  echo
  echo "Before:"
  counts_in "$copy" | tee "$before"

  echo
  echo "Migrating $copy..."
  local user
  user=$(compose exec -T postgres sh -c 'printf %s "$POSTGRES_USER"')
  run_migrate db:migrate -e DATABASE_URL="postgresql://$user:$password@postgres:5432/$copy"

  echo
  echo "After:"
  counts_in "$copy" | tee "$after"

  echo
  echo "Differences (< before, > after; a new table shows only as >):"
  diff "$before" "$after" || true

  pg -d "$db" -c "drop database \"$copy\""
  echo
  echo "Dropped $copy. The live database was not touched."
}

cmd_counts() {
  counts_in "$(db_name)"
}

cmd_psql() {
  compose exec postgres sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
}

# The seed script lives in the DAL package beside the migrations, so it runs
# in the same one-off tools container.
cmd_seed() {
  run_migrate db:seed
}

cmd_shell() {
  local service="${1:-}"
  [[ -n "$service" ]] || die "usage: deploy.sh shell <service>"
  compose exec "$service" sh
}

main() {
  local command="${1:-help}"
  shift || true

  if [[ "$command" == "help" || "$command" == "-h" || "$command" == "--help" ]]; then
    cmd_help
    return
  fi

  if ! declare -F "cmd_$command" >/dev/null; then
    cmd_help >&2
    die "unknown command: $command"
  fi

  preflight
  "cmd_$command" "$@"
}

main "$@"
