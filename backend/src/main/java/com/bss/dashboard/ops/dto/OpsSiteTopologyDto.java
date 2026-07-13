package com.bss.dashboard.ops.dto;

import java.util.List;

public record OpsSiteTopologyDto(Site site, List<Device> devices, List<Link> links) {
    public record Site(String siteCode, String name, String countryName, String city, String status,
                       int deviceCount, double onlineRate, int alertCount, int resourceUsage) {}

    public record Metric(String label, String value) {}

    public record Device(long id, String deviceCode, String siteCode, String name, String deviceType,
                         String primaryIp, String vendor, String model, String status, int x, int y,
                         Long hostId, int alertCount, List<Metric> metrics, List<String> policies,
                         List<String> audits) {}

    public record Link(long from, long to, String status, int latencyMs, String bandwidth) {}
}
