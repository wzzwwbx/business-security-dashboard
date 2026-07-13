package com.bss.dashboard.situation.dto;

import java.util.List;

public record SituationGeoOverviewDto(
        String generatedAt,
        List<SitePoint> sites,
        List<TerminalRegion> terminalRegions,
        List<DomainSummary> domains
) {
    public record SitePoint(String kind, String siteCode, String name, String countryCode, String countryName,
                            String city, double longitude, double latitude, String status, int deviceCount,
                            double onlineRate, int alertCount, int resourceUsage) {}

    public record TerminalRegion(String kind, String countryCode, String countryName, double longitude,
                                 double latitude, int total, int online, int offline, int warning,
                                 int danger, String status) {}

    public record DomainMetric(String label, String value) {}

    public record DomainSummary(String code, String name, String status, List<DomainMetric> metrics) {}
}
