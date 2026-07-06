package com.bss.dashboard.controller;

import com.bss.dashboard.dto.DashboardMenuItem;
import com.bss.dashboard.dto.DashboardPage;
import com.bss.dashboard.dto.DashboardRuntimeInfo;
import com.bss.dashboard.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/pages")
    public List<DashboardMenuItem> getPages() {
        return dashboardService.getMenu();
    }

    @GetMapping("/pages/{pageCode}")
    public DashboardPage getPage(@PathVariable String pageCode) {
        return dashboardService.getPage(pageCode);
    }

    @GetMapping("/runtime")
    public DashboardRuntimeInfo getRuntimeInfo() {
        return dashboardService.getRuntimeInfo();
    }
}
