package com.bss.probe.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.Comparator;
import java.util.Enumeration;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

@Service
public class HostIdentityService {

    public HostIdentity build(long memoryTotalBytes) {
        String hostname = readHostname();
        String primaryIp = resolvePrimaryIp();
        String arch = System.getProperty("os.arch", "unknown");
        String machineFingerprint = resolveMachineFingerprint();
        String hostCode = sha256(hostname + "|" + primaryIp + "|" + arch + "|" + machineFingerprint);
        return new HostIdentity(
                hostCode,
                hostname,
                hostname,
                primaryIp,
                readOsName(),
                System.getProperty("os.version", "unknown"),
                arch,
                Runtime.getRuntime().availableProcessors(),
                memoryTotalBytes,
                machineFingerprint
        );
    }

    private String readHostname() {
        try {
            return Files.readString(Path.of("/proc/sys/kernel/hostname"), StandardCharsets.UTF_8).trim();
        } catch (IOException ignored) {
            try {
                return InetAddress.getLocalHost().getHostName();
            } catch (IOException exception) {
                return "unknown-host";
            }
        }
    }

    private String resolvePrimaryIp() {
        try {
            List<InetAddress> candidates = java.util.Collections.list(NetworkInterface.getNetworkInterfaces()).stream()
                    .filter(networkInterface -> isUsable(networkInterface))
                    .flatMap(networkInterface -> java.util.Collections.list(networkInterface.getInetAddresses()).stream())
                    .filter(address -> !address.isLoopbackAddress())
                    .sorted(Comparator.comparingInt(address -> address instanceof Inet4Address ? 0 : 1))
                    .toList();
            return candidates.stream()
                    .filter(address -> address instanceof Inet4Address)
                    .map(InetAddress::getHostAddress)
                    .findFirst()
                    .orElseGet(() -> candidates.stream().map(InetAddress::getHostAddress).findFirst().orElse("127.0.0.1"));
        } catch (Exception exception) {
            return "127.0.0.1";
        }
    }

    private boolean isUsable(NetworkInterface networkInterface) {
        try {
            return networkInterface.isUp() && !networkInterface.isLoopback() && !networkInterface.isVirtual();
        } catch (Exception exception) {
            return false;
        }
    }

    private String readOsName() {
        for (String line : readLines(Path.of("/etc/os-release"))) {
            if (line.startsWith("PRETTY_NAME=")) {
                return stripQuotes(line.substring("PRETTY_NAME=".length()));
            }
        }
        return System.getProperty("os.name", "Linux");
    }

    private String resolveMachineFingerprint() {
        String machineId = readTrimmed(Path.of("/etc/machine-id"));
        if (!machineId.isBlank()) {
            return machineId;
        }
        machineId = readTrimmed(Path.of("/var/lib/dbus/machine-id"));
        if (!machineId.isBlank()) {
            return machineId;
        }
        return resolveMacFingerprint();
    }

    private String resolveMacFingerprint() {
        StringBuilder builder = new StringBuilder();
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface networkInterface = interfaces.nextElement();
                if (!isUsable(networkInterface)) {
                    continue;
                }
                byte[] hardwareAddress = networkInterface.getHardwareAddress();
                if (hardwareAddress == null || hardwareAddress.length == 0) {
                    continue;
                }
                builder.append(networkInterface.getName()).append('=')
                        .append(HexFormat.of().formatHex(hardwareAddress)).append(';');
            }
        } catch (Exception ignored) {
            // ignore
        }
        return builder.isEmpty() ? "unknown-machine" : sha256(builder.toString().toLowerCase(Locale.ROOT));
    }

    private List<String> readLines(Path path) {
        try {
            return Files.readAllLines(path, StandardCharsets.UTF_8);
        } catch (IOException exception) {
            return List.of();
        }
    }

    private String readTrimmed(Path path) {
        try {
            return Files.readString(path, StandardCharsets.UTF_8).trim();
        } catch (IOException exception) {
            return "";
        }
    }

    private String stripQuotes(String value) {
        if (value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("生成 hostCode 失败", exception);
        }
    }

    public record HostIdentity(
            String hostCode,
            String hostname,
            String displayName,
            String primaryIp,
            String osName,
            String kernelVersion,
            String arch,
            int cpuCores,
            long memoryTotalBytes,
            String machineFingerprint
    ) {
    }
}
