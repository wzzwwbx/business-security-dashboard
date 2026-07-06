package com.bss.dashboard.ops.support;

import com.bss.dashboard.ops.domain.SourceType;
import com.bss.dashboard.ops.dto.OpsHostPayload;
import com.bss.dashboard.ops.dto.OpsIngestRequest;
import com.bss.dashboard.ops.dto.OpsNetworkInterfacePayload;
import com.bss.dashboard.ops.dto.OpsProcessPayload;
import com.bss.dashboard.ops.dto.OpsSnapshotPayload;
import com.bss.dashboard.ops.service.OpsIngestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;

@Component
@Profile("mysql")
public class OpsDemoDataSeeder implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final OpsIngestService ingestService;
    private final ObjectMapper objectMapper;

    public OpsDemoDataSeeder(JdbcTemplate jdbcTemplate, OpsIngestService ingestService, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.ingestService = ingestService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(ApplicationArguments args) {
        Integer hostCount = jdbcTemplate.queryForObject("SELECT COUNT(1) FROM ops_host", Integer.class);
        if (hostCount != null && hostCount > 0) {
            return;
        }

        String now = OffsetDateTime.now().minusSeconds(30).toString();
        OpsIngestRequest probeRequest = new OpsIngestRequest(
                SourceType.PROBE,
                "linux-arm-probe",
                "seed-probe-001",
                null,
                now,
                new OpsHostPayload("host-arm-edge-01", "arm-edge-01", "华东 ARM 边缘节点 01", "10.23.8.11", "Linux", "6.1.0-arm64", "aarch64", 8, 17179869184L, "machine-seed-001"),
                new OpsSnapshotPayload(43.2, 1.76, 1.42, 1.31, 9345845248L, 7834025984L, 0L, 268435456000L, 536870912000L, 50.0, 187, 156),
                List.of(
                        new OpsNetworkInterfacePayload("eth0", 842120L, 312880L, 1320L, 980L),
                        new OpsNetworkInterfacePayload("bond0", 1250120L, 512880L, 1420L, 1080L)
                ),
                List.of(
                        new OpsProcessPayload(1032, "java", "/opt/app/bss-probe.jar", 12.6, 462422016L, "S", true),
                        new OpsProcessPayload(892, "nginx", "nginx: master process", 4.1, 125829120L, "S", true),
                        new OpsProcessPayload(2311, "redis-server", "redis-server *:6379", 9.7, 268435456L, "S", true),
                        new OpsProcessPayload(1192, "node", "node export-worker.js", 14.2, 318767104L, "R", false)
                )
        );
        ingestService.ingestProbe("probe-seed-agent", now, sign(now, probeRequest), probeRequest);

        OpsIngestRequest externalRequest = new OpsIngestRequest(
                SourceType.EXTERNAL_API,
                "cmdb-sync",
                "seed-ext-001",
                "asset-east-02",
                OffsetDateTime.now().minusMinutes(2).toString(),
                new OpsHostPayload("host-bj-app-02", "bj-app-02", "北京业务主机 02", "10.55.19.22", "Linux", "5.15.0-generic", "aarch64", 16, 34359738368L, null),
                new OpsSnapshotPayload(88.4, 3.65, 2.88, 2.53, 29527900160L, 4831838208L, 1073741824L, 751619276800L, 858993459200L, 87.5, 412, 289),
                List.of(new OpsNetworkInterfacePayload("eth0", 2421200L, 1288120L, 2720L, 1680L)),
                List.of(
                        new OpsProcessPayload(4021, "java", "java -jar core-service.jar", 36.8, 1879048192L, "R", true),
                        new OpsProcessPayload(4022, "java", "java -jar batch-job.jar", 22.7, 1207959552L, "S", true),
                        new OpsProcessPayload(521, "mysqld", "mysqld", 10.1, 2147483648L, "S", false)
                )
        );
        ingestService.ingestExternal("external-dev-token", externalRequest);

        OpsIngestRequest manualRequest = new OpsIngestRequest(
                SourceType.MANUAL_IMPORT,
                "demo-import",
                "seed-manual-001",
                "asset-demo-03",
                OffsetDateTime.now().minusMinutes(6).toString(),
                new OpsHostPayload("host-demo-03", "demo-ops-03", "演示导入主机 03", "10.66.0.18", "Linux", "5.10.0", "aarch64", 4, 8589934592L, null),
                new OpsSnapshotPayload(23.8, 0.66, 0.52, 0.48, 3221225472L, 4294967296L, 0L, 128849018880L, 268435456000L, 48.0, 62, 74),
                List.of(new OpsNetworkInterfacePayload("eth0", 221200L, 198120L, 620L, 580L)),
                List.of(new OpsProcessPayload(721, "python", "python collector.py", 6.4, 134217728L, "S", true))
        );
        ingestService.ingestManual("manual-dev-token", manualRequest);
    }

    private String sign(String timestamp, OpsIngestRequest request) {
        try {
            String payload = objectMapper.writeValueAsString(request);
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec("dev-probe-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal((timestamp + "\n" + payload).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("生成 demo probe 签名失败", exception);
        }
    }
}
