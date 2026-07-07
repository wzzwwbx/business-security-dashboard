package com.bss.dashboard.ops.dto;

import com.bss.dashboard.ops.domain.SourceType;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

public record OpsIngestRequest(
        SourceType sourceType,
        String sourceSystem,
        String requestId,
        String externalAssetId,
        String schemaVersion,
        String payloadType,
        String observedAt,
        @Valid OpsHostPayload host,
        @Valid OpsSnapshotPayload snapshot,
        List<@Valid OpsNetworkInterfacePayload> networkInterfaces,
        List<@Valid OpsProcessPayload> processes,
        Map<String, String> labels,
        Map<String, Object> attributes,
        Map<String, Object> metrics,
        Map<String, Object> extensions
) {
}
