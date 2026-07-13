#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v docker >/dev/null || { echo "Docker is required" >&2; exit 1; }
test -f .env.production || { echo "Missing .env.production" >&2; exit 1; }
test -f bss-images-arm64.tar || { echo "Missing bss-images-arm64.tar" >&2; exit 1; }
test -f frontend/dist/maps/world-110m.json || { echo "Missing world map asset" >&2; exit 1; }

echo "Loading ARM64 images..."
docker load -i bss-images-arm64.tar

echo "Validating Compose configuration..."
docker compose --env-file .env.production -f deploy/compose.offline.yml config >/dev/null

echo "Starting dashboard..."
docker compose --env-file .env.production -f deploy/compose.offline.yml up -d
docker compose --env-file .env.production -f deploy/compose.offline.yml ps

echo "Health check:"
curl --fail --retry 20 --retry-delay 2 http://127.0.0.1/actuator/health
echo
