package com.bss.dashboard.terminal.dto;

/**
 * 终端来源概览。
 */
public record TerminalSourceDto(
        String sourceType,
        String sourceSystem,
        boolean enabled,
        String status,
        int deviceCount,
        String lastSeenAt
) {
}
