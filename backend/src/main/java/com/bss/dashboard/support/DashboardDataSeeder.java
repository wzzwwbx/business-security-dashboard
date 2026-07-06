package com.bss.dashboard.support;

import com.bss.dashboard.dto.DashboardPage;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("mysql")
public class DashboardDataSeeder implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final DashboardDataLoader dataLoader;
    private final ObjectMapper objectMapper;

    public DashboardDataSeeder(JdbcTemplate jdbcTemplate, DashboardDataLoader dataLoader, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataLoader = dataLoader;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        var bundle = dataLoader.load();

        jdbcTemplate.update("UPDATE dashboard_page SET active = 0");

        int pageOrder = 1;
        for (var menuItem : bundle.menu()) {
            DashboardPage page = bundle.pages().stream()
                    .filter(item -> item.code().equals(menuItem.code()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("演示数据缺少页面定义：" + menuItem.code()));

            upsertPage(page, menuItem.route(), menuItem.badge(), pageOrder++);
            jdbcTemplate.update("DELETE FROM dashboard_metric WHERE page_code = ?", page.code());
            jdbcTemplate.update("DELETE FROM dashboard_widget WHERE page_code = ?", page.code());

            seedMetrics(page);
            seedWidgets(page);
        }
    }

    private void upsertPage(DashboardPage page, String route, Integer badge, int pageOrder) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM dashboard_page WHERE page_code = ?",
                Integer.class,
                page.code()
        );

        if (count != null && count > 0) {
            jdbcTemplate.update(
                    """
                    UPDATE dashboard_page
                    SET page_name = ?, route = ?, badge = ?, page_title = ?, page_subtitle = ?, location = ?, last_updated = ?, page_order = ?, active = 1
                    WHERE page_code = ?
                    """,
                    page.name(),
                    route,
                    badge,
                    page.title(),
                    page.subtitle(),
                    page.location(),
                    page.lastUpdated(),
                    pageOrder,
                    page.code()
            );
            return;
        }

        jdbcTemplate.update(
                """
                INSERT INTO dashboard_page (page_code, page_name, route, badge, page_title, page_subtitle, location, last_updated, page_order, active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                """,
                page.code(),
                page.name(),
                route,
                badge,
                page.title(),
                page.subtitle(),
                page.location(),
                page.lastUpdated(),
                pageOrder
        );
    }

    private void seedMetrics(DashboardPage page) {
        int metricOrder = 1;
        for (var metric : page.summaryMetrics()) {
            jdbcTemplate.update(
                    """
                    INSERT INTO dashboard_metric (page_code, metric_label, metric_value, metric_unit, trend, status, description, metric_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    page.code(),
                    metric.label(),
                    metric.value(),
                    metric.unit(),
                    metric.trend(),
                    metric.status(),
                    metric.description(),
                    metricOrder++
            );
        }
    }

    private void seedWidgets(DashboardPage page) {
        int widgetOrder = 1;
        for (var widget : page.widgets()) {
            try {
                jdbcTemplate.update(
                        """
                        INSERT INTO dashboard_widget (page_code, widget_code, widget_title, widget_type, col_span, min_height, tags_json, payload_json, widget_order)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        page.code(),
                        widget.code(),
                        widget.title(),
                        widget.type(),
                        widget.colSpan(),
                        widget.minHeight(),
                        objectMapper.writeValueAsString(widget.tags()),
                        objectMapper.writeValueAsString(widget.payload()),
                        widgetOrder++
                );
            } catch (Exception e) {
                throw new IllegalStateException("写入组件数据失败：" + widget.code(), e);
            }
        }
    }
}
