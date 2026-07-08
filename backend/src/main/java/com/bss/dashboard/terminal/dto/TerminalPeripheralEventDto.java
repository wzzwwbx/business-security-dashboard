package com.bss.dashboard.terminal.dto;

/**
 * 终端外设接入记录。
 */
public record TerminalPeripheralEventDto(
        Long id,
        String peripheralType,
        String peripheralName,
        String actionType,
        String detail,
        String observedAt
) {
}
