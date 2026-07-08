package com.bss.dashboard.iam.dto;

public record IamApprovalTicketDto(
        Long id,
        String ticketType,
        String targetType,
        String targetId,
        String targetLabel,
        String requesterUsername,
        String reviewerUsername,
        String status,
        String summary,
        String reason,
        String reviewComment,
        String submittedAt,
        String reviewedAt,
        String executedAt
) {
}
