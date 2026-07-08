package com.bss.dashboard.iam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateUserRequest(
        @NotBlank @Pattern(regexp = "[a-zA-Z0-9_.-]{4,32}") String username,
        @NotBlank @Size(min = 2, max = 64) String displayName,
        @NotBlank @Size(min = 8, max = 64) String password,
        @NotEmpty List<String> roleCodes
) {
}
