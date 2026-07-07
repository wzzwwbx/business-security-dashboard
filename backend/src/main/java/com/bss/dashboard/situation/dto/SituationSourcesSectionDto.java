package com.bss.dashboard.situation.dto;

import java.util.List;

public record SituationSourcesSectionDto(
        String kind,
        String code,
        String title,
        String description,
        List<String> tags,
        Integer colSpan,
        Integer minHeight,
        List<SituationSourceItemDto> items
) implements SituationSectionDto {
}
