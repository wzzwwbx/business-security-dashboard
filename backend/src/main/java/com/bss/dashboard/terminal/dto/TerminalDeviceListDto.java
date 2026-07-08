package com.bss.dashboard.terminal.dto;

import java.util.List;

/**
 * 终端分页结果。
 */
public record TerminalDeviceListDto(
        List<TerminalDeviceSummaryDto> items,
        int page,
        int size,
        int total
) {
}
