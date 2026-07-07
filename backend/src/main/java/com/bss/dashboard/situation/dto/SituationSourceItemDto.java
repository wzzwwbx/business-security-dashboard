package com.bss.dashboard.situation.dto;

public record SituationSourceItemDto(
        String source,
        String status,
        String latency,
        String coverage,
        String note,
        String tone
) {
}
