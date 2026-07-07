package com.bss.dashboard.situation.dto;

import java.util.Map;

public record SituationTableRowDto(
        Map<String, String> cells,
        Map<String, String> tones
) {
}
