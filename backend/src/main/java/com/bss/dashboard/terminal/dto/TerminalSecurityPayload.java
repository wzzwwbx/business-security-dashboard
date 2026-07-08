package com.bss.dashboard.terminal.dto;

/**
 * 终端安全快照。
 */
public record TerminalSecurityPayload(
        String passwordModuleStatus,
        String passwordModuleVersion,
        String passwordSuiteStatus,
        Integer wrongPasswordCount,
        Boolean fingerprintChanged,
        Boolean configModified,
        String riskLevel,
        Integer riskScore,
        String summary
) {
}
