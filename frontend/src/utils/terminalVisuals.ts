import type {
  TerminalDeviceDetailDto,
  TerminalDeviceSummaryDto,
  TerminalEventDto,
  TerminalOverviewDto,
  TerminalPeripheralEventDto,
  TerminalSoftwareChangeDto,
  TerminalSourceDto,
  TerminalTimeseriesDto
} from '@/types/terminal';
import type { MiniTrendItem, VisualAssetNode, VisualBadgeItem, VisualLink } from '@/types/visualization';
import {
  deviceStatusLabel,
  eventSeverityLabel,
  formatBytes,
  formatRelativeTime,
  ownershipStatusLabel,
  passwordModuleStatusLabel,
  peripheralActionLabel,
  riskLevelLabel,
  softwareChangeTypeLabel,
  sourceStatusLabel,
  sourceSystemLabel,
  sourceTypeLabel,
  statusTone
} from '@/utils/terminalFormatters';
import { normalizeTone, percentageTone } from '@/utils/visualization';

export function buildTerminalOverviewMetrics(overview: TerminalOverviewDto | null): MiniTrendItem[] {
  if (!overview) {
    return [];
  }

  return [
    {
      key: 'online',
      label: '在线终端',
      value: `${overview.onlineDevices}`,
      trend: `来源 ${overview.sourceCount} 个`,
      percent: Math.min(100, overview.onlineDevices),
      tone: 'success'
    },
    {
      key: 'risk',
      label: '高风险终端',
      value: `${overview.highRiskDevices}`,
      trend: `待认领 ${overview.pendingClaimDevices} 台`,
      percent: Math.min(100, overview.highRiskDevices * 10),
      tone: overview.highRiskDevices > 0 ? 'danger' : 'success'
    },
    {
      key: 'module',
      label: '密码模块异常',
      value: `${overview.abnormalPasswordModuleDevices}`,
      trend: `指纹变化 ${overview.fingerprintChangedDevices} 台`,
      percent: Math.min(100, overview.abnormalPasswordModuleDevices * 12),
      tone: overview.abnormalPasswordModuleDevices > 0 ? 'warning' : 'success'
    },
    {
      key: 'software',
      label: '软件变更',
      value: `${overview.softwareChangeDevices}`,
      trend: `外设事件 ${overview.peripheralAlertCount} 条`,
      percent: Math.min(100, overview.softwareChangeDevices * 6),
      tone: overview.softwareChangeDevices > 0 ? 'warning' : 'info'
    }
  ];
}

function buildDeviceNode(device: TerminalDeviceSummaryDto): VisualAssetNode {
  return {
    id: `device-${device.id}`,
    name: device.displayName,
    assetType: device.imei || device.meid ? 'mobile' : 'terminal',
    status: normalizeTone(device.riskLevel === 'HIGH' || device.riskLevel === 'CRITICAL' ? 'HIGH' : device.status),
    description: `${device.personName || '未关联人员'} · ${device.primaryIp || '未上报地址'}`,
    metrics: [
      { label: '流量', value: formatBytes(device.trafficUsedBytes) },
      { label: '风险', value: riskLevelLabel(device.riskLevel), tone: normalizeTone(device.riskLevel) }
    ],
    badges: [
      { label: deviceStatusLabel(device.status), tone: normalizeTone(device.status) },
      { label: ownershipStatusLabel(device.ownershipStatus), tone: normalizeTone(device.ownershipStatus) }
    ],
    drilldownKey: String(device.id)
  };
}

function clusterDevices(devices: TerminalDeviceSummaryDto[]) {
  if (devices.length <= 24) {
    return devices.map(buildDeviceNode);
  }

  const groups = new Map<string, TerminalDeviceSummaryDto[]>();
  devices.forEach((device) => {
    const key = `${device.riskLevel}-${device.ownershipStatus}`;
    const items = groups.get(key) ?? [];
    items.push(device);
    groups.set(key, items);
  });

  return Array.from(groups.entries()).map(([groupKey, items], index) => ({
    id: `terminal-cluster-${index}`,
    name: `${riskLevelLabel(items[0].riskLevel)} · ${ownershipStatusLabel(items[0].ownershipStatus)}`,
    assetType: 'cluster' as const,
    status: normalizeTone(items[0].riskLevel),
    count: items.length,
    groupKey,
    description: `${items.length} 台终端`,
    metrics: [
      { label: '在线', value: `${items.filter((item) => item.status === 'ONLINE').length} 台` },
      { label: '指纹变化', value: `${items.filter((item) => item.fingerprintChanged).length} 台` }
    ],
    children: items.slice(0, 16).map(buildDeviceNode)
  }));
}

export function buildTerminalAssetCluster(devices: TerminalDeviceSummaryDto[]) {
  return clusterDevices(devices);
}

export function buildTerminalScene(sources: TerminalSourceDto[], devices: TerminalDeviceSummaryDto[]) {
  const sourceNodes: VisualAssetNode[] = sources.map((source, index) => ({
    id: `terminal-source-${index}`,
    name: sourceSystemLabel(source.sourceSystem),
    assetType: 'source',
    status: normalizeTone(source.status),
    description: `${sourceTypeLabel(source.sourceType)} · ${sourceStatusLabel(source.status)}`,
    x: 16 + index * 14,
    y: 20,
    metrics: [{ label: '终端', value: `${source.deviceCount} 台` }]
  }));

  const clusterNodes = clusterDevices(devices).slice(0, 6).map((node, index) => ({
    ...node,
    id: `terminal-scene-${node.id}`,
    x: 58 + (index % 2) * 18,
    y: 18 + Math.floor(index / 2) * 24
  }));

  const hub: VisualAssetNode = {
    id: 'terminal-hub',
    name: '终端资产中枢',
    assetType: 'domain',
    status: devices.some((item) => item.riskLevel === 'HIGH' || item.riskLevel === 'CRITICAL') ? 'warning' : 'success',
    description: '终端、人员、异常事件统一联动',
    x: 42,
    y: 50,
    metrics: [
      { label: '终端', value: `${devices.length} 台` },
      { label: '异常', value: `${devices.filter((item) => item.riskLevel === 'HIGH' || item.riskLevel === 'CRITICAL').length} 台` }
    ]
  };

  const personNode: VisualAssetNode = {
    id: 'terminal-person',
    name: '人员关联',
    assetType: 'person',
    status: devices.some((item) => item.ownershipStatus === 'PENDING_CLAIM') ? 'warning' : 'success',
    description: '手机号、人员档案与终端归属',
    x: 78,
    y: 76,
    metrics: [{ label: '待认领', value: `${devices.filter((item) => item.ownershipStatus === 'PENDING_CLAIM').length} 台` }]
  };

  const nodes = [...sourceNodes, hub, ...clusterNodes, personNode];
  const links: VisualLink[] = [
    ...sourceNodes.map((node) => ({ from: node.id, to: hub.id, tone: node.status })),
    ...clusterNodes.map((node) => ({ from: hub.id, to: node.id, tone: node.status })),
    { from: hub.id, to: personNode.id, tone: personNode.status }
  ];

  return { nodes, links };
}

export function buildTerminalDrawerBadges(detail: TerminalDeviceDetailDto | null): VisualBadgeItem[] {
  if (!detail) {
    return [];
  }

  return [
    { label: deviceStatusLabel(detail.status), tone: normalizeTone(detail.status) },
    { label: riskLevelLabel(detail.riskLevel), tone: normalizeTone(detail.riskLevel) },
    { label: ownershipStatusLabel(detail.ownershipStatus), tone: normalizeTone(detail.ownershipStatus) }
  ];
}

export function buildTerminalBasicFacts(detail: TerminalDeviceDetailDto | null) {
  if (!detail) {
    return [];
  }

  return [
    { label: '终端编码', value: detail.deviceCode },
    { label: '终端名称', value: detail.displayName },
    { label: '数据来源', value: `${sourceTypeLabel(detail.sourceType)} · ${sourceSystemLabel(detail.sourceSystem)}` },
    { label: '终端上报手机号', value: detail.reportedPhoneNumberMasked || '未上报' },
    { label: '设备地址', value: detail.deviceInfo.primaryIp || '未上报' },
    { label: '系统版本', value: detail.deviceInfo.osVersion || '未上报' },
    { label: '国际移动设备识别码', value: detail.deviceInfo.imei || '未上报' },
    { label: '移动设备识别码', value: detail.deviceInfo.meid || '未上报' },
    { label: '最近观测', value: formatRelativeTime(detail.lastObservedAt) }
  ];
}

export function buildTerminalPersonFacts(detail: TerminalDeviceDetailDto | null) {
  if (!detail?.person) {
    return [];
  }

  return [
    { label: '人员姓名', value: detail.person.displayName || detail.person.fullName },
    { label: '工号', value: detail.person.employeeNo || '未维护' },
    { label: '部门', value: detail.person.departmentName || '未维护' },
    { label: '组织路径', value: detail.person.organizationPath || '未维护' },
    { label: '岗位', value: detail.person.jobTitle || '未维护' },
    { label: '人员手机号', value: detail.person.phoneNumberMasked || '未维护' }
  ];
}

export function buildTerminalSecurityFacts(detail: TerminalDeviceDetailDto | null) {
  if (!detail) {
    return [];
  }

  return [
    { label: '密码模块状态', value: passwordModuleStatusLabel(detail.latestSecurity.passwordModuleStatus) },
    { label: '密码套件状态', value: detail.latestSecurity.passwordSuiteStatus || '未上报' },
    { label: '错误口令次数', value: `${detail.latestSecurity.wrongPasswordCount}` },
    { label: '风险评分', value: detail.latestSecurity.riskScore != null ? `${detail.latestSecurity.riskScore}` : '未上报' },
    { label: '指纹变化', value: detail.latestSecurity.fingerprintChanged ? '是' : '否' },
    { label: '配置修改', value: detail.latestSecurity.configModified ? '是' : '否' },
    { label: '流量消耗', value: formatBytes(detail.deviceInfo.trafficUsedBytes) },
    { label: '风险摘要', value: detail.latestSecurity.summary || '暂无摘要' }
  ];
}

export function buildTerminalEventNodes(events: TerminalEventDto[]) {
  return events.slice(0, 8).map((event) => ({
    id: `event-${event.id}`,
    name: event.title,
    assetType: 'alert' as const,
    status: normalizeTone(event.severity),
    description: `${event.eventCategory} · ${eventSeverityLabel(event.severity)}`,
    badges: [{ label: event.eventType, tone: normalizeTone(event.severity) }],
    metrics: [{ label: '最近发生', value: formatRelativeTime(event.observedAt) }]
  }));
}

export function buildTerminalSoftwareNodes(changes: TerminalSoftwareChangeDto[]) {
  return changes.slice(0, 8).map((change) => ({
    id: `software-${change.id}`,
    name: change.softwareName,
    assetType: 'service' as const,
    status: 'info' as const,
    description: `${softwareChangeTypeLabel(change.changeType)} · ${change.softwareVersion || '版本未上报'}`,
    metrics: [{ label: '最近变化', value: formatRelativeTime(change.observedAt) }]
  }));
}

export function buildTerminalPeripheralNodes(events: TerminalPeripheralEventDto[]) {
  return events.slice(0, 8).map((event) => ({
    id: `peripheral-${event.id}`,
    name: event.peripheralName || event.peripheralType,
    assetType: 'alert' as const,
    status: 'warning' as const,
    description: `${peripheralActionLabel(event.actionType)} · ${event.peripheralType}`,
    metrics: [{ label: '最近变化', value: formatRelativeTime(event.observedAt) }]
  }));
}

export function buildTerminalTimeseriesSummary(timeseries: TerminalTimeseriesDto | null): MiniTrendItem[] {
  const points = timeseries?.points ?? [];
  if (!points.length) {
    return [];
  }

  const last = points[points.length - 1];
  const riskScore = last.riskScore ?? 0;
  return [
    {
      key: 'traffic',
      label: '流量消耗',
      value: formatBytes(last.trafficUsedBytes),
      trend: `${timeseries?.range || '24h'} 观察窗`,
      percent: Math.min(100, last.trafficUsedBytes / 1024 / 1024 / 4),
      tone: 'info'
    },
    {
      key: 'password',
      label: '错误口令',
      value: `${last.wrongPasswordCount}`,
      trend: `最近风险 ${riskLevelLabel(last.riskLevel)}`,
      percent: Math.min(100, last.wrongPasswordCount * 10),
      tone: last.wrongPasswordCount > 0 ? 'warning' : 'success'
    },
    {
      key: 'risk',
      label: '风险评分',
      value: last.riskScore != null ? `${last.riskScore}` : '未上报',
      trend: '综合判断',
      percent: Math.min(100, riskScore),
      tone: percentageTone(riskScore, 45, 70)
    }
  ];
}
