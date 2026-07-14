#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-$ROOT_DIR/dist-offline-arm64}"
BACKEND_IMAGE="bss-dashboard-backend:0.1.0-arm64"

command -v npm >/dev/null || { echo "npm is required on the preparation machine" >&2; exit 1; }
command -v mvn >/dev/null || { echo "mvn is required on the preparation machine" >&2; exit 1; }
command -v docker >/dev/null || { echo "docker is required on the preparation machine" >&2; exit 1; }

mkdir -p "$OUT_DIR"

echo "[1/6] Building frontend integration bundle"
npm --prefix "$ROOT_DIR/frontend" ci
npm --prefix "$ROOT_DIR/frontend" run build

test -f "$ROOT_DIR/frontend/dist/maps/world-110m.json" || {
  echo "frontend/dist/maps/world-110m.json is missing" >&2
  exit 1
}

echo "[2/6] Packaging backend and ARM Probe"
mvn -B -DskipTests -f "$ROOT_DIR/backend/pom.xml" package
mvn -B -DskipTests -f "$ROOT_DIR/probe/pom.xml" package

echo "[3/6] Building ARM64 backend runtime image"
docker buildx build --platform linux/arm64 --load \
  -t "$BACKEND_IMAGE" \
  -f "$ROOT_DIR/deploy/backend-runtime.Dockerfile" "$ROOT_DIR"

echo "[4/6] Pulling ARM64 runtime images"
docker pull --platform linux/arm64 mysql:8.4
docker pull --platform linux/arm64 nginx:1.27-alpine

echo "[5/6] Exporting images"
docker save -o "$OUT_DIR/bss-images-arm64.tar" \
  mysql:8.4 nginx:1.27-alpine "$BACKEND_IMAGE"

echo "[6/6] Copying deployment bundle"
rm -rf "$OUT_DIR/frontend" "$OUT_DIR/database" "$OUT_DIR/deploy" "$OUT_DIR/probe" "$OUT_DIR/backend"
mkdir -p "$OUT_DIR/frontend" "$OUT_DIR/database" "$OUT_DIR/deploy" "$OUT_DIR/probe" "$OUT_DIR/backend"
cp -R "$ROOT_DIR/frontend/dist" "$OUT_DIR/frontend/dist"
cp -R "$ROOT_DIR/database/mysql" "$OUT_DIR/database/mysql"
cp "$ROOT_DIR/backend/target/business-security-dashboard-0.1.0.jar" \
  "$OUT_DIR/backend/business-security-dashboard-0.1.0.jar"
cp "$ROOT_DIR/deploy/compose.offline.yml" "$ROOT_DIR/deploy/nginx.conf" \
  "$ROOT_DIR/deploy/install-offline.sh" "$ROOT_DIR/deploy/update-offline.sh" \
  "$ROOT_DIR/deploy/uninstall-offline.sh" "$OUT_DIR/deploy/"
cp "$ROOT_DIR/deploy/.env.production.example" "$OUT_DIR/.env.production.example"
cp "$ROOT_DIR/probe/target/business-security-probe-0.1.0.jar" "$OUT_DIR/probe/"
cp "$ROOT_DIR/probe/deploy/business-security-probe.service" \
  "$ROOT_DIR/probe/deploy/probe.env.example" "$OUT_DIR/probe/"
if [[ -d "$ROOT_DIR/deploy/docker" ]]; then
  cp -R "$ROOT_DIR/deploy/docker" "$OUT_DIR/deploy/docker"
fi
cp "$ROOT_DIR/docs/deployment-arm64-offline.md" "$OUT_DIR/README.md"

echo "Bundle created: $OUT_DIR"
echo "Before transfer: cp $OUT_DIR/.env.production.example $OUT_DIR/.env.production"
