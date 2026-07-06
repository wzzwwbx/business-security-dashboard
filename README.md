# 业务安全态势系统 — 可交付工程版

## 1. 项目定位

当前目录已从静态原型继续细化为一个可交付、可联调、可扩展的前后端分离工程：

- **前端**：Vue 3 + TypeScript + Vite + Vue Router + ECharts
- **后端**：Spring Boot 3 + Java 17
- **数据库**：MySQL 8
- **交付形态**：本地开发、Mock 演示、MySQL 联调、Docker Compose 部署骨架

本项目当前重点已经不再只是“看起来像原型”，而是具备以下工程属性：

1. 前端支持 **mock / integration** 双运行模式；
2. 后端支持 **mock / mysql** 双 profile；
3. MySQL 提供建表脚本与后端自动灌数能力；
4. 前端不会在 integration 模式下静默回退页面 mock 数据；
5. 项目补充了部署编排文件、接口文档、架构文档与运行说明。

---

## 2. 当前目录结构

```text
/Users/bingham/Documents/Project/业务安全态势系统_项目资料
├── frontend/                        # Vue 前端工程
├── backend/                         # Spring Boot 后端工程
├── database/mysql/                  # MySQL 初始化脚本
├── docs/                            # 架构 / API / 部署说明
├── artifacts/                       # 当前验证截图产物
├── compose.yml                      # Docker Compose 交付编排
├── 业务安全态势系统_原型界面.html
├── 业务安全态势系统_完善方案.docx
└── README.md
```

---

## 3. 已完成的工程化能力

### 3.1 前端

- 五大态势页面统一收敛为 Vue 路由页面；
- 左侧导航、头部、指标卡、组件面板全部组件化；
- 支持折线图、柱状图、饼图、雷达图、仪表盘、表格、状态卡、时间线、推荐列表、拓扑、节点图；
- `mock` 模式下直接使用前端演示数据；
- `integration` 模式下通过 `/api/dashboard/**` 联调 Spring Boot；
- integration 模式联调失败时：
  - 左侧导航壳仍保留，便于排查；
  - 主内容区明确显示加载失败；
  - **不会** 偷偷回退为页面 mock 数据。

### 3.2 后端

- Spring Boot 启动、Controller、Service、异常处理、跨域配置完整；
- 提供接口：
  - `GET /api/dashboard/pages`
  - `GET /api/dashboard/pages/{pageCode}`
  - `GET /api/dashboard/runtime`
- 支持：
  - `mock` profile：读取 `backend/src/main/resources/mock/dashboard-data.json`
  - `mysql` profile：读取 MySQL，并在空表时自动灌数
- 新增运行态接口，可返回当前 profile、数据模式、Java 版本、数据库启用状态。

### 3.3 数据库

当前首期数据模型为：

- `dashboard_page`
- `dashboard_metric`
- `dashboard_widget`

该模型适合原型工程化第一阶段，后续可继续按业务域拆表。

### 3.4 交付辅助

- `compose.yml`：MySQL + 后端容器编排
- `backend/Dockerfile`：后端镜像构建
- `docs/api-spec.md`：接口说明
- `docs/architecture.md`：工程架构说明
- `docs/deployment.md`：部署与联调说明

---

## 4. 启动方式

## 4.1 前端 Mock 预览模式

适合纯视觉预览、演示汇报、前端联调前检查。

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/frontend
npm install
npm run dev:mock
```

默认地址：
- [http://127.0.0.1:5173](http://127.0.0.1:5173)

## 4.2 前端 Integration 联调模式

适合接 Spring Boot API 验证真实联调行为。

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/frontend
npm install
npm run dev:integration
```

说明：
- 默认通过 Vite 代理把 `/api` 转发到 `http://localhost:8080`；
- 若后端未启动，导航壳仍会显示，但页面主内容区会明确报错；
- 当前前端默认脚本 `npm run dev` 等价于 `npm run dev:integration`。

## 4.3 后端本地 Mock 模式

> 当前本机已安装 Java，但未安装 Maven；如本地没有 Maven，建议直接用 Docker Compose 方式启动后端。

如你本机已安装 Maven：

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/backend
mvn spring-boot:run
```

默认地址：
- [http://localhost:8080](http://localhost:8080)

## 4.4 后端本地 MySQL 模式

1. 先准备本地 MySQL；
2. 先执行：
   `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/database/mysql/schema.sql`
3. 再按需覆盖：
   `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/backend/src/main/resources/application-mysql.yml`
4. 启动：

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/backend
mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```

## 4.5 Docker Compose 启动 MySQL + 后端

如果你希望快速获得一个可联调的后端环境，推荐直接使用：

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料
docker compose up --build -d mysql dashboard-backend
```

启动后可联调：
- 后端接口基地址：[http://localhost:8080/api/dashboard](http://localhost:8080/api/dashboard)
- 健康检查：[http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

停止：

```bash
docker compose down
```

---

## 5. 当前验证结果

### 前端已验证

已完成以下验证：

- `frontend` mock 构建通过；
- `frontend` integration 构建通过；
- mock 模式下主内容区已恢复正常显示；
- integration 模式下在后端不可用时，会明确显示失败状态；
- Docker Compose 配置语法已校验通过。

当前验证截图：

- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/artifacts/mock-overview-fixed.png`
- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/artifacts/integration-overview-empty-state.png`

---

## 6. 接口清单

### 导航菜单
- `GET /api/dashboard/pages`

### 页面详情
- `GET /api/dashboard/pages/{pageCode}`

### 运行态信息
- `GET /api/dashboard/runtime`

示例说明见：
- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/docs/api-spec.md`

---

## 7. 下一步建议

1. 增加登录、权限、组织维度与操作审计；
2. 将 `payload_json` 逐步拆解成业务域明细表；
3. 为后端补充单元测试 / 接口测试；
4. 增加 WebSocket / SSE 实时刷新；
5. 对接真实业务采集链路与告警处置闭环；
6. 增加 CI/CD、镜像发布和环境参数模板。
