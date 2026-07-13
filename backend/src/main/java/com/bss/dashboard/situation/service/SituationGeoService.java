package com.bss.dashboard.situation.service;

import com.bss.dashboard.situation.dto.SituationGeoOverviewDto;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class SituationGeoService {

    public SituationGeoOverviewDto getOverview() {
        return new SituationGeoOverviewDto(
                OffsetDateTime.now().toString(),
                List.of(
                        site("beijing-core", "北京中心机房", "CN", "中国", "北京", 116.4, 39.9, "warning", 86, 97.7, 5, 72)
                ),
                List.of(
                        region("CN", "中国", 104.2, 35.8, 326, 307, 8, 9, 2, "warning"),
                        region("AE", "阿联酋", 54.4, 24.3, 86, 79, 2, 4, 1, "warning"),
                        region("SG", "新加坡", 103.8, 1.3, 64, 62, 1, 1, 0, "success"),
                        region("DE", "德国", 10.4, 51.1, 48, 43, 2, 2, 1, "danger"),
                        region("KE", "肯尼亚", 37.9, 0.2, 35, 33, 1, 1, 0, "success"),
                        region("BR", "巴西", -51.9, -14.2, 27, 24, 1, 2, 0, "warning")
                ),
                List.of(
                        domain("security", "安全态势", "danger", "高危事件", "4 起", "高风险用户", "12 人", "异常行为", "37 条"),
                        domain("business", "业务态势", "success", "密信收发", "12.8 万", "签阅积压", "23 件", "加解密成功率", "99.6%"),
                        domain("terminal", "终端态势", "warning", "终端在线率", "94.8%", "高风险终端", "6 台", "USB Key 失败", "18 次"),
                        domain("ops", "运维态势", "warning", "机房健康度", "92 分", "离线设备", "3 台", "资源告警", "21 条")
                )
        );
    }

    private SituationGeoOverviewDto.SitePoint site(String code, String name, String countryCode, String countryName,
                                                    String city, double longitude, double latitude, String status,
                                                    int devices, double onlineRate, int alerts, int usage) {
        return new SituationGeoOverviewDto.SitePoint("site", code, name, countryCode, countryName, city,
                longitude, latitude, status, devices, onlineRate, alerts, usage);
    }

    private SituationGeoOverviewDto.TerminalRegion region(String code, String name, double longitude, double latitude,
                                                           int total, int online, int offline, int warning, int danger,
                                                           String status) {
        return new SituationGeoOverviewDto.TerminalRegion("terminal-region", code, name, longitude, latitude,
                total, online, offline, warning, danger, status);
    }

    private SituationGeoOverviewDto.DomainSummary domain(String code, String name, String status, String... values) {
        return new SituationGeoOverviewDto.DomainSummary(code, name, status, List.of(
                new SituationGeoOverviewDto.DomainMetric(values[0], values[1]),
                new SituationGeoOverviewDto.DomainMetric(values[2], values[3]),
                new SituationGeoOverviewDto.DomainMetric(values[4], values[5])
        ));
    }
}
