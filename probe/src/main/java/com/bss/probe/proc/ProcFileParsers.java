package com.bss.probe.proc;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class ProcFileParsers {

    private static final long KB = 1024L;

    private ProcFileParsers() {
    }

    public static CpuTimes parseCpuTimes(String content) {
        for (String line : lines(content)) {
            if (!line.startsWith("cpu ")) {
                continue;
            }
            String[] parts = line.trim().split("\\s+");
            long total = 0;
            for (int i = 1; i < parts.length; i++) {
                total += parseLong(parts[i]);
            }
            long idle = parts.length > 4 ? parseLong(parts[4]) : 0;
            long iowait = parts.length > 5 ? parseLong(parts[5]) : 0;
            return new CpuTimes(total, idle + iowait);
        }
        throw new IllegalArgumentException("/proc/stat 中未找到 cpu 行");
    }

    public static LoadAverages parseLoadAverages(String content) {
        String[] parts = content.trim().split("\\s+");
        if (parts.length < 3) {
            throw new IllegalArgumentException("/proc/loadavg 格式不正确");
        }
        return new LoadAverages(parseDouble(parts[0]), parseDouble(parts[1]), parseDouble(parts[2]));
    }

    public static MemoryStats parseMemoryStats(String content) {
        Map<String, Long> values = new HashMap<>();
        for (String line : lines(content)) {
            int separator = line.indexOf(':');
            if (separator <= 0) {
                continue;
            }
            String key = line.substring(0, separator).trim();
            String[] parts = line.substring(separator + 1).trim().split("\\s+");
            if (parts.length == 0) {
                continue;
            }
            long value = parseLong(parts[0]);
            String unit = parts.length > 1 ? parts[1].toLowerCase(Locale.ROOT) : "";
            values.put(key, "kb".equals(unit) ? value * KB : value);
        }

        long memTotal = values.getOrDefault("MemTotal", 0L);
        long memAvailable = values.getOrDefault("MemAvailable",
                values.getOrDefault("MemFree", 0L)
                        + values.getOrDefault("Buffers", 0L)
                        + values.getOrDefault("Cached", 0L));
        long memUsed = Math.max(0L, memTotal - memAvailable);
        long swapTotal = values.getOrDefault("SwapTotal", 0L);
        long swapFree = values.getOrDefault("SwapFree", 0L);
        long swapUsed = Math.max(0L, swapTotal - swapFree);
        return new MemoryStats(memTotal, memAvailable, memUsed, swapUsed);
    }

    public static List<NetDevCounters> parseNetDev(String content) {
        List<NetDevCounters> result = new ArrayList<>();
        for (String line : lines(content)) {
            if (!line.contains(":")) {
                continue;
            }
            String[] pieces = line.split(":", 2);
            String interfaceName = pieces[0].trim();
            if (interfaceName.isEmpty()) {
                continue;
            }
            String[] parts = pieces[1].trim().split("\\s+");
            if (parts.length < 16) {
                continue;
            }
            result.add(new NetDevCounters(
                    interfaceName,
                    parseLong(parts[0]),
                    parseLong(parts[1]),
                    parseLong(parts[8]),
                    parseLong(parts[9])
            ));
        }
        return result;
    }

    public static int countTcpEstablished(String content) {
        int count = 0;
        for (String line : lines(content)) {
            String trimmed = line.trim();
            if (trimmed.isEmpty() || trimmed.startsWith("sl")) {
                continue;
            }
            String[] parts = trimmed.split("\\s+");
            if (parts.length > 3 && "01".equalsIgnoreCase(parts[3])) {
                count++;
            }
        }
        return count;
    }

    public static ProcessStat parseProcessStat(int pid, String content) {
        String line = content.trim();
        int openParen = line.indexOf('(');
        int closeParen = line.lastIndexOf(')');
        if (openParen < 0 || closeParen <= openParen) {
            throw new IllegalArgumentException("/proc/[pid]/stat 格式不正确");
        }
        String comm = line.substring(openParen + 1, closeParen);
        String remainder = line.substring(closeParen + 2).trim();
        String[] parts = remainder.split("\\s+");
        if (parts.length < 15) {
            throw new IllegalArgumentException("/proc/[pid]/stat 字段不足");
        }
        String state = parts[0];
        long utime = parseLong(parts[11]);
        long stime = parseLong(parts[12]);
        return new ProcessStat(pid, comm, state, utime + stime);
    }

    public static long parseStatusVmRssBytes(String content) {
        for (String line : lines(content)) {
            if (!line.startsWith("VmRSS:")) {
                continue;
            }
            String[] parts = line.substring("VmRSS:".length()).trim().split("\\s+");
            if (parts.length == 0) {
                return 0L;
            }
            long value = parseLong(parts[0]);
            String unit = parts.length > 1 ? parts[1].toLowerCase(Locale.ROOT) : "";
            return "kb".equals(unit) ? value * KB : value;
        }
        return 0L;
    }

    private static List<String> lines(String content) {
        return content == null ? List.of() : content.lines().toList();
    }

    private static long parseLong(String value) {
        return Long.parseLong(value.trim());
    }

    private static double parseDouble(String value) {
        return Double.parseDouble(value.trim());
    }

    public record CpuTimes(long totalJiffies, long idleJiffies) {
    }

    public record LoadAverages(double load1, double load5, double load15) {
    }

    public record MemoryStats(long memTotalBytes, long memAvailableBytes, long memUsedBytes, long swapUsedBytes) {
    }

    public record NetDevCounters(String interfaceName, long rxBytes, long rxPackets, long txBytes, long txPackets) {
    }

    public record ProcessStat(int pid, String processName, String state, long totalJiffies) {
    }
}
