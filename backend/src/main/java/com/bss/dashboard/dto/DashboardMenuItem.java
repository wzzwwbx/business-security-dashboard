package com.bss.dashboard.dto;

public record DashboardMenuItem(
        String code,
        String name,
        String route,
        Integer badge
) {
}
