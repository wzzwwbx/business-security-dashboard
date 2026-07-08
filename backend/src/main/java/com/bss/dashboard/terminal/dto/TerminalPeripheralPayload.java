package com.bss.dashboard.terminal.dto;

/**
 * 外设接入事件。
 */
public record TerminalPeripheralPayload(
        String peripheralType,
        String peripheralName,
        String actionType,
        String detail
) {
}
