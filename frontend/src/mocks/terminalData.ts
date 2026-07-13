import type { TerminalDeviceDetailDto, TerminalDeviceSummaryDto, TerminalEventDto, TerminalOverviewDto, TerminalPeripheralEventDto, TerminalSoftwareChangeDto, TerminalSourceDto, TerminalTimeseriesDto } from '@/types/terminal';

const regions = [
  ['CN', '中国', '北京'], ['CN', '中国', '上海'], ['AE', '阿联酋', '迪拜'],
  ['SG', '新加坡', '新加坡'], ['DE', '德国', '法兰克福'], ['KE', '肯尼亚', '内罗毕'], ['BR', '巴西', '巴西利亚']
] as const;
const deviceKinds = ['签批 PAD', '移动电报终端', '便携保障终端', '值守终端'];
const owners = ['王芳', '李强', '陈宇', '赵敏', '周航', '孙悦'];

export const mockTerminalDevices: TerminalDeviceSummaryDto[] = Array.from({ length: 28 }, (_, index) => {
  const [countryCode, countryName, city] = regions[index % regions.length];
  const isCritical = index === 11 || index === 18;
  const isOffline = index % 13 === 0;
  return {
    id: index + 1,
    deviceCode: `T-${String(index + 21).padStart(3, '0')}`,
    displayName: `${city}${deviceKinds[index % deviceKinds.length]}-${String(index + 1).padStart(2, '0')}`,
    personName: owners[index % owners.length],
    employeeNo: `U-${String(800 + index)}`,
    departmentName: countryCode === 'CN' ? '国内业务保障组' : '境外综合保障组',
    phoneNumberMasked: `138****${String(1200 + index).slice(-4)}`,
    primaryIp: `10.${20 + index}.6.${21 + index}`,
    osVersion: index % 2 ? 'Android 14' : 'HarmonyOS 4.2',
    imei: `86000000000${index}111`,
    meid: `A100000000${index}111`,
    passwordModuleStatus: isCritical ? 'ABNORMAL' : 'NORMAL',
    riskLevel: isCritical ? 'CRITICAL' : index % 6 === 0 ? 'HIGH' : 'LOW',
    status: isOffline ? 'OFFLINE' : 'ONLINE',
    ownershipStatus: index % 17 === 0 ? 'PENDING_CLAIM' : 'CLAIMED',
    trafficUsedBytes: 5368709120 + index * 268435456,
    fingerprintChanged: index % 11 === 0,
    configModified: index % 9 === 0,
    lastObservedAt: new Date(Date.now() - (index % 5) * 60000).toISOString(),
    sourceType: 'EXTERNAL_API',
    sourceSystem: '移动终端管控平台',
    countryCode,
    countryName,
    city,
    siteCode: countryCode === 'CN' ? 'beijing-core' : null
  };
});

export const mockTerminalOverview: TerminalOverviewDto = {
  generatedAt: new Date().toISOString(), onlineDevices: 618, staleDevices: 7, offlineDevices: 12,
  highRiskDevices: 6, abnormalPasswordModuleDevices: 3, fingerprintChangedDevices: 4,
  pendingClaimDevices: 8, peripheralAlertCount: 18, softwareChangeDevices: 12, sourceCount: 4
};

const terminalRegionTotals: Record<string, number> = { CN: 326, AE: 86, SG: 64, DE: 48, KE: 35, BR: 27 };

export function getMockTerminalOverview(countryCode?: string): TerminalOverviewDto {
  const total = countryCode ? terminalRegionTotals[countryCode] : undefined;
  if (!total) return mockTerminalOverview;

  const offlineDevices = Math.max(1, Math.round(total * 0.025));
  const highRiskDevices = Math.max(1, Math.round(total * 0.018));
  return {
    generatedAt: new Date().toISOString(),
    onlineDevices: total - offlineDevices,
    staleDevices: Math.max(1, Math.round(total * 0.012)),
    offlineDevices,
    highRiskDevices,
    abnormalPasswordModuleDevices: Math.max(1, Math.round(highRiskDevices / 2)),
    fingerprintChangedDevices: Math.max(1, Math.round(total * 0.012)),
    pendingClaimDevices: Math.max(1, Math.round(total * 0.015)),
    peripheralAlertCount: Math.max(2, Math.round(total * 0.055)),
    softwareChangeDevices: Math.max(2, Math.round(total * 0.035)),
    sourceCount: 4
  };
}

export const mockTerminalSources: TerminalSourceDto[] = [
  { sourceType: 'EXTERNAL_API', sourceSystem: '移动终端管控平台', enabled: true, status: 'HEALTHY', deviceCount: 637, lastSeenAt: new Date().toISOString() },
  { sourceType: 'EXTERNAL_API', sourceSystem: '签批 PAD 管理平台', enabled: true, status: 'HEALTHY', deviceCount: 286, lastSeenAt: new Date().toISOString() },
  { sourceType: 'EXTERNAL_API', sourceSystem: 'USB Key 认证中心', enabled: true, status: 'HEALTHY', deviceCount: 612, lastSeenAt: new Date().toISOString() },
  { sourceType: 'EXTERNAL_API', sourceSystem: '零信任运维管理系统', enabled: true, status: 'HEALTHY', deviceCount: 598, lastSeenAt: new Date().toISOString() }
];

export function getMockTerminalDetail(id: number): TerminalDeviceDetailDto {
  const item = mockTerminalDevices.find((device) => device.id === id) ?? mockTerminalDevices[0];
  return {
    id: item.id, deviceCode: item.deviceCode, displayName: item.displayName, status: item.status,
    riskLevel: item.riskLevel, lastObservedAt: item.lastObservedAt, sourceType: item.sourceType,
    sourceSystem: item.sourceSystem, ownershipStatus: item.ownershipStatus,
    reportedPhoneNumberMasked: item.phoneNumberMasked,
    person: { personCode: item.employeeNo || '', fullName: item.personName || '', displayName: item.personName, employeeNo: item.employeeNo, departmentName: item.departmentName, organizationPath: `保障中心/${item.departmentName}`, jobTitle: '终端保障员', email: null, phoneNumberMasked: item.phoneNumberMasked },
    deviceInfo: { deviceName: item.displayName, primaryIp: item.primaryIp, osVersion: item.osVersion, imei: item.imei, meid: item.meid, plmn: '46000', trafficUsedBytes: item.trafficUsedBytes, countryCode: item.countryCode, countryName: item.countryName, city: item.city, siteCode: item.siteCode },
    latestSecurity: { passwordModuleStatus: item.passwordModuleStatus, passwordModuleVersion: '3.8.2', passwordSuiteStatus: 'NORMAL', wrongPasswordCount: item.riskLevel === 'CRITICAL' ? 3 : 0, fingerprintChanged: item.fingerprintChanged, configModified: item.configModified, riskLevel: item.riskLevel, riskScore: item.riskLevel === 'CRITICAL' ? 92 : 24, summary: '设备健康、USB Key 与通联状态已完成综合评估。' },
    bindings: []
  };
}

export function getMockTerminalEvents(id: number): TerminalEventDto[] {
  const titles = ['USB Key 连续认证失败', '终端状态心跳恢复', '通联对象关系发生变更', '签批客户端完成安全升级', '设备电量进入关注区间', '终端接入位置发生变化', '密码模块自检通过', '离线消息同步完成'];
  return titles.map((title, index) => ({ id: id * 100 + index, eventCategory: index % 2 ? '通联' : '认证', eventType: index % 3 ? 'STATUS' : 'PIN_FAILURE', severity: index === 0 ? 'HIGH' : index === 4 ? 'WARNING' : 'INFO', title, detail: `${title}，系统已记录处置状态和责任人。`, observedAt: new Date(Date.now() - index * 600000).toISOString() }));
}

export function getMockTerminalSoftware(id: number): TerminalSoftwareChangeDto[] {
  return [
    { id: id * 10, changeType: 'UPDATE', softwareName: '签批客户端', softwareVersion: '6.2.1', detail: '安全补丁已安装', observedAt: new Date().toISOString() },
    { id: id * 10 + 1, changeType: 'UPDATE', softwareName: '密码服务组件', softwareVersion: '3.8.2', detail: '组件完整性校验通过', observedAt: new Date(Date.now() - 3600000).toISOString() }
  ];
}

export function getMockTerminalPeripherals(id: number): TerminalPeripheralEventDto[] {
  return [
    { id: id * 10, peripheralType: 'USB_KEY', peripheralName: 'USB Key 013A', actionType: 'INSERT', detail: '设备已插入并完成认证', observedAt: new Date().toISOString() },
    { id: id * 10 + 1, peripheralType: 'SECURITY_MODULE', peripheralName: '密码安全模块', actionType: 'SELF_CHECK', detail: '模块自检通过', observedAt: new Date(Date.now() - 1800000).toISOString() }
  ];
}

export function getMockTerminalTimeseries(): TerminalTimeseriesDto {
  return { range: '24h', points: Array.from({ length: 12 }, (_, index) => ({ observedAt: new Date(Date.now() - index * 3600000).toISOString(), trafficUsedBytes: 1024 * 1024 * (index + 3), wrongPasswordCount: index === 1 ? 3 : 0, riskScore: 22 + index * 4, riskLevel: index > 8 ? 'HIGH' : 'LOW' })) };
}
