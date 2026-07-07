package com.bss.probe.service;

import com.bss.probe.config.ProbeProperties;
import com.bss.probe.dto.ProbeIngestRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LinuxProbeCollectorTest {

    @TempDir
    Path tempDir;

    @Test
    void shouldCollectTopNAndWhitelistedProcessesFromCustomProcRoot() throws Exception {
        Path procRoot = Files.createDirectories(tempDir.resolve("proc"));
        Path netRoot = Files.createDirectories(procRoot.resolve("net"));
        writeCommonHostFiles();
        writeProcSnapshot(
                procRoot,
                "cpu  100 0 0 900 0 0 0 0 0 0\n",
                "MemTotal:       32768000 kB\nMemAvailable:   16384000 kB\nSwapTotal:       4096000 kB\nSwapFree:        2048000 kB\n",
                "1.23 0.98 0.76 1/128 12345\n",
                "Inter-|   Receive                                                |  Transmit\n" +
                        " face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed\n" +
                        "  lo: 100 10 0 0 0 0 0 0 100 10 0 0 0 0 0 0\n" +
                        "eth0: 1000 10 0 0 0 0 0 0 2000 20 0 0 0 0 0 0\n",
                "  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode\n" +
                        "   0: 0F00000A:A5B2 2200000A:01BB 01 00000000:00000000 00:00000000 00000000   100        0 1 1 0000000000000000 100 0 0 10 0\n",
                "  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode\n",
                List.of(
                        process(101, "java", 300, 100, 400_000, "java -jar app.jar"),
                        process(102, "python", 280, 80, 220_000, "python worker.py"),
                        process(103, "nginx", 20, 10, 90_000, "nginx: master process")
                )
        );

        ProbeProperties properties = new ProbeProperties();
        properties.setProcRoot(procRoot.toString());
        properties.setHostnameFile(tempDir.resolve("hostname").toString());
        properties.setOsReleaseFile(tempDir.resolve("os-release").toString());
        properties.setMachineIdFile(tempDir.resolve("machine-id").toString());
        properties.setDbusMachineIdFile(tempDir.resolve("missing-machine-id").toString());
        properties.setDiskRoot(tempDir.toString());
        properties.setProcessTopN(2);
        properties.setWhitelistProcesses(List.of("nginx"));

        LinuxProbeCollector collector = new LinuxProbeCollector(properties, new HostIdentityService(properties));
        ProbeIngestRequest first = collector.collect();

        assertEquals(0.0, first.snapshot().cpuUsagePct());
        assertEquals(3, first.snapshot().processCount());
        assertEquals(1, first.snapshot().tcpEstablishedCount());
        assertEquals(0L, first.networkInterfaces().get(0).rxBytesPerSec());
        assertEquals("fixture-arm-node", first.host().hostname());
        assertEquals("Test Linux ARM", first.host().osName());
        assertEquals(33_554_432_000L, first.host().memoryTotalBytes());

        writeProcSnapshot(
                procRoot,
                "cpu  200 0 0 950 0 0 0 0 0 0\n",
                "MemTotal:       32768000 kB\nMemAvailable:   14336000 kB\nSwapTotal:       4096000 kB\nSwapFree:        1024000 kB\n",
                "2.10 1.60 1.20 1/128 12346\n",
                "Inter-|   Receive                                                |  Transmit\n" +
                        " face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed\n" +
                        "  lo: 100 10 0 0 0 0 0 0 100 10 0 0 0 0 0 0\n" +
                        "eth0: 6000 50 0 0 0 0 0 0 8000 60 0 0 0 0 0 0\n",
                "  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode\n" +
                        "   0: 0F00000A:A5B2 2200000A:01BB 01 00000000:00000000 00:00000000 00000000   100        0 1 1 0000000000000000 100 0 0 10 0\n" +
                        "   1: 0F00000A:A5B3 3300000A:01BB 01 00000000:00000000 00:00000000 00000000   100        0 1 1 0000000000000000 100 0 0 10 0\n",
                "  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode\n",
                List.of(
                        process(101, "java", 700, 200, 420_000, "java -jar app.jar"),
                        process(102, "python", 520, 180, 240_000, "python worker.py"),
                        process(103, "nginx", 260, 110, 95_000, "nginx: master process")
                )
        );

        ProbeIngestRequest second = collector.collect();

        assertTrue(second.snapshot().cpuUsagePct() > 0.0);
        assertEquals(2, second.snapshot().tcpEstablishedCount());
        assertEquals(3, second.snapshot().processCount());
        assertEquals(1, second.networkInterfaces().size());
        assertTrue(second.networkInterfaces().get(0).rxBytesPerSec() > 0L);
        assertTrue(second.networkInterfaces().get(0).txBytesPerSec() > 0L);
        assertEquals(3, second.processes().size(), "top2 + whitelist 应全部上报");
        assertEquals("java", second.processes().get(0).processName());
        assertEquals("python", second.processes().get(1).processName());
        assertEquals("nginx", second.processes().get(2).processName());
        assertFalse(second.processes().get(0).whitelisted());
        assertTrue(second.processes().get(2).whitelisted());
        assertNotNull(second.host().hostCode());
        assertEquals(64, second.host().hostCode().length());
    }

    private void writeCommonHostFiles() throws Exception {
        Files.writeString(tempDir.resolve("hostname"), "fixture-arm-node\n", StandardCharsets.UTF_8);
        Files.writeString(tempDir.resolve("os-release"), "PRETTY_NAME=\"Test Linux ARM\"\n", StandardCharsets.UTF_8);
        Files.writeString(tempDir.resolve("machine-id"), "fixture-machine-id-001\n", StandardCharsets.UTF_8);
    }

    private void writeProcSnapshot(Path procRoot,
                                   String stat,
                                   String meminfo,
                                   String loadavg,
                                   String netDev,
                                   String tcp,
                                   String tcp6,
                                   List<ProcessFixture> processes) throws Exception {
        Files.createDirectories(procRoot.resolve("net"));
        Files.writeString(procRoot.resolve("stat"), stat, StandardCharsets.UTF_8);
        Files.writeString(procRoot.resolve("meminfo"), meminfo, StandardCharsets.UTF_8);
        Files.writeString(procRoot.resolve("loadavg"), loadavg, StandardCharsets.UTF_8);
        Files.writeString(procRoot.resolve("net/dev"), netDev, StandardCharsets.UTF_8);
        Files.writeString(procRoot.resolve("net/tcp"), tcp, StandardCharsets.UTF_8);
        Files.writeString(procRoot.resolve("net/tcp6"), tcp6, StandardCharsets.UTF_8);

        try (var stream = Files.list(procRoot)) {
            stream.filter(path -> Files.isDirectory(path) && path.getFileName().toString().chars().allMatch(Character::isDigit))
                    .forEach(path -> {
                        try {
                            Files.walk(path)
                                    .sorted((left, right) -> right.getNameCount() - left.getNameCount())
                                    .forEach(item -> {
                                        try {
                                            Files.deleteIfExists(item);
                                        } catch (Exception ignored) {
                                            // ignore
                                        }
                                    });
                        } catch (Exception ignored) {
                            // ignore
                        }
                    });
        }

        for (ProcessFixture process : processes) {
            Path processDir = Files.createDirectories(procRoot.resolve(String.valueOf(process.pid())));
            Files.writeString(processDir.resolve("stat"), process.statLine(), StandardCharsets.UTF_8);
            Files.writeString(processDir.resolve("status"), "Name:\t" + process.name() + "\nState:\tS (sleeping)\nVmRSS:\t  " + process.vmRssKb() + " kB\n", StandardCharsets.UTF_8);
            Files.write(processDir.resolve("cmdline"), process.commandLine().replace(' ', '\u0000').concat("\u0000").getBytes(StandardCharsets.UTF_8));
        }
    }

    private ProcessFixture process(int pid, String name, long utime, long stime, long vmRssKb, String commandLine) {
        return new ProcessFixture(pid, name, utime, stime, vmRssKb, commandLine);
    }

    private record ProcessFixture(int pid, String name, long utime, long stime, long vmRssKb, String commandLine) {
        String statLine() {
            return pid + " (" + name + ") S 1 2 3 4 5 6 7 8 9 10 " + utime + ' ' + stime + " 13 14 15 16 17 18 19 20\n";
        }
    }
}
