package com.bss.dashboard.terminal.dto;

import java.util.List;

/**
 * 终端详情。
 */
public record TerminalDeviceDetailDto(
        Long id,
        String deviceCode,
        String displayName,
        String status,
        String riskLevel,
        String lastObservedAt,
        String sourceType,
        String sourceSystem,
        String ownershipStatus,
        String reportedPhoneNumberMasked,
        TerminalPersonDto person,
        TerminalDeviceInfoDto deviceInfo,
        TerminalSecurityInfoDto latestSecurity,
        List<TerminalBindingDto> bindings
) {

    /**
     * 终端设备信息。
     */
    public record TerminalDeviceInfoDto(
            String deviceName,
            String primaryIp,
            String osVersion,
            String imei,
            String meid,
            String plmn,
            long trafficUsedBytes
    ) {
    }

    /**
     * 最近一次安全状态。
     */
    public record TerminalSecurityInfoDto(
            String passwordModuleStatus,
            String passwordModuleVersion,
            String passwordSuiteStatus,
            int wrongPasswordCount,
            boolean fingerprintChanged,
            boolean configModified,
            String riskLevel,
            Integer riskScore,
            String summary
    ) {
    }
}
