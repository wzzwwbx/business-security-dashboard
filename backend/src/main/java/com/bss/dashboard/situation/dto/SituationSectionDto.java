package com.bss.dashboard.situation.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.util.List;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "kind", visible = true)
@JsonSubTypes({
        @JsonSubTypes.Type(value = SituationMatrixSectionDto.class, name = "matrix"),
        @JsonSubTypes.Type(value = SituationChartSectionDto.class, name = "chart"),
        @JsonSubTypes.Type(value = SituationSignalsSectionDto.class, name = "signals"),
        @JsonSubTypes.Type(value = SituationSourcesSectionDto.class, name = "sources"),
        @JsonSubTypes.Type(value = SituationCardsSectionDto.class, name = "cards"),
        @JsonSubTypes.Type(value = SituationTableSectionDto.class, name = "table"),
        @JsonSubTypes.Type(value = SituationTimelineSectionDto.class, name = "timeline")
})
public sealed interface SituationSectionDto permits SituationMatrixSectionDto,
        SituationChartSectionDto,
        SituationSignalsSectionDto,
        SituationSourcesSectionDto,
        SituationCardsSectionDto,
        SituationTableSectionDto,
        SituationTimelineSectionDto {

    String kind();

    String code();

    String title();

    String description();

    List<String> tags();

    Integer colSpan();

    Integer minHeight();
}
