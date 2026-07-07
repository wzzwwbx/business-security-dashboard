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
- `backend/src/main/resources/mock/situations.json` 已完成结构校验
- 本地前端 dev server 可启动并用于主题态势页面验证

补充说明：

- 当前宿主机若缺少 `mvn`，建议使用容器 Maven 或具备 Maven 的环境执行 backend / probe 单测
- 若本地桌面沙箱直接请求 `127.0.0.1:8080` 失败，而前端代理联调正常，通常是沙箱网络限制，不代表 backend 异常
