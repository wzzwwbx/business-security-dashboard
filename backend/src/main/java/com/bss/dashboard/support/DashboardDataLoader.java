package com.bss.dashboard.support;

import com.bss.dashboard.dto.DashboardDataBundle;
import com.bss.dashboard.dto.DashboardPage;
import com.bss.dashboard.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class DashboardDataLoader {

    private final ObjectMapper objectMapper;
    private DashboardDataBundle cache;

    public DashboardDataLoader(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public synchronized DashboardDataBundle load() {
        if (cache != null) {
            return cache;
        }

        try {
            cache = objectMapper.readValue(
                    new ClassPathResource("mock/dashboard-data.json").getInputStream(),
                    DashboardDataBundle.class
            );
            return cache;
        } catch (IOException e) {
            throw new IllegalStateException("无法加载演示数据文件 mock/dashboard-data.json", e);
        }
    }

    public DashboardPage getPage(String pageCode) {
        return load().pages().stream()
                .filter(page -> page.code().equals(pageCode))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("未找到页面：" + pageCode));
    }
}
