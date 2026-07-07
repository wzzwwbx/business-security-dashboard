package com.bss.dashboard.situation.dto;

public record SituationMatrixItemDto(
        String name,
        String owner,
        String score,
        String status,
        String trend,
        String source,
        String description,
        String tone
) {
}
