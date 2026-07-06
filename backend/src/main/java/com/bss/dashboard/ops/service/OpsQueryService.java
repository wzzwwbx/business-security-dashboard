package com.bss.dashboard.ops.service;

import com.bss.dashboard.ops.config.OpsProperties;
import com.bss.dashboard.ops.domain.HostStatus;
import com.bss.dashboard.ops.dto.*;
import com.bss.dashboard.ops.repository.OpsRepository;
import com.bss.dashboard.ops.support.OpsTimeFormats;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Profile("mysql")
public class OpsQueryService {

    private static final int HOST_SCAN_LIMIT = 10_000;

    private final OpsRepository repository;
    private final OpsProperties properties;

    public OpsQueryService(OpsRepository repository, OpsProperties properties) {
        this.repository = repository;
        this.properties = properties;
    }

    public OpsOverviewDto getOverview() {
        OpsOverviewDto rawOverview = repository.getOverview(OpsTimeFormats.format(LocalDateTime.now()));
        List<OpsHostSummaryDto> hosts = loadNormalizedHosts(null);
        int online = 0;
        int stale = 0;
        int offline = 0;
        for (OpsHostSummaryDto host : hosts) {
            switch (host.status()) {
                case "ONLINE" -> online++;
                case "STALE" -> stale++;
                default -> offline++;
            }
        }
        return new OpsOverviewDto(
                rawOverview.generatedAt(),
                online,
                stale,
                offline,
                rawOverview.openAlerts(),
                rawOverview.sourceCount(),
                rawOverview.averageCpuUsagePct(),
                rawOverview.averageMemoryUsagePct()
        );
    }

    public OpsHostListDto listHosts(String keyword, String status, int page, int size) {
        List<OpsHostSummaryDto> normalized = loadNormalizedHosts(keyword).stream()
                .filter(item -> status == null || status.isBlank() || item.status().equalsIgnoreCase(status))
                .toList();
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(size, 1);
        int from = Math.max(0, (safePage - 1) * safeSize);
        int to = Math.min(normalized.size(), from + safeSize);
        List<OpsHostSummaryDto> paged = from >= normalized.size() ? List.of() : normalized.subList(from, to);
        return new OpsHostListDto(paged, safePage, safeSize, normalized.size());
    }

    public OpsHostDetailDto getHostDetail(long hostId) {
        OpsHostDetailDto detail = repository.getHostDetail(hostId);
        return new OpsHostDetailDto(
                detail.id(),
                detail.hostCode(),
                detail.hostname(),
                detail.displayName(),
                detail.primaryIp(),
                computeHostStatus(detail.lastObservedAt()),
                detail.sourceType(),
                detail.sourceSystem(),
                detail.osName(),
                detail.kernelVersion(),
                detail.arch(),
                detail.cpuCores(),
                detail.memoryTotalBytes(),
                detail.lastObservedAt(),
                detail.latestSnapshot(),
                detail.bindings()
        );
    }

    public OpsTimeseriesDto getTimeseries(long hostId, String range) {
        LocalDateTime since = switch (range) {
            case "1h" -> LocalDateTime.now().minusHours(1);
            case "6h" -> LocalDateTime.now().minusHours(6);
            case "24h" -> LocalDateTime.now().minusHours(24);
            default -> LocalDateTime.now().minusHours(6);
        };
        return new OpsTimeseriesDto(range, repository.listTimeseries(hostId, since));
    }

    public List<OpsProcessDto> listProcesses(long hostId) {
        return repository.listProcesses(hostId);
    }

    public List<OpsAlertDto> listAlerts(Long hostId, int limit) {
        return repository.listAlerts(hostId, limit);
    }

    public List<OpsSourceDto> listSources() {
        return repository.listSources().stream().map(this::applySourceStatus).toList();
    }

    private List<OpsHostSummaryDto> loadNormalizedHosts(String keyword) {
        return repository.listHosts(keyword, null, 1, HOST_SCAN_LIMIT).items().stream()
                .map(this::applyStatus)
                .toList();
    }

    private OpsHostSummaryDto applyStatus(OpsHostSummaryDto item) {
        return new OpsHostSummaryDto(
                item.id(),
                item.hostCode(),
                item.hostname(),
                item.displayName(),
                item.primaryIp(),
                computeHostStatus(item.lastObservedAt()),
                item.sourceType(),
                item.sourceSystem(),
                item.cpuUsagePct(),
                item.memoryUsagePct(),
                item.load1(),
                item.diskUsagePct(),
                item.openAlertCount(),
                item.lastObservedAt()
        );
    }

    private OpsSourceDto applySourceStatus(OpsSourceDto item) {
        return new OpsSourceDto(
                item.sourceType(),
                item.sourceSystem(),
                item.enabled(),
                computeSourceStatus(item.enabled(), item.lastSeenAt()),
                item.hostCount(),
                item.lastSeenAt()
        );
    }

    private String computeHostStatus(String lastObservedAt) {
        if (lastObservedAt == null || lastObservedAt.isBlank()) {
            return HostStatus.OFFLINE.name();
        }
        Duration gap = Duration.between(OpsTimeFormats.parseToLocalDateTime(lastObservedAt), LocalDateTime.now());
        long seconds = gap.getSeconds();
        long staleThreshold = properties.getSamplingIntervalSeconds() * properties.getStaleAfterPeriods();
        long offlineThreshold = properties.getSamplingIntervalSeconds() * properties.getOfflineAfterPeriods();
        if (seconds >= offlineThreshold) {
            return HostStatus.OFFLINE.name();
        }
        if (seconds >= staleThreshold) {
            return HostStatus.STALE.name();
        }
        return HostStatus.ONLINE.name();
    }

    private String computeSourceStatus(boolean enabled, String lastSeenAt) {
        if (!enabled) {
            return "DISABLED";
        }
        if (lastSeenAt == null || lastSeenAt.isBlank()) {
            return "UNKNOWN";
        }
        String hostStatus = computeHostStatus(lastSeenAt);
        return switch (hostStatus) {
            case "ONLINE" -> "HEALTHY";
            case "STALE" -> "DEGRADED";
            default -> "OFFLINE";
        };
    }
}
