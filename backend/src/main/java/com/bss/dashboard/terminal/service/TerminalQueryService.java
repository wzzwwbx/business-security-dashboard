package com.bss.dashboard.terminal.service;

import com.bss.dashboard.terminal.config.TerminalProperties;
import com.bss.dashboard.terminal.domain.TerminalDeviceStatus;
import com.bss.dashboard.terminal.dto.TerminalDeviceDetailDto;
import com.bss.dashboard.terminal.dto.TerminalDeviceListDto;
import com.bss.dashboard.terminal.dto.TerminalDeviceSummaryDto;
import com.bss.dashboard.terminal.dto.TerminalEventDto;
import com.bss.dashboard.terminal.dto.TerminalOverviewDto;
import com.bss.dashboard.terminal.dto.TerminalPeripheralEventDto;
import com.bss.dashboard.terminal.dto.TerminalSoftwareChangeDto;
import com.bss.dashboard.terminal.dto.TerminalSourceDto;
import com.bss.dashboard.terminal.dto.TerminalTimeseriesDto;
import com.bss.dashboard.terminal.repository.TerminalRepository;
import com.bss.dashboard.terminal.support.TerminalTimeFormats;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * 终端查询服务。
 *
 * <p>职责：</p>
 * <ul>
 *     <li>聚合终端域查询结果</li>
 *     <li>统一计算在线状态与来源健康状态</li>
 *     <li>为前端提供稳定 DTO</li>
 * </ul>
 */
@Service
@Profile("mysql")
public class TerminalQueryService {

    private static final int DEVICE_SCAN_LIMIT = 10_000;

    private final TerminalRepository repository;
    private final TerminalProperties properties;

    public TerminalQueryService(TerminalRepository repository, TerminalProperties properties) {
        this.repository = Objects.requireNonNull(repository, "repository must not be null");
        this.properties = Objects.requireNonNull(properties, "properties must not be null");
    }

    /**
     * 查询终端总览。
     *
     * @return 总览指标
     */
    public TerminalOverviewDto getOverview() {
        List<TerminalDeviceSummaryDto> devices = loadNormalizedDevices(null);
        int online = 0;
        int stale = 0;
        int offline = 0;
        int highRisk = 0;
        int abnormalPasswordModule = 0;
        int fingerprintChanged = 0;
        int pendingClaim = 0;
        for (TerminalDeviceSummaryDto device : devices) {
            switch (device.status()) {
                case "ONLINE" -> online++;
                case "STALE" -> stale++;
                default -> offline++;
            }
            if ("HIGH".equals(device.riskLevel()) || "CRITICAL".equals(device.riskLevel())) {
                highRisk++;
            }
            if (isAbnormalPasswordModule(device.passwordModuleStatus())) {
                abnormalPasswordModule++;
            }
            if (device.fingerprintChanged()) {
                fingerprintChanged++;
            }
            if ("PENDING_CLAIM".equals(device.ownershipStatus())) {
                pendingClaim++;
            }
        }
        return new TerminalOverviewDto(
                TerminalTimeFormats.format(LocalDateTime.now()),
                online,
                stale,
                offline,
                highRisk,
                abnormalPasswordModule,
                fingerprintChanged,
                pendingClaim,
                repository.countPeripheralAlerts(24),
                repository.countSoftwareChangedDevices(24),
                repository.listSources().size()
        );
    }

    /**
     * 查询终端列表。
     *
     * @param keyword 关键字
     * @param status 状态过滤
     * @param riskLevel 风险等级过滤
     * @param ownershipStatus 归属状态过滤
     * @param page 页码
     * @param size 每页条数
     * @return 列表结果
     */
    public TerminalDeviceListDto listDevices(String keyword, String status, String riskLevel, String ownershipStatus, int page, int size) {
        List<TerminalDeviceSummaryDto> normalized = loadNormalizedDevices(keyword).stream()
                .filter(item -> status == null || status.isBlank() || item.status().equalsIgnoreCase(status))
                .filter(item -> riskLevel == null || riskLevel.isBlank() || item.riskLevel().equalsIgnoreCase(riskLevel))
                .filter(item -> ownershipStatus == null || ownershipStatus.isBlank()
                        || item.ownershipStatus().equalsIgnoreCase(ownershipStatus))
                .toList();
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(size, 1);
        int from = Math.max(0, (safePage - 1) * safeSize);
        int to = Math.min(normalized.size(), from + safeSize);
        List<TerminalDeviceSummaryDto> paged = from >= normalized.size() ? List.of() : normalized.subList(from, to);
        return new TerminalDeviceListDto(paged, safePage, safeSize, normalized.size());
    }

    /**
     * 查询终端详情。
     *
     * @param deviceId 终端主键
     * @return 终端详情
     */
    public TerminalDeviceDetailDto getDeviceDetail(long deviceId) {
        TerminalDeviceDetailDto detail = repository.getDeviceDetail(deviceId);
        return new TerminalDeviceDetailDto(
                detail.id(),
                detail.deviceCode(),
                detail.displayName(),
                computeDeviceStatus(detail.lastObservedAt()),
                detail.riskLevel(),
                detail.lastObservedAt(),
                detail.sourceType(),
                detail.sourceSystem(),
                detail.ownershipStatus(),
                detail.reportedPhoneNumberMasked(),
                detail.person(),
                detail.deviceInfo(),
                detail.latestSecurity(),
                detail.bindings()
        );
    }

    /**
     * 查询终端事件。
     *
     * @param deviceId 终端主键
     * @param limit 返回条数
     * @return 事件列表
     */
    public List<TerminalEventDto> listEvents(long deviceId, int limit) {
        return repository.listEvents(deviceId, Math.max(limit, 1));
    }

    /**
     * 查询终端软件变更。
     *
     * @param deviceId 终端主键
     * @param limit 返回条数
     * @return 软件变更列表
     */
    public List<TerminalSoftwareChangeDto> listSoftwareChanges(long deviceId, int limit) {
        return repository.listSoftwareChanges(deviceId, Math.max(limit, 1));
    }

    /**
     * 查询终端外设接入记录。
     *
     * @param deviceId 终端主键
     * @param limit 返回条数
     * @return 外设接入列表
     */
    public List<TerminalPeripheralEventDto> listPeripheralEvents(long deviceId, int limit) {
        return repository.listPeripheralEvents(deviceId, Math.max(limit, 1));
    }

    /**
     * 查询终端趋势。
     *
     * @param deviceId 终端主键
     * @param range 时间范围
     * @return 趋势数据
     */
    public TerminalTimeseriesDto getTimeseries(long deviceId, String range) {
        LocalDateTime since = switch (range) {
            case "6h" -> LocalDateTime.now().minusHours(6);
            case "24h" -> LocalDateTime.now().minusHours(24);
            case "7d" -> LocalDateTime.now().minusDays(7);
            default -> LocalDateTime.now().minusHours(24);
        };
        return new TerminalTimeseriesDto(range, repository.listTimeseries(deviceId, since));
    }

    /**
     * 查询来源概览。
     *
     * @return 来源列表
     */
    public List<TerminalSourceDto> listSources() {
        return repository.listSources().stream().map(this::applySourceStatus).toList();
    }

    private List<TerminalDeviceSummaryDto> loadNormalizedDevices(String keyword) {
        return repository.listDevices(keyword, DEVICE_SCAN_LIMIT).stream()
                .map(this::applyStatus)
                .toList();
    }

    private TerminalDeviceSummaryDto applyStatus(TerminalDeviceSummaryDto item) {
        return new TerminalDeviceSummaryDto(
                item.id(),
                item.deviceCode(),
                item.displayName(),
                item.personName(),
                item.employeeNo(),
                item.departmentName(),
                item.phoneNumberMasked(),
                item.primaryIp(),
                item.osVersion(),
                item.imei(),
                item.meid(),
                item.passwordModuleStatus(),
                item.riskLevel(),
                computeDeviceStatus(item.lastObservedAt()),
                item.ownershipStatus(),
                item.trafficUsedBytes(),
                item.fingerprintChanged(),
                item.configModified(),
                item.lastObservedAt(),
                item.sourceType(),
                item.sourceSystem()
        );
    }

    private TerminalSourceDto applySourceStatus(TerminalSourceDto item) {
        return new TerminalSourceDto(
                item.sourceType(),
                item.sourceSystem(),
                item.enabled(),
                computeSourceStatus(item.enabled(), item.lastSeenAt()),
                item.deviceCount(),
                item.lastSeenAt()
        );
    }

    private String computeDeviceStatus(String lastObservedAt) {
        if (lastObservedAt == null || lastObservedAt.isBlank()) {
            return TerminalDeviceStatus.OFFLINE.name();
        }
        Duration gap = Duration.between(TerminalTimeFormats.parseToLocalDateTime(lastObservedAt), LocalDateTime.now());
        long seconds = gap.getSeconds();
        long staleThreshold = properties.getSamplingIntervalSeconds() * properties.getStaleAfterPeriods();
        long offlineThreshold = properties.getSamplingIntervalSeconds() * properties.getOfflineAfterPeriods();
        if (seconds >= offlineThreshold) {
            return TerminalDeviceStatus.OFFLINE.name();
        }
        if (seconds >= staleThreshold) {
            return TerminalDeviceStatus.STALE.name();
        }
        return TerminalDeviceStatus.ONLINE.name();
    }

    private String computeSourceStatus(boolean enabled, String lastSeenAt) {
        if (!enabled) {
            return "DISABLED";
        }
        if (lastSeenAt == null || lastSeenAt.isBlank()) {
            return "UNKNOWN";
        }
        String terminalStatus = computeDeviceStatus(lastSeenAt);
        return switch (terminalStatus) {
            case "ONLINE" -> "HEALTHY";
            case "STALE" -> "DEGRADED";
            default -> "OFFLINE";
        };
    }

    private boolean isAbnormalPasswordModule(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        String normalized = value.trim().toUpperCase();
        return !("NORMAL".equals(normalized) || "HEALTHY".equals(normalized) || "ACTIVE".equals(normalized)
                || "AVAILABLE".equals(normalized) || "启用".equals(value.trim()) || "正常".equals(value.trim()));
    }
}
