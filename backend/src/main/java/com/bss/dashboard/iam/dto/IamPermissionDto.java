package com.bss.dashboard.iam.dto;

public record IamPermissionDto(
        String code,
        String resourceType,
        String action,
        String description
) {
}
