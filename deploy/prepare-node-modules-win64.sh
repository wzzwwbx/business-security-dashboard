#!/usr/bin/env bash
# 在联网的 macOS/Linux 机器上，为离线 Windows 目标生成 win64 版 node_modules 离线包。
#
# 为什么需要这个脚本：
#   Vite 的依赖含平台原生二进制（@esbuild/<platform>、@rollup/rollup-<platform>），
#   直接把 macOS 的 node_modules 拷到 Windows 会因缺少 @esbuild/win32-x64 而报错。
#   npm >= 10.5 支持 --os/--cpu，可在任意平台安装出目标平台的依赖树。
#
# 用法:
#   ./deploy/prepare-node-modules-win64.sh
#
# 产物:
#   dist-offline-win64/node_modules-win64.tar.gz   （node_modules + package-lock.json）
#
# 在离线 Windows 上的应用:
#   cd <仓库>\frontend
#   tar -xzf <离线包>\node_modules-win64.tar.gz
#   npm run dev:integration
#
# 前置: Node 20+，npm >= 10.5（两端 Node 大版本需一致，目标机也装 Node 20）
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="$REPO/frontend"
OUT_DIR="$REPO/dist-offline-win64"
SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

test -f "$FRONTEND/package-lock.json" || { echo "缺少 $FRONTEND/package-lock.json" >&2; exit 1; }
npm --version | awk -F. '$1<10 || ($1==10 && $2<5) { print "npm 版本过低，需要 >= 10.5（当前 " $0 "）"; exit 1 }'

echo "== 1/3 在临时目录安装 win32-x64 版依赖 =="
cp "$FRONTEND/package.json" "$FRONTEND/package-lock.json" "$SCRATCH/"
(cd "$SCRATCH" && npm ci --os=win32 --cpu=x64 --no-audit --no-fund)

echo "== 2/3 校验平台二进制 =="
test -f "$SCRATCH/node_modules/@esbuild/win32-x64/esbuild.exe" \
  || { echo "!! 缺少 @esbuild/win32-x64/esbuild.exe，--os/--cpu 未生效，请检查 npm 版本" >&2; exit 1; }
echo "  确认: $(ls "$SCRATCH/node_modules/@esbuild/")"

# macOS 上 npm 生成的 .bin 是符号链接（bash 脚本），Windows cmd.exe 无法执行；
# 补生成 npm 标准的 .cmd/.ps1 启动器（与 Windows 上 npm install 生成的完全一致）。
echo "  生成 Windows .cmd/.ps1 启动器..."
node "$REPO/deploy/win-bins.cjs" "$SCRATCH/node_modules"

echo "== 3/3 打包 =="
mkdir -p "$OUT_DIR"
tar -czf "$OUT_DIR/node_modules-win64.tar.gz" -C "$SCRATCH" node_modules package-lock.json
ls -lh "$OUT_DIR/node_modules-win64.tar.gz"
echo "完成。将产物拷到离线 Windows 仓库 frontend/ 下解压即可。"
