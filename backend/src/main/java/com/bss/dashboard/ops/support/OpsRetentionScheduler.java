package com.bss.dashboard.ops.support;

import com.bss.dashboard.ops.config.OpsProperties;
import com.bss.dashboard.ops.repository.OpsRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("mysql")
public class OpsRetentionScheduler {

    private final OpsRepository repository;
    private final OpsProperties properties;

    public OpsRetentionScheduler(OpsRepository repository, OpsProperties properties) {
        this.repository = repository;
        this.properties = properties;
    }

    @Scheduled(cron = "0 15 * * * *")
    public void cleanupExpiredData() {
        repository.deleteExpiredSnapshots(properties.getSnapshotRetentionDays());
        repository.deleteExpiredProcesses(properties.getProcessRetentionDays());
        repository.deleteExpiredPayloads(properties.getPayloadRetentionDays());
    }
}
