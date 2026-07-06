package com.bss.dashboard.ops.dto;

public record OpsTimeseriesPointDto(
        String observedAt,
        double cpuUsagePct,
        double memoryUsagePct,
        double diskUsagePct,
        double load1,
        long rxBytesPerSec,
        long txBytesPerSec
) {
}
