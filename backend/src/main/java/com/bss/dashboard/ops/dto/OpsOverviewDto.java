package com.bss.dashboard.ops.dto;

public record OpsOverviewDto(
        String generatedAt,
        int onlineHosts,
        int staleHosts,
        int offlineHosts,
        int openAlerts,
        int sourceCount,
        double averageCpuUsagePct,
        double averageMemoryUsagePct
) {
}
