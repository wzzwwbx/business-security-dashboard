# API 说明

## 1. 统一响应结构

### 成功

```json
{
  "code": 0,
  "message": "OK",
  "data": {},
  "traceId": "uuid",
  "timestamp": "2026-07-07T00:00:00Z"
}
```

### 失败

```json
{
  "code": 500,
  "message": "error message",
  "details": {},
  "traceId": "uuid",
  "timestamp": "2026-07-07T00:00:00Z"
}
```

## 2. 运维入站接口 `/api/ops/ingest/**`

### `POST /api/ops/ingest/probe`

请求头：

- `X-Agent-Key`
- `X-Timestamp`
- `X-Signature`

签名规则：

```text
hex(hmac_sha256(sharedSecret, X-Timestamp + "\n" + rawJsonBody))
```

请求体示例：

```json
{
  "sourceType": "PROBE",
  "sourceSystem": "linux-arm-probe",
  "requestId": "req-001",
  "externalAssetId": null,
  "observedAt": "2026-07-07T00:00:00Z",
  "host": {
    "hostCode": "host-code",
    "hostname": "arm-node-01",
    "displayName": "arm-node-01",
    "primaryIp": "10.0.0.10",
    "osName": "Ubuntu 22.04.4 LTS",
    "kernelVersion": "6.1.0",
    "arch": "aarch64",
    "cpuCores": 8,
    "memoryTotalBytes": 17179869184,
    "machineFingerprint": "machine-id"
  },
  "snapshot": {
    "cpuUsagePct": 42.4,
    "load1": 1.26,
    "load5": 1.11,
    "load15": 0.96,
    "memUsedBytes": 8589934592,
    "memAvailableBytes": 8589934592,
    "swapUsedBytes": 0,
    "diskUsedBytes": 268435456000,
    "diskTotalBytes": 536870912000,
    "diskUsagePct": 50.0,
    "tcpEstablishedCount": 132,
    "processCount": 164
  },
  "networkInterfaces": [],
  "processes": []
}
```

### `POST /api/ops/ingest/external`

请求头：

- `X-Ingest-Token`

说明：

- 作为未来外部系统接入占位接口
- 允许使用 `externalAssetId`
- 统一写入同一运维态势域

### `POST /api/ops/ingest/manual`

请求头：

- `X-Ingest-Token`

说明：

- 用于联调 / 演示 / 测试数据注入



### external / manual 灵活接入约定

`/api/ops/ingest/external` 与 `/api/ops/ingest/manual` 支持两类字段同时存在：

1. **标准领域字段**
   - `host`
   - `snapshot`
   - `networkInterfaces`
   - `processes`

2. **扩展 envelope 字段**
   - `schemaVersion`
   - `payloadType`
   - `labels`
   - `attributes`
   - `metrics`
   - `extensions`

归一化规则：

- `host.*` 缺失时，后端会从 `attributes/extensions` 自动回填 `hostname / primaryIp / osName / kernelVersion / arch / cpuCores / memoryTotalBytes / machineFingerprint`
- `snapshot.*` 缺失时，后端会从 `metrics` 自动回填 `cpuUsagePct / memUsedBytes / memAvailableBytes / swapUsedBytes / diskUsedBytes / diskTotalBytes / diskUsagePct / tcpEstablishedCount / processCount / load1 / load5 / load15`
- `processes[*].pid` 缺失时回填 `-1`
- `processes[*].processName` 缺失时从 `commandLine` 首 token 推断
- `processes[*].state` 缺失时回填 `UNKNOWN`
- `hostCode` 缺失时：
  - 若存在 `externalAssetId`，使用 `sha256(sourceSystem + "|" + externalAssetId)` 生成稳定值
  - 否则使用 `sourceSystem + hostname + primaryIp + arch + machineFingerprint` 组合生成稳定值

示例：

- flexible external：`/Users/bingham/Documents/Project/业务安全态势系统_项目资料/docs/examples/ops-external-flexible.json`
- minimal manual：`/Users/bingham/Documents/Project/业务安全态势系统_项目资料/docs/examples/ops-manual-minimal.json`

## 3. 运维查询接口 `/api/ops/**`

### 时间字段约定

- `/api/ops/**` 返回的业务时间字段统一使用 **带时区的 ISO-8601** 字符串，例如 `2026-07-07T02:14:23Z`
- 典型字段包括：`generatedAt`、`lastObservedAt`、`observedAt`、`lastSeenAt`、`firstSeenAt`、`resolvedAt`
- 前端或第三方调用方应按标准时区时间解析；如兼容历史无时区数据，建议按 UTC 兜底处理

### `GET /api/ops/overview`

返回：

- 在线主机数
- stale 主机数
- offline 主机数
- 打开告警数
- 来源数
- 平均 CPU / 内存利用率

### `GET /api/ops/hosts`

查询参数：

- `keyword`
- `status`
- `page`
- `size`

说明：

- `status` 支持：`ONLINE` / `STALE` / `OFFLINE`
- 主机状态以最近 `lastObservedAt` freshness 动态计算

### `GET /api/ops/hosts/{hostId}`

返回：

- 主机基础信息
- 最新可信快照
- 绑定信息

### `GET /api/ops/hosts/{hostId}/timeseries?range=1h|6h|24h`

返回：

- CPU
- 内存
- 磁盘
- Load
- 聚合网络上下行速率

### `GET /api/ops/hosts/{hostId}/processes`

返回：

- 最新采样批次中的 TopN / 白名单进程

### `GET /api/ops/alerts`

参数：

- `hostId` 可选
- `limit` 默认 20

### `GET /api/ops/sources`

返回：

- 来源类型
- 来源系统名
- enabled
- 健康状态
- 已归一主机数量
- 最近同步时间

## 4. 等保三员 IAM 接口 `/api/iam/**`

### 4.1 初始化与认证

- `GET /api/iam/bootstrap/status`：查询是否已初始化三员账户
- `POST /api/iam/bootstrap/init`：首次初始化 `sysadmin / secadmin / auditadmin`
- `POST /api/iam/auth/login`：用户名密码登录，建立 HttpOnly Session
- `POST /api/iam/auth/logout`：注销当前会话
- `GET /api/iam/auth/me`：获取当前登录用户、页面权限、动作权限
- `POST /api/iam/auth/change-password`：修改当前登录用户密码

### 4.2 账户与角色

- `GET /api/iam/users`：查询账户列表，需 `account:view`
- `POST /api/iam/users`：创建账户，需 `account:create`
- `PATCH /api/iam/users/{userId}`：更新显示名/状态等，需 `account:update`
- `POST /api/iam/users/{userId}/disable`：发起禁用申请，需 `account:disable + approval:submit`
- `POST /api/iam/users/{userId}/enable`：发起启用申请，需 `account:enable + approval:submit`
- `POST /api/iam/users/{userId}/reset-password`：发起口令重置申请，需 `account:reset-password + approval:submit`
- `PUT /api/iam/users/{userId}/roles`：发起角色绑定申请，需 `account:bind-role + approval:submit`
- `GET /api/iam/roles`：查询角色目录，需 `role:view`
- `GET /api/iam/permissions`：查询权限目录，需 `role:view`

### 4.3 审批与审计

- `GET /api/iam/approvals`：查询审批工单，需 `approval:view`
- `POST /api/iam/approvals/{ticketId}/approve`：审批通过，需 `approval:review`
- `POST /api/iam/approvals/{ticketId}/reject`：审批拒绝，需 `approval:review`
- `GET /api/iam/audit/logins?limit=50`：查询登录审计，需 `audit:view`
- `GET /api/iam/audit/operations?limit=50`：查询操作审计，需 `audit:view`

### 4.4 认证说明

- 后端在 `mysql` profile 下启用 IAM 接口
- 认证方式为 **Spring Security Session**，前端需使用 `withCredentials=true` 且优先走同源 `/api` 代理
- 未登录访问受保护接口时，后端统一返回：

```json
{
  "code": 401,
  "message": "请先登录后再访问系统资源",
  "details": { "error": "Unauthorized" },
  "traceId": "...",
  "timestamp": "2026-07-08T02:24:16Z"
}
```

## 5. 主题态势接口 `/api/situation/**`

### `GET /api/situation/{pageCode}`

支持参数：

- `overview`
- `security`
- `business`
- `terminal`

说明：

- 返回主题态势页面完整结构
- 当前由后端统一返回 `SituationPageDto`
- 前端默认优先联调该接口，失败时回退到本地 mock

### 快捷路径

- `GET /api/situation/overview`
- `GET /api/situation/security`
- `GET /api/situation/business`
- `GET /api/situation/terminal`

### 返回结构要点

`SituationPageDto` 核心字段：

- `code`
- `name`
- `title`
- `subtitle`
- `location`
- `lastUpdated`
- `dataMode`
- `summary`
- `heroTags`
- `actions`
- `kpis`
- `highlights`
- `sections`

### `sections` 支持的 `kind`

- `matrix`
- `chart`
- `signals`
- `sources`
- `cards`
- `table`
- `timeline`

### 返回示例（节选）

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "code": "overview",
    "title": "综合态势总览",
    "summary": "聚合业务、安全、终端与运维多个主题的关键变化。",
    "kpis": [
      {
        "label": "跨域风险指数",
        "value": "78",
        "unit": "/100",
        "trend": "+6.2%",
        "description": "高风险信号集中在终端暴露与业务高峰链路。",
        "tone": "warning"
      }
    ],
    "sections": [
      {
        "kind": "matrix",
        "code": "overview-domain-matrix",
        "title": "主题态势矩阵",
        "colSpan": 7,
        "items": []
      }
    ]
  },
  "traceId": "uuid",
  "timestamp": "2026-07-07T00:00:00Z"
}
```

## 6. 终端域真实接口与人员归一约定

终端域已落地独立接口 `/api/terminal/**`，并围绕零信任客户端上报能力形成“人员主数据优先”的归一模型。

### 6.1 查询接口

- `GET /api/terminal/overview`：终端总览，包含在线、离线、高风险、待认领终端等指标
- `GET /api/terminal/sources`：来源概览
- `GET /api/terminal/devices`：终端列表，支持 `keyword`、`status`、`riskLevel`、`ownershipStatus` 过滤
- `GET /api/terminal/devices/{deviceId}`：终端详情
- `GET /api/terminal/devices/{deviceId}/timeseries?range=6h|24h|7d`：流量、口令错误、风险分趋势
- `GET /api/terminal/devices/{deviceId}/events?limit=20`：最新事件聚合流
- `GET /api/terminal/devices/{deviceId}/software-changes?limit=10`：最近软件安装、更新、卸载记录
- `GET /api/terminal/devices/{deviceId}/peripherals?limit=10`：最近外设接入记录

### 6.2 入站接口

- `POST /api/terminal/ingest/external`：外部系统终端数据接入
- `POST /api/terminal/ingest/manual`：手工注入演示 / 联调数据

### 6.3 终端归一规则

- 上报中的 `phoneNumber` 默认不是人员主键
- 后端优先通过 `person_profile` / `person_phone` 解析终端关联人员
- 前端默认展示脱敏手机号，完整手机号需受权限控制
- 终端归属状态统一为：
  - `BOUND`：已关联人员
  - `PENDING_CLAIM`：已上报手机号但未匹配到人员档案
  - `ANONYMOUS`：未提供足够身份线索

当前主数据表：

- `person_profile`
- `person_phone`

入站 DTO 兼容以下身份字段：

- `personCode`
- `employeeNo`
- `externalPersonId`
- `phoneNumber`
- `imei`
- `meid`

## 7. 前端数据策略说明

综合 / 安全 / 业务 / 终端四类页面采用统一策略：

1. 综合 / 安全 / 业务页面默认按 integration 模式请求 `/api/situation/**`
2. 终端页面默认请求真实终端域接口 `/api/terminal/**`
3. 若后端未启动、代理不可达或返回结构异常，则自动回退到前端 mock
4. UI 通过来源标签与提示信息明确告知当前数据来源
