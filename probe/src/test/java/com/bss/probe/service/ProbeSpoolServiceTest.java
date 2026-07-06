package com.bss.probe.service;

import com.bss.probe.config.ProbeProperties;
import com.bss.probe.dto.ProbeIngestRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProbeSpoolServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void shouldEnqueueDrainAndDeleteSpoolFiles() throws Exception {
        ProbeProperties properties = new ProbeProperties();
        properties.setSpoolDir(tempDir.toString());
        ProbeSpoolService service = new ProbeSpoolService(new ObjectMapper(), properties);

        ProbeIngestRequest request = sampleRequest("req-001");
        service.enqueue(request);

        assertEquals(1L, Files.list(tempDir).count());

        AtomicInteger drained = new AtomicInteger();
        service.drain(item -> {
            drained.incrementAndGet();
            assertEquals("req-001", item.requestId());
            assertEquals("host-code", item.host().hostCode());
        });

        assertEquals(1, drained.get());
        assertEquals(0L, Files.list(tempDir).count());
    }

    @Test
    void shouldTrimOldestSpoolFilesWhenSizeLimitExceeded() throws Exception {
        ProbeProperties properties = new ProbeProperties();
        properties.setSpoolDir(tempDir.toString());
        properties.setSpoolMaxSizeMb(0);
        ProbeSpoolService service = new ProbeSpoolService(new ObjectMapper(), properties);

        service.enqueue(sampleRequest("req-001"));
        service.enqueue(sampleRequest("req-002"));

        assertEquals(2L, Files.list(tempDir).count());

        properties.setSpoolMaxSizeMb(1);
        ProbeSpoolService limitedService = new ProbeSpoolService(new ObjectMapper(), properties);
        for (int index = 0; index < 128; index++) {
            limitedService.enqueue(sampleRequest("req-bulk-" + index, "x".repeat(12_000)));
        }

        long totalBytes;
        try (var stream = Files.list(tempDir)) {
            totalBytes = stream.mapToLong(path -> {
                try {
                    return Files.size(path);
                } catch (Exception exception) {
                    return 0L;
                }
            }).sum();
        }

        assertTrue(totalBytes <= 1_048_576L, "spool size should stay within configured 1MB cap");
    }

    private ProbeIngestRequest sampleRequest(String requestId) {
        return sampleRequest(requestId, "java -jar probe.jar");
    }

    private ProbeIngestRequest sampleRequest(String requestId, String commandLine) {
        return new ProbeIngestRequest(
                "PROBE",
                "linux-arm-probe",
                requestId,
                null,
                OffsetDateTime.now().toString(),
                new ProbeIngestRequest.Host("host-code", "arm-node-01", "ARM 节点 01", "10.0.0.8", "Linux", "6.1.0", "aarch64", 8, 16_000_000_000L, "machine-001"),
                new ProbeIngestRequest.Snapshot(31.5, 1.2, 1.0, 0.8, 6_000_000_000L, 8_000_000_000L, 0L, 200_000_000_000L, 500_000_000_000L, 40.0, 88, 120),
                List.of(new ProbeIngestRequest.NetworkInterface("eth0", 1024L, 2048L, 32L, 48L)),
                List.of(new ProbeIngestRequest.ProcessInfo(1001, "java", commandLine, 12.0, 256_000_000L, "S", true))
        );
    }
}
