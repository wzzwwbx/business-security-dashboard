# 业务安全态势系统 — 工程化项目（多源接入版）

## 项目概述

当前仓库已经从单纯前端原型继续演进为 **前后端分离、可扩展、多源接入** 的工程化项目。

本期实现重点不是把探针做成唯一入口，而是先打通第一条真实闭环：

**Java Probe → Backend `/api/ops/ingest/probe` → MySQL → Frontend `/ops` 运维态势页**

同时，后端已经为未来外部系统预留统一接入能力：

- `PROBE`
- `EXTERNAL_API`
- `MANUAL_IMPORT`

## 技术栈

- 前端：Vue 3 + TypeScript + Vite + Vue Router + ECharts
- 后端：Spring Boot 3 + Java 17
- 数据库：MySQL 8
- 探针：Java 17，Linux `/proc` + `FileStore` 采集

## 目录结构

```text
/Users/bingham/Documents/Project/业务安全态势系统_项目资料
├── frontend/                 # Vue 前端
├── backend/                  # Spring Boot 后端
├── probe/                    # Linux ARM Java Probe
├── database/mysql/           # MySQL 初始化脚本
├── docs/                     # 架构 / API / 部署文档
├── compose.yml               # mysql + backend 编排
└── README.md
```

## 本期已落地能力

### 1. 前端 `/ops` 独立运维态势页面

`/ops` 已从通用 dashboard 页面中剥离，形成真实运维域页面，包含：

1. 总览卡片
2. 来源概览
3. 主机列表
4. 主机详情
5. 趋势图
6. TopN / 白名单进程
7. 最新告警

前端新增专属模块：

- `frontend/src/api/ops.ts`
- `frontend/src/types/ops.ts`
- `frontend/src/composables/useOpsOverview.ts`
- `frontend/src/composables/useOpsHostDetail.ts`
- `frontend/src/components/ops/*`
- `frontend/src/views/OpsPageView.vue`

### 2. 后端多源运维态势域

后端新增 `/api/ops/**` 领域接口，按运维域进行拆分：

- `ingest`：统一接入层
- `domain/repository`：主机、快照、告警、来源
- `query`：面向 `/ops` 的聚合查询
- `support`：保留策略、演示灌数

核心接口：

#### 入站接口
- `POST /api/ops/ingest/probe`
- `POST /api/ops/ingest/external`
- `POST /api/ops/ingest/manual`

#### 查询接口
- `GET /api/ops/overview`
- `GET /api/ops/hosts`
- `GET /api/ops/hosts/{hostId}`
- `GET /api/ops/hosts/{hostId}/timeseries`
- `GET /api/ops/hosts/{hostId}/processes`
- `GET /api/ops/alerts`
- `GET /api/ops/sources`

### 3. 多源统一模型

统一来源类型：

- `PROBE`
- `EXTERNAL_API`
- `MANUAL_IMPORT`

统一标识策略：

- 内部标识：`host_code`
- 外部标识：`external_asset_id`

通过 `ops_host_binding` 维护来源绑定关系，使同一台主机可以同时接入多个来源并归一为一条主机记录。

### 4. MySQL 运维域表

已新增：

- `ops_host`
- `ops_host_binding`
- `ops_source_agent`
- `ops_host_snapshot`
- `ops_netif_snapshot`
- `ops_process_snapshot`
- `ops_alert`
- `ops_ingest_event`
- `ops_ingest_payload`

### 5. Java Probe 独立模块

`probe/` 模块当前已具备：

- Linux ARM64 / aarch64 采集逻辑
- `/proc` 解析
- TopN + 白名单进程筛选
- HMAC 签名上报
- 本地 spool 缓冲与补报
- `systemd` 部署示例

详见：
- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe/README.md`

## 运行方式

## 前端

### 开发联调模式

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/frontend
npm install
npm run dev:integration
```

### 生产构建校验

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/frontend
npm run build
```

> 当前这一步已完成构建验证。

## 后端 + MySQL

### Docker Compose

```bash
docker compose up --build
```

会启动：

- MySQL 8
- Spring Boot backend（`mysql` profile）

后端在空库时会自动灌入 probe / external / manual 三类演示数据，便于 `/ops` 首屏直接出数。

### 配置项

后端默认关键环境变量：

- `SPRING_PROFILES_ACTIVE=mysql`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `OPS_PROBE_SHARED_SECRET`
- `OPS_EXTERNAL_INGEST_TOKEN`
- `OPS_MANUAL_INGEST_TOKEN`

## Probe

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe
mvn -DskipTests package
java -jar target/business-security-probe-0.1.0.jar
```

> 如果本地没有 Maven，可使用容器化构建或在具备 Maven 的环境中打包。

## 当前状态说明

### 已完成验证

- 前端生产构建通过：`npm --prefix frontend run build`
- 后端单元测试通过：`docker run --rm -v "$PWD/backend":/workspace -w /workspace maven:3.9.9-eclipse-temurin-17 mvn -B test`
- 探针单元测试通过：`docker run --rm -v "$PWD/probe":/workspace -w /workspace maven:3.9.9-eclipse-temurin-17 mvn -B test`
- `docker compose up -d --build` 已验证可启动 `mysql + backend`
- 容器内接口联调通过：
  - `/actuator/health`
  - `/api/ops/overview`
  - `/api/ops/hosts?page=1&size=20`
- `/ops` 页面已切到真实 `/api/ops/**`，默认不是 mock 数据

### 运行时说明

- 在当前 Codex 沙箱环境中，宿主机对 `127.0.0.1:8080` 的直连偶尔会受限制；容器内访问与前端代理联调已验证正常
- 演示 seed 数据会自动注入 3 类来源（`PROBE` / `EXTERNAL_API` / `MANUAL_IMPORT`），便于首屏直接看到多源态势
- 后端已修复基于 `observedAt` 的时区归一问题，以及 `/api/ops/overview` / `/api/ops/hosts?status=` 的状态统计一致性问题
- `/api/ops/**` 中的业务时间字段（如 `generatedAt` / `lastObservedAt` / `observedAt` / `lastSeenAt`）统一返回带时区的 ISO-8601 时间，前端按标准时区解析，避免联调环境出现 8 小时偏差

## 文档

- 架构：`/Users/bingham/Documents/Project/业务安全态势系统_项目资料/docs/architecture.md`
- API：`/Users/bingham/Documents/Project/业务安全态势系统_项目资料/docs/api-spec.md`
- 部署：`/Users/bingham/Documents/Project/业务安全态势系统_项目资料/docs/deployment.md`
- Probe：`/Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe/README.md`
