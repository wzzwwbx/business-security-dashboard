# 部署与联调说明

## 1. 推荐方式

当前最推荐的本地交付验证路径：

1. 用 Docker Compose 起 MySQL + Spring Boot；
2. 用前端 `integration` 模式连接本地 API；
3. 用前端 `mock` 模式做纯原型演示。

---

## 2. Docker Compose

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料
docker compose up --build -d mysql dashboard-backend
```

服务说明：

- `mysql`：MySQL 8.4
- `dashboard-backend`：Spring Boot 3，默认以 `mysql` profile 启动

停止：

```bash
docker compose down
```

---

## 3. 前端联调

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/frontend
npm install
npm run dev:integration
```

默认通过以下配置代理到后端：

```env
VITE_DASHBOARD_DATA_SOURCE=integration
VITE_API_BASE_URL=/api
VITE_USE_PROXY=true
VITE_DEV_PROXY_TARGET=http://localhost:8080
```

---

## 4. 前端纯演示模式

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/frontend
npm run dev:mock
```

该模式完全不依赖后端，适合：

- 评审 UI
- 展示视觉稿
- 无后端条件下继续做前端开发

---

## 5. 后端运行态接口

用于验证当前后端真实联调环境：

```bash
curl http://localhost:8080/api/dashboard/runtime
```

可判断：

- 当前是否接到 Spring Boot；
- 当前为 `mock` 还是 `mysql`；
- 数据库灌数链路是否已启用。
