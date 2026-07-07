package com.bss.dashboard.ops.dto;

public record OpsHostPayload(
        String hostCode,
        String hostname,
        String displayName,
        String primaryIp,
        String osName,
        String kernelVersion,
        String arch,
        Integer cpuCores,
        Long memoryTotalBytes,
        String machineFingerprint
) {
}
