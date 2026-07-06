package com.bss.dashboard.service.impl;

import com.bss.dashboard.dto.DashboardMenuItem;
import com.bss.dashboard.dto.DashboardPage;
import com.bss.dashboard.dto.DashboardRuntimeInfo;
import com.bss.dashboard.service.DashboardService;
import com.bss.dashboard.support.DashboardDataLoader;
import com.bss.dashboard.support.DashboardRuntimeResolver;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Profile("mock")
public class MockDashboardService implements DashboardService {

    private final DashboardDataLoader dataLoader;
    private final DashboardRuntimeResolver runtimeResolver;

    public MockDashboardService(DashboardDataLoader dataLoader, DashboardRuntimeResolver runtimeResolver) {
        this.dataLoader = dataLoader;
        this.runtimeResolver = runtimeResolver;
    }

    @Override
    public List<DashboardMenuItem> getMenu() {
        return dataLoader.load().menu();
    }

    @Override
    public DashboardPage getPage(String pageCode) {
        return dataLoader.getPage(pageCode);
    }

    @Override
    public DashboardRuntimeInfo getRuntimeInfo() {
        return runtimeResolver.resolve();
    }
}
