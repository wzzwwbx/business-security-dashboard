# Linux ARM Java Probe

该模块是业务安全态势系统的 **独立探针工程**，负责在 Linux ARM64 / aarch64 服务器上周期性采集运行状态，并通过 `/api/ops/ingest/probe` 上报到后端统一运维态势域。

## 目标能力

- 纯 Java 为主，尽量直接读取 Linux `/proc` 与标准文件接口
- 60 秒周期采集，可通过配置调整
- 采集 CPU / 内存 / Swap / Load / 根文件系统磁盘 / TCP / 网卡 / 进程
- 进程维度输出 **TopN + 白名单**
- 使用 `X-Agent-Key + X-Timestamp + X-Signature` 做 HMAC-SHA256 鉴权
- 后端不可达时写入本地 spool，恢复后自动补报

## 采集来源

- CPU：`/proc/stat`
- 内存 / Swap：`/proc/meminfo`
- Load：`/proc/loadavg`
- 网络吞吐：`/proc/net/dev`
- TCP 连接：`/proc/net/tcp`、`/proc/net/tcp6`
- 进程：`/proc/[pid]/stat`、`/proc/[pid]/status`、`/proc/[pid]/cmdline`
- 磁盘容量：Java `FileStore`（默认统计 `/` 根文件系统）

## 配置说明

示例配置位于：
- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe/src/main/resources/application.yml`

关键项：

```yaml
probe:
  server-url: http://127.0.0.1:8080/api/ops/ingest/probe
  source-system: linux-arm-probe
  agent-key: probe-dev-agent
  agent-secret: dev-probe-secret
  request-timeout-ms: 10000
  schedule:
    fixed-delay-ms: 60000
  spool-dir: ./data/spool
  spool-max-size-mb: 200
  process-top-n: 10
  whitelist-processes:
    - java
    - nginx
    - redis-server
    - mysqld
```

## 打包与运行

当前工程基于 **Java 17 + Spring Boot 3**。

如本机具备 Maven：

```bash
cd /Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe
mvn -DskipTests package
java -jar target/business-security-probe-0.1.0.jar
```

## 部署建议

建议以 `systemd` 方式部署，示例文件见：
- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/probe/deploy/business-security-probe.service`

推荐部署目录：

```text
/opt/business-security-probe/
├── business-security-probe.jar
├── application.yml
└── data/spool/
```

启动步骤：

```bash
sudo mkdir -p /opt/business-security-probe/data/spool
sudo cp target/business-security-probe-0.1.0.jar /opt/business-security-probe/business-security-probe.jar
sudo cp src/main/resources/application.yml /opt/business-security-probe/application.yml
sudo cp deploy/business-security-probe.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now business-security-probe
sudo systemctl status business-security-probe
```

## 与后端对接约定

后端接口：
- `POST /api/ops/ingest/probe`

请求头：
- `X-Agent-Key`
- `X-Timestamp`
- `X-Signature`

请求体：
- `sourceType=PROBE`
- `sourceSystem`
- `observedAt`
- `host`
- `snapshot`
- `networkInterfaces`
- `processes`

## 当前限制

- 首期目标平台：Linux ARM64 / aarch64
- 文件系统磁盘统计默认只取根挂载点 `/`
- 进程 CPU 为相邻采样间隔的 delta 估算值
- 目前未接入 TLS 双向认证、证书轮换与远程配置中心
