package com.bss.dashboard.ops.dto;

public record OpsNetworkInterfacePayload(
        String interfaceName,
        Long rxBytesPerSec,
        Long txBytesPerSec,
        Long rxPacketsPerSec,
        Long txPacketsPerSec
) {
}
