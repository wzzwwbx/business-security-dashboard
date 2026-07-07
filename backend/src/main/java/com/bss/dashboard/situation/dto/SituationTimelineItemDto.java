package com.bss.dashboard.situation.dto;

public record SituationTimelineItemDto(
        String time,
        String title,
        String description,
        String actor,
        String tone
) {
}
