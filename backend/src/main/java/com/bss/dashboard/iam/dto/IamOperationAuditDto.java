package com.bss.dashboard.iam.dto;

public record IamOperationAuditDto(
        Long id,
        String operatorUsername,
        String operationType,
        String targetType,
        String targetId,
        String targetLabel,
        String result,
        String traceId,
        String detail,
        String operatedAt
) {
}
