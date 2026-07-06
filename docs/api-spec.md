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

## 2. 运维入站接口

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

## 3. 运维查询接口

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

说明：

- 总览中的主机状态统计与 `/api/ops/hosts` 使用同一 freshness 规则，保证首屏卡片与主机列表一致

### `GET /api/ops/hosts`

查询参数：

- `keyword`
- `status`
- `page`
- `size`

说明：

- `status` 支持：`ONLINE` / `STALE` / `OFFLINE`
- 主机状态以最近 `lastObservedAt` freshness 动态计算，不依赖库中历史冗余状态字段直接回显

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
