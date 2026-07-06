package com.bss.dashboard.ops.dto;

public record OpsHostSummaryDto(
        Long id,
        String hostCode,
        String hostname,
        String displayName,
        String primaryIp,
        String status,
        String sourceType,
        String sourceSystem,
        double cpuUsagePct,
        double memoryUsagePct,
        double load1,
        double diskUsagePct,
        int openAlertCount,
        String lastObservedAt
) {
}
