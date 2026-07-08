package com.bss.dashboard.iam.dto;

import java.util.List;

public record IamRoleDto(
        String code,
        String name,
        String type,
        boolean enabled,
        String description,
        List<String> permissions,
        List<String> pageCodes
) {
}
