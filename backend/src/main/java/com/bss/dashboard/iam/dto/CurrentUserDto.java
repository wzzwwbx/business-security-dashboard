package com.bss.dashboard.iam.dto;

import java.util.List;

public record CurrentUserDto(
        Long id,
        String username,
        String displayName,
        boolean forcePasswordChange,
        List<String> roleCodes,
        List<String> roleNames,
        List<String> pagePermissions,
        List<String> actionPermissions,
        List<String> pageCodes
) {
}
