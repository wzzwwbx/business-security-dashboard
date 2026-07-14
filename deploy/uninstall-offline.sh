#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "Docker Compose plugin or docker-compose is required" >&2
  exit 1
fi

if [[ "${1:-}" == "--purge-data" ]]; then
  echo "This will remove containers and the MySQL data volume."
  read -r -p "Type PURGE to continue: " confirmation
  [[ "$confirmation" == "PURGE" ]] || { echo "Cancelled"; exit 1; }
  "${COMPOSE[@]}" --env-file .env.production -f deploy/compose.offline.yml down -v --remove-orphans
else
  echo "Removing containers and network; keeping MySQL data volume."
  "${COMPOSE[@]}" --env-file .env.production -f deploy/compose.offline.yml down --remove-orphans
fi

echo "Dashboard containers removed."
