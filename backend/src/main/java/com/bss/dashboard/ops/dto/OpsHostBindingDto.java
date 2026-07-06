package com.bss.dashboard.ops.dto;

public record OpsHostBindingDto(
        String sourceSystem,
        String externalAssetId,
        String externalHostName,
        String bindingStatus
) {
}
