package com.bss.dashboard.ops.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OpsHostPayload(
        @NotBlank String hostCode,
        @NotBlank String hostname,
        String displayName,
        @NotBlank String primaryIp,
        @NotBlank String osName,
        @NotBlank String kernelVersion,
        @NotBlank String arch,
        @NotNull Integer cpuCores,
        @NotNull Long memoryTotalBytes,
        String machineFingerprint
) {
}
