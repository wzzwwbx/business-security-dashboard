package com.bss.dashboard.ops.service;

import com.bss.dashboard.exception.ResourceNotFoundException;
import com.bss.dashboard.ops.dto.OpsSiteTopologyDto;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OpsTopologyService {

    private final List<OpsSiteTopologyDto.Site> sites = List.of(
            new OpsSiteTopologyDto.Site("beijing-core", "北京中心机房", "中国", "北京", "warning", 86, 97.7, 5, 72)
    );

    public List<OpsSiteTopologyDto.Site> listSites() {
        return sites;
    }

    public OpsSiteTopologyDto getTopology(String siteCode) {
        OpsSiteTopologyDto.Site site = sites.stream().filter(item -> item.siteCode().equals(siteCode)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("机房不存在: " + siteCode));
        long offset = (long) sites.indexOf(site) * 1000;
        List<OpsSiteTopologyDto.Device> devices = List.of(
                device(101 + offset, siteCode, "WAN-01", "专网接入链路", "link", "172.18.0.1", "专线运营商", "MPLS-VPN", "success", 50, 9, null, 0, "入口带宽", "2 Gbps", "当前时延", "18 ms"),
                device(102 + offset, siteCode, "FW-01", "边界防火墙 A", "firewall", "10.10.0.2", "华为", "USG6680E", site.alertCount() > 2 ? "warning" : "success", 38, 28, null, Math.min(2, site.alertCount()), "会话数", "18,642", "策略命中", "96.8%"),
                device(103 + offset, siteCode, "GW-01", "安全接入网关", "gateway", "10.10.0.3", "深信服", "VPN-1000", "success", 62, 28, null, 0, "在线隧道", "126", "认证成功率", "99.4%"),
                device(104 + offset, siteCode, "SW-CORE", "核心交换机", "switch", "10.10.1.1", "华为", "CloudEngine S12700E", "success", 50, 47, null, 0, "端口利用率", "63%", "丢包率", "0.02%"),
                device(105 + offset, siteCode, "APP-01", "密信应用服务器", "server", "10.55.19.22", "浪潮", "NF5180M6", "warning", 22, 72, offset == 0 ? 2L : null, 2, "CPU", "88.4%", "内存", "86.0%"),
                device(106 + offset, siteCode, "APP-02", "签阅应用服务器", "server", "10.23.8.11", "华为", "TaiShan 200", "success", 42, 72, offset == 0 ? 1L : null, 0, "CPU", "43.2%", "内存", "54.4%"),
                device(107 + offset, siteCode, "DB-01", "核心业务数据库", "database", "10.55.20.10", "达梦", "DM8", site.status().equals("danger") ? "danger" : "warning", 62, 72, null, Math.max(1, site.alertCount() - 2), "连接数", "412", "存储使用", "87.5%"),
                device(108 + offset, siteCode, "SAN-01", "集中存储阵列", "storage", "10.55.30.10", "华为", "OceanStor 5500", "success", 82, 72, null, 0, "容量", "68%", "IOPS", "12.4k")
        );
        return new OpsSiteTopologyDto(site, devices, List.of(
                link(101 + offset, 102 + offset, "success", 18, "2 Gbps"), link(101 + offset, 103 + offset, "success", 20, "1 Gbps"),
                link(102 + offset, 104 + offset, "warning", 36, "10 Gbps"), link(103 + offset, 104 + offset, "success", 12, "10 Gbps"),
                link(104 + offset, 105 + offset, "success", 8, "10 Gbps"), link(104 + offset, 106 + offset, "success", 8, "10 Gbps"),
                link(104 + offset, 107 + offset, "warning", 48, "10 Gbps"), link(104 + offset, 108 + offset, "success", 7, "10 Gbps")
        ));
    }

    public OpsSiteTopologyDto.Device getDevice(long deviceId) {
        return sites.stream().map(site -> getTopology(site.siteCode())).flatMap(topology -> topology.devices().stream())
                .filter(device -> device.id() == deviceId).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("设备不存在: " + deviceId));
    }

    private OpsSiteTopologyDto.Device device(long id, String siteCode, String code, String name, String type,
                                             String ip, String vendor, String model, String status, int x, int y,
                                             Long hostId, int alerts, String metric1, String value1, String metric2, String value2) {
        return new OpsSiteTopologyDto.Device(id, code, siteCode, name, type, ip, vendor, model, status, x, y,
                hostId, alerts, List.of(new OpsSiteTopologyDto.Metric(metric1, value1), new OpsSiteTopologyDto.Metric(metric2, value2)),
                List.of("设备基线策略已生效", "关键配置变更需要复核"), List.of("最近健康检查通过", "策略执行结果已归档"));
    }

    private OpsSiteTopologyDto.Link link(long from, long to, String status, int latency, String bandwidth) {
        return new OpsSiteTopologyDto.Link(from, to, status, latency, bandwidth);
    }
}
