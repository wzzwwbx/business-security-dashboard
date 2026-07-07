package com.bss.dashboard.ops.dto;

public record OpsSnapshotPayload(
        Double cpuUsagePct,
        Double load1,
        Double load5,
        Double load15,
        Long memUsedBytes,
        Long memAvailableBytes,
        Long swapUsedBytes,
        Long diskUsedBytes,
        Long diskTotalBytes,
        Double diskUsagePct,
        Integer tcpEstablishedCount,
        Integer processCount
) {
}
