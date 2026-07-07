package com.bss.dashboard.situation.dto;

import java.util.List;

public record SituationTableSectionDto(
        String kind,
        String code,
        String title,
        String description,
        List<String> tags,
        Integer colSpan,
        Integer minHeight,
        List<SituationTableColumnDto> columns,
        List<SituationTableRowDto> rows
) implements SituationSectionDto {
}
