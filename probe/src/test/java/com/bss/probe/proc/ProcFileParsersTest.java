package com.bss.probe.proc;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProcFileParsersTest {

    @Test
    void shouldParseCpuTimes() {
        ProcFileParsers.CpuTimes cpuTimes = ProcFileParsers.parseCpuTimes("""
                cpu  4705 0 2250 104450 240 0 120 0 0 0
                cpu0 2300 0 1020 52100 120 0 60 0 0 0
                """);

        assertEquals(111765L, cpuTimes.totalJiffies());
        assertEquals(104690L, cpuTimes.idleJiffies());
    }

    @Test
    void shouldParseMemoryStats() {
        ProcFileParsers.MemoryStats memoryStats = ProcFileParsers.parseMemoryStats("""
                MemTotal:       16344956 kB
                MemFree:         1234567 kB
                MemAvailable:    6123456 kB
                Buffers:          345678 kB
                Cached:          1456789 kB
                SwapTotal:       2097148 kB
                SwapFree:        1048574 kB
                """);

        assertEquals(16_737_234_944L, memoryStats.memTotalBytes());
        assertEquals(6_270_418_944L, memoryStats.memAvailableBytes());
        assertEquals(10_466_816_000L, memoryStats.memUsedBytes());
        assertEquals(1_073_739_776L, memoryStats.swapUsedBytes());
    }

    @Test
    void shouldParseNetDev() {
        List<ProcFileParsers.NetDevCounters> interfaces = ProcFileParsers.parseNetDev("""
                Inter-|   Receive                                                |  Transmit
                 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
                  lo: 100 10 0 0 0 0 0 0 100 10 0 0 0 0 0 0
                eth0: 2048 32 0 0 0 0 0 0 1024 16 0 0 0 0 0 0
                """);

        assertEquals(2, interfaces.size());
        assertEquals("eth0", interfaces.get(1).interfaceName());
        assertEquals(2048L, interfaces.get(1).rxBytes());
        assertEquals(16L, interfaces.get(1).txPackets());
    }

    @Test
    void shouldCountEstablishedTcpSessions() {
        int count = ProcFileParsers.countTcpEstablished("""
                  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode
                   0: 0100007F:1F90 00000000:0000 0A 00000000:00000000 00:00000000 00000000   100        0 1 1 0000000000000000 100 0 0 10 0
                   1: 0F00000A:A5B2 2200000A:01BB 01 00000000:00000000 00:00000000 00000000   100        0 1 1 0000000000000000 100 0 0 10 0
                   2: 0F00000A:A5B3 3300000A:01BB 01 00000000:00000000 00:00000000 00000000   100        0 1 1 0000000000000000 100 0 0 10 0
                """);

        assertEquals(2, count);
    }

    @Test
    void shouldParseProcessStatAndVmRss() {
        ProcFileParsers.ProcessStat stat = ProcFileParsers.parseProcessStat(1234,
                "1234 (java) S 1 2 3 4 5 6 7 8 9 10 120 50 13 14 15 16 17 18 19 20");
        long rss = ProcFileParsers.parseStatusVmRssBytes("""
                Name:\tjava
                State:\tS (sleeping)
                VmRSS:\t  262144 kB
                """);

        assertEquals(1234, stat.pid());
        assertEquals("java", stat.processName());
        assertEquals("S", stat.state());
        assertEquals(170L, stat.totalJiffies());
        assertEquals(268_435_456L, rss);
    }
}
