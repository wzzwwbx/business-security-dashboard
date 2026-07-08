package com.bss.dashboard.iam.dto;

import jakarta.validation.constraints.Size;

public record ApprovalDecisionRequest(
        @Size(max = 255) String reviewComment
) {
}
