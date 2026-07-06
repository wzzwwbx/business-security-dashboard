# 业务安全态势系统工程化架构说明

## 1. 总体形态

项目采用前后端分离模式：

- **前端**：Vue 3 + TypeScript + Vite + Vue Router + ECharts
- **后端**：Spring Boot 3 + Java 17 + JDBC
- **数据库**：MySQL 8
- **部署形态**：本地开发 + Docker Compose 交付骨架

## 2. 目录结构

```text
业务安全态势系统_项目资料/
├── frontend/                # Vue 前端工程
├── backend/                 # Java 后端工程
├── database/mysql/          # MySQL 初始化脚本
├── docs/                    # 架构 / 接口 / 部署文档
├── artifacts/               # 截图与验证产物
├── compose.yml              # 交付编排文件
├── 业务安全态势系统_原型界面.html
└── 业务安全态势系统_完善方案.docx
```

## 3. 前端分层

- `src/layout/`：整体框架、左侧导航、运行态提示
- `src/views/`：页面级视图，按态势主题装配组件
- `src/components/common/`：通用卡片、指标卡、头部组件
- `src/components/dashboard/`：页面摘要区和运行关注区
- `src/components/widgets/`：图表 / 列表 / 表格 / 拓扑 / 节点图等部件
- `src/composables/`：页面数据装配与摘要逻辑
- `src/api/`：后端接口调用封装
- `src/types/`：接口数据结构声明
- `src/mocks/`：前端演示数据

## 4. 后端分层

- `controller`：REST API 对外暴露
- `service`：页面查询与运行态服务接口
- `service/impl`：`mock` 与 `mysql` 双实现
- `support`：演示数据加载器、运行态解析器、MySQL 自动灌数逻辑
- `config`：跨域与 Web 配置
- `exception`：统一异常处理
- `dto`：菜单、页面、指标、组件、运行态 DTO

## 5. 联调模式设计

### 5.1 前端双模式

- `mock`：完全前端自给数据，适合视觉评审与无后端演示；
- `integration`：仅调用后端 API，不再静默回退页面 mock 数据。

### 5.2 后端双模式

- `mock` profile：从 `mock/dashboard-data.json` 读取演示数据；
- `mysql` profile：从 MySQL 查询页面、指标与组件数据，并在空表时自动灌数。

### 5.3 运行态感知

新增 `GET /api/dashboard/runtime` 用于让前端识别：

- 当前是否真的接上后端；
- 当前后端处于 `mock` 还是 `mysql`；
- 当前数据库灌数链路是否启用。

## 6. 数据模型设计

当前第一阶段采用“页面 + 指标 + 组件”三层模型：

- `dashboard_page`：页面主信息
- `dashboard_metric`：头部摘要指标
- `dashboard_widget`：页面组件定义及配置负载

这种做法适合：

1. 先把静态原型稳定转成可联调工程；
2. 后续逐个替换为真实业务域表；
3. 通过 `payload_json` 承接图表配置与列表数据，降低首期开发复杂度。

## 7. 后续演进建议

### 7.1 后端演进

建议逐步按业务域拆表：

- 终端域：终端台账、终端状态、链路状态、USB Key 状态
- 业务域：密信消息统计、签阅流转、数字信封操作日志
- 安全域：安全事件、风险评估、AI 告警结果、策略联动
- 运维域：设备资源、工单、策略下发日志、审计日志

### 7.2 前端演进

建议补充：

- Pinia 状态管理
- 权限模型与登录页
- 大屏模式 / 运维台模式切换
- 组件配置化渲染与主题皮肤管理
- WebSocket / SSE 实时刷新

### 7.3 工程演进

- 增加后端单测 / API 测试
- 增加前端组件测试 / E2E
- 增加镜像发布、环境变量模板、CI/CD
