package com.bss.dashboard.terminal.dto;

/**
 * 终端列表项。
 */
public record TerminalDeviceSummaryDto(
        Long id,
        String deviceCode,
        String displayName,
        String personName,
        String employeeNo,
        String departmentName,
        String phoneNumberMasked,
        String primaryIp,
        String osVersion,
        String imei,
        String meid,
        String passwordModuleStatus,
        String riskLevel,
        String status,
        String ownershipStatus,
        long trafficUsedBytes,
        boolean fingerprintChanged,
        boolean configModified,
        String lastObservedAt,
        String sourceType,
        String sourceSystem
) {
}
