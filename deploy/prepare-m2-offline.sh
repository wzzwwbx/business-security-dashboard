#!/usr/bin/env bash
# 在联网的 macOS/Linux 机器上，为离线 Windows 目标生成后端 Maven 离线仓库。
#
# 为什么不用 mvn dependency:go-offline：
#   go-offline 有已知缺陷，会漏掉部分依赖（如 test scope 的 byte-buddy 等），
#   导致离线构建中途报 "has not been downloaded"。最稳妥的做法是：
#   在干净仓库上跑一次完整在线构建（mvn package），构建真实触碰过的依赖全会进仓库，
#   之后同一命令加 -o 即可全离线。
#
# 用法:
#   ./deploy/prepare-m2-offline.sh
#
# 产物:
#   dist-offline-win64/offline-deps/m2-repository.tar.gz   离线 Maven 仓库（解压出 m2-repository/）
#   dist-offline-win64/backend/business-security-dashboard-0.1.0.jar  后端可执行 jar（运行用，不需要 Maven）
#
# 在离线 Windows 上:
#   1) 安装 JDK 17 + Maven 3.9
#   2) 解压 m2-repository.tar.gz，把 m2-repository 内容合并到 %USERPROFILE%\.m2\repository
#   3) cd backend && mvn -o -DskipTests package
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

# 优先用 JDK 17（与目标一致）；没有则用当前 JAVA_HOME
if [ -z "${JAVA_HOME:-}" ] && command -v /usr/libexec/java_home >/dev/null 2>&1; then
  JDK17="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
  if [ -n "$JDK17" ]; then
    export JAVA_HOME="$JDK17"
    echo "== 使用 JDK 17: $JDK17"
  fi
fi
java -version 2>&1 | head -1

echo "== 1/2 在干净仓库上完整在线构建（灌满依赖） =="
mvn -B -Dmaven.repo.local="$SCRATCH/m2-repository" -DskipTests -f "$REPO/backend/pom.xml" package

echo "== 2/2 清理远端标记 + 打包 =="
find "$SCRATCH/m2-repository" \( -name "_remote.repositories" -o -name "*.lastUpdated" -o -name "*.repositories" \) -delete
mkdir -p "$REPO/dist-offline-win64/offline-deps" "$REPO/dist-offline-win64/backend"
tar -czf "$REPO/dist-offline-win64/offline-deps/m2-repository.tar.gz" -C "$SCRATCH" m2-repository
cp "$REPO/backend/target/business-security-dashboard-0.1.0.jar" "$REPO/dist-offline-win64/backend/"
ls -lh "$REPO/dist-offline-win64/offline-deps/m2-repository.tar.gz" "$REPO/dist-offline-win64/backend/"
echo "完成。"
