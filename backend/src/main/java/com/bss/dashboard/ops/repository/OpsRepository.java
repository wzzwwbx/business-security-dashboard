package com.bss.dashboard.ops.repository;

import com.bss.dashboard.exception.ResourceNotFoundException;
import com.bss.dashboard.ops.domain.AlertSeverity;
import com.bss.dashboard.ops.domain.AlertStatus;
import com.bss.dashboard.ops.domain.SourceType;
import com.bss.dashboard.ops.dto.*;
import com.bss.dashboard.ops.support.OpsTimeFormats;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

@Repository
@Profile("mysql")
public class OpsRepository {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public OpsRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public Optional<SourceAgentRecord> findSourceAgent(String agentKey) {
        List<SourceAgentRecord> rows = jdbcTemplate.query(
                """
                SELECT id, agent_key, source_type, source_system, secret_hash, enabled, last_seen_at
                FROM ops_source_agent
                WHERE agent_key = ?
                """,
                sourceAgentMapper(),
                agentKey
        );
        return rows.stream().findFirst();
    }

    public void upsertSourceAgent(String agentKey, SourceType sourceType, String sourceSystem, String secretHash) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM ops_source_agent WHERE agent_key = ?",
                Integer.class,
                agentKey
        );
        if (count != null && count > 0) {
            jdbcTemplate.update(
                    """
                    UPDATE ops_source_agent
                    SET source_type = ?, source_system = ?, secret_hash = ?, enabled = 1, last_seen_at = CURRENT_TIMESTAMP
                    WHERE agent_key = ?
                    """,
                    sourceType.name(),
                    sourceSystem,
                    secretHash,
                    agentKey
            );
            return;
        }

        jdbcTemplate.update(
                """
                INSERT INTO ops_source_agent (agent_key, source_type, source_system, secret_hash, enabled, last_seen_at)
                VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
                """,
                agentKey,
                sourceType.name(),
                sourceSystem,
                secretHash
        );
    }

    public void touchSourceAgent(String agentKey) {
        jdbcTemplate.update("UPDATE ops_source_agent SET last_seen_at = CURRENT_TIMESTAMP WHERE agent_key = ?", agentKey);
    }

    @Transactional
    public long resolveOrCreateHost(ResolvedHostUpsert upsert) {
        Long hostId = null;
        if (hasText(upsert.sourceSystem()) && hasText(upsert.externalAssetId())) {
            List<Long> bindingMatches = jdbcTemplate.query(
                    """
                    SELECT host_id
                    FROM ops_host_binding
                    WHERE source_system = ? AND external_asset_id = ?
                    LIMIT 1
                    """,
                    (rs, rowNum) -> rs.getLong(1),
                    upsert.sourceSystem(),
                    upsert.externalAssetId()
            );
            if (!bindingMatches.isEmpty()) {
                hostId = bindingMatches.get(0);
            }
        }

        if (hostId == null && hasText(upsert.hostCode())) {
            List<Long> hostMatches = jdbcTemplate.query(
                    "SELECT id FROM ops_host WHERE host_code = ? LIMIT 1",
                    (rs, rowNum) -> rs.getLong(1),
                    upsert.hostCode()
            );
            if (!hostMatches.isEmpty()) {
                hostId = hostMatches.get(0);
            }
        }

        if (hostId == null) {
            jdbcTemplate.update(
                    """
                    INSERT INTO ops_host (
                      host_code, hostname, display_name, primary_ip, os_name, kernel_version, arch,
                      cpu_cores, memory_total_bytes, status, last_observed_at, last_source_type, last_source_system
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ONLINE', ?, ?, ?)
                    """,
                    upsert.hostCode(),
                    upsert.hostname(),
                    upsert.displayName(),
                    upsert.primaryIp(),
                    upsert.osName(),
                    upsert.kernelVersion(),
                    upsert.arch(),
                    upsert.cpuCores(),
                    upsert.memoryTotalBytes(),
                    Timestamp.valueOf(upsert.observedAt()),
                    upsert.sourceType().name(),
                    upsert.sourceSystem()
            );
            hostId = jdbcTemplate.queryForObject("SELECT id FROM ops_host WHERE host_code = ?", Long.class, upsert.hostCode());
        } else {
            jdbcTemplate.update(
                    """
                    UPDATE ops_host
                    SET hostname = ?, display_name = ?, primary_ip = ?, os_name = ?, kernel_version = ?, arch = ?,
                        cpu_cores = ?, memory_total_bytes = ?, status = 'ONLINE', last_observed_at = ?,
                        last_source_type = ?, last_source_system = ?
                    WHERE id = ?
                    """,
                    upsert.hostname(),
                    upsert.displayName(),
                    upsert.primaryIp(),
                    upsert.osName(),
                    upsert.kernelVersion(),
                    upsert.arch(),
                    upsert.cpuCores(),
                    upsert.memoryTotalBytes(),
                    Timestamp.valueOf(upsert.observedAt()),
                    upsert.sourceType().name(),
                    upsert.sourceSystem(),
                    hostId
            );
        }

        if (hasText(upsert.externalAssetId())) {
            upsertHostBinding(hostId, upsert.sourceSystem(), upsert.externalAssetId(), upsert.hostname());
        }

        return hostId;
    }

    public void upsertHostBinding(long hostId, String sourceSystem, String externalAssetId, String externalHostName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM ops_host_binding WHERE source_system = ? AND external_asset_id = ?",
                Integer.class,
                sourceSystem,
                externalAssetId
        );
        if (count != null && count > 0) {
            jdbcTemplate.update(
                    """
                    UPDATE ops_host_binding
                    SET host_id = ?, external_host_name = ?, binding_status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
                    WHERE source_system = ? AND external_asset_id = ?
                    """,
                    hostId,
                    externalHostName,
                    sourceSystem,
                    externalAssetId
            );
            return;
        }

        jdbcTemplate.update(
                """
                INSERT INTO ops_host_binding (host_id, source_system, external_asset_id, external_host_name, binding_status)
                VALUES (?, ?, ?, ?, 'ACTIVE')
                """,
                hostId,
                sourceSystem,
                externalAssetId,
                externalHostName
        );
    }

    public long insertHostSnapshot(long hostId, SourceType sourceType, String sourceSystem, LocalDateTime observedAt,
                                   OpsSnapshotPayload snapshot, double memoryUsagePct) {
        jdbcTemplate.update(
                """
                INSERT INTO ops_host_snapshot (
                    host_id, source_type, source_system, observed_at, cpu_usage_pct, memory_usage_pct,
                    load1, load5, load15, mem_used_bytes, mem_available_bytes, swap_used_bytes,
                    disk_used_bytes, disk_total_bytes, disk_usage_pct, tcp_established_count, process_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                hostId,
                sourceType.name(),
                sourceSystem,
                Timestamp.valueOf(observedAt),
                snapshot.cpuUsagePct(),
                memoryUsagePct,
                snapshot.load1(),
                snapshot.load5(),
                snapshot.load15(),
                snapshot.memUsedBytes(),
                snapshot.memAvailableBytes(),
                snapshot.swapUsedBytes(),
                snapshot.diskUsedBytes(),
                snapshot.diskTotalBytes(),
                snapshot.diskUsagePct(),
                snapshot.tcpEstablishedCount(),
                snapshot.processCount()
        );
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    public void insertNetworkSnapshots(long snapshotId, List<OpsNetworkInterfacePayload> interfaces) {
        if (interfaces == null || interfaces.isEmpty()) {
            return;
        }
        for (OpsNetworkInterfacePayload item : interfaces) {
            jdbcTemplate.update(
                    """
                    INSERT INTO ops_netif_snapshot (
                        host_snapshot_id, interface_name, rx_bytes_per_sec, tx_bytes_per_sec, rx_packets_per_sec, tx_packets_per_sec
                    ) VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    snapshotId,
                    item.interfaceName(),
                    item.rxBytesPerSec(),
                    item.txBytesPerSec(),
                    item.rxPacketsPerSec(),
                    item.txPacketsPerSec()
            );
        }
    }

    public void insertProcessSnapshots(long hostId, long snapshotId, LocalDateTime observedAt, List<OpsProcessPayload> processes) {
        if (processes == null || processes.isEmpty()) {
            return;
        }
        for (OpsProcessPayload item : processes) {
            jdbcTemplate.update(
                    """
                    INSERT INTO ops_process_snapshot (
                        host_id, host_snapshot_id, observed_at, pid, process_name, command_line,
                        cpu_usage_pct, memory_rss_bytes, state, is_whitelisted
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    hostId,
                    snapshotId,
                    Timestamp.valueOf(observedAt),
                    item.pid(),
                    item.processName(),
                    item.commandLine(),
                    item.cpuUsagePct(),
                    item.memoryRssBytes(),
                    item.state(),
                    item.whitelisted()
            );
        }
    }

    public void insertIngestEvent(SourceType sourceType, String sourceSystem, String requestId,
                                  LocalDateTime observedAt, String ingestStatus, String errorMessage) {
        jdbcTemplate.update(
                """
                INSERT INTO ops_ingest_event (source_type, source_system, request_id, observed_at, ingest_status, error_message)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                sourceType.name(),
                sourceSystem,
                requestId,
                Timestamp.valueOf(observedAt),
                ingestStatus,
                errorMessage
        );
    }

    public void insertIngestPayload(SourceType sourceType, String sourceSystem, String requestId, String payloadJson) {
        jdbcTemplate.update(
                """
                INSERT INTO ops_ingest_payload (source_type, source_system, request_id, payload_json)
                VALUES (?, ?, ?, ?)
                """,
                sourceType.name(),
                sourceSystem,
                requestId,
                payloadJson
        );
    }

    public String toJson(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("序列化接入报文失败", exception);
        }
    }

    public void openOrRefreshAlert(long hostId, String alertType, AlertSeverity severity, String title, String detail) {
        List<Long> openAlertIds = jdbcTemplate.query(
                "SELECT id FROM ops_alert WHERE host_id = ? AND alert_type = ? AND status = 'OPEN' LIMIT 1",
                (rs, rowNum) -> rs.getLong(1),
                hostId,
                alertType
        );
        if (!openAlertIds.isEmpty()) {
            jdbcTemplate.update(
                    "UPDATE ops_alert SET last_seen_at = CURRENT_TIMESTAMP, detail = ?, severity = ? WHERE id = ?",
                    detail,
                    severity.name(),
                    openAlertIds.get(0)
            );
            return;
        }
        jdbcTemplate.update(
                """
                INSERT INTO ops_alert (host_id, alert_type, severity, status, title, detail, first_seen_at, last_seen_at)
                VALUES (?, ?, ?, 'OPEN', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                hostId,
                alertType,
                severity.name(),
                title,
                detail
        );
    }

    public void resolveAlert(long hostId, String alertType) {
        jdbcTemplate.update(
                """
                UPDATE ops_alert
                SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP
                WHERE host_id = ? AND alert_type = ? AND status = 'OPEN'
                """,
                hostId,
                alertType
        );
    }

    public OpsOverviewDto getOverview(String generatedAt) {
        List<OpsHostSummaryDto> hosts = listHosts(null, null, 1, 200).items();
        int online = 0;
        int stale = 0;
        int offline = 0;
        int openAlerts = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM ops_alert WHERE status = 'OPEN'", Integer.class);
        double cpuSum = 0;
        double memorySum = 0;
        int count = 0;
        for (OpsHostSummaryDto host : hosts) {
            switch (host.status()) {
                case "ONLINE" -> online++;
                case "STALE" -> stale++;
                default -> offline++;
            }
            cpuSum += host.cpuUsagePct();
            memorySum += host.memoryUsagePct();
            count++;
        }
        Integer sourceCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT CONCAT(source_type, ':', source_system)) FROM ops_ingest_event",
                Integer.class
        );
        return new OpsOverviewDto(
                generatedAt,
                online,
                stale,
                offline,
                openAlerts,
                sourceCount == null ? 0 : sourceCount,
                count == 0 ? 0 : round(cpuSum / count),
                count == 0 ? 0 : round(memorySum / count)
        );
    }

    public OpsHostListDto listHosts(String keyword, String status, int page, int size) {
        String latestSnapshotSql = """
                SELECT h.id, h.host_code, h.hostname, h.display_name, h.primary_ip, h.status,
                       h.last_source_type, h.last_source_system, h.last_observed_at,
                       COALESCE(s.cpu_usage_pct, 0) AS cpu_usage_pct,
                       COALESCE(s.memory_usage_pct, 0) AS memory_usage_pct,
                       COALESCE(s.load1, 0) AS load1,
                       COALESCE(s.disk_usage_pct, 0) AS disk_usage_pct,
                       COALESCE((SELECT COUNT(1) FROM ops_alert a WHERE a.host_id = h.id AND a.status = 'OPEN'), 0) AS open_alert_count
                FROM ops_host h
                LEFT JOIN ops_host_snapshot s ON s.id = (
                  SELECT s2.id FROM ops_host_snapshot s2 WHERE s2.host_id = h.id ORDER BY s2.observed_at DESC, s2.id DESC LIMIT 1
                )
                WHERE (? IS NULL OR h.hostname LIKE ? OR h.primary_ip LIKE ? OR h.host_code LIKE ?)
                ORDER BY h.last_observed_at DESC, h.id DESC
                """;

        String fuzzy = hasText(keyword) ? "%" + keyword.trim() + "%" : null;
        List<OpsHostSummaryDto> rows = jdbcTemplate.query(
                latestSnapshotSql,
                (rs, rowNum) -> new OpsHostSummaryDto(
                        rs.getLong("id"),
                        rs.getString("host_code"),
                        rs.getString("hostname"),
                        rs.getString("display_name"),
                        rs.getString("primary_ip"),
                        rs.getString("status"),
                        rs.getString("last_source_type"),
                        rs.getString("last_source_system"),
                        round(rs.getDouble("cpu_usage_pct")),
                        round(rs.getDouble("memory_usage_pct")),
                        round(rs.getDouble("load1")),
                        round(rs.getDouble("disk_usage_pct")),
                        rs.getInt("open_alert_count"),
                        format(rs.getTimestamp("last_observed_at"))
                ),
                fuzzy,
                fuzzy,
                fuzzy,
                fuzzy
        );

        List<OpsHostSummaryDto> filtered = rows.stream()
                .filter(item -> !hasText(status) || Objects.equals(item.status(), status.toUpperCase(Locale.ROOT)))
                .toList();
        int from = Math.max(0, (page - 1) * size);
        int to = Math.min(filtered.size(), from + size);
        List<OpsHostSummaryDto> paged = from >= filtered.size() ? List.of() : filtered.subList(from, to);
        return new OpsHostListDto(paged, page, size, filtered.size());
    }

    public OpsHostDetailDto getHostDetail(long hostId) {
        List<OpsHostDetailDto> rows = jdbcTemplate.query(
                """
                SELECT h.id, h.host_code, h.hostname, h.display_name, h.primary_ip, h.status, h.last_source_type,
                       h.last_source_system, h.os_name, h.kernel_version, h.arch, h.cpu_cores, h.memory_total_bytes,
                       h.last_observed_at,
                       COALESCE(s.cpu_usage_pct, 0) AS cpu_usage_pct,
                       COALESCE(s.memory_usage_pct, 0) AS memory_usage_pct,
                       COALESCE(s.load1, 0) AS load1,
                       COALESCE(s.load5, 0) AS load5,
                       COALESCE(s.load15, 0) AS load15,
                       COALESCE(s.mem_used_bytes, 0) AS mem_used_bytes,
                       COALESCE(s.mem_available_bytes, 0) AS mem_available_bytes,
                       COALESCE(s.swap_used_bytes, 0) AS swap_used_bytes,
                       COALESCE(s.disk_used_bytes, 0) AS disk_used_bytes,
                       COALESCE(s.disk_total_bytes, 0) AS disk_total_bytes,
                       COALESCE(s.disk_usage_pct, 0) AS disk_usage_pct,
                       COALESCE(s.tcp_established_count, 0) AS tcp_established_count,
                       COALESCE(s.process_count, 0) AS process_count
                FROM ops_host h
                LEFT JOIN ops_host_snapshot s ON s.id = (
                  SELECT s2.id FROM ops_host_snapshot s2 WHERE s2.host_id = h.id ORDER BY s2.observed_at DESC, s2.id DESC LIMIT 1
                )
                WHERE h.id = ?
                """,
                (rs, rowNum) -> new OpsHostDetailDto(
                        rs.getLong("id"),
                        rs.getString("host_code"),
                        rs.getString("hostname"),
                        rs.getString("display_name"),
                        rs.getString("primary_ip"),
                        rs.getString("status"),
                        rs.getString("last_source_type"),
                        rs.getString("last_source_system"),
                        rs.getString("os_name"),
                        rs.getString("kernel_version"),
                        rs.getString("arch"),
                        rs.getInt("cpu_cores"),
                        rs.getLong("memory_total_bytes"),
                        format(rs.getTimestamp("last_observed_at")),
                        new OpsHostDetailDto.OpsLatestSnapshotDto(
                                round(rs.getDouble("cpu_usage_pct")),
                                round(rs.getDouble("memory_usage_pct")),
                                round(rs.getDouble("load1")),
                                round(rs.getDouble("load5")),
                                round(rs.getDouble("load15")),
                                rs.getLong("mem_used_bytes"),
                                rs.getLong("mem_available_bytes"),
                                rs.getLong("swap_used_bytes"),
                                rs.getLong("disk_used_bytes"),
                                rs.getLong("disk_total_bytes"),
                                round(rs.getDouble("disk_usage_pct")),
                                rs.getInt("tcp_established_count"),
                                rs.getInt("process_count")
                        ),
                        listBindings(hostId)
                ),
                hostId
        );
        return rows.stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("未找到主机：" + hostId));
    }

    public List<OpsHostBindingDto> listBindings(long hostId) {
        return jdbcTemplate.query(
                "SELECT source_system, external_asset_id, external_host_name, binding_status FROM ops_host_binding WHERE host_id = ? ORDER BY id DESC",
                (rs, rowNum) -> new OpsHostBindingDto(
                        rs.getString("source_system"),
                        rs.getString("external_asset_id"),
                        rs.getString("external_host_name"),
                        rs.getString("binding_status")
                ),
                hostId
        );
    }

    public List<OpsTimeseriesPointDto> listTimeseries(long hostId, LocalDateTime since) {
        List<SnapshotPoint> snapshots = jdbcTemplate.query(
                """
                SELECT id, observed_at, cpu_usage_pct, memory_usage_pct, disk_usage_pct, load1
                FROM ops_host_snapshot
                WHERE host_id = ? AND observed_at >= ?
                ORDER BY observed_at ASC, id ASC
                """,
                (rs, rowNum) -> new SnapshotPoint(
                        rs.getLong("id"),
                        rs.getTimestamp("observed_at").toLocalDateTime(),
                        rs.getDouble("cpu_usage_pct"),
                        rs.getDouble("memory_usage_pct"),
                        rs.getDouble("disk_usage_pct"),
                        rs.getDouble("load1")
                ),
                hostId,
                Timestamp.valueOf(since)
        );
        List<OpsTimeseriesPointDto> points = new ArrayList<>();
        for (SnapshotPoint snapshot : snapshots) {
            NetifAggregate aggregate = jdbcTemplate.queryForObject(
                    """
                    SELECT COALESCE(SUM(rx_bytes_per_sec), 0) AS rx_total, COALESCE(SUM(tx_bytes_per_sec), 0) AS tx_total
                    FROM ops_netif_snapshot
                    WHERE host_snapshot_id = ?
                    """,
                    (rs, rowNum) -> new NetifAggregate(rs.getLong("rx_total"), rs.getLong("tx_total")),
                    snapshot.id()
            );
            points.add(new OpsTimeseriesPointDto(
                    OpsTimeFormats.format(snapshot.observedAt()),
                    round(snapshot.cpuUsagePct()),
                    round(snapshot.memoryUsagePct()),
                    round(snapshot.diskUsagePct()),
                    round(snapshot.load1()),
                    aggregate == null ? 0 : aggregate.rxBytesPerSec(),
                    aggregate == null ? 0 : aggregate.txBytesPerSec()
            ));
        }
        return points;
    }

    public List<OpsProcessDto> listProcesses(long hostId) {
        return jdbcTemplate.query(
                """
                SELECT pid, process_name, command_line, cpu_usage_pct, memory_rss_bytes, state, is_whitelisted, observed_at
                FROM ops_process_snapshot
                WHERE host_id = ?
                ORDER BY is_whitelisted DESC, cpu_usage_pct DESC, memory_rss_bytes DESC
                LIMIT 20
                """,
                (rs, rowNum) -> new OpsProcessDto(
                        rs.getInt("pid"),
                        rs.getString("process_name"),
                        rs.getString("command_line"),
                        round(rs.getDouble("cpu_usage_pct")),
                        rs.getLong("memory_rss_bytes"),
                        rs.getString("state"),
                        rs.getBoolean("is_whitelisted"),
                        format(rs.getTimestamp("observed_at"))
                ),
                hostId
        );
    }

    public List<OpsAlertDto> listAlerts(Long hostId, int limit) {
        String sql = """
                SELECT a.id, a.host_id, h.hostname, h.primary_ip, a.alert_type, a.severity, a.status,
                       a.title, a.detail, a.first_seen_at, a.last_seen_at, a.resolved_at
                FROM ops_alert a
                JOIN ops_host h ON h.id = a.host_id
                WHERE (? IS NULL OR a.host_id = ?)
                ORDER BY CASE WHEN a.status = 'OPEN' THEN 0 ELSE 1 END, a.last_seen_at DESC, a.id DESC
                LIMIT ?
                """;
        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new OpsAlertDto(
                        rs.getLong("id"),
                        rs.getLong("host_id"),
                        rs.getString("hostname"),
                        rs.getString("primary_ip"),
                        rs.getString("alert_type"),
                        rs.getString("severity"),
                        rs.getString("status"),
                        rs.getString("title"),
                        rs.getString("detail"),
                        format(rs.getTimestamp("first_seen_at")),
                        format(rs.getTimestamp("last_seen_at")),
                        format(rs.getTimestamp("resolved_at"))
                ),
                hostId,
                hostId,
                limit
        );
    }

    public List<OpsSourceDto> listSources() {
        return jdbcTemplate.query(
                """
                SELECT se.source_type, se.source_system,
                       MAX(se.observed_at) AS last_seen_at,
                       SUM(CASE WHEN se.ingest_status = 'SUCCESS' THEN 1 ELSE 0 END) AS success_count,
                       COALESCE((SELECT COUNT(1) FROM ops_host h WHERE h.last_source_type = se.source_type AND h.last_source_system = se.source_system), 0) AS host_count,
                       COALESCE((SELECT MAX(sa.enabled) FROM ops_source_agent sa WHERE sa.source_type = se.source_type AND sa.source_system = se.source_system), 1) AS enabled
                FROM ops_ingest_event se
                GROUP BY se.source_type, se.source_system
                ORDER BY last_seen_at DESC
                """,
                (rs, rowNum) -> new OpsSourceDto(
                        rs.getString("source_type"),
                        rs.getString("source_system"),
                        rs.getInt("enabled") > 0,
                        rs.getTimestamp("last_seen_at") == null ? "UNKNOWN" : "HEALTHY",
                        rs.getInt("host_count"),
                        format(rs.getTimestamp("last_seen_at"))
                )
        );
    }

    public void deleteExpiredSnapshots(long snapshotRetentionDays) {
        jdbcTemplate.update("DELETE FROM ops_netif_snapshot WHERE host_snapshot_id IN (SELECT id FROM ops_host_snapshot WHERE observed_at < DATE_SUB(NOW(), INTERVAL ? DAY))", snapshotRetentionDays);
        jdbcTemplate.update("DELETE FROM ops_host_snapshot WHERE observed_at < DATE_SUB(NOW(), INTERVAL ? DAY)", snapshotRetentionDays);
    }

    public void deleteExpiredProcesses(long processRetentionDays) {
        jdbcTemplate.update("DELETE FROM ops_process_snapshot WHERE observed_at < DATE_SUB(NOW(), INTERVAL ? DAY)", processRetentionDays);
    }

    public void deleteExpiredPayloads(long payloadRetentionDays) {
        jdbcTemplate.update("DELETE FROM ops_ingest_payload WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)", payloadRetentionDays);
    }

    private RowMapper<SourceAgentRecord> sourceAgentMapper() {
        return (rs, rowNum) -> new SourceAgentRecord(
                rs.getLong("id"),
                rs.getString("agent_key"),
                SourceType.valueOf(rs.getString("source_type")),
                rs.getString("source_system"),
                rs.getString("secret_hash"),
                rs.getBoolean("enabled"),
                rs.getTimestamp("last_seen_at") == null ? null : rs.getTimestamp("last_seen_at").toLocalDateTime()
        );
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String format(Timestamp timestamp) {
        return OpsTimeFormats.format(timestamp);
    }

    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public record SourceAgentRecord(long id, String agentKey, SourceType sourceType, String sourceSystem,
                                    String secretHash, boolean enabled, LocalDateTime lastSeenAt) {
    }

    public record ResolvedHostUpsert(String hostCode, String hostname, String displayName, String primaryIp,
                                     String osName, String kernelVersion, String arch, int cpuCores,
                                     long memoryTotalBytes, SourceType sourceType, String sourceSystem,
                                     String externalAssetId, LocalDateTime observedAt) {
    }

    private record SnapshotPoint(long id, LocalDateTime observedAt, double cpuUsagePct,
                                 double memoryUsagePct, double diskUsagePct, double load1) {
    }

    private record NetifAggregate(long rxBytesPerSec, long txBytesPerSec) {
    }
}
