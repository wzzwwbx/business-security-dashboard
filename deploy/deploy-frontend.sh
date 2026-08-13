#!/usr/bin/env bash
# 部署前端 dist 到目标服务器（仅更新前端 + 重建 Nginx，不重启后端/MySQL）。
# 用法:
#   ./deploy/deploy-frontend.sh <host> <ssh-key> [extra-ssh-args...]
# 示例:
#   ./deploy/deploy-frontend.sh 192.168.50.15 ~/.ssh/id_ed25519_bss_deploy
#   ./deploy/deploy-frontend.sh 192.168.50.12 ~/.ssh/id_rsa -o IdentitiesOnly=yes
#
# 流程：就地覆盖 dist（目录 inode 不变 → nginx 无需重启）→ 健康检查。
set -euo pipefail

HOST="${1:?用法: $0 <host> <ssh-key> [extra-ssh-args...]}"
KEY="${2:?用法: $0 <host> <ssh-key> [extra-ssh-args...]}"
shift 2
SSH_ARGS=("$@")

DEPLOY_DIR="/opt/business-security-dashboard"
LOCAL_DIST="$(cd "$(dirname "${BASH_SOURCE[0]}")/../frontend/dist" && pwd)"

test -d "$LOCAL_DIST" || { echo "缺少 frontend/dist，请先在 frontend 执行 npm run build" >&2; exit 1; }

SSH=(ssh -o BatchMode=yes -o ConnectTimeout=10 -i "$KEY" "${SSH_ARGS[@]}")
SCP=(scp -o BatchMode=yes -o ConnectTimeout=10 -i "$KEY" "${SSH_ARGS[@]}")

TS=$(date +%Y%m%d%H%M%S)
echo "== 部署标识: ${TS} =="

# 1) 清空旧资源并覆盖新文件（保持 dist 目录本身不变，nginx bind mount 即时生效）
echo "== 就地覆盖 dist（nginx 无需重启） =="
"${SSH[@]}" "root@${HOST}" "rm -rf ${DEPLOY_DIR}/frontend/dist/assets/* ${DEPLOY_DIR}/frontend/dist/maps/*"
"${SCP[@]}" -r \
  "${LOCAL_DIST}/index.html" \
  "${LOCAL_DIST}/assets" \
  "${LOCAL_DIST}/maps" \
  "root@${HOST}:${DEPLOY_DIR}/frontend/dist/"

# 2) 健康检查（后端不受影响，仅确认服务正常）
echo "== 健康检查 =="
"${SSH[@]}" "root@${HOST}" "echo \"HEALTH: \$(curl -fsS http://127.0.0.1/actuator/health)\""

# 3) 远端 SHA-256 核对
echo "== SHA-256 核对 =="
LOCAL_SHA="$(cd "${LOCAL_DIST}" && shasum -a 256 $(find . -type f | sort))"
REMOTE_SHA="$("${SSH[@]}" "root@${HOST}" "cd ${DEPLOY_DIR}/frontend/dist && shasum -a 256 \$(find . -type f | sort)")"
if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
  echo "SHA-256 一致 ✓"
else
  echo "!! SHA-256 不一致，请检查" >&2
  diff <(echo "$LOCAL_SHA") <(echo "$REMOTE_SHA") || true
  exit 1
fi

echo "== 部署完成，标识 ${TS}（nginx 无需重启） =="
