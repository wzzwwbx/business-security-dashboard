package com.bss.dashboard.situation.dto;

public record SituationSignalItemDto(
        String label,
        String title,
        String description,
        String meta,
        String tone
) {
}
