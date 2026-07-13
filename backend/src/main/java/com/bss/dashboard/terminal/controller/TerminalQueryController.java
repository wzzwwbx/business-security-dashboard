package com.bss.dashboard.terminal.controller;

import com.bss.dashboard.api.ApiResponse;
import com.bss.dashboard.terminal.dto.TerminalDeviceDetailDto;
import com.bss.dashboard.terminal.dto.TerminalDeviceListDto;
import com.bss.dashboard.terminal.dto.TerminalEventDto;
import com.bss.dashboard.terminal.dto.TerminalOverviewDto;
import com.bss.dashboard.terminal.dto.TerminalPeripheralEventDto;
import com.bss.dashboard.terminal.dto.TerminalSoftwareChangeDto;
import com.bss.dashboard.terminal.dto.TerminalSourceDto;
import com.bss.dashboard.terminal.dto.TerminalTimeseriesDto;
import com.bss.dashboard.terminal.service.TerminalQueryService;
import org.springframework.context.annotation.Profile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Objects;

/**
 * 终端查询控制器。
 */
@RestController
@Profile("mysql")
@RequestMapping("/api/terminal")
@PreAuthorize("hasAuthority('page:terminal:view')")
public class TerminalQueryController {

    private final TerminalQueryService queryService;

    public TerminalQueryController(TerminalQueryService queryService) {
        this.queryService = Objects.requireNonNull(queryService, "queryService must not be null");
    }

    /**
     * 查询终端总览。
     *
     * @return 总览指标
     */
    @GetMapping("/overview")
    public ApiResponse<TerminalOverviewDto> getOverview(
            @RequestParam(required = false) String countryCode,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String siteCode
    ) {
        return ApiResponse.success(queryService.getOverview());
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
    @GetMapping("/devices")
    public ApiResponse<TerminalDeviceListDto> listDevices(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String ownershipStatus,
            @RequestParam(required = false) String countryCode,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String siteCode,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(queryService.listDevices(keyword, status, riskLevel, ownershipStatus, page, size));
    }

    /**
     * 查询终端详情。
     *
     * @param deviceId 终端主键
     * @return 终端详情
     */
    @GetMapping("/devices/{deviceId}")
    public ApiResponse<TerminalDeviceDetailDto> getDevice(@PathVariable long deviceId) {
        return ApiResponse.success(queryService.getDeviceDetail(deviceId));
    }

    /**
     * 查询终端事件列表。
     *
     * @param deviceId 终端主键
     * @param limit 返回条数
     * @return 事件列表
     */
    @GetMapping("/devices/{deviceId}/events")
    public ApiResponse<List<TerminalEventDto>> getEvents(
            @PathVariable long deviceId,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ApiResponse.success(queryService.listEvents(deviceId, limit));
    }

    /**
     * 查询终端软件变更列表。
     *
     * @param deviceId 终端主键
     * @param limit 返回条数
     * @return 软件变更列表
     */
    @GetMapping("/devices/{deviceId}/software-changes")
    public ApiResponse<List<TerminalSoftwareChangeDto>> getSoftwareChanges(
            @PathVariable long deviceId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(queryService.listSoftwareChanges(deviceId, limit));
    }

    /**
     * 查询终端外设接入列表。
     *
     * @param deviceId 终端主键
     * @param limit 返回条数
     * @return 外设接入列表
     */
    @GetMapping("/devices/{deviceId}/peripherals")
    public ApiResponse<List<TerminalPeripheralEventDto>> getPeripheralEvents(
            @PathVariable long deviceId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(queryService.listPeripheralEvents(deviceId, limit));
    }

    /**
     * 查询终端趋势。
     *
     * @param deviceId 终端主键
     * @param range 时间范围
     * @return 趋势结果
     */
    @GetMapping("/devices/{deviceId}/timeseries")
    public ApiResponse<TerminalTimeseriesDto> getTimeseries(
            @PathVariable long deviceId,
            @RequestParam(defaultValue = "24h") String range
    ) {
        return ApiResponse.success(queryService.getTimeseries(deviceId, range));
    }

    /**
     * 查询来源概览。
     *
     * @return 来源概览列表
     */
    @GetMapping("/sources")
    public ApiResponse<List<TerminalSourceDto>> getSources() {
        return ApiResponse.success(queryService.listSources());
    }
}
