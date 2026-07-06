package com.bss.dashboard.service;

import com.bss.dashboard.dto.DashboardMenuItem;
import com.bss.dashboard.dto.DashboardPage;
import com.bss.dashboard.dto.DashboardRuntimeInfo;

import java.util.List;

public interface DashboardService {

    List<DashboardMenuItem> getMenu();

    DashboardPage getPage(String pageCode);

    DashboardRuntimeInfo getRuntimeInfo();
}
