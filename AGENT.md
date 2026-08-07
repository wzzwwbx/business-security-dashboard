# 业务安全态势系统工程说明

## 1. 工程定位

本工程是一个面向安全运营、业务运行和基础设施值守的业务安全态势系统。系统采用前后端分离架构，支持多主题态势展示、多源运维数据接入、统一数据归一、权限治理和离线部署。

当前工程分为两条主线：

- **真实运维闭环**：Java Probe / 外部系统 / 人工导入 → `/api/ops/ingest/**` → 归一化与 MySQL → `/api/ops/**` → 前端 `/ops`。
- **主题态势线**：综合、安全、业务、终端页面使用统一 Situation 模型和稳定接口契约，当前以占位接口与 Mock 数据支撑前端联调，后续逐步接入真实数据源。

## 2. 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Vue 3、TypeScript、Vite、Vue Router、ECharts |
| 后端 | Spring Boot 3、Java 17 |
| 数据库 | MySQL 8 |
| 探针 | Java 17，Linux `/proc` 与 `FileStore` 采集 |
| 部署 | Docker Compose、离线安装脚本、ARM64 Probe 部署 |

## 3. 工程结构

```text
frontend/                 Vue 前端、路由、页面、组件、composable、Mock
backend/                  Spring Boot API、领域服务、数据初始化与 Mock loader
probe/                    Linux Java Probe、采集、签名、spool 与补报
database/mysql/           MySQL 初始化脚本和数据库说明
docs/                     架构、API、部署、数据模型、设计规范
deploy/                   Docker、离线部署、RPM 和 Nginx 配置
compose.yml               后端与 MySQL 编排
```

## 4. 前端页面与路由

| 路由 | 页面 | 职责 |
| --- | --- | --- |
| `/overview` | 综合态势 | 汇总业务、安全、终端与运维的总体状态 |
| `/security` | 安全态势 | 展示漏洞、告警、策略执行和防护覆盖 |
| `/business` | 业务态势 | 展示业务连续性、关键链路和服务质量 |
| `/terminal` | 终端态势 | 展示终端资产、健康度、风险和处置状态 |
| `/ops` | 运维态势 | 展示多源主机、探针、资源、进程和告警 |
| `/system/*` | 系统管理 | 账户、角色、审批和审计，遵循三员分立 |

登录、初始化和 403 页面使用独立布局，不渲染主应用壳层。系统导航通过页面权限和动作权限动态裁剪。

## 5. 后端领域与数据链路

### 5.1 API 领域

- `/api/situation/**`：综合、安全、业务、终端主题态势域。当前数据主要来自 `backend/src/main/resources/mock/situations.json`，接口结构已经与前端联调模式对齐。
- `/api/ops/**`：真实运维域，负责 Probe、外部 API、人工导入的数据接入、主机归一、快照、告警、来源健康和查询聚合。
- `/api/iam/**`：认证、账户、角色、审批、审计和三员治理。

### 5.2 运维数据流

```text
Java Probe / 外部系统 / 人工导入
        ↓
/api/ops/ingest/{probe|external|manual}
        ↓
来源校验、主机归一、快照与告警沉淀
        ↓
MySQL ops_* 表
        ↓
/api/ops/overview、hosts、alerts、sources、timeseries
        ↓
Vue /ops 工作台
```

运维来源包括 `PROBE`、`EXTERNAL_API` 和 `MANUAL_IMPORT`。系统使用内部 `host_code` 与外部 `external_asset_id` 双标识，并通过绑定关系将同一主机的多来源数据归一到统一记录。

终端人员数据遵循主数据约束：手机号作为人员归一线索，通过 `person_profile` 与 `person_phone` 维护，不直接替代人员主记录。

## 6. 当前已实现能力

- 统一 `SituationPage`、`SituationSection` 模型，支持 KPI、摘要、图表、表格、时间线、场景、拓扑、资产集群和趋势组件。
- 主题态势采用接口优先、Mock 回退策略，并提供来源提示、过滤 chips、焦点详情、加载态、空态、错误态和重试。
- `/ops` 已形成真实运维页面，支持总览、来源、主机筛选、主机详情、趋势、进程、告警和站点拓扑。
- 运维接入支持 Probe 严格字段校验，以及外部/人工来源的灵活 envelope 和字段归一补全。
- Java Probe 支持 Linux ARM64 采集、HMAC 签名、本地 spool 缓冲和服务恢复后的自动补报。
- IAM 已落地 Spring Security + HttpOnly Session、本地初始化、账户/角色/审批/审计接口和按权限裁剪导航。
- 前端已有统一 `AppShell`、`PanelCard`、`MetricCard`、`BaseIcon`、`BaseEmpty`、`BaseSkeleton` 等基础组件。
- 全局设计 token、深色态势样式、SVG 图标、键盘焦点和 reduced-motion 规则已经建立，并持续迁移存量组件。

## 7. 前端开发约束

- 接口优先：生产联调优先请求 `/api`，Mock 只用于本地演示、故障回退和页面开发。
- 开发环境使用 Vite proxy 同源访问 `/api`，避免跨源导致 `JSESSIONID` 登录态不稳定。
- 页面 View 负责装配；数据获取和页面状态集中在 composable；展示组件保持单一职责。
- 新增数据结构优先补充 `frontend/src/types/` 类型，再实现 API、composable 和组件。
- 新组件优先消费 `--sys-*`、`--space-*`、`--radius-*`、`--shadow-*`、`--motion-*` 等语义 token；不要新增随意的原始颜色和间距。
- 状态不得只依赖颜色，应同时使用文字、图标、数值、时间或动作语义。
- 数据面板必须考虑 loading、empty、error、retry 和 no-data 状态；详情优先使用抽屉或聚焦面板承载。
- 结构性图标使用统一 SVG 图标组件，不使用 emoji 或字符字形替代。
- 变更应保持与现有 Vue 3 + TypeScript + Vite 模式一致，避免无必要的框架或状态管理引入。

## 8. 运行与验证

### 前端开发

```bash
cd frontend
npm install
npm run dev:integration
```

本地 Mock 模式：

```bash
npm run dev:mock
```

生产构建校验：

```bash
npm run build
```

### 后端与 MySQL

```bash
docker compose up --build
```

开发联调时保持前端通过 Vite proxy 同源访问后端 `/api`。具体部署、离线安装和 ARM64 交付方式以 `docs/deployment.md`、`docs/deployment-arm64-offline.md` 和 `deploy/` 下脚本为准。

## 9. 当前状态与工程目标

### 当前状态

`/ops` 是当前最完整的真实数据闭环，已经覆盖多源接入、MySQL 持久化、聚合查询和前端运维工作台。综合、安全、业务、终端主题态势页面已完成统一前端工程化，但其后端仍以占位接口和 Mock 数据为主，真实第三方数据适配尚未全部完成。

### 后续目标

1. 将主题态势占位数据逐步替换为真实数据库查询、聚合服务或第三方适配器。
2. 继续完善运维多源适配、来源健康、字段映射、幂等和告警策略。
3. 将现有 token、基础组件、图表和状态反馈沉淀为稳定的前端设计系统。
4. 强化权限边界、审批留痕、审计查询和高危动作的可追踪性。
5. 完善可访问性、键盘操作、reduced-motion 和移动端巡检体验。
6. 持续验证 Docker、离线安装、RPM 和 ARM64 环境下的可部署性。

## 10. 相关文档

- `README.md`：项目概览与运行说明
- `docs/architecture.md`：总体架构、领域拆分和数据链路
- `docs/api-spec.md`：接口、请求体和时间字段约定
- `docs/design-tokens.md`：全局设计 token 说明
- `docs/ui-ux-review.md`：前端 UI/UX 评审和后续治理建议
- `docs/business-system-integration-ledger.md`：业务系统数据接入与态势设计持续台账
- `docs/demo-situation-optimization-plan.md`：综合态势与业务态势演示优化方案
- `DESIGN.md`：面向日常设计和开发的前端视觉基线
