package com.bss.dashboard.ops.dto;

public record OpsIngestResultDto(
        Long hostId,
        String hostCode,
        String sourceSystem,
        String sourceType,
        String status
) {
}
