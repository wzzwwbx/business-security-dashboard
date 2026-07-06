package com.bss.dashboard.service.impl;

import com.bss.dashboard.dto.DashboardMenuItem;
import com.bss.dashboard.dto.DashboardPage;
import com.bss.dashboard.dto.MetricCard;
import com.bss.dashboard.dto.WidgetDefinition;
import com.bss.dashboard.dto.DashboardRuntimeInfo;
import com.bss.dashboard.exception.ResourceNotFoundException;
import com.bss.dashboard.service.DashboardService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import com.bss.dashboard.support.DashboardRuntimeResolver;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@Profile("mysql")
public class MysqlDashboardService implements DashboardService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final DashboardRuntimeResolver runtimeResolver;

    public MysqlDashboardService(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper, DashboardRuntimeResolver runtimeResolver) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.runtimeResolver = runtimeResolver;
    }

    @Override
    public List<DashboardMenuItem> getMenu() {
        return jdbcTemplate.query(
                """
                SELECT page_code, page_name, route, badge
                FROM dashboard_page
                WHERE active = 1
                ORDER BY page_order ASC
                """,
                (rs, rowNum) -> new DashboardMenuItem(
                        rs.getString("page_code"),
                        rs.getString("page_name"),
                        rs.getString("route"),
                        (Integer) rs.getObject("badge")
                )
        );
    }

    @Override
    public DashboardPage getPage(String pageCode) {
        List<DashboardPage> pages = jdbcTemplate.query(
                """
                SELECT page_code, page_name, page_title, page_subtitle, location, last_updated
                FROM dashboard_page
                WHERE active = 1 AND page_code = ?
                LIMIT 1
                """,
                (rs, rowNum) -> new DashboardPage(
                        rs.getString("page_code"),
                        rs.getString("page_name"),
                        rs.getString("page_title"),
                        rs.getString("page_subtitle"),
                        rs.getString("location"),
                        rs.getString("last_updated"),
                        "api",
                        Collections.emptyList(),
                        Collections.emptyList()
                ),
                pageCode
        );

        if (pages.isEmpty()) {
            throw new ResourceNotFoundException("未找到页面：" + pageCode);
        }

        DashboardPage basePage = pages.get(0);
        List<MetricCard> metrics = jdbcTemplate.query(
                """
                SELECT metric_label, metric_value, metric_unit, trend, status, description
                FROM dashboard_metric
                WHERE page_code = ?
                ORDER BY metric_order ASC
                """,
                (rs, rowNum) -> new MetricCard(
                        rs.getString("metric_label"),
                        rs.getString("metric_value"),
                        rs.getString("metric_unit"),
                        rs.getString("trend"),
                        rs.getString("status"),
                        rs.getString("description")
                ),
                pageCode
        );

        List<WidgetDefinition> widgets = jdbcTemplate.query(
                """
                SELECT widget_code, widget_title, widget_type, col_span, min_height, tags_json, payload_json
                FROM dashboard_widget
                WHERE page_code = ?
                ORDER BY widget_order ASC
                """,
                (rs, rowNum) -> new WidgetDefinition(
                        rs.getString("widget_code"),
                        rs.getString("widget_title"),
                        rs.getString("widget_type"),
                        rs.getInt("col_span"),
                        (Integer) rs.getObject("min_height"),
                        readTags(rs.getString("tags_json")),
                        readPayload(rs.getString("payload_json"))
                ),
                pageCode
        );

        return new DashboardPage(
                basePage.code(),
                basePage.name(),
                basePage.title(),
                basePage.subtitle(),
                basePage.location(),
                basePage.lastUpdated(),
                "api",
                metrics,
                widgets
        );
    }

    @Override
    public DashboardRuntimeInfo getRuntimeInfo() {
        return runtimeResolver.resolve();
    }

    private List<String> readTags(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }

        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalStateException("解析 tags_json 失败", e);
        }
    }

    private Map<String, Object> readPayload(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }

        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalStateException("解析 payload_json 失败", e);
        }
    }
}
