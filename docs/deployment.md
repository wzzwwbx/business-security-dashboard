# 部署与联调说明

## 1. 开发联调推荐路径

推荐顺序：

1. 启动 MySQL + backend（`mysql` profile）
2. 启动 frontend（integration 模式）
3. 先验证 `/ops` 是否出现 seed 数据
4. 再验证 `/overview`、`/security`、`/business`、`/terminal` 是否命中 `/api/situation/**`
5. 最后部署或运行 probe，上报真实 Linux ARM 主机数据

## 2. 启动 MySQL + backend

仓库已提供：
- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/compose.yml`

执行：

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料
docker compose up --build
```

默认服务：

- MySQL：`3306`
- backend：`8080`

默认环境变量：

- `SPRING_PROFILES_ACTIVE=mysql`
- `SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/business_security_dashboard?...`
- `SPRING_DATASOURCE_USERNAME=root`
- `SPRING_DATASOURCE_PASSWORD=root`
- `OPS_PROBE_SHARED_SECRET=dev-probe-secret`
- `OPS_EXTERNAL_INGEST_TOKEN=external-dev-token`
- `OPS_MANUAL_INGEST_TOKEN=manual-dev-token`

## 3. 启动前端

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/frontend
npm install
npm run dev:integration
```

Vite 会将 `/api` 代理到 `http://localhost:8080`。

### 3.1 IAM 联调注意事项

- 开发态必须优先走 **同源 `/api` 代理**，不要把前端改成优先直连 `127.0.0.1:8080`
- 原因：本项目的 IAM 认证基于 `HttpOnly Session (JSESSIONID)`，若页面运行在 `localhost:5173/5176` 而接口改成 `127.0.0.1:8080`，浏览器会出现跨源 Cookie 问题，导致“登录成功但后续接口未登录”
- 若需要覆盖代理行为，请显式设置 `VITE_USE_PROXY=true`，保持 `frontend/src/api/http.ts` 继续优先走同源 `/api`

如果只验证前端展示与回退机制，可运行：

```bash
npm run dev:mock
```

## 4. 主题态势页联调说明

前端路由：

- `http://localhost:5173/overview`
- `http://localhost:5173/security`
- `http://localhost:5173/business`
- `http://localhost:5173/terminal`
- `http://localhost:5173/ops`
- `http://localhost:5173/login`
- `http://localhost:5173/bootstrap`
- `http://localhost:5173/system/accounts`

综合 / 安全 / 业务 / 终端页面的联调策略：

- 默认优先请求 `/api/situation/{pageCode}`
- 若 backend 不可达，则自动回退到前端 mock
- 页面会显示：
  - 数据来源 pill
  - warning banner
  - 过滤 chips
  - 焦点详情面板

建议验证项：

1. 点击 KPI / Highlight / Signal / Table Row 后，是否出现焦点详情
2. 切换 filter chips 后，板块是否按标签过滤
3. backend 关闭时，是否展示 `Mock 回退` 与 warning banner
4. backend 开启时，是否展示 `接口联调`
5. 初始化完成后，是否可走通 `/login -> /overview -> /system/accounts`
6. 使用不同三员账号登录时，导航与系统页标签是否按权限裁剪

## 5. Probe 部署

Probe 独立模块位于：
- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe`

### 5.1 打包

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe
mvn -DskipTests package
```

### 5.2 启动

```bash
java -jar target/business-security-probe-0.1.0.jar
```

### 5.3 systemd 部署

参考文件：
- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe/deploy/business-security-probe.service`

## 6. Manual / External 占位联调

### external 示例

```bash
curl -X POST 'http://127.0.0.1:8080/api/ops/ingest/external' \
  -H 'Content-Type: application/json' \
  -H 'X-Ingest-Token: external-dev-token' \
  -d '{
    "sourceType": "EXTERNAL_API",
    "sourceSystem": "cmdb-sync",
    "requestId": "ext-demo-001",
    "externalAssetId": "asset-1001",
    "observedAt": "2026-07-07T00:00:00Z",
    "host": {
      "hostCode": "host-ext-001",
      "hostname": "ext-host-01",
      "displayName": "外部系统主机01",
      "primaryIp": "10.10.10.10",
      "osName": "Linux",
      "kernelVersion": "5.10.0",
      "arch": "aarch64",
      "cpuCores": 8,
      "memoryTotalBytes": 17179869184,
      "machineFingerprint": null
    },
    "snapshot": {
      "cpuUsagePct": 36.5,
      "load1": 1.2,
      "load5": 1.1,
      "load15": 1.0,
      "memUsedBytes": 8589934592,
      "memAvailableBytes": 8589934592,
      "swapUsedBytes": 0,
      "diskUsedBytes": 200000000000,
      "diskTotalBytes": 500000000000,
      "diskUsagePct": 40.0,
      "tcpEstablishedCount": 88,
      "processCount": 120
    },
    "networkInterfaces": [],
    "processes": []
  }'
```

### manual 示例

将 Header 改为：

```text
X-Ingest-Token: manual-dev-token
```

并将 `sourceType` 改为 `MANUAL_IMPORT` 即可。

## 7. 当前环境验证状态

当前仓库代码层面已经补齐：

- `/ops` 专属前端模块
- backend `/api/ops/**`
- backend `/api/situation/**`
- `ops_*` MySQL 表
- probe 独立模块
- 主题态势页的 integration + fallback 机制

已完成验证：

- `frontend` 执行 `npm --prefix frontend run build` 成功
- backend 已通过容器 Maven 测试：`docker run --rm -v "$PWD/backend":/workspace -w /workspace maven:3.9.9-eclipse-temurin-17 mvn -B test`
- `backend/src/main/resources/mock/situations.json` 已完成结构校验
- 本地前端 dev server 可启动并用于主题态势页面验证

补充说明：

- 当前宿主机若缺少 `mvn`，建议继续使用容器 Maven 或具备 Maven 的环境执行 backend / probe 单测
- 若本地桌面沙箱直接请求 `127.0.0.1:8080` 失败，而前端代理联调正常，通常是沙箱网络限制，不代表 backend 异常

## 8. Windows 原生部署（无 Docker）

如需在 **Windows 上不使用 Docker** 部署（纯演示或离线开发），请直接阅读：

- **`deploy/windows/README.md`** — 完整指南（两种场景）
- `deploy/windows/start-demo.bat` — 一键演示：MySQL + 后端 + nginx
- `deploy/windows/init-mysql.bat` / `start-mysql.bat` — 便携版 MySQL 初始化/启动
- `deploy/windows/start-backend.bat` — 启动后端 jar（`mysql` profile）
- `deploy/windows/nginx-windows.conf` — nginx 配置模板（前端静态 + `/api` 反向代理）
- `deploy/windows/prepare-offline.ps1` — 联网机打包离线依赖（node_modules / `~/.m2` / 构建产物）

要点：

- 运行只需 JRE 17 + MySQL 8 + nginx；`backend/target/*.jar` 与 `frontend/dist` 均为已构建产物，直接使用。
- 前端 dist 构建时带 `VITE_PREVIEW_AUTH=preview`，**演示预览模式免登录**。
- 后端以 `mysql` profile 启动时自动建表并灌入 `/ops` 演示数据（`OpsDemoDataSeeder`），无需手工执行 SQL。
- `backend/target/`、`frontend/dist/`、`frontend/node_modules/` 均在 `.gitignore` 中，离线环境需通过 `prepare-offline.ps1` 将产物与依赖一并携带。

## 9. 前端单机部署（仅更新前端 + 重建 Nginx）

仓库提供 `deploy/deploy-frontend.sh`，用于把本地 `frontend/dist` 部署到任意一台服务器，**只更新前端、重建 Nginx，不重启后端 / MySQL**，并保留上一版供快速回滚。

前置条件：

1. 本地已完成构建：`cd frontend && npm run build`；
2. 可免密 SSH 登录目标服务器（root）；
3. 服务器部署目录为 `/opt/business-security-dashboard`，使用 `docker-compose`（`/usr/local/bin/docker-compose` 或 `docker-compose`）。

用法：

```bash
# 192.168.50.15（使用 ed25519 部署密钥）
./deploy/deploy-frontend.sh 192.168.50.15 ~/.ssh/id_ed25519_bss_deploy

# 192.168.50.12（使用 id_rsa，需 IdentitiesOnly）
./deploy/deploy-frontend.sh 192.168.50.12 ~/.ssh/id_rsa -o IdentitiesOnly=yes
```

脚本流程（**就地覆盖，nginx 无需重启**）：

1. 清空服务器 `dist/assets/*`、`dist/maps/*`（保留 `dist` 目录本身不变）；
2. `scp` 覆盖 `index.html`、`assets/`、`maps/` 到 `dist/`；
3. 因为 nginx 以目录 bind mount 挂载 `dist`，目录 inode 未变，容器内实时读到新文件，**无需重启 nginx**；
4. 健康检查 + 远端/本地 SHA-256 逐一核对。

注意：HTML 入口为 `no-store`（每次请求读最新 index.html），静态资源带内容哈希文件名且旧文件被清空，因此替换后刷新即拿到新版本，不会出现“旧入口引用旧 js”的缓存问题。

回滚：

```bash
ssh root@<host> 'cd /opt/business-security-dashboard/frontend && rm -rf dist && mv dist.previous dist && \
  (test -x /usr/local/bin/docker-compose && /usr/local/bin/docker-compose || docker-compose) -f /opt/business-security-dashboard/deploy/compose.offline.yml up -d --no-deps --force-recreate nginx'
```

要点：

- 服务器 `deploy/nginx.conf` 需为含缓存头的版本（SPA HTML `no-store`，`/assets/` 一年 immutable）；
- 只更新前端时**不要**运行 `deploy/update-offline.sh`（那个会 force-recreate backend 与 nginx）。
