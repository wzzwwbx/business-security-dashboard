package com.bss.probe.service;

import com.bss.probe.config.ProbeProperties;
import com.bss.probe.dto.ProbeIngestRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProbeReporterTest {

    private HttpServer server;

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void shouldSendSignedProbePayload() throws Exception {
        AtomicReference<String> bodyRef = new AtomicReference<>();
        AtomicReference<String> agentKeyRef = new AtomicReference<>();
        AtomicReference<String> timestampRef = new AtomicReference<>();
        AtomicReference<String> signatureRef = new AtomicReference<>();
        server = startServer(exchange -> {
            bodyRef.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            agentKeyRef.set(exchange.getRequestHeaders().getFirst("X-Agent-Key"));
            timestampRef.set(exchange.getRequestHeaders().getFirst("X-Timestamp"));
            signatureRef.set(exchange.getRequestHeaders().getFirst("X-Signature"));
            writeResponse(exchange, 200, "{\"code\":0}");
        });

        ProbeProperties properties = new ProbeProperties();
        properties.setServerUrl("http://127.0.0.1:" + server.getAddress().getPort() + "/api/ops/ingest/probe");
        properties.setAgentKey("probe-agent");
        properties.setAgentSecret("reporter-secret");
        ProbeReporter reporter = new ProbeReporter(new ObjectMapper(), properties);

        reporter.send(sampleRequest());

        assertEquals("probe-agent", agentKeyRef.get());
        assertNotNull(timestampRef.get());
        assertNotNull(signatureRef.get());
        assertTrue(bodyRef.get().contains("\"sourceType\":\"PROBE\""));
        assertTrue(bodyRef.get().contains("\"requestId\":\"req-001\""));
    }

    @Test
    void shouldThrowWhenBackendReturnsErrorStatus() throws Exception {
        server = startServer(exchange -> writeResponse(exchange, 500, "backend error"));

        ProbeProperties properties = new ProbeProperties();
        properties.setServerUrl("http://127.0.0.1:" + server.getAddress().getPort() + "/api/ops/ingest/probe");
        ProbeReporter reporter = new ProbeReporter(new ObjectMapper(), properties);

        IOException exception = assertThrows(IOException.class, () -> reporter.send(sampleRequest()));
        assertTrue(exception.getMessage().contains("HTTP 500"));
    }

    private HttpServer startServer(ThrowingHandler handler) throws IOException {
        HttpServer httpServer = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        httpServer.createContext("/api/ops/ingest/probe", exchange -> {
            try {
                handler.handle(exchange);
            } finally {
                exchange.close();
            }
        });
        httpServer.start();
        return httpServer;
    }

    private void writeResponse(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream outputStream = exchange.getResponseBody()) {
            outputStream.write(bytes);
        }
    }

    private ProbeIngestRequest sampleRequest() {
        return new ProbeIngestRequest(
                "PROBE",
                "linux-arm-probe",
                "req-001",
                null,
                OffsetDateTime.now().toString(),
                new ProbeIngestRequest.Host("host-code", "arm-node-01", "ARM 节点 01", "10.0.0.8", "Linux", "6.1.0", "aarch64", 8, 16_000_000_000L, "machine-001"),
                new ProbeIngestRequest.Snapshot(31.5, 1.2, 1.0, 0.8, 6_000_000_000L, 8_000_000_000L, 0L, 200_000_000_000L, 500_000_000_000L, 40.0, 88, 120),
                List.of(),
                List.of()
        );
    }

    @FunctionalInterface
    private interface ThrowingHandler {
        void handle(HttpExchange exchange) throws IOException;
    }
}
