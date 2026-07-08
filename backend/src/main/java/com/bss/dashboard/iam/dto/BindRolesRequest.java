package com.bss.dashboard.iam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record BindRolesRequest(
        @NotEmpty List<String> roleCodes,
        @NotBlank String reason
) {
}
