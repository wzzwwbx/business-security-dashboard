#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

test -f .env.production || { echo "Missing .env.production" >&2; exit 1; }
test -f backend/business-security-dashboard-0.1.0.jar || { echo "Missing backend/business-security-dashboard-0.1.0.jar" >&2; exit 1; }
test -f frontend/dist/maps/world-110m.json || { echo "Missing world map asset" >&2; exit 1; }

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "Docker Compose plugin or docker-compose is required" >&2
  exit 1
fi

echo "Updating backend JAR and frontend assets without rebuilding images..."
"${COMPOSE[@]}" --env-file .env.production -f deploy/compose.offline.yml up -d --force-recreate backend nginx
"${COMPOSE[@]}" --env-file .env.production -f deploy/compose.offline.yml ps
curl --fail --retry 20 --retry-delay 2 http://127.0.0.1/actuator/health
echo
