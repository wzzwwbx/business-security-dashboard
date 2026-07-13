import type { OpsSiteSummary, OpsSiteTopology, OpsTopologyDevice } from '@/types/opsTopology';

export const mockOpsSites: OpsSiteSummary[] = [
  { siteCode: 'beijing-core', name: '北京中心机房', countryName: '中国', city: '北京', status: 'warning', deviceCount: 86, onlineRate: 97.7, alertCount: 5, resourceUsage: 72 }
];

const devices: OpsTopologyDevice[] = [
  { id: 101, deviceCode: 'WAN-BJ-01', siteCode: 'beijing-core', name: '专网接入链路', deviceType: 'link', primaryIp: '172.18.0.1', vendor: '专线运营商', model: 'MPLS-VPN', status: 'success', x: 50, y: 9, alertCount: 0, metrics: [{ label: '入口带宽', value: '2 Gbps' }, { label: '当前时延', value: '18 ms' }], policies: ['链路自动切换策略已生效'], audits: ['16:31 主链路健康检查通过'] },
  { id: 102, deviceCode: 'FW-BJ-01', siteCode: 'beijing-core', name: '边界防火墙 A', deviceType: 'firewall', primaryIp: '10.10.0.2', vendor: '华为', model: 'USG6680E', status: 'warning', x: 38, y: 28, alertCount: 2, metrics: [{ label: '会话数', value: '18,642' }, { label: '策略命中', value: '96.8%' }], policies: ['零信任访问策略 v42', '高危端口阻断策略'], audits: ['16:28 策略 v42 下发完成', '15:55 管理员复核异常会话'] },
  { id: 103, deviceCode: 'GW-BJ-01', siteCode: 'beijing-core', name: '安全接入网关', deviceType: 'gateway', primaryIp: '10.10.0.3', vendor: '深信服', model: 'VPN-1000', status: 'success', x: 62, y: 28, alertCount: 0, metrics: [{ label: '在线隧道', value: '126' }, { label: '认证成功率', value: '99.4%' }], policies: ['双因素认证策略已生效'], audits: ['16:20 证书状态同步完成'] },
  { id: 104, deviceCode: 'SW-BJ-CORE', siteCode: 'beijing-core', name: '核心交换机', deviceType: 'switch', primaryIp: '10.10.1.1', vendor: '华为', model: 'CloudEngine S12700E', status: 'success', x: 50, y: 47, alertCount: 0, metrics: [{ label: '端口利用率', value: '63%' }, { label: '丢包率', value: '0.02%' }], policies: ['核心 VLAN 隔离策略'], audits: ['16:12 配置完整性校验通过'] },
  { id: 105, deviceCode: 'APP-BJ-01', siteCode: 'beijing-core', name: '密信应用服务器', deviceType: 'server', primaryIp: '10.55.19.22', vendor: '浪潮', model: 'NF5180M6', status: 'warning', x: 20, y: 72, hostId: 2, alertCount: 2, metrics: [{ label: 'CPU', value: '88.4%' }, { label: '内存', value: '86.0%' }], policies: ['应用进程白名单'], audits: ['16:03 资源告警升级为关注'] },
  { id: 106, deviceCode: 'APP-BJ-02', siteCode: 'beijing-core', name: '签阅应用服务器', deviceType: 'server', primaryIp: '10.23.8.11', vendor: '华为', model: 'TaiShan 200', status: 'success', x: 40, y: 72, hostId: 1, alertCount: 0, metrics: [{ label: 'CPU', value: '43.2%' }, { label: '内存', value: '54.4%' }], policies: ['签阅服务基线策略'], audits: ['15:58 健康检查通过'] },
  { id: 107, deviceCode: 'DB-BJ-01', siteCode: 'beijing-core', name: '核心业务数据库', deviceType: 'database', primaryIp: '10.55.20.10', vendor: '达梦', model: 'DM8', status: 'danger', x: 60, y: 72, alertCount: 3, metrics: [{ label: '连接数', value: '412' }, { label: '存储使用', value: '87.5%' }], policies: ['数据库审计策略', '敏感表访问控制'], audits: ['16:34 慢查询告警触发', '16:05 审计日志归档'] },
  { id: 108, deviceCode: 'ST-BJ-01', siteCode: 'beijing-core', name: '集中存储阵列', deviceType: 'storage', primaryIp: '10.55.30.10', vendor: '华为', model: 'OceanStor 5500', status: 'success', x: 80, y: 72, alertCount: 0, metrics: [{ label: '容量', value: '68%' }, { label: 'IOPS', value: '12.4k' }], policies: ['每日快照与异地复制'], audits: ['16:00 增量快照完成'] },
  { id: 109, deviceCode: 'COL-BJ-01', siteCode: 'beijing-core', name: '日志采集节点', deviceType: 'collector', primaryIp: '10.66.0.18', vendor: '通用', model: 'ARM Collector', status: 'success', x: 50, y: 92, hostId: 3, alertCount: 0, metrics: [{ label: '日志速率', value: '8.6k/s' }, { label: '积压', value: '0' }], policies: ['日志完整性校验'], audits: ['16:35 审计数据上送完成'] }
];

const links = [
  { from: 101, to: 102, status: 'success' as const, latencyMs: 18, bandwidth: '2 Gbps' }, { from: 101, to: 103, status: 'success' as const, latencyMs: 20, bandwidth: '1 Gbps' },
  { from: 102, to: 104, status: 'warning' as const, latencyMs: 36, bandwidth: '10 Gbps' }, { from: 103, to: 104, status: 'success' as const, latencyMs: 12, bandwidth: '10 Gbps' },
  ...[105, 106, 107, 108].map((to) => ({ from: 104, to, status: to === 107 ? 'danger' as const : 'success' as const, latencyMs: to === 107 ? 48 : 8, bandwidth: '10 Gbps' })),
  { from: 105, to: 109, status: 'success' as const, latencyMs: 5, bandwidth: '1 Gbps' }, { from: 106, to: 109, status: 'success' as const, latencyMs: 4, bandwidth: '1 Gbps' }, { from: 107, to: 109, status: 'warning' as const, latencyMs: 26, bandwidth: '1 Gbps' }
];

export function getMockOpsTopology(siteCode: string): OpsSiteTopology {
  const site = mockOpsSites.find((item) => item.siteCode === siteCode) ?? mockOpsSites[0];
  return { site, devices, links };
}
