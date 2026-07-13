import type { SituationGeoOverview } from '@/types/situationGeo';

export const mockSituationGeoOverview: SituationGeoOverview = {
  generatedAt: '2026-07-13 16:42:18',
  sites: [
    { kind: 'site', siteCode: 'beijing-core', name: '北京中心机房', countryCode: 'CN', countryName: '中国', city: '北京', longitude: 116.4, latitude: 39.9, status: 'warning', deviceCount: 86, onlineRate: 97.7, alertCount: 5, resourceUsage: 72 }
  ],
  terminalRegions: [
    { kind: 'terminal-region', countryCode: 'CN', countryName: '中国', longitude: 104.2, latitude: 35.8, total: 326, online: 307, offline: 8, warning: 9, danger: 2, status: 'warning' },
    { kind: 'terminal-region', countryCode: 'AE', countryName: '阿联酋', longitude: 54.4, latitude: 24.3, total: 86, online: 79, offline: 2, warning: 4, danger: 1, status: 'warning' },
    { kind: 'terminal-region', countryCode: 'SG', countryName: '新加坡', longitude: 103.8, latitude: 1.3, total: 64, online: 62, offline: 1, warning: 1, danger: 0, status: 'success' },
    { kind: 'terminal-region', countryCode: 'DE', countryName: '德国', longitude: 10.4, latitude: 51.1, total: 48, online: 43, offline: 2, warning: 2, danger: 1, status: 'danger' },
    { kind: 'terminal-region', countryCode: 'KE', countryName: '肯尼亚', longitude: 37.9, latitude: 0.2, total: 35, online: 33, offline: 1, warning: 1, danger: 0, status: 'success' },
    { kind: 'terminal-region', countryCode: 'BR', countryName: '巴西', longitude: -51.9, latitude: -14.2, total: 27, online: 24, offline: 1, warning: 2, danger: 0, status: 'warning' }
  ],
  domains: [
    { code: 'security', name: '安全态势', status: 'danger', metrics: [{ label: '高危事件', value: '4 起' }, { label: '高风险用户', value: '12 人' }, { label: '异常行为', value: '37 条' }] },
    { code: 'business', name: '业务态势', status: 'success', metrics: [{ label: '密信收发', value: '12.8 万' }, { label: '签阅积压', value: '23 件' }, { label: '加解密成功率', value: '99.6%' }] },
    { code: 'terminal', name: '终端态势', status: 'warning', metrics: [{ label: '终端在线率', value: '94.8%' }, { label: '高风险终端', value: '6 台' }, { label: 'USB Key 失败', value: '18 次' }] },
    { code: 'ops', name: '运维态势', status: 'warning', metrics: [{ label: '机房健康度', value: '92 分' }, { label: '离线设备', value: '3 台' }, { label: '资源告警', value: '21 条' }] }
  ]
};
