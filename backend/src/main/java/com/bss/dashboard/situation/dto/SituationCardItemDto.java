package com.bss.dashboard.situation.dto;

public record SituationCardItemDto(
        String name,
        String summary,
        String metric,
        String detail,
        String tone,
        Integer progress
) {
}
