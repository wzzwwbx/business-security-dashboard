#!/usr/bin/env bash
set -euo pipefail

RPM_FILE="${1:-}"
if [[ -z "$RPM_FILE" ]]; then
  RPM_FILE="$(find . -maxdepth 1 -type f -name 'bss-dashboard-*.aarch64.rpm' -print -quit)"
fi
test -n "$RPM_FILE" && test -f "$RPM_FILE" || {
  echo "Usage: $0 /path/to/bss-dashboard-*.aarch64.rpm" >&2
  exit 1
}

[[ "$(id -u)" -eq 0 ]] || { echo "Run this installer as root" >&2; exit 1; }
command -v rpm >/dev/null || { echo "rpm is required" >&2; exit 1; }

DEFAULT_DIR="/opt/business-security-dashboard"
read -r -p "Installation directory [$DEFAULT_DIR]: " INSTALL_DIR
INSTALL_DIR="${INSTALL_DIR:-$DEFAULT_DIR}"
case "$INSTALL_DIR" in
  /*) ;;
  *) echo "Installation directory must be absolute" >&2; exit 1 ;;
esac

if [[ -e "$INSTALL_DIR" ]] && [[ -n "$(find "$INSTALL_DIR" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]]; then
  read -r -p "Directory is not empty. Continue? [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]] || { echo "Cancelled"; exit 1; }
fi

echo "Installing RPM to $INSTALL_DIR ..."
rpm -Uvh --replacepkgs --prefix "$INSTALL_DIR" "$RPM_FILE"

if ! command -v docker >/dev/null 2>&1; then
  DOCKER_INSTALLER="$INSTALL_DIR/deploy/docker/install-docker.sh"
  if [[ -f "$DOCKER_INSTALLER" ]]; then
    read -r -p "Docker is missing. Install the bundled ARM64 Docker now? [Y/n] " answer
    if [[ ! "$answer" =~ ^[Nn]$ ]]; then
      (cd "$(dirname "$DOCKER_INSTALLER")" && bash "$DOCKER_INSTALLER")
    fi
  fi
fi

command -v docker >/dev/null || { echo "Docker is required to continue" >&2; exit 1; }

ENV_FILE="$INSTALL_DIR/.env.production"
if [[ ! -f "$ENV_FILE" ]]; then
  cp "$INSTALL_DIR/.env.production.example" "$ENV_FILE"
  if command -v openssl >/dev/null 2>&1; then
    secret() { openssl rand -hex 24; }
  else
    secret() { od -An -N24 -tx1 /dev/urandom | tr -d ' \n'; }
  fi
  sed -i \
    -e "s/change-this-db-password/$(secret)/" \
    -e "s/change-this-probe-secret/$(secret)/" \
    -e "s/change-this-ops-external-token/$(secret)/" \
    -e "s/change-this-ops-manual-token/$(secret)/" \
    -e "s/change-this-terminal-external-token/$(secret)/" \
    -e "s/change-this-terminal-manual-token/$(secret)/" \
    "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "Generated deployment secrets: $ENV_FILE"
fi

echo "Starting dashboard..."
bash "$INSTALL_DIR/deploy/install-offline.sh"
echo "Installation completed at $INSTALL_DIR"
