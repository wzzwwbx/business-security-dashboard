package com.bss.dashboard.situation.dto;

import java.util.List;

public record SituationMatrixSectionDto(
        String kind,
        String code,
        String title,
        String description,
        List<String> tags,
        Integer colSpan,
        Integer minHeight,
        List<SituationMatrixItemDto> items
) implements SituationSectionDto {
}
