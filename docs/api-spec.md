# API 说明

## 1. 获取导航菜单

- **URL**: `GET /api/dashboard/pages`
- **说明**: 返回左侧导航菜单

### 响应示例

```json
[
  {
    "code": "overview",
    "name": "态势总览",
    "route": "/overview",
    "badge": null
  }
]
```

---

## 2. 获取页面详情

- **URL**: `GET /api/dashboard/pages/{pageCode}`
- **说明**: 返回指定主题态势页的标题、指标与组件布局

### 响应字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `code` | string | 页面编码 |
| `name` | string | 页面名称 |
| `title` | string | 大标题 |
| `subtitle` | string | 副标题 |
| `location` | string | 部署位置 |
| `lastUpdated` | string | 最近刷新时间 |
| `dataMode` | string | 数据来源模式，通常为 `api` |
| `summaryMetrics` | array | 顶部摘要指标 |
| `widgets` | array | 页面组件定义 |

### `widgets.type` 取值

- `lineChart`
- `barChart`
- `pieChart`
- `radarChart`
- `gaugeChart`
- `statusGrid`
- `topology`
- `table`
- `timeline`
- `alertList`
- `recommendationList`
- `nodeMap`

---

## 3. 获取后端运行态信息

- **URL**: `GET /api/dashboard/runtime`
- **说明**: 返回当前后端激活 profile、数据模式、Java 版本和数据库开关状态，可供前端提示当前联调环境。

### 响应示例

```json
{
  "applicationName": "business-security-dashboard",
  "activeProfile": "mysql",
  "dataSourceMode": "mysql",
  "apiBasePath": "/api/dashboard",
  "javaVersion": "17.0.12",
  "databaseEnabled": true,
  "seedEnabled": true,
  "status": "UP"
}
```

---

## 4. 健康检查

- **URL**: `GET /actuator/health`
- **说明**: Spring Boot 健康检查接口
