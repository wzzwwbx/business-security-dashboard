package com.bss.probe.service;

import com.bss.probe.config.ProbeProperties;
import com.bss.probe.dto.ProbeIngestRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;

@Service
public class ProbeReporter {

    private static final Logger log = LoggerFactory.getLogger(ProbeReporter.class);

    private final ObjectMapper objectMapper;
    private final ProbeProperties properties;
    private final HttpClient httpClient;

    public ProbeReporter(ObjectMapper objectMapper, ProbeProperties properties) {
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.max(1000L, properties.getRequestTimeoutMs())))
                .build();
    }

    public void send(ProbeIngestRequest request) throws IOException, InterruptedException {
        String payload = objectMapper.writeValueAsString(request);
        String timestamp = OffsetDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(properties.getServerUrl()))
                .timeout(Duration.ofMillis(Math.max(1000L, properties.getRequestTimeoutMs())))
                .header("Content-Type", "application/json")
                .header("X-Agent-Key", properties.getAgentKey())
                .header("X-Timestamp", timestamp)
                .header("X-Signature", sign(timestamp, payload))
                .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("probe 上报失败，HTTP " + response.statusCode() + "，响应：" + response.body());
        }
        log.debug("probe 上报成功: {}", response.body());
    }

    private String sign(String timestamp, String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(properties.getAgentSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal((timestamp + "\n" + payload).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("生成 probe HMAC 签名失败", exception);
        }
    }
}
