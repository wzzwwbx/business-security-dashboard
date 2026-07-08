package com.bss.dashboard.terminal.dto;

/**
 * 终端时间序列点。
 */
public record TerminalTimeseriesPointDto(
        String observedAt,
        long trafficUsedBytes,
        int wrongPasswordCount,
        Integer riskScore,
        String riskLevel
) {
}
