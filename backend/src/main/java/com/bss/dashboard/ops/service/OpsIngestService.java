package com.bss.dashboard.ops.service;

import com.bss.dashboard.exception.ResourceNotFoundException;
import com.bss.dashboard.ops.config.OpsProperties;
import com.bss.dashboard.ops.domain.AlertSeverity;
import com.bss.dashboard.ops.domain.SourceType;
import com.bss.dashboard.ops.dto.OpsHostPayload;
import com.bss.dashboard.ops.dto.OpsIngestRequest;
import com.bss.dashboard.ops.dto.OpsIngestResultDto;
import com.bss.dashboard.ops.dto.OpsNetworkInterfacePayload;
import com.bss.dashboard.ops.dto.OpsProcessPayload;
import com.bss.dashboard.ops.dto.OpsSnapshotPayload;
import com.bss.dashboard.ops.repository.OpsRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@Profile("mysql")
public class OpsIngestService {

    private static final String UNKNOWN = "UNKNOWN";

    private final OpsRepository repository;
    private final OpsProperties properties;

    public OpsIngestService(OpsRepository repository, OpsProperties properties) {
        this.repository = repository;
        this.properties = properties;
    }

    @Transactional
    public OpsIngestResultDto ingestProbe(String agentKey, String timestampHeader, String signature, OpsIngestRequest request) {
        if (agentKey == null || agentKey.isBlank()) {
            throw new IllegalArgumentException("缺少 X-Agent-Key");
        }
        validateSourceType(SourceType.PROBE, request.sourceType());
        validateTimestamp(timestampHeader);

        String payloadJson = repository.toJson(request);
        verifySignature(properties.getProbe().getSharedSecret(), timestampHeader, payloadJson, signature);
        String sourceSystem = normalizeSourceSystem(request.sourceSystem(), "probe-agent");
        String secretHash = sha256(properties.getProbe().getSharedSecret());
        OpsRepository.SourceAgentRecord sourceAgent = repository.findSourceAgent(agentKey).orElse(null);
        if (sourceAgent == null) {
            if (properties.getProbe().isAutoRegister()) {
                repository.upsertSourceAgent(agentKey, SourceType.PROBE, sourceSystem, secretHash);
            }
        } else if (!sourceAgent.enabled()) {
            throw new IllegalArgumentException("probe agent 已被禁用");
        }
        repository.touchSourceAgent(agentKey);
        NormalizedIngestRequest normalized = normalizeRequest(SourceType.PROBE, sourceSystem, request);
        return ingestInternal(SourceType.PROBE, sourceSystem, normalized, payloadJson);
    }

    @Transactional
    public OpsIngestResultDto ingestExternal(String token, OpsIngestRequest request) {
        validateSourceType(SourceType.EXTERNAL_API, request.sourceType());
        requireToken(properties.getExternal().getIngestToken(), token, "external");
        String sourceSystem = normalizeSourceSystem(request.sourceSystem(), "external-api");
        String payloadJson = repository.toJson(request);
        NormalizedIngestRequest normalized = normalizeRequest(SourceType.EXTERNAL_API, sourceSystem, request);
        return ingestInternal(SourceType.EXTERNAL_API, sourceSystem, normalized, payloadJson);
    }

    @Transactional
    public OpsIngestResultDto ingestManual(String token, OpsIngestRequest request) {
        validateSourceType(SourceType.MANUAL_IMPORT, request.sourceType());
        requireToken(properties.getManual().getIngestToken(), token, "manual");
        String sourceSystem = normalizeSourceSystem(request.sourceSystem(), "manual-import");
        String payloadJson = repository.toJson(request);
        NormalizedIngestRequest normalized = normalizeRequest(SourceType.MANUAL_IMPORT, sourceSystem, request);
        return ingestInternal(SourceType.MANUAL_IMPORT, sourceSystem, normalized, payloadJson);
    }

    private OpsIngestResultDto ingestInternal(SourceType sourceType, String sourceSystem, NormalizedIngestRequest request, String payloadJson) {
        repository.insertIngestPayload(sourceType, sourceSystem, request.requestId(), payloadJson);
        try {
            double memoryUsagePct = request.host().memoryTotalBytes() <= 0
                    ? 0
                    : request.snapshot().memUsedBytes() * 100.0 / request.host().memoryTotalBytes();
            long hostId = repository.resolveOrCreateHost(new OpsRepository.ResolvedHostUpsert(
                    request.host().hostCode(),
                    request.host().hostname(),
                    request.host().displayName(),
                    request.host().primaryIp(),
                    request.host().osName(),
                    request.host().kernelVersion(),
                    request.host().arch(),
                    request.host().cpuCores(),
                    request.host().memoryTotalBytes(),
                    sourceType,
                    sourceSystem,
                    request.externalAssetId(),
                    request.observedAt()
            ));
            long snapshotId = repository.insertHostSnapshot(hostId, sourceType, sourceSystem, request.observedAt(), request.snapshot(), memoryUsagePct);
            repository.insertNetworkSnapshots(snapshotId, request.networkInterfaces());
            repository.insertProcessSnapshots(hostId, snapshotId, request.observedAt(), request.processes());
            evaluateAlerts(hostId, request.host().hostname(), request.snapshot().cpuUsagePct(), memoryUsagePct, request.snapshot().diskUsagePct());
            repository.insertIngestEvent(sourceType, sourceSystem, request.requestId(), request.observedAt(), "SUCCESS", null);
            return new OpsIngestResultDto(hostId, request.host().hostCode(), sourceSystem, sourceType.name(), "SUCCESS");
        } catch (RuntimeException exception) {
            repository.insertIngestEvent(sourceType, sourceSystem, request.requestId(), request.observedAt(), "FAILED", exception.getMessage());
            throw exception;
        }
    }

    private NormalizedIngestRequest normalizeRequest(SourceType sourceType, String sourceSystem, OpsIngestRequest request) {
        return sourceType == SourceType.PROBE
                ? normalizeProbeRequest(request)
                : normalizeFlexibleRequest(sourceSystem, request);
    }

    private NormalizedIngestRequest normalizeProbeRequest(OpsIngestRequest request) {
        requireNotBlank(request.observedAt(), "observedAt");
        OpsHostPayload host = requireProbeHost(request.host());
        OpsSnapshotPayload snapshot = requireProbeSnapshot(request.snapshot());
        return new NormalizedIngestRequest(
                normalizeRequestId(request.requestId()),
                normalizeExternalAssetId(request.externalAssetId(), Map.of()),
                parseObservedAt(request.observedAt()),
                host,
                snapshot,
                normalizeNetworkInterfaces(request.networkInterfaces()),
                normalizeProcesses(request.processes())
        );
    }

    private NormalizedIngestRequest normalizeFlexibleRequest(String sourceSystem, OpsIngestRequest request) {
        Map<String, String> labels = normalizeLabels(request.labels());
        Map<String, Object> attributes = normalizeObjects(request.attributes());
        Map<String, Object> metrics = normalizeObjects(request.metrics());
        Map<String, Object> extensions = normalizeObjects(request.extensions());
        String externalAssetId = normalizeExternalAssetId(request.externalAssetId(), attributes);
        LocalDateTime observedAt = resolveObservedAt(request.observedAt(), attributes, extensions);
        List<OpsProcessPayload> processes = normalizeProcesses(request.processes());
        OpsSnapshotPayload snapshot = normalizeSnapshot(request.snapshot(), metrics, processes.size());
        OpsHostPayload host = normalizeHost(sourceSystem, externalAssetId, request.host(), snapshot, labels, attributes, extensions);
        return new NormalizedIngestRequest(
                normalizeRequestId(request.requestId()),
                externalAssetId,
                observedAt,
                host,
                snapshot,
                normalizeNetworkInterfaces(request.networkInterfaces()),
                processes
        );
    }

    private OpsHostPayload requireProbeHost(OpsHostPayload host) {
        if (host == null) {
            throw new IllegalArgumentException("probe host 信息不能为空");
        }
        requireNotBlank(host.hostCode(), "host.hostCode");
        requireNotBlank(host.hostname(), "host.hostname");
        requireNotBlank(host.primaryIp(), "host.primaryIp");
        requireNotBlank(host.osName(), "host.osName");
        requireNotBlank(host.kernelVersion(), "host.kernelVersion");
        requireNotBlank(host.arch(), "host.arch");
        requireNotNull(host.cpuCores(), "host.cpuCores");
        requireNotNull(host.memoryTotalBytes(), "host.memoryTotalBytes");
        return host;
    }

    private OpsSnapshotPayload requireProbeSnapshot(OpsSnapshotPayload snapshot) {
        if (snapshot == null) {
            throw new IllegalArgumentException("probe snapshot 信息不能为空");
        }
        requireNotNull(snapshot.cpuUsagePct(), "snapshot.cpuUsagePct");
        requireNotNull(snapshot.load1(), "snapshot.load1");
        requireNotNull(snapshot.load5(), "snapshot.load5");
        requireNotNull(snapshot.load15(), "snapshot.load15");
        requireNotNull(snapshot.memUsedBytes(), "snapshot.memUsedBytes");
        requireNotNull(snapshot.memAvailableBytes(), "snapshot.memAvailableBytes");
        requireNotNull(snapshot.swapUsedBytes(), "snapshot.swapUsedBytes");
        requireNotNull(snapshot.diskUsedBytes(), "snapshot.diskUsedBytes");
        requireNotNull(snapshot.diskTotalBytes(), "snapshot.diskTotalBytes");
        requireNotNull(snapshot.diskUsagePct(), "snapshot.diskUsagePct");
        requireNotNull(snapshot.tcpEstablishedCount(), "snapshot.tcpEstablishedCount");
        requireNotNull(snapshot.processCount(), "snapshot.processCount");
        return snapshot;
    }

    private OpsHostPayload normalizeHost(String sourceSystem,
                                         String externalAssetId,
                                         OpsHostPayload host,
                                         OpsSnapshotPayload snapshot,
                                         Map<String, String> labels,
                                         Map<String, Object> attributes,
                                         Map<String, Object> extensions) {
        String hostname = firstText(
                host == null ? null : host.hostname(),
                stringValue(attributes, "hostname", "hostName"),
                stringValue(extensions, "hostname", "hostName"),
                host == null ? null : host.displayName(),
                stringValue(attributes, "displayName"),
                externalAssetId
        );
        String displayName = firstText(
                host == null ? null : host.displayName(),
                stringValue(attributes, "displayName"),
                stringValue(extensions, "displayName"),
                hostname
        );
        String primaryIp = firstText(
                host == null ? null : host.primaryIp(),
                stringValue(attributes, "primaryIp", "ip"),
                stringValue(extensions, "primaryIp", "ip"),
                labels.get("primaryIp"),
                "0.0.0.0"
        );
        String arch = firstText(
                host == null ? null : host.arch(),
                stringValue(attributes, "arch"),
                stringValue(extensions, "arch"),
                labels.get("arch"),
                UNKNOWN
        );
        String machineFingerprint = firstText(
                host == null ? null : host.machineFingerprint(),
                stringValue(attributes, "machineFingerprint"),
                stringValue(extensions, "machineFingerprint"),
                sha256(sourceSystem + "|" + firstText(externalAssetId, hostname, primaryIp, UNKNOWN))
        );
        String hostCode = firstText(
                host == null ? null : host.hostCode(),
                stringValue(attributes, "hostCode"),
                stringValue(extensions, "hostCode"),
                hasText(externalAssetId) ? buildExternalHostCode(sourceSystem, externalAssetId) : null,
                sha256(sourceSystem + "|" + hostname + "|" + primaryIp + "|" + arch + "|" + machineFingerprint)
        );
        long inferredMemoryTotal = inferMemoryTotalBytes(snapshot);
        Long attributeMemoryTotal = longValue(attributes.get("memoryTotalBytes"), attributes.get("memTotalBytes"));
        Long extensionMemoryTotal = longValue(extensions.get("memoryTotalBytes"), extensions.get("memTotalBytes"));
        Integer attributeCpuCores = intValue(attributes.get("cpuCores"), attributes.get("cores"));
        Integer extensionCpuCores = intValue(extensions.get("cpuCores"), extensions.get("cores"));
        return new OpsHostPayload(
                hostCode,
                firstText(hostname, hostCode),
                displayName,
                primaryIp,
                firstText(host == null ? null : host.osName(), stringValue(attributes, "osName", "os"), stringValue(extensions, "osName", "os"), labels.get("osName"), UNKNOWN),
                firstText(host == null ? null : host.kernelVersion(), stringValue(attributes, "kernelVersion"), stringValue(extensions, "kernelVersion"), labels.get("kernelVersion"), UNKNOWN),
                arch,
                firstInteger(host == null ? null : host.cpuCores(), attributeCpuCores, extensionCpuCores, 0),
                firstLong(host == null ? null : host.memoryTotalBytes(), attributeMemoryTotal, extensionMemoryTotal, inferredMemoryTotal, 0L),
                machineFingerprint
        );
    }

    private OpsSnapshotPayload normalizeSnapshot(OpsSnapshotPayload snapshot, Map<String, Object> metrics, int processCountFallback) {
        long memUsedBytes = firstLong(
                snapshot == null ? null : snapshot.memUsedBytes(),
                longValue(metrics.get("memUsedBytes"), metrics.get("memUsed"), metrics.get("memoryUsedBytes")),
                0L
        );
        long memAvailableBytes = firstLong(
                snapshot == null ? null : snapshot.memAvailableBytes(),
                longValue(metrics.get("memAvailableBytes"), metrics.get("memAvailable"), metrics.get("memoryAvailableBytes")),
                0L
        );
        long diskUsedBytes = firstLong(
                snapshot == null ? null : snapshot.diskUsedBytes(),
                longValue(metrics.get("diskUsedBytes"), metrics.get("diskUsed")),
                0L
        );
        long diskTotalBytes = firstLong(
                snapshot == null ? null : snapshot.diskTotalBytes(),
                longValue(metrics.get("diskTotalBytes"), metrics.get("diskTotal")),
                0L
        );
        double diskUsagePct = firstDouble(
                snapshot == null ? null : snapshot.diskUsagePct(),
                doubleValue(metrics.get("diskUsagePct"), metrics.get("diskUsage"), metrics.get("diskPct")),
                diskTotalBytes > 0 ? diskUsedBytes * 100.0 / diskTotalBytes : 0.0
        );
        return new OpsSnapshotPayload(
                firstDouble(snapshot == null ? null : snapshot.cpuUsagePct(), doubleValue(metrics.get("cpuUsagePct"), metrics.get("cpuUsage"), metrics.get("cpu")), 0.0),
                firstDouble(snapshot == null ? null : snapshot.load1(), doubleValue(metrics.get("load1")), 0.0),
                firstDouble(snapshot == null ? null : snapshot.load5(), doubleValue(metrics.get("load5")), 0.0),
                firstDouble(snapshot == null ? null : snapshot.load15(), doubleValue(metrics.get("load15")), 0.0),
                memUsedBytes,
                memAvailableBytes,
                firstLong(snapshot == null ? null : snapshot.swapUsedBytes(), longValue(metrics.get("swapUsedBytes"), metrics.get("swapUsed")), 0L),
                diskUsedBytes,
                diskTotalBytes,
                round(diskUsagePct),
                firstInteger(snapshot == null ? null : snapshot.tcpEstablishedCount(), intValue(metrics.get("tcpEstablishedCount"), metrics.get("tcpConnections")), 0),
                firstInteger(snapshot == null ? null : snapshot.processCount(), intValue(metrics.get("processCount"), metrics.get("processes")), processCountFallback)
        );
    }

    private List<OpsNetworkInterfacePayload> normalizeNetworkInterfaces(List<OpsNetworkInterfacePayload> interfaces) {
        if (interfaces == null || interfaces.isEmpty()) {
            return List.of();
        }
        List<OpsNetworkInterfacePayload> normalized = new ArrayList<>();
        for (OpsNetworkInterfacePayload item : interfaces) {
            if (item == null) {
                continue;
            }
            normalized.add(new OpsNetworkInterfacePayload(
                    firstText(item.interfaceName(), "unknown"),
                    firstLong(item.rxBytesPerSec(), 0L),
                    firstLong(item.txBytesPerSec(), 0L),
                    firstLong(item.rxPacketsPerSec(), 0L),
                    firstLong(item.txPacketsPerSec(), 0L)
            ));
        }
        return normalized;
    }

    private List<OpsProcessPayload> normalizeProcesses(List<OpsProcessPayload> processes) {
        if (processes == null || processes.isEmpty()) {
            return List.of();
        }
        List<OpsProcessPayload> normalized = new ArrayList<>();
        for (OpsProcessPayload item : processes) {
            if (item == null) {
                continue;
            }
            String commandLine = item.commandLine();
            normalized.add(new OpsProcessPayload(
                    firstInteger(item.pid(), -1),
                    firstText(item.processName(), fallbackProcessName(commandLine), "unknown"),
                    commandLine,
                    firstDouble(item.cpuUsagePct(), 0.0),
                    firstLong(item.memoryRssBytes(), 0L),
                    firstText(item.state(), UNKNOWN),
                    item.whitelisted()
            ));
        }
        return normalized;
    }

    private String fallbackProcessName(String commandLine) {
        if (!hasText(commandLine)) {
            return null;
        }
        String trimmed = commandLine.trim();
        int index = trimmed.indexOf(' ');
        return index > 0 ? trimmed.substring(0, index) : trimmed;
    }

    private long inferMemoryTotalBytes(OpsSnapshotPayload snapshot) {
        if (snapshot == null) {
            return 0L;
        }
        Long used = snapshot.memUsedBytes();
        Long available = snapshot.memAvailableBytes();
        if (used == null || available == null) {
            return 0L;
        }
        return Math.max(0L, used + available);
    }

    private String buildExternalHostCode(String sourceSystem, String externalAssetId) {
        return sha256(sourceSystem + "|" + externalAssetId);
    }

    private String normalizeExternalAssetId(String externalAssetId, Map<String, Object> attributes) {
        return firstText(externalAssetId, stringValue(attributes, "externalAssetId", "assetId"));
    }

    private LocalDateTime resolveObservedAt(String observedAt, Map<String, Object> attributes, Map<String, Object> extensions) {
        String resolved = firstText(observedAt, stringValue(attributes, "observedAt"), stringValue(extensions, "observedAt"));
        return hasText(resolved)
                ? parseObservedAt(resolved)
                : OffsetDateTime.now().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private String normalizeRequestId(String requestId) {
        return hasText(requestId) ? requestId.trim() : UUID.randomUUID().toString();
    }

    private void evaluateAlerts(long hostId, String hostname, double cpuUsagePct, double memoryUsagePct, double diskUsagePct) {
        if (cpuUsagePct > 85) {
            repository.openOrRefreshAlert(hostId, "HIGH_CPU", AlertSeverity.CRITICAL, "CPU 利用率过高", hostname + " CPU 使用率已达到 " + round(cpuUsagePct) + "%");
        } else {
            repository.resolveAlert(hostId, "HIGH_CPU");
        }
        if (memoryUsagePct > 90) {
            repository.openOrRefreshAlert(hostId, "HIGH_MEMORY", AlertSeverity.CRITICAL, "内存利用率过高", hostname + " 内存使用率已达到 " + round(memoryUsagePct) + "%");
        } else {
            repository.resolveAlert(hostId, "HIGH_MEMORY");
        }
        if (diskUsagePct > 85) {
            repository.openOrRefreshAlert(hostId, "HIGH_DISK", AlertSeverity.WARNING, "磁盘利用率过高", hostname + " 磁盘使用率已达到 " + round(diskUsagePct) + "%");
        } else {
            repository.resolveAlert(hostId, "HIGH_DISK");
        }
    }

    private void requireToken(String expected, String actual, String scope) {
        if (expected == null || expected.isBlank()) {
            throw new ResourceNotFoundException(scope + " ingest token 未配置");
        }
        if (!expected.equals(actual)) {
            throw new IllegalArgumentException(scope + " token 校验失败");
        }
    }

    private void validateSourceType(SourceType expected, SourceType actual) {
        if (actual == null) {
            return;
        }
        if (actual != expected) {
            throw new IllegalArgumentException("sourceType 与当前 ingest 端点不匹配，应为 " + expected.name());
        }
    }

    private LocalDateTime parseObservedAt(String value) {
        return OffsetDateTime.parse(value).toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private void validateTimestamp(String timestampHeader) {
        OffsetDateTime timestamp = OffsetDateTime.parse(timestampHeader);
        long diffSeconds = Math.abs(Duration.between(timestamp, OffsetDateTime.now()).getSeconds());
        if (diffSeconds > 300) {
            throw new IllegalArgumentException("签名时间戳已过期");
        }
    }

    private void verifySignature(String secret, String timestamp, String payloadJson, String signature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String content = timestamp + "\n" + payloadJson;
            String expected = HexFormat.of().formatHex(mac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
            if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), normalizeSignature(signature).getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException("probe 签名校验失败");
            }
        } catch (IllegalArgumentException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("probe 签名校验异常", exception);
        }
    }

    private String normalizeSignature(String signature) {
        if (signature == null || signature.isBlank()) {
            throw new IllegalArgumentException("缺少 X-Signature");
        }
        return signature.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeSourceSystem(String sourceSystem, String fallback) {
        return sourceSystem == null || sourceSystem.isBlank() ? fallback : sourceSystem.trim();
    }

    private Map<String, String> normalizeLabels(Map<String, String> labels) {
        return labels == null ? Map.of() : labels;
    }

    private Map<String, Object> normalizeObjects(Map<String, Object> source) {
        return source == null ? Map.of() : new HashMap<>(source);
    }

    private void requireNotBlank(String value, String fieldName) {
        if (!hasText(value)) {
            throw new IllegalArgumentException(fieldName + " 不能为空");
        }
    }

    private void requireNotNull(Object value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException(fieldName + " 不能为空");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private Integer firstInteger(Integer... values) {
        for (Integer value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private Long firstLong(Long... values) {
        for (Long value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private Double firstDouble(Double... values) {
        for (Double value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private String stringValue(Map<String, Object> source, String... keys) {
        if (source == null || source.isEmpty()) {
            return null;
        }
        for (String key : keys) {
            Object value = source.get(key);
            if (value instanceof CharSequence sequence && hasText(sequence.toString())) {
                return sequence.toString().trim();
            }
        }
        return null;
    }

    private Integer intValue(Object... values) {
        for (Object value : values) {
            Number number = numberValue(value);
            if (number != null) {
                return number.intValue();
            }
        }
        return null;
    }

    private Long longValue(Object... values) {
        for (Object value : values) {
            Number number = numberValue(value);
            if (number != null) {
                return number.longValue();
            }
        }
        return null;
    }

    private Double doubleValue(Object... values) {
        for (Object value : values) {
            Number number = numberValue(value);
            if (number != null) {
                return number.doubleValue();
            }
        }
        return null;
    }

    private Number numberValue(Object value) {
        if (value instanceof Number number) {
            return number;
        }
        if (value instanceof CharSequence sequence && hasText(sequence.toString())) {
            String text = sequence.toString().trim();
            try {
                return text.contains(".") ? Double.parseDouble(text) : Long.parseLong(text);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("计算 secret hash 失败", exception);
        }
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private record NormalizedIngestRequest(
            String requestId,
            String externalAssetId,
            LocalDateTime observedAt,
            OpsHostPayload host,
            OpsSnapshotPayload snapshot,
            List<OpsNetworkInterfacePayload> networkInterfaces,
            List<OpsProcessPayload> processes
    ) {
    }
}
