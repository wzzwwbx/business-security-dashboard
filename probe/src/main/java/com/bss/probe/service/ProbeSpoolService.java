package com.bss.probe.service;

import com.bss.probe.config.ProbeProperties;
import com.bss.probe.dto.ProbeIngestRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class ProbeSpoolService {

    private static final Logger log = LoggerFactory.getLogger(ProbeSpoolService.class);

    private final ObjectMapper objectMapper;
    private final ProbeProperties properties;

    public ProbeSpoolService(ObjectMapper objectMapper, ProbeProperties properties) {
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    public void enqueue(ProbeIngestRequest request) {
        try {
            Path spoolDir = ensureSpoolDir();
            String fileName = OffsetDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"))
                    + "-"
                    + UUID.randomUUID()
                    + ".json";
            Path file = spoolDir.resolve(fileName);
            objectMapper.writeValue(file.toFile(), request);
            enforceSizeLimit(spoolDir);
            log.warn("probe 上报失败，已写入本地缓冲: {}", file);
        } catch (Exception exception) {
            log.error("写入 probe 本地缓冲失败", exception);
        }
    }

    public void drain(ThrowingConsumer<ProbeIngestRequest> sender) throws Exception {
        Path spoolDir = ensureSpoolDir();
        for (Path file : listSpoolFiles(spoolDir)) {
            ProbeIngestRequest request = objectMapper.readValue(file.toFile(), ProbeIngestRequest.class);
            sender.accept(request);
            Files.deleteIfExists(file);
            log.info("probe 补报成功，已清理缓冲文件: {}", file.getFileName());
        }
    }

    private Path ensureSpoolDir() throws IOException {
        Path spoolDir = Path.of(properties.getSpoolDir()).toAbsolutePath().normalize();
        Files.createDirectories(spoolDir);
        return spoolDir;
    }

    private List<Path> listSpoolFiles(Path spoolDir) throws IOException {
        try (var stream = Files.list(spoolDir)) {
            return stream
                    .filter(path -> path.getFileName().toString().endsWith(".json"))
                    .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                    .toList();
        }
    }

    private void enforceSizeLimit(Path spoolDir) throws IOException {
        long maxBytes = properties.getSpoolMaxSizeMb() * 1024L * 1024L;
        if (maxBytes <= 0) {
            return;
        }
        List<Path> files = listSpoolFiles(spoolDir);
        long totalBytes = 0;
        for (Path file : files) {
            totalBytes += Files.size(file);
        }
        int index = 0;
        while (totalBytes > maxBytes && index < files.size()) {
            Path toDelete = files.get(index++);
            long size = Files.size(toDelete);
            Files.deleteIfExists(toDelete);
            totalBytes -= size;
            log.warn("probe spool 超过限制，删除最早缓冲文件: {}", toDelete.getFileName());
        }
    }

    @FunctionalInterface
    public interface ThrowingConsumer<T> {
        void accept(T value) throws Exception;
    }
}
