package com.bss.dashboard.ops.dto;

import java.util.List;

public record OpsTimeseriesDto(
        String range,
        List<OpsTimeseriesPointDto> points
) {
}
