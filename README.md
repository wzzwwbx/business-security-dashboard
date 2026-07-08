# 业务安全态势系统 — 工程化项目（多源接入版）

## 项目概述

当前仓库已经从单纯前端原型继续演进为 **前后端分离、可扩展、多主题、多源接入** 的工程化项目。

本期实现分成两条线并行推进：

1. **真实闭环线**：`Java Probe → Backend /api/ops/ingest/probe → MySQL → Frontend /ops`
2. **主题态势线**：综合 / 安全 / 业务 / 终端四类主题态势页面，先按统一领域模型落成前端与占位接口，为未来第三方系统接入预留空间

当前设计明确区分两类域：

- `/api/ops/**`：真实运维域，承接 probe / external / manual 多源数据
- `/api/situation/**`：综合、安全、业务、终端态势域，占位接口优先，支持前端联调与经验建模展示

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

## 当前已落地能力

### 1. `/ops` 真实运维态势闭环

`/ops` 已从通用 dashboard 页面中剥离，形成真实运维域页面，包含：

1. 总览卡片
2. 来源概览
3. 主机列表
4. 主机详情
5. 趋势图
6. TopN / 白名单进程
7. 最新告警

对应工程模块：

- `frontend/src/api/ops.ts`
- `frontend/src/types/ops.ts`
- `frontend/src/composables/useOpsOverview.ts`
- `frontend/src/composables/useOpsHostDetail.ts`
- `frontend/src/components/ops/*`
- `frontend/src/views/OpsPageView.vue`

### 2. 四类主题态势页工程化落地

前端已实现四个主题页面：

- `/overview`：综合态势
- `/security`：安全态势
- `/business`：业务态势
- `/terminal`：终端态势

当前这四类页面具备以下工程化能力：

- 使用统一 `SituationPage` 类型与 section schema
- 支持 **接口优先、mock 回退** 的数据策略
- 支持来源状态提示：`接口联调 / Mock 回退 / 本地 Mock`
- 支持板块过滤 chips
- 支持 KPI / 摘要 / 表格 / 时间线等卡片点击后的焦点详情面板
- 支持空态、加载态、错误态

对应工程模块：

- `frontend/src/api/situations.ts`
- `frontend/src/types/situation.ts`
- `frontend/src/composables/useSituationPage.ts`
- `frontend/src/components/situation/*`
- `frontend/src/views/SituationPageView.vue`

### 3. 后端多源运维态势域 `/api/ops/**`

后端新增 `/api/ops/**` 领域接口，按运维域拆分：

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

### 4. 后端主题态势占位域 `/api/situation/**`

后端已新增统一主题态势占位接口：

- `GET /api/situation/{pageCode}`
- `GET /api/situation/overview`
- `GET /api/situation/security`
- `GET /api/situation/business`
- `GET /api/situation/terminal`

说明：

- 当前数据来自 `backend/src/main/resources/mock/situations.json`
- 接口返回结构已与前端真实联调模式对齐
- 后续可将静态 mock loader 替换为数据库查询、聚合服务或第三方接口编排，而无需推翻前端页面结构

### 5. 多源统一模型

统一来源类型：

- `PROBE`
- `EXTERNAL_API`
- `MANUAL_IMPORT`

统一标识策略：

- 内部标识：`host_code`
- 外部标识：`external_asset_id`

通过 `ops_host_binding` 维护来源绑定关系，使同一台主机可以同时接入多个来源并归一为一条主机记录。

### 6. MySQL 运维域表

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

同时已为终端域预留人员主数据表：

- `person_profile`
- `person_phone`

约束说明：终端侧上报的手机号不再直接散落在设备记录中，而是先关联到人员主数据，再由终端域完成人员归一。

### 7. Java Probe 独立模块

`probe/` 模块当前已具备：

- Linux ARM64 / aarch64 采集逻辑
- `/proc` 解析
- TopN + 白名单进程筛选
- HMAC 签名上报
- 本地 spool 缓冲与补报
- `systemd` 部署示例

详见：
- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe/README.md`

### 8. IAM 等保三员治理

系统已补齐符合等级保护三员分立要求的 IAM 基础能力，形成 **系统管理员 / 安全管理员 / 审计管理员** 的职责边界：

- 系统管理员：账户创建、启停用申请、口令重置申请、基础资料维护
- 安全管理员：角色绑定审批、高危账户操作审批、策略与来源接入授权
- 审计管理员：登录审计、操作审计、审批留痕核查

当前已工程化落地：

- 后端 `Spring Security + HttpOnly Session` 本地认证
- `/api/iam/**` 账户、角色、审批、审计接口
- 初始化接口：首次启动可一键创建 `sysadmin / secadmin / auditadmin`
- 前端登录页、初始化页、403 页、系统管理页
- 导航与页面按 `page permission + action permission` 实时裁剪
- 审计日志记录登录与关键操作，审批流记录审批结果与意见

对应工程模块：

- `backend/src/main/java/com/bss/dashboard/iam/**`
- `frontend/src/views/LoginPageView.vue`
- `frontend/src/views/BootstrapPageView.vue`
- `frontend/src/views/SystemPageView.vue`
- `frontend/src/components/system/*`

## 运行方式

### 前端

#### 开发联调模式

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/frontend
npm install
npm run dev:integration
```

> 开发联调时请保持前端通过 **Vite proxy 同源访问 `/api`**。
> 不要把 dev 环境改成优先直连 `http://127.0.0.1:8080`，否则浏览器 `JSESSIONID` 会因为跨源而导致 IAM 登录态不稳定。

#### 本地 Mock 模式

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/frontend
npm run dev:mock
```

#### 生产构建校验

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/frontend
npm run build
```

> 当前已完成构建验证：`npm --prefix frontend run build`

### 后端 + MySQL

#### Docker Compose

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料
docker compose up --build
```

会启动：

- MySQL 8
- Spring Boot backend（`mysql` profile）

后端在空库时会自动灌入 probe / external / manual 三类演示数据，便于 `/ops` 首屏直接出数。

### 后端关键环境变量

- `SPRING_PROFILES_ACTIVE=mysql`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `OPS_PROBE_SHARED_SECRET`
- `OPS_EXTERNAL_INGEST_TOKEN`
- `OPS_MANUAL_INGEST_TOKEN`

### Probe

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe
mvn -DskipTests package
java -jar target/business-security-probe-0.1.0.jar
```

> 如果本地没有 Maven，可使用容器化构建或在具备 Maven 的环境中打包。

## 当前状态说明

### 已完成验证

- 前端生产构建通过：`npm --prefix frontend run build`
- `backend/src/main/resources/mock/situations.json` 已完成 JSON 结构校验
- backend 已通过容器 Maven 执行测试：`docker run --rm -v "$PWD/backend":/workspace -w /workspace maven:3.9.9-eclipse-temurin-17 mvn -B test`
- backend 灵活接入归一化已完成定向自测：external payload 可仅传 `attributes/metrics/extensions` 仍可统一归一为 host/snapshot/process
- probe 采集链路已完成本地伪 `/proc` 自测：验证 CPU delta、TCP 连接数、网卡速率、TopN + 白名单进程筛选均正常
- 主题态势页前端已接通交互：过滤、回退提示、焦点详情
- `/ops` 页面仍保持真实 `/api/ops/**` 联调路径，不受本轮主题态势改造影响
- IAM 初始化 / 登录 / 会话鉴权 / 三员账户列表 / 角色与权限查询 / 审批列表 已完成 curl 真链路验证
- 浏览器已完成登录验证：`/login -> /overview -> /system/accounts` 可按权限正常展示

### 当前环境限制说明

- 当前桌面环境可直接完成前端构建与本地 dev server 启动验证
- 当前宿主机虽然缺少本地 `mvn` 命令，但已通过容器 Maven 完成 backend 测试校验；后续在目标环境仍建议保留常规 Maven / CI 流水线验证
- 在当前前端实现中，`/overview`、`/security`、`/business`、`/terminal` 默认优先请求 `/api/situation/**`；若接口不可达，会自动回退到本地经验数据并展示 warning banner

## 文档

- 架构：`/Users/bingham/Documents/Project/业务安全态势系统_项目资料/docs/architecture.md`
- API：`/Users/bingham/Documents/Project/业务安全态势系统_项目资料/docs/api-spec.md`
- 部署：`/Users/bingham/Documents/Project/业务安全态势系统_项目资料/docs/deployment.md`
- Probe：`/Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe/README.md`
- 终端建模：`/Users/bingham/Documents/Project/业务安全态势系统_项目资料/docs/terminal-data-model.md`


## 灵活接入补充说明

为适配“其他系统接口尚未明确”的现实情况，`/api/ops/ingest/external` 与 `/api/ops/ingest/manual` 已升级为 **标准字段 + 扩展字段兼容模型**：

- 标准字段：`sourceType`、`sourceSystem`、`requestId`、`externalAssetId`、`schemaVersion`、`payloadType`、`observedAt`
- 扩展字段：`labels`、`attributes`、`metrics`、`extensions`
- 归一策略：
  - 主机基础信息优先取 `host.*`，缺失时回退 `attributes/extensions`
  - 指标优先取 `snapshot.*`，缺失时回退 `metrics`
  - `externalAssetId` 缺失时可从 `attributes.assetId/externalAssetId` 提取
  - `observedAt` 缺失时可从 `attributes/extensions` 提取，仍缺失则回退当前时间
  - `hostCode` 缺失时自动生成稳定值，避免 external/manual 接入方必须先实现内部主机编码算法

示例文件：

- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/docs/examples/ops-external-flexible.json`
- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/docs/examples/ops-manual-minimal.json`
