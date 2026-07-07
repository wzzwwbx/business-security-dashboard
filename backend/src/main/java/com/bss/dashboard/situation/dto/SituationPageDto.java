package com.bss.dashboard.situation.dto;

import java.util.List;

public record SituationPageDto(
        String code,
        String name,
        String title,
        String subtitle,
        String location,
        String lastUpdated,
        String dataMode,
        String summary,
        List<SituationHeroTagDto> heroTags,
        List<SituationActionItemDto> actions,
        List<SituationKpiDto> kpis,
        List<SituationHighlightDto> highlights,
        List<SituationSectionDto> sections
) {
}
