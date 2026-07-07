package com.bss.probe.service;

import com.bss.probe.config.ProbeProperties;
import com.bss.probe.dto.ProbeIngestRequest;
import com.bss.probe.proc.ProcFileParsers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.DirectoryStream;
import java.nio.file.FileStore;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class LinuxProbeCollector {

    private static final Logger log = LoggerFactory.getLogger(LinuxProbeCollector.class);
    private final ProbeProperties properties;
    private final HostIdentityService hostIdentityService;

    private ProcFileParsers.CpuTimes previousCpuTimes;
    private OffsetDateTime previousObservedAt;
    private final Map<String, ProcFileParsers.NetDevCounters> previousNetCounters = new HashMap<>();
    private final Map<Integer, Long> previousProcessCpuJiffies = new HashMap<>();

    public LinuxProbeCollector(ProbeProperties properties, HostIdentityService hostIdentityService) {
        this.properties = properties;
        this.hostIdentityService = hostIdentityService;
    }

    public synchronized ProbeIngestRequest collect() {
        OffsetDateTime observedAt = OffsetDateTime.now(ZoneOffset.UTC);
        Path procRoot = procRoot();
        ProcFileParsers.CpuTimes currentCpuTimes = ProcFileParsers.parseCpuTimes(readString(procRoot.resolve("stat")));
        ProcFileParsers.MemoryStats memoryStats = ProcFileParsers.parseMemoryStats(readString(procRoot.resolve("meminfo")));
        ProcFileParsers.LoadAverages loadAverages = ProcFileParsers.parseLoadAverages(readString(procRoot.resolve("loadavg")));
        HostIdentityService.HostIdentity identity = hostIdentityService.build(memoryStats.memTotalBytes());

        double cpuUsagePct = calculateCpuUsagePct(currentCpuTimes);
        DiskUsage diskUsage = collectDiskUsage();
        int tcpEstablishedCount = collectTcpEstablishedCount();

        NetworkCollection networkCollection = collectNetworkInterfaces(observedAt);
        ProcessCollection processCollection = collectProcesses(currentCpuTimes, identity.cpuCores());

        previousCpuTimes = currentCpuTimes;
        previousObservedAt = observedAt;

        ProbeIngestRequest.Host host = new ProbeIngestRequest.Host(
                identity.hostCode(),
                identity.hostname(),
                identity.displayName(),
                identity.primaryIp(),
                identity.osName(),
                identity.kernelVersion(),
                identity.arch(),
                identity.cpuCores(),
                identity.memoryTotalBytes(),
                identity.machineFingerprint()
        );

        ProbeIngestRequest.Snapshot snapshot = new ProbeIngestRequest.Snapshot(
                round(cpuUsagePct),
                round(loadAverages.load1()),
                round(loadAverages.load5()),
                round(loadAverages.load15()),
                memoryStats.memUsedBytes(),
                memoryStats.memAvailableBytes(),
                memoryStats.swapUsedBytes(),
                diskUsage.usedBytes(),
                diskUsage.totalBytes(),
                round(diskUsage.usagePct()),
                tcpEstablishedCount,
                processCollection.totalProcessCount()
        );

        return new ProbeIngestRequest(
                "PROBE",
                properties.getSourceSystem(),
                UUID.randomUUID().toString(),
                null,
                observedAt.toString(),
                host,
                snapshot,
                networkCollection.interfaces(),
                processCollection.processes()
        );
    }

    private double calculateCpuUsagePct(ProcFileParsers.CpuTimes currentCpuTimes) {
        if (previousCpuTimes == null) {
            return 0;
        }
        long totalDelta = currentCpuTimes.totalJiffies() - previousCpuTimes.totalJiffies();
        long idleDelta = currentCpuTimes.idleJiffies() - previousCpuTimes.idleJiffies();
        if (totalDelta <= 0) {
            return 0;
        }
        return Math.max(0, Math.min(100, (totalDelta - idleDelta) * 100.0 / totalDelta));
    }

    private NetworkCollection collectNetworkInterfaces(OffsetDateTime observedAt) {
        double deltaSeconds = computeDeltaSeconds(observedAt);
        List<ProbeIngestRequest.NetworkInterface> interfaces = new ArrayList<>();
        Map<String, ProcFileParsers.NetDevCounters> currentMap = new HashMap<>();
        for (ProcFileParsers.NetDevCounters counters : ProcFileParsers.parseNetDev(readString(procRoot().resolve("net/dev")))) {
            if ("lo".equals(counters.interfaceName())) {
                continue;
            }
            currentMap.put(counters.interfaceName(), counters);
            ProcFileParsers.NetDevCounters previous = previousNetCounters.get(counters.interfaceName());
            interfaces.add(new ProbeIngestRequest.NetworkInterface(
                    counters.interfaceName(),
                    rate(previous == null ? 0 : counters.rxBytes() - previous.rxBytes(), deltaSeconds),
                    rate(previous == null ? 0 : counters.txBytes() - previous.txBytes(), deltaSeconds),
                    rate(previous == null ? 0 : counters.rxPackets() - previous.rxPackets(), deltaSeconds),
                    rate(previous == null ? 0 : counters.txPackets() - previous.txPackets(), deltaSeconds)
            ));
        }
        previousNetCounters.clear();
        previousNetCounters.putAll(currentMap);
        interfaces.sort(Comparator.comparing(ProbeIngestRequest.NetworkInterface::interfaceName));
        return new NetworkCollection(interfaces);
    }

    private ProcessCollection collectProcesses(ProcFileParsers.CpuTimes currentCpuTimes,
                                               int cpuCores) {
        double totalJiffiesDelta = previousCpuTimes == null ? 0 : currentCpuTimes.totalJiffies() - previousCpuTimes.totalJiffies();
        List<ProcessCandidate> candidates = new ArrayList<>();
        Set<Integer> seenPids = new HashSet<>();
        Set<String> whitelist = properties.getWhitelistProcesses().stream()
                .map(name -> name.toLowerCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toSet());

        try (DirectoryStream<Path> processDirs = Files.newDirectoryStream(procRoot(), entry -> Files.isDirectory(entry) && isNumeric(entry.getFileName().toString()))) {
            for (Path processDir : processDirs) {
                int pid = Integer.parseInt(processDir.getFileName().toString());
                try {
                    ProcessCandidate candidate = readProcessCandidate(pid, processDir, totalJiffiesDelta, cpuCores, whitelist);
                    if (candidate != null) {
                        candidates.add(candidate);
                        seenPids.add(pid);
                    }
                } catch (Exception exception) {
                    log.debug("忽略无法解析的进程 {}: {}", pid, exception.getMessage());
                }
            }
        } catch (IOException exception) {
            throw new IllegalStateException("遍历 /proc 进程目录失败", exception);
        }

        previousProcessCpuJiffies.keySet().retainAll(seenPids);
        for (ProcessCandidate candidate : candidates) {
            previousProcessCpuJiffies.put(candidate.pid(), candidate.totalCpuJiffies());
        }

        List<ProcessCandidate> ranked = candidates.stream()
                .sorted(Comparator.comparingDouble(ProcessCandidate::cpuUsagePct).reversed()
                        .thenComparing(Comparator.comparingLong(ProcessCandidate::memoryRssBytes).reversed()))
                .toList();

        List<ProbeIngestRequest.ProcessInfo> selected = new ArrayList<>();
        Set<Integer> addedPids = new HashSet<>();
        for (ProcessCandidate candidate : ranked.stream().limit(properties.getProcessTopN()).toList()) {
            selected.add(candidate.toDto());
            addedPids.add(candidate.pid());
        }
        for (ProcessCandidate candidate : ranked) {
            if (!candidate.whitelisted() || addedPids.contains(candidate.pid())) {
                continue;
            }
            selected.add(candidate.toDto());
            addedPids.add(candidate.pid());
        }
        return new ProcessCollection(selected, candidates.size());
    }

    private ProcessCandidate readProcessCandidate(int pid,
                                                  Path processDir,
                                                  double totalJiffiesDelta,
                                                  int cpuCores,
                                                  Set<String> whitelist) throws IOException {
        ProcFileParsers.ProcessStat stat = ProcFileParsers.parseProcessStat(pid, readString(processDir.resolve("stat")));
        long rssBytes = ProcFileParsers.parseStatusVmRssBytes(readString(processDir.resolve("status")));
        String commandLine = readCommandLine(processDir.resolve("cmdline"));
        long previousCpu = previousProcessCpuJiffies.getOrDefault(pid, stat.totalJiffies());
        long processDelta = Math.max(0, stat.totalJiffies() - previousCpu);
        double cpuUsagePct = totalJiffiesDelta <= 0 ? 0 : (processDelta * 100.0 * cpuCores) / totalJiffiesDelta;
        boolean whitelisted = whitelist.contains(stat.processName().toLowerCase(Locale.ROOT));
        return new ProcessCandidate(
                pid,
                stat.processName(),
                commandLine,
                round(cpuUsagePct),
                rssBytes,
                stat.state(),
                whitelisted,
                stat.totalJiffies()
        );
    }

    private DiskUsage collectDiskUsage() {
        try {
            FileStore fileStore = Files.getFileStore(Path.of(properties.getDiskRoot()));
            long total = fileStore.getTotalSpace();
            long usable = fileStore.getUsableSpace();
            long used = Math.max(0L, total - usable);
            double usagePct = total <= 0 ? 0 : used * 100.0 / total;
            return new DiskUsage(total, used, usagePct);
        } catch (IOException exception) {
            throw new IllegalStateException("读取根文件系统容量失败", exception);
        }
    }

    private int collectTcpEstablishedCount() {
        Path procRoot = procRoot();
        return ProcFileParsers.countTcpEstablished(readString(procRoot.resolve("net/tcp")))
                + ProcFileParsers.countTcpEstablished(readString(procRoot.resolve("net/tcp6")));
    }


    private Path procRoot() {
        return Path.of(properties.getProcRoot());
    }

    private String readCommandLine(Path path) throws IOException {
        byte[] bytes = Files.readAllBytes(path);
        if (bytes.length == 0) {
            return "";
        }
        return new String(bytes, StandardCharsets.UTF_8)
                .replace('\u0000', ' ')
                .trim();
    }

    private String readString(Path path) {
        try {
            return Files.readString(path, StandardCharsets.UTF_8);
        } catch (IOException exception) {
            throw new IllegalStateException("读取文件失败: " + path, exception);
        }
    }

    private boolean isNumeric(String value) {
        for (int index = 0; index < value.length(); index++) {
            if (!Character.isDigit(value.charAt(index))) {
                return false;
            }
        }
        return !value.isEmpty();
    }

    private double computeDeltaSeconds(OffsetDateTime currentObservedAt) {
        if (previousObservedAt == null) {
            return 1;
        }
        return Math.max(1, Duration.between(previousObservedAt, currentObservedAt).toMillis() / 1000.0);
    }

    private long rate(long delta, double seconds) {
        if (delta <= 0 || seconds <= 0) {
            return 0L;
        }
        return Math.max(0L, Math.round(delta / seconds));
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private record DiskUsage(long totalBytes, long usedBytes, double usagePct) {
    }

    private record NetworkCollection(List<ProbeIngestRequest.NetworkInterface> interfaces) {
    }

    private record ProcessCollection(List<ProbeIngestRequest.ProcessInfo> processes, int totalProcessCount) {
    }

    private record ProcessCandidate(
            int pid,
            String processName,
            String commandLine,
            double cpuUsagePct,
            long memoryRssBytes,
            String state,
            boolean whitelisted,
            long totalCpuJiffies
    ) {
        ProbeIngestRequest.ProcessInfo toDto() {
            return new ProbeIngestRequest.ProcessInfo(pid, processName, commandLine, cpuUsagePct, memoryRssBytes, state, whitelisted);
        }
    }
}
