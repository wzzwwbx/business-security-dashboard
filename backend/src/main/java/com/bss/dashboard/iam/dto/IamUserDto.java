package com.bss.dashboard.iam.dto;

import java.util.List;

public record IamUserDto(
        Long id,
        String username,
        String displayName,
        String status,
        boolean builtIn,
        boolean forcePasswordChange,
        String lastLoginAt,
        List<String> roleCodes,
        List<String> roleNames,
        List<String> pageCodes,
        String createdAt
) {
}
