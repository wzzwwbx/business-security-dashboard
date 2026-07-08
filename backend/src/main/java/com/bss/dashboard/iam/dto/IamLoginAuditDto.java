package com.bss.dashboard.iam.dto;

public record IamLoginAuditDto(
        Long id,
        String username,
        boolean success,
        String clientIp,
        String userAgent,
        String reason,
        String loggedAt
) {
}
