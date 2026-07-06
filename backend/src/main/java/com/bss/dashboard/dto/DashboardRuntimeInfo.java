package com.bss.dashboard.dto;

public record DashboardRuntimeInfo(
        String applicationName,
        String activeProfile,
        String dataSourceMode,
        String apiBasePath,
        String javaVersion,
        boolean databaseEnabled,
        boolean seedEnabled,
        String status
) {
}
