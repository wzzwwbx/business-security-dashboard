package com.bss.dashboard.terminal.support;

import com.bss.dashboard.terminal.config.TerminalProperties;
import com.bss.dashboard.terminal.repository.TerminalRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * 终端域保留策略任务。
 */
@Component
@Profile("mysql")
public class TerminalRetentionScheduler {

    private final TerminalRepository repository;
    private final TerminalProperties properties;

    public TerminalRetentionScheduler(TerminalRepository repository, TerminalProperties properties) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
        this.properties = Objects.requireNonNull(properties, "properties must not be null");
    }

    /**
     * 定时清理过期终端数据。
     */
    @Scheduled(cron = "0 35 * * * *")
    public void cleanupExpiredData() {
        repository.deleteExpiredSnapshots(properties.getSnapshotRetentionDays());
        repository.deleteExpiredEvents(properties.getEventRetentionDays());
        repository.deleteExpiredPayloads(properties.getPayloadRetentionDays());
    }
}
