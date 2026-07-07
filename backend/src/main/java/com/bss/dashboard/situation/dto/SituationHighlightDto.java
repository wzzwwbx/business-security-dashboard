package com.bss.dashboard.situation.dto;

public record SituationHighlightDto(
        String title,
        String description,
        String metric,
        String meta,
        String tone
) {
}
