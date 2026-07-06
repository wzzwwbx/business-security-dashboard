package com.bss.dashboard.ops.dto;

import com.bss.dashboard.ops.domain.SourceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record OpsIngestRequest(
        SourceType sourceType,
        @NotBlank String sourceSystem,
        String requestId,
        String externalAssetId,
        @NotBlank String observedAt,
        @Valid @NotNull OpsHostPayload host,
        @Valid @NotNull OpsSnapshotPayload snapshot,
        List<@Valid OpsNetworkInterfacePayload> networkInterfaces,
        List<@Valid OpsProcessPayload> processes
) {
}
