package com.bss.dashboard.dto;

import java.util.List;

public record DashboardPage(
        String code,
        String name,
        String title,
        String subtitle,
        String location,
        String lastUpdated,
        String dataMode,
        List<MetricCard> summaryMetrics,
        List<WidgetDefinition> widgets
) {
}
