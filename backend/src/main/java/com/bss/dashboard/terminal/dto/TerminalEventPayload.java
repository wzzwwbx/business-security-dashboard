package com.bss.dashboard.terminal.dto;

/**
 * 显式终端事件。
 */
public record TerminalEventPayload(
        String eventType,
        String severity,
        String title,
        String detail,
        String status
) {
}
