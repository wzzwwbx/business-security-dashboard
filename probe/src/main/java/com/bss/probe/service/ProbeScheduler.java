package com.bss.probe.service;

import com.bss.probe.dto.ProbeIngestRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ProbeScheduler {

    private static final Logger log = LoggerFactory.getLogger(ProbeScheduler.class);

    private final LinuxProbeCollector collector;
    private final ProbeReporter reporter;
    private final ProbeSpoolService spoolService;

    public ProbeScheduler(LinuxProbeCollector collector, ProbeReporter reporter, ProbeSpoolService spoolService) {
        this.collector = collector;
        this.reporter = reporter;
        this.spoolService = spoolService;
    }

    @Scheduled(initialDelayString = "${probe.schedule.initial-delay-ms:5000}", fixedDelayString = "${probe.schedule.fixed-delay-ms:60000}")
    public void collectAndReport() {
        ProbeIngestRequest request;
        try {
            request = collector.collect();
        } catch (Exception exception) {
            log.error("probe 采集失败", exception);
            return;
        }

        try {
            spoolService.drain(reporter::send);
            reporter.send(request);
            log.info("probe 上报成功 hostCode={} observedAt={}", request.host().hostCode(), request.observedAt());
        } catch (Exception exception) {
            log.warn("probe 上报失败，进入本地缓冲: {}", exception.getMessage());
            spoolService.enqueue(request);
        }
    }
}
