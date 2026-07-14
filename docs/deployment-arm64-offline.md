# ARM64 离线部署

本项目的演示部署包由前端静态文件、Spring Boot 后端、MySQL 和 Nginx 组成。推荐在联网的 ARM64 准备机上构建并导出镜像，再把整个目录带到离线 ARM 服务器运行。

## 准备机

准备机需要 Node.js/npm、Java 17、Maven 和 Docker Buildx。目标架构应为 `aarch64`/`arm64`。在仓库根目录执行：

```bash
./deploy/prepare-arm64.sh ./dist-offline-arm64
cp ./dist-offline-arm64/.env.production.example ./dist-offline-arm64/.env.production
```

编辑 `.env.production`，替换所有 `change-this-*` 值。不要把真实密钥提交到 Git。

## 传输到离线服务器

将 `dist-offline-arm64` 整个目录复制到服务器。运行 Docker 版主系统只需要预装 ARM64 Docker Engine 和 Compose Plugin；如果同时运行 ARM Probe，还需要预装 ARM64 Java 17 JRE。

```bash
cd dist-offline-arm64
bash deploy/install-offline.sh
```

首次安装会导入镜像，并将 `backend/business-security-dashboard-0.1.0.jar` 挂载到后端容器中。镜像只提供 Java 运行环境，应用 JAR 不再固化在镜像内。

日常更新不需要重新构建或导出镜像。只替换以下两个内容：

```text
backend/business-security-dashboard-0.1.0.jar
frontend/dist/
```

然后执行：

```bash
bash deploy/update-offline.sh
```

该脚本只重建 backend 和 nginx 容器，不会重新加载镜像，也不会操作 MySQL 数据卷。

## 卸载

卸载服务但保留数据库数据：

```bash
bash deploy/uninstall-offline.sh
```

彻底卸载并删除 MySQL 数据卷：

```bash
bash deploy/uninstall-offline.sh --purge-data
```

删除数据前脚本会要求输入 `PURGE` 确认。

如需启用 Probe：

```bash
sudo mkdir -p /opt/business-security-probe/data/spool
sudo cp probe/business-security-probe-0.1.0.jar /opt/business-security-probe/business-security-probe.jar
sudo cp probe/probe.env.example /opt/business-security-probe/probe.env
sudo cp probe/business-security-probe.service /etc/systemd/system/
sudo vi /opt/business-security-probe/probe.env
sudo systemctl daemon-reload
sudo systemctl enable --now business-security-probe
```

## 访问与初始化

浏览器访问 `http://服务器IP/`。首次访问会进入 `/bootstrap`，设置 `sysadmin`、`secadmin`、`auditadmin` 三个账户，然后通过 `/login` 登录。

验证 `/overview`、`/security`、`/business`、`/terminal`、`/ops`，以及综合态势到机房拓扑和终端区域的下钻。地图资源为本地文件，不依赖互联网。

## 运维命令

```bash
docker compose --env-file .env.production -f deploy/compose.offline.yml ps
docker compose --env-file .env.production -f deploy/compose.offline.yml logs -f backend
docker compose --env-file .env.production -f deploy/compose.offline.yml restart nginx
docker compose --env-file .env.production -f deploy/compose.offline.yml down
```

MySQL 数据保存在 Docker volume `mysql-data` 中。不要使用 `down -v`，否则会删除演示账户和数据库数据。

生产网络只暴露 Nginx 的 `80` 端口；MySQL `3306` 和后端 `8080` 仅在 Docker 内部网络可见。

## RPM 一键安装

RPM 可以在 macOS 上构建，推荐使用 Apple Silicon Mac；RPM 只负责封装 ARM64 文件，不会在 macOS 上运行 Linux 服务。准备工具：

```bash
brew install rpm gnu-tar
```

如果使用 Intel Mac，也可以构建 RPM，但 Docker ARM64 镜像构建需要 Docker Desktop 的 ARM64 Buildx/QEMU 支持。

在联网 ARM64 准备机上先生成最新离线部署包，然后使用 `rpmbuild` 构建 RPM：

```bash
./deploy/prepare-arm64.sh ./dist-offline-arm64
./deploy/build-rpm.sh ./dist-offline-arm64 ./rpm-out
```

将 `rpm-out/bss-dashboard-*.aarch64.rpm` 和 `deploy/install-rpm.sh` 带到目标服务器，执行：

```bash
bash deploy/install-rpm.sh ./bss-dashboard-*.aarch64.rpm
```

安装向导会询问安装目录，默认是 `/opt/business-security-dashboard`；如果安装包中包含 `deploy/docker/`，还会在检测不到 Docker 时询问是否自动安装 ARM64 Docker。之后自动生成 `.env.production`、导入 ARM64 镜像并启动系统。RPM 安装包不包含真实密钥。

卸载但保留数据库：

```bash
bash /安装目录/deploy/uninstall-offline.sh
```

卸载并删除数据库：

```bash
bash /安装目录/deploy/uninstall-offline.sh --purge-data
```

## Probe 对接配置

Probe 使用 HMAC-SHA256 签名。Probe 的 `OPS_PROBE_SHARED_SECRET` 必须与后端部署包 `.env.production` 中的同名变量完全一致，不能继续使用 `dev-probe-secret`。Probe 配置模板位于 `probe/deploy/probe.env.example`。

在目标 ARM 服务器上安装 Probe 时：

```bash
sudo cp probe/deploy/probe.env.example /opt/business-security-probe/probe.env
sudo vi /opt/business-security-probe/probe.env
sudo systemctl daemon-reload
sudo systemctl restart business-security-probe
sudo journalctl -u business-security-probe -f
```

Probe 的 `PROBE_SERVER_URL` 应指向 Nginx 暴露的地址。若 Probe 与 Docker 在同一台服务器，使用 `http://127.0.0.1/api/ops/ingest/probe`；不要使用容器内部名称 `backend`，因为 Probe 运行在宿主机 systemd 中。

## 终端外部接入令牌

终端外部上报必须发送：

```text
X-Ingest-Token: <.env.production 中 TERMINAL_EXTERNAL_INGEST_TOKEN 的完整值>
```

接口地址为 `/api/terminal/ingest/external`。修改 `.env.production` 后必须重建或重启后端容器：

```bash
docker compose --env-file .env.production -f deploy/compose.offline.yml up -d --force-recreate backend
```

不要在浏览器或前端代码中使用该令牌。它只用于受信任的终端外部上报程序。
