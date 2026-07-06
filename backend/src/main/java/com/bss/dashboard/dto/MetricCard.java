package com.bss.dashboard.dto;

public record MetricCard(
        String label,
        String value,
        String unit,
        String trend,
        String status,
        String description
) {
}
