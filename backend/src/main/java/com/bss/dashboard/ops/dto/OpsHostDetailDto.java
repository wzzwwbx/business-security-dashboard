package com.bss.dashboard.ops.dto;

import java.util.List;

public record OpsHostDetailDto(
        Long id,
        String hostCode,
        String hostname,
        String displayName,
        String primaryIp,
        String status,
        String sourceType,
        String sourceSystem,
        String osName,
        String kernelVersion,
        String arch,
        int cpuCores,
        long memoryTotalBytes,
        String lastObservedAt,
        OpsLatestSnapshotDto latestSnapshot,
        List<OpsHostBindingDto> bindings
) {
    public record OpsLatestSnapshotDto(
            double cpuUsagePct,
            double memoryUsagePct,
            double load1,
            double load5,
            double load15,
            long memUsedBytes,
            long memAvailableBytes,
            long swapUsedBytes,
            long diskUsedBytes,
            long diskTotalBytes,
            double diskUsagePct,
            int tcpEstablishedCount,
            int processCount
    ) {
    }
}
