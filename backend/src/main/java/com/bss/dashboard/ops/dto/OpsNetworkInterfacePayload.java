package com.bss.dashboard.ops.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OpsNetworkInterfacePayload(
        @NotBlank String interfaceName,
        @NotNull Long rxBytesPerSec,
        @NotNull Long txBytesPerSec,
        @NotNull Long rxPacketsPerSec,
        @NotNull Long txPacketsPerSec
) {
}
