package com.bss.dashboard.iam.dto;

public record IamActionResultDto(
        String action,
        String status,
        Long targetId,
        Long approvalTicketId,
        String message
) {
}
