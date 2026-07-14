#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUNDLE_DIR="${1:-$ROOT_DIR/dist-offline-arm64}"
OUTPUT_DIR="${2:-$ROOT_DIR/rpm-out}"
VERSION="${VERSION:-0.1.0}"

command -v rpmbuild >/dev/null || { echo "rpmbuild is required" >&2; exit 1; }
test -d "$BUNDLE_DIR" || { echo "Missing bundle: $BUNDLE_DIR" >&2; exit 1; }
test -f "$BUNDLE_DIR/bss-images-arm64.tar" || { echo "Missing ARM64 image archive" >&2; exit 1; }
test -f "$BUNDLE_DIR/backend/business-security-dashboard-0.1.0.jar" || { echo "Missing backend JAR" >&2; exit 1; }

if command -v gtar >/dev/null 2>&1; then
  TAR_BIN=gtar
else
  TAR_BIN=tar
fi
"$TAR_BIN" --help 2>&1 | grep -q -- '--transform' || {
  echo "GNU tar is required; install it with: brew install gnu-tar" >&2
  exit 1
}

TOP_DIR="$(mktemp -d)"
trap 'rm -rf "$TOP_DIR"' EXIT
mkdir -p "$TOP_DIR/BUILD" "$TOP_DIR/BUILDROOT" "$TOP_DIR/RPMS" "$TOP_DIR/SOURCES" "$TOP_DIR/SPECS" "$TOP_DIR/SRPMS"

"$TAR_BIN" -C "$BUNDLE_DIR" \
  --transform='s,^,bss-dashboard-bundle/,' \
  --exclude='.env.production' \
  -czf "$TOP_DIR/SOURCES/bss-dashboard-bundle-$VERSION.tar.gz" .
cp "$ROOT_DIR/deploy/rpm/bss-dashboard.spec" "$TOP_DIR/SPECS/"

rpmbuild -bb \
  --target aarch64-linux \
  --define "_topdir $TOP_DIR" \
  --define "_build_id_links none" \
  "$TOP_DIR/SPECS/bss-dashboard.spec"

mkdir -p "$OUTPUT_DIR"
RPM_PATH="$(find "$TOP_DIR/RPMS/aarch64" -maxdepth 1 -type f -name "bss-dashboard-$VERSION-1*.aarch64.rpm" -print -quit)"
test -n "$RPM_PATH" || { echo "RPM output was not found" >&2; exit 1; }
cp "$RPM_PATH" "$OUTPUT_DIR/"
cp "$ROOT_DIR/deploy/install-rpm.sh" "$OUTPUT_DIR/"
echo "RPM created in $OUTPUT_DIR"
