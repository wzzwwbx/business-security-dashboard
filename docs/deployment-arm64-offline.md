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

将 `dist-offline-arm64` 整个目录复制到服务器。服务器只需要预装 ARM64 Docker Engine 和 Compose Plugin，不需要 Node.js、Maven 或 JDK。

```bash
cd dist-offline-arm64
bash deploy/install-offline.sh
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
