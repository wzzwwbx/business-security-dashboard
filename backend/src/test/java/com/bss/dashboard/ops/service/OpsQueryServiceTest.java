package com.bss.dashboard.ops.service;

import com.bss.dashboard.ops.config.OpsProperties;
import com.bss.dashboard.ops.dto.OpsHostDetailDto;
import com.bss.dashboard.ops.dto.OpsHostListDto;
import com.bss.dashboard.ops.dto.OpsHostSummaryDto;
import com.bss.dashboard.ops.dto.OpsOverviewDto;
import com.bss.dashboard.ops.dto.OpsSourceDto;
import com.bss.dashboard.ops.dto.OpsTimeseriesDto;
import com.bss.dashboard.ops.repository.OpsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OpsQueryServiceTest {

    private OpsRepository repository;
    private OpsQueryService service;

    @BeforeEach
    void setUp() {
        repository = mock(OpsRepository.class);
        OpsProperties properties = new OpsProperties();
        properties.setSamplingIntervalSeconds(60);
        properties.setStaleAfterPeriods(2);
        properties.setOfflineAfterPeriods(5);
        service = new OpsQueryService(repository, properties);
    }

    @Test
    void shouldRecomputeHostStatusForHostListAndDetail() {
        String staleObservedAt = LocalDateTime.now().minusMinutes(3).toString();
        String onlineObservedAt = LocalDateTime.now().minusSeconds(45).toString();
        String offlineObservedAt = LocalDateTime.now().minusMinutes(6).toString();

        when(repository.listHosts(null, null, 1, 10_000)).thenReturn(buildRepositoryHostList(onlineObservedAt, staleObservedAt, offlineObservedAt));

        OpsHostListDto hostList = service.listHosts(null, null, 1, 20);

        assertEquals(List.of("ONLINE", "STALE", "OFFLINE"), hostList.items().stream().map(OpsHostSummaryDto::status).toList());

        OpsHostDetailDto detail = new OpsHostDetailDto(
                2L,
                "host-2",
                "stale-host",
                "延迟主机",
                "10.0.0.2",
                "ONLINE",
                "PROBE",
                "linux-arm-probe",
                "Linux",
                "6.1.0",
                "aarch64",
                8,
                16_000_000_000L,
                staleObservedAt,
                new OpsHostDetailDto.OpsLatestSnapshotDto(42.0, 61.0, 1.2, 1.1, 1.0, 9_000_000_000L, 7_000_000_000L, 0L, 300_000_000_000L, 500_000_000_000L, 60.0, 120, 130),
                List.of()
        );
        when(repository.getHostDetail(2L)).thenReturn(detail);

        assertEquals("STALE", service.getHostDetail(2L).status());
    }

    @Test
    void shouldFilterByRecomputedStatusInsteadOfStoredStatus() {
        String onlineObservedAt = LocalDateTime.now().minusSeconds(40).toString();
        String staleObservedAt = LocalDateTime.now().minusMinutes(3).toString();
        String offlineObservedAt = LocalDateTime.now().minusMinutes(7).toString();
        when(repository.listHosts(null, null, 1, 10_000)).thenReturn(buildRepositoryHostList(onlineObservedAt, staleObservedAt, offlineObservedAt));

        OpsHostListDto staleHosts = service.listHosts(null, "stale", 1, 20);
        OpsHostListDto offlineHosts = service.listHosts(null, "OFFLINE", 1, 20);

        assertEquals(1, staleHosts.total());
        assertEquals("host-2", staleHosts.items().get(0).hostCode());
        assertEquals(1, offlineHosts.total());
        assertEquals("host-3", offlineHosts.items().get(0).hostCode());
    }

    @Test
    void shouldAcceptOffsetTimestampsForFreshnessComputations() {
        String staleObservedAt = LocalDateTime.now().minusMinutes(3).atOffset(ZoneOffset.UTC).toString();

        when(repository.getHostDetail(2L)).thenReturn(new OpsHostDetailDto(
                2L,
                "host-2",
                "stale-host",
                "延迟主机",
                "10.0.0.2",
                "ONLINE",
                "PROBE",
                "linux-arm-probe",
                "Linux",
                "6.1.0",
                "aarch64",
                8,
                16_000_000_000L,
                staleObservedAt,
                new OpsHostDetailDto.OpsLatestSnapshotDto(42.0, 61.0, 1.2, 1.1, 1.0, 9_000_000_000L, 7_000_000_000L, 0L, 300_000_000_000L, 500_000_000_000L, 60.0, 120, 130),
                List.of()
        ));

        assertEquals("STALE", service.getHostDetail(2L).status());
    }

    @Test
    void shouldMapSourceFreshnessToHealthStatus() {
        String healthyAt = LocalDateTime.now().minusSeconds(30).toString();
        String degradedAt = LocalDateTime.now().minusMinutes(3).toString();
        String offlineAt = LocalDateTime.now().minusMinutes(10).toString();

        when(repository.listSources()).thenReturn(List.of(
                new OpsSourceDto("PROBE", "probe-a", true, "UNKNOWN", 2, healthyAt),
                new OpsSourceDto("EXTERNAL_API", "cmdb-sync", true, "UNKNOWN", 3, degradedAt),
                new OpsSourceDto("MANUAL_IMPORT", "demo", true, "UNKNOWN", 1, offlineAt),
                new OpsSourceDto("PROBE", "probe-disabled", false, "UNKNOWN", 0, healthyAt)
        ));

        List<OpsSourceDto> sources = service.listSources();

        assertEquals(List.of("HEALTHY", "DEGRADED", "OFFLINE", "DISABLED"),
                sources.stream().map(OpsSourceDto::status).toList());
    }

    @Test
    void shouldRecomputeOverviewStatusCounts() {
        String onlineObservedAt = LocalDateTime.now().minusSeconds(30).toString();
        String staleObservedAt = LocalDateTime.now().minusMinutes(3).toString();
        String offlineObservedAt = LocalDateTime.now().minusMinutes(8).toString();
        OpsOverviewDto rawOverview = new OpsOverviewDto(LocalDateTime.now().toString(), 3, 0, 0, 2, 3, 51.8, 59.28);

        when(repository.getOverview(anyString())).thenReturn(rawOverview);
        when(repository.listHosts(null, null, 1, 10_000)).thenReturn(buildRepositoryHostList(onlineObservedAt, staleObservedAt, offlineObservedAt));

        OpsOverviewDto overview = service.getOverview();

        assertEquals(1, overview.onlineHosts());
        assertEquals(1, overview.staleHosts());
        assertEquals(1, overview.offlineHosts());
        assertEquals(2, overview.openAlerts());
        assertEquals(3, overview.sourceCount());
        assertEquals(51.8, overview.averageCpuUsagePct());
        assertEquals(59.28, overview.averageMemoryUsagePct());
    }

    @Test
    void shouldPassThroughTimeseries() {
        when(repository.listTimeseries(eq(9L), any(LocalDateTime.class))).thenReturn(List.of());

        OpsTimeseriesDto timeseries = service.getTimeseries(9L, "24h");
        assertEquals("24h", timeseries.range());
        assertEquals(0, timeseries.points().size());
    }

    private OpsHostListDto buildRepositoryHostList(String onlineObservedAt, String staleObservedAt, String offlineObservedAt) {
        return new OpsHostListDto(List.of(
                new OpsHostSummaryDto(1L, "host-1", "online-host", "在线主机", "10.0.0.1", "ONLINE", "PROBE", "linux-arm-probe", 20.0, 30.0, 0.9, 45.0, 0, onlineObservedAt),
                new OpsHostSummaryDto(2L, "host-2", "stale-host", "延迟主机", "10.0.0.2", "ONLINE", "PROBE", "linux-arm-probe", 50.0, 55.0, 1.2, 60.0, 1, staleObservedAt),
                new OpsHostSummaryDto(3L, "host-3", "offline-host", "离线主机", "10.0.0.3", "ONLINE", "PROBE", "linux-arm-probe", 0.0, 0.0, 0.0, 0.0, 0, offlineObservedAt)
        ), 1, 10_000, 3);
    }
}
