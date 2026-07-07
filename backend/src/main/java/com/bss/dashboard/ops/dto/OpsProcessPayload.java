package com.bss.dashboard.ops.dto;

public record OpsProcessPayload(
        Integer pid,
        String processName,
        String commandLine,
        Double cpuUsagePct,
        Long memoryRssBytes,
        String state,
        boolean whitelisted
) {
}
