package com.bss.dashboard.ops.controller;

import com.bss.dashboard.api.ApiResponse;
import com.bss.dashboard.ops.dto.*;
import com.bss.dashboard.ops.service.OpsQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Profile("mysql")
@RequestMapping("/api/ops")
public class OpsQueryController {

    private final OpsQueryService queryService;

    public OpsQueryController(OpsQueryService queryService) {
        this.queryService = queryService;
    }

    @GetMapping("/overview")
    public ApiResponse<OpsOverviewDto> getOverview() {
        return ApiResponse.success(queryService.getOverview());
    }

    @GetMapping("/hosts")
    public ApiResponse<OpsHostListDto> listHosts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(queryService.listHosts(keyword, status, page, size));
    }

    @GetMapping("/hosts/{hostId}")
    public ApiResponse<OpsHostDetailDto> getHost(@PathVariable long hostId) {
        return ApiResponse.success(queryService.getHostDetail(hostId));
    }

    @GetMapping("/hosts/{hostId}/timeseries")
    public ApiResponse<OpsTimeseriesDto> getTimeseries(
            @PathVariable long hostId,
            @RequestParam(defaultValue = "6h") String range
    ) {
        return ApiResponse.success(queryService.getTimeseries(hostId, range));
    }

    @GetMapping("/hosts/{hostId}/processes")
    public ApiResponse<List<OpsProcessDto>> getProcesses(@PathVariable long hostId) {
        return ApiResponse.success(queryService.listProcesses(hostId));
    }

    @GetMapping("/alerts")
    public ApiResponse<List<OpsAlertDto>> getAlerts(
            @RequestParam(required = false) Long hostId,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ApiResponse.success(queryService.listAlerts(hostId, limit));
    }

    @GetMapping("/sources")
    public ApiResponse<List<OpsSourceDto>> getSources() {
        return ApiResponse.success(queryService.listSources());
    }
}
