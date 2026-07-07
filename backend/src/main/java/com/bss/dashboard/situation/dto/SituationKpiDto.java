package com.bss.dashboard.situation.dto;

public record SituationKpiDto(
        String label,
        String value,
        String unit,
        String trend,
        String description,
        String tone
) {
}
