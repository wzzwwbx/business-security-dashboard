package com.bss.dashboard.terminal.dto;

/**
 * 终端来源绑定信息。
 */
public record TerminalBindingDto(
        String sourceSystem,
        String externalDeviceId,
        String externalDeviceName,
        String bindingStatus
) {
}
