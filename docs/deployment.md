# 部署与联调说明

## 1. 开发联调推荐路径

推荐顺序：

1. 启动 MySQL + backend（`mysql` profile）
2. 启动 frontend（integration 模式）
3. 观察 `/ops` 是否出现 seed 数据
4. 再部署或运行 probe，上报真实 Linux ARM 主机数据

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

## 4. Probe 部署

Probe 独立模块位于：
- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe`

### 4.1 打包

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe
mvn -DskipTests package
```

### 4.2 启动

```bash
java -jar target/business-security-probe-0.1.0.jar
```

### 4.3 systemd 部署

参考文件：
- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe/deploy/business-security-probe.service`

## 5. Manual / External 占位联调

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

## 6. 当前环境验证状态

当前仓库代码层面已经补齐：

- `/ops` 专属前端模块
- backend `/api/ops/**`
- `ops_*` MySQL 表
- probe 独立模块
- probe spool 与 systemd 示例

已完成验证：

- `frontend` 执行 `npm --prefix frontend run build` 成功
- `backend` 执行 Docker Maven 单测成功
- `probe` 执行 Docker Maven 单测成功
- `docker compose up -d --build` 成功拉起 `mysql + backend`
- 容器内验证接口可用：
  - `GET /actuator/health`
  - `GET /api/ops/overview`
  - `GET /api/ops/hosts?page=1&size=20`

补充说明：

- 如当前桌面沙箱直接 `curl 127.0.0.1:8080` 失败，而容器内请求正常，这通常是本地沙箱网络限制，不代表 backend 异常
- seed 数据内置 3 类来源主机，可直接在 `/ops` 页面看到 `ONLINE / STALE / OFFLINE` 三种状态
- 探针真实上报链路仍建议在目标 Linux ARM 主机上完成最终验收
