package com.bss.dashboard.terminal.dto;

/**
 * 终端软件变更记录。
 */
public record TerminalSoftwareChangeDto(
        Long id,
        String changeType,
        String softwareName,
        String softwareVersion,
        String detail,
        String observedAt
) {
}
