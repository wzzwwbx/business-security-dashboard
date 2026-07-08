package com.bss.dashboard.terminal.dto;

/**
 * 终端详情中的人员信息。
 */
public record TerminalPersonDto(
        String personCode,
        String fullName,
        String displayName,
        String employeeNo,
        String departmentName,
        String organizationPath,
        String jobTitle,
        String email,
        String phoneNumberMasked
) {
}
