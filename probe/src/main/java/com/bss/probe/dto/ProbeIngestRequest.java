package com.bss.probe.dto;

import java.util.List;

public record ProbeIngestRequest(
        String sourceType,
        String sourceSystem,
        String requestId,
        String externalAssetId,
        String observedAt,
        Host host,
        Snapshot snapshot,
        List<NetworkInterface> networkInterfaces,
        List<ProcessInfo> processes
) {
    public record Host(
            String hostCode,
            String hostname,
            String displayName,
            String primaryIp,
            String osName,
            String kernelVersion,
            String arch,
            Integer cpuCores,
            Long memoryTotalBytes,
            String machineFingerprint
    ) {
    }

    public record Snapshot(
            Double cpuUsagePct,
            Double load1,
            Double load5,
            Double load15,
            Long memUsedBytes,
            Long memAvailableBytes,
            Long swapUsedBytes,
            Long diskUsedBytes,
            Long diskTotalBytes,
            Double diskUsagePct,
            Integer tcpEstablishedCount,
            Integer processCount
    ) {
    }

    public record NetworkInterface(
            String interfaceName,
            Long rxBytesPerSec,
            Long txBytesPerSec,
            Long rxPacketsPerSec,
            Long txPacketsPerSec
    ) {
    }

    public record ProcessInfo(
            Integer pid,
            String processName,
            String commandLine,
            Double cpuUsagePct,
            Long memoryRssBytes,
            String state,
            boolean whitelisted
    ) {
    }
}
