package com.bss.dashboard.terminal.dto;

/**
 * 软件变更事件。
 */
public record TerminalSoftwareChangePayload(
        String changeType,
        String softwareName,
        String softwareVersion,
        String detail
) {
}
