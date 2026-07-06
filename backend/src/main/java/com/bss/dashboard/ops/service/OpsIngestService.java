package com.bss.dashboard.ops.service;

import com.bss.dashboard.exception.ResourceNotFoundException;
import com.bss.dashboard.ops.config.OpsProperties;
import com.bss.dashboard.ops.domain.AlertSeverity;
import com.bss.dashboard.ops.domain.SourceType;
import com.bss.dashboard.ops.dto.OpsIngestRequest;
import com.bss.dashboard.ops.dto.OpsIngestResultDto;
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
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
@Profile("mysql")
public class OpsIngestService {

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
        return ingestInternal(SourceType.PROBE, sourceSystem, request, payloadJson);
    }

    @Transactional
    public OpsIngestResultDto ingestExternal(String token, OpsIngestRequest request) {
        validateSourceType(SourceType.EXTERNAL_API, request.sourceType());
        requireToken(properties.getExternal().getIngestToken(), token, "external");
        String payloadJson = repository.toJson(request);
        return ingestInternal(SourceType.EXTERNAL_API, normalizeSourceSystem(request.sourceSystem(), "external-api"), request, payloadJson);
    }

    @Transactional
    public OpsIngestResultDto ingestManual(String token, OpsIngestRequest request) {
        validateSourceType(SourceType.MANUAL_IMPORT, request.sourceType());
        requireToken(properties.getManual().getIngestToken(), token, "manual");
        String payloadJson = repository.toJson(request);
        return ingestInternal(SourceType.MANUAL_IMPORT, normalizeSourceSystem(request.sourceSystem(), "manual-import"), request, payloadJson);
    }

    private OpsIngestResultDto ingestInternal(SourceType sourceType, String sourceSystem, OpsIngestRequest request, String payloadJson) {
        LocalDateTime observedAt = parseObservedAt(request.observedAt());
        String requestId = request.requestId() == null || request.requestId().isBlank()
                ? UUID.randomUUID().toString()
                : request.requestId();

        repository.insertIngestPayload(sourceType, sourceSystem, requestId, payloadJson);
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
                    observedAt
            ));
            long snapshotId = repository.insertHostSnapshot(hostId, sourceType, sourceSystem, observedAt, request.snapshot(), memoryUsagePct);
            repository.insertNetworkSnapshots(snapshotId, request.networkInterfaces());
            repository.insertProcessSnapshots(hostId, snapshotId, observedAt, request.processes());
            evaluateAlerts(hostId, request.host().hostname(), request.snapshot().cpuUsagePct(), memoryUsagePct, request.snapshot().diskUsagePct());
            repository.insertIngestEvent(sourceType, sourceSystem, requestId, observedAt, "SUCCESS", null);
            return new OpsIngestResultDto(hostId, request.host().hostCode(), sourceSystem, sourceType.name(), "SUCCESS");
        } catch (RuntimeException exception) {
            repository.insertIngestEvent(sourceType, sourceSystem, requestId, observedAt, "FAILED", exception.getMessage());
            throw exception;
        }
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
}
