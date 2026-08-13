#!/usr/bin/env bash
# 部署前端 dist 到目标服务器（仅更新前端 + 重建 Nginx，不重启后端/MySQL）。
# 用法:
#   ./deploy/deploy-frontend.sh <host> <ssh-key> [extra-ssh-args...]
# 示例:
#   ./deploy/deploy-frontend.sh 192.168.50.15 ~/.ssh/id_ed25519_bss_deploy
#   ./deploy/deploy-frontend.sh 192.168.50.12 ~/.ssh/id_rsa -o IdentitiesOnly=yes
#
# 流程：上传 dist → 原子替换（旧版保留为 dist.previous）→ 仅重建 nginx → 健康检查。
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

# 1) 上传新构建产物
echo "== 上传 dist -> dist.new =="
"${SSH[@]}" "root@${HOST}" "rm -rf ${DEPLOY_DIR}/frontend/dist.new && mkdir -p ${DEPLOY_DIR}/frontend/dist.new"
"${SCP[@]}" -r \
  "${LOCAL_DIST}/index.html" \
  "${LOCAL_DIST}/assets" \
  "${LOCAL_DIST}/maps" \
  "root@${HOST}:${DEPLOY_DIR}/frontend/dist.new/"

# 2) 原子替换（旧版保留为 dist.previous 供快速回滚）
echo "== 原子替换 dist（旧版 -> dist.previous） =="
"${SSH[@]}" "root@${HOST}" "
set -e
cd ${DEPLOY_DIR}/frontend
rm -rf dist.previous
mv dist dist.previous
mv dist.new dist
chown -R root:root dist
"

# 3) 仅重建 nginx（--force-recreate 让 bind mount 指向新 dist 目录 inode）
echo "== 重建 Nginx =="
"${SSH[@]}" "root@${HOST}" "
set -e
cd ${DEPLOY_DIR}
if [ -x /usr/local/bin/docker-compose ]; then DC=/usr/local/bin/docker-compose; else DC=docker-compose; fi
\$DC -f deploy/compose.offline.yml up -d --no-deps --force-recreate nginx >/dev/null 2>&1
sleep 3
echo \"HEALTH: \$(curl -fsS http://127.0.0.1/actuator/health)\"
echo \"HTML-CACHE: \$(curl -sI http://127.0.0.1/ | grep -i cache-control | tail -1)\"
"

# 4) 远端 SHA-256 核对
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

echo "== 部署完成，标识 ${TS} =="
