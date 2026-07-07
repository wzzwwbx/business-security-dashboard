package com.bss.dashboard.situation.dto;

import java.util.List;
import java.util.Map;

public record SituationChartSectionDto(
        String kind,
        String code,
        String title,
        String description,
        List<String> tags,
        Integer colSpan,
        Integer minHeight,
        Map<String, Object> option,
        String footer
) implements SituationSectionDto {
}
