package com.bss.dashboard.terminal.dto;

/**
 * 终端基础属性。
 */
public record TerminalDevicePayload(
        String deviceCode,
        String deviceName,
        String displayName,
        String primaryIp,
        String osVersion,
        String imei,
        String meid,
        String plmn,
        Long trafficUsedBytes
) {
}
