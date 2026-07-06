package com.bss.dashboard.ops.dto;

public record OpsSourceDto(
        String sourceType,
        String sourceSystem,
        boolean enabled,
        String status,
        int hostCount,
        String lastSeenAt
) {
}
