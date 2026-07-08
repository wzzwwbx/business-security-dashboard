package com.bss.dashboard.terminal.dto;

/**
 * 终端接入结果。
 */
public record TerminalIngestResultDto(
        Long deviceId,
        String deviceCode,
        String personCode,
        String status,
        String riskLevel,
        String observedAt
) {
}
