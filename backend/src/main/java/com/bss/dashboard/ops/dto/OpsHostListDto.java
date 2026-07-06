package com.bss.dashboard.ops.dto;

import java.util.List;

public record OpsHostListDto(
        List<OpsHostSummaryDto> items,
        int page,
        int size,
        long total
) {
}
