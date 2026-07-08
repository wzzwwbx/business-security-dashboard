package com.bss.dashboard.terminal.dto;

/**
 * 终端事件。
 */
public record TerminalEventDto(
        Long id,
        String eventCategory,
        String eventType,
        String severity,
        String title,
        String detail,
        String observedAt
) {
}
