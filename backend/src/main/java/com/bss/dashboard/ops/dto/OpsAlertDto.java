package com.bss.dashboard.ops.dto;

public record OpsAlertDto(
        Long id,
        Long hostId,
        String hostName,
        String primaryIp,
        String alertType,
        String severity,
        String status,
        String title,
        String detail,
        String firstSeenAt,
        String lastSeenAt,
        String resolvedAt
) {
}
