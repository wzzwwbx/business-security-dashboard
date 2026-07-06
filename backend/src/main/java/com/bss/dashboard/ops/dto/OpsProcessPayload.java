package com.bss.dashboard.ops.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OpsProcessPayload(
        @NotNull Integer pid,
        @NotBlank String processName,
        String commandLine,
        @NotNull Double cpuUsagePct,
        @NotNull Long memoryRssBytes,
        @NotBlank String state,
        boolean whitelisted
) {
}
