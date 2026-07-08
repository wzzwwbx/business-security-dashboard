package com.bss.dashboard.terminal.dto;

import java.util.List;

/**
 * 终端趋势数据。
 */
public record TerminalTimeseriesDto(
        String range,
        List<TerminalTimeseriesPointDto> points
) {
}
