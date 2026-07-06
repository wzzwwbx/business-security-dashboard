package com.bss.dashboard.dto;

import java.util.List;

public record DashboardDataBundle(
        List<DashboardMenuItem> menu,
        List<DashboardPage> pages
) {
}
