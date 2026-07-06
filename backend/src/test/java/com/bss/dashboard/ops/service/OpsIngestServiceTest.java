package com.bss.dashboard.ops.service;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;

class OpsIngestServiceTest {

    private OpsRepository repository;
    private OpsIngestService service;
    private OpsProperties properties;

    @BeforeEach
    void setUp() {
        repository = mock(OpsRepository.class);
        properties = new OpsProperties();
        properties.getProbe().setSharedSecret("unit-test-secret");
        properties.getExternal().setIngestToken("external-token");
        properties.getManual().setIngestToken("manual-token");
        service = new OpsIngestService(repository, properties);
    }

    @Test
    void shouldIngestProbeAndOpenThresholdAlerts() throws Exception {
        OpsIngestRequest request = buildRequest(SourceType.PROBE, 92.4, 15_500_000_000L, 96.8);
        String payloadJson = "{\"probe\":true}";
        String timestamp = OffsetDateTime.now().toString();
        String signature = sign(properties.getProbe().getSharedSecret(), timestamp, payloadJson);

        when(repository.toJson(request)).thenReturn(payloadJson);
        when(repository.findSourceAgent("agent-001")).thenReturn(Optional.empty());
        when(repository.resolveOrCreateHost(any())).thenReturn(101L);
        when(repository.insertHostSnapshot(anyLong(), any(), anyString(), any(), any(), any(Double.class))).thenReturn(9001L);

        OpsIngestResultDto result = service.ingestProbe("agent-001", timestamp, signature, request);

        assertEquals(101L, result.hostId());
        assertEquals("SUCCESS", result.status());
        assertEquals("PROBE", result.sourceType());
        assertEquals("linux-arm-probe", result.sourceSystem());

        verify(repository).upsertSourceAgent(eq("agent-001"), eq(SourceType.PROBE), eq("linux-arm-probe"), anyString());
        verify(repository).touchSourceAgent("agent-001");
        verify(repository).insertIngestPayload(eq(SourceType.PROBE), eq("linux-arm-probe"), eq("req-001"), eq(payloadJson));
        verify(repository).insertNetworkSnapshots(eq(9001L), anyList());
        verify(repository).insertProcessSnapshots(eq(101L), eq(9001L), any(), anyList());
        verify(repository).insertIngestEvent(eq(SourceType.PROBE), eq("linux-arm-probe"), eq("req-001"), any(), eq("SUCCESS"), eq(null));

        verify(repository).openOrRefreshAlert(eq(101L), eq("HIGH_CPU"), eq(AlertSeverity.CRITICAL), eq("CPU 利用率过高"), eq("arm-node-01 CPU 使用率已达到 92.4%"));
        verify(repository).openOrRefreshAlert(eq(101L), eq("HIGH_MEMORY"), eq(AlertSeverity.CRITICAL), eq("内存利用率过高"), eq("arm-node-01 内存使用率已达到 96.88%"));
        verify(repository).openOrRefreshAlert(eq(101L), eq("HIGH_DISK"), eq(AlertSeverity.WARNING), eq("磁盘利用率过高"), eq("arm-node-01 磁盘使用率已达到 96.8%"));
        verify(repository, never()).resolveAlert(anyLong(), anyString());

        ArgumentCaptor<OpsRepository.ResolvedHostUpsert> captor = ArgumentCaptor.forClass(OpsRepository.ResolvedHostUpsert.class);
        verify(repository).resolveOrCreateHost(captor.capture());
        assertEquals("asset-001", captor.getValue().externalAssetId());
        assertEquals("host-code-001", captor.getValue().hostCode());
    }

    @Test
    void shouldResolveAlertsForLowRiskExternalPayload() {
        OpsIngestRequest request = buildRequest(SourceType.EXTERNAL_API, 32.6, 7_000_000_000L, 48.0);
        when(repository.toJson(request)).thenReturn("{\"external\":true}");
        when(repository.resolveOrCreateHost(any())).thenReturn(202L);
        when(repository.insertHostSnapshot(anyLong(), any(), anyString(), any(), any(), any(Double.class))).thenReturn(9901L);

        OpsIngestResultDto result = service.ingestExternal("external-token", request);

        assertEquals(202L, result.hostId());
        verify(repository, times(1)).resolveAlert(202L, "HIGH_CPU");
        verify(repository, times(1)).resolveAlert(202L, "HIGH_MEMORY");
        verify(repository, times(1)).resolveAlert(202L, "HIGH_DISK");
        verify(repository, never()).openOrRefreshAlert(anyLong(), anyString(), any(), anyString(), anyString());
    }

    @Test
    void shouldRejectExpiredProbeTimestamp() throws Exception {
        OpsIngestRequest request = buildRequest(SourceType.PROBE, 12.0, 3_000_000_000L, 40.0);
        String payloadJson = "{\"probe\":true}";
        String timestamp = OffsetDateTime.now().minusMinutes(6).toString();
        String signature = sign(properties.getProbe().getSharedSecret(), timestamp, payloadJson);
        when(repository.toJson(request)).thenReturn(payloadJson);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.ingestProbe("agent-001", timestamp, signature, request));

        assertEquals("签名时间戳已过期", exception.getMessage());
        verify(repository, never()).findSourceAgent(anyString());
    }

    @Test
    void shouldRejectInvalidProbeSignature() {
        OpsIngestRequest request = buildRequest(SourceType.PROBE, 12.0, 3_000_000_000L, 40.0);
        when(repository.toJson(request)).thenReturn("{\"probe\":true}");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.ingestProbe("agent-001", OffsetDateTime.now().toString(), "bad-signature", request));

        assertEquals("probe 签名校验失败", exception.getMessage());
    }

    @Test
    void shouldRejectWrongExternalToken() {
        OpsIngestRequest request = buildRequest(SourceType.EXTERNAL_API, 40.0, 3_000_000_000L, 40.0);
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.ingestExternal("wrong-token", request));
        assertEquals("external token 校验失败", exception.getMessage());
    }

    private OpsIngestRequest buildRequest(SourceType sourceType, double cpuUsagePct, long memUsedBytes, double diskUsagePct) {
        return new OpsIngestRequest(
                sourceType,
                "linux-arm-probe",
                "req-001",
                "asset-001",
                OffsetDateTime.now().minusSeconds(30).toString(),
                new OpsHostPayload("host-code-001", "arm-node-01", "ARM 节点 01", "10.0.0.8", "Linux", "6.1.0", "aarch64", 8, 16_000_000_000L, "fingerprint-001"),
                new OpsSnapshotPayload(cpuUsagePct, 1.2, 1.0, 0.8, memUsedBytes, 500_000_000L, 0L, 480_000_000_000L, 500_000_000_000L, diskUsagePct, 98, 135),
                List.of(new OpsNetworkInterfacePayload("eth0", 1024L, 2048L, 32L, 48L)),
                List.of(new OpsProcessPayload(1001, "java", "java -jar probe.jar", 12.0, 256_000_000L, "S", true))
        );
    }

    private String sign(String secret, String timestamp, String payloadJson) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal((timestamp + "\n" + payloadJson).getBytes(StandardCharsets.UTF_8)));
    }
}
