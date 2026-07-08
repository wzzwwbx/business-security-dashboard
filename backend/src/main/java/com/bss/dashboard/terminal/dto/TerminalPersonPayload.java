package com.bss.dashboard.terminal.dto;

/**
 * 终端上报中的人员线索。
 */
public record TerminalPersonPayload(
        String personCode,
        String employeeNo,
        String externalPersonId,
        String phoneNumber
) {
}
