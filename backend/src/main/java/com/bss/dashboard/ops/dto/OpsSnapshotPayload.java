package com.bss.dashboard.ops.dto;

import jakarta.validation.constraints.NotNull;

public record OpsSnapshotPayload(
        @NotNull Double cpuUsagePct,
        @NotNull Double load1,
        @NotNull Double load5,
        @NotNull Double load15,
        @NotNull Long memUsedBytes,
        @NotNull Long memAvailableBytes,
        @NotNull Long swapUsedBytes,
        @NotNull Long diskUsedBytes,
        @NotNull Long diskTotalBytes,
        @NotNull Double diskUsagePct,
        @NotNull Integer tcpEstablishedCount,
        @NotNull Integer processCount
) {
}
