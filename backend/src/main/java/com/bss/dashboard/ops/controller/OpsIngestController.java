package com.bss.dashboard.ops.controller;

import com.bss.dashboard.api.ApiResponse;
import com.bss.dashboard.ops.dto.OpsIngestRequest;
import com.bss.dashboard.ops.dto.OpsIngestResultDto;
import com.bss.dashboard.ops.service.OpsIngestService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile("mysql")
@RequestMapping("/api/ops/ingest")
public class OpsIngestController {

    private final OpsIngestService ingestService;

    public OpsIngestController(OpsIngestService ingestService) {
        this.ingestService = ingestService;
    }

    @PostMapping("/probe")
    public ApiResponse<OpsIngestResultDto> ingestProbe(
            @RequestHeader("X-Agent-Key") String agentKey,
            @RequestHeader("X-Timestamp") String timestamp,
            @RequestHeader("X-Signature") String signature,
            @Valid @RequestBody OpsIngestRequest request
    ) {
        return ApiResponse.success("probe ingest success", ingestService.ingestProbe(agentKey, timestamp, signature, request));
    }

    @PostMapping("/external")
    public ApiResponse<OpsIngestResultDto> ingestExternal(
            @RequestHeader("X-Ingest-Token") String token,
            @Valid @RequestBody OpsIngestRequest request
    ) {
        return ApiResponse.success("external ingest success", ingestService.ingestExternal(token, request));
    }

    @PostMapping("/manual")
    public ApiResponse<OpsIngestResultDto> ingestManual(
            @RequestHeader("X-Ingest-Token") String token,
            @Valid @RequestBody OpsIngestRequest request
    ) {
        return ApiResponse.success("manual ingest success", ingestService.ingestManual(token, request));
    }
}
