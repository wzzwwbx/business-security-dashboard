package com.bss.dashboard.terminal.dto;

/**
 * 终端总览指标。
 */
public record TerminalOverviewDto(
        String generatedAt,
        int onlineDevices,
        int staleDevices,
        int offlineDevices,
        int highRiskDevices,
        int abnormalPasswordModuleDevices,
        int fingerprintChangedDevices,
        int pendingClaimDevices,
        int peripheralAlertCount,
        int softwareChangeDevices,
        int sourceCount
) {
}
