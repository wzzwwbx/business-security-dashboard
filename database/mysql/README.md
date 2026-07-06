# MySQL 初始化说明

1. 创建数据库并执行 `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/database/mysql/schema.sql`。
2. 启动后端时切换到 `mysql` profile：

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/backend
mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```

3. 后端首次启动时会自动将内置演示数据灌入 `dashboard_page`、`dashboard_metric`、`dashboard_widget` 三张表。
4. 生产化阶段可以保留现有表结构，将 `payload_json` 拆分为业务域明细表，逐步替换为真实业务数据接入。
