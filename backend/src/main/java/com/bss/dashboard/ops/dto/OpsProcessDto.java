package com.bss.dashboard.ops.dto;

public record OpsProcessDto(
        int pid,
        String processName,
        String commandLine,
        double cpuUsagePct,
        long memoryRssBytes,
        String state,
        boolean whitelisted,
        String observedAt
) {
}
