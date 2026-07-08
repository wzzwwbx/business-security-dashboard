package com.bss.dashboard.iam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank @Size(min = 8, max = 64) String tempPassword,
        @NotBlank @Size(min = 2, max = 120) String reason
) {
}
