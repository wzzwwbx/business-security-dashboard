package com.bss.dashboard.iam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BootstrapInitRequest(
        @NotBlank @Size(min = 8, max = 64) String systemAdminPassword,
        @NotBlank @Size(min = 8, max = 64) String securityAdminPassword,
        @NotBlank @Size(min = 8, max = 64) String auditAdminPassword
) {
}
