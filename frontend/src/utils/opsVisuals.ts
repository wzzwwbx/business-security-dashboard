import type {
  OpsAlertDto,
  OpsHostDetailDto,
  OpsHostSummaryDto,
  OpsOverviewDto,
  OpsProcessDto,
  OpsSourceDto,
  OpsTimeseriesDto
} from '@/types/ops';
import type { MiniTrendItem, VisualAssetNode, VisualBadgeItem, VisualLink } from '@/types/visualization';
import {
  archLabel,
  bindingStatusLabel,
  formatBytes,
  formatPercent,
  formatRelativeTime,
  processStateLabel,
  sourceSystemLabel,
  statusLabel,
  statusTone
} from '@/utils/opsFormatters';
import { normalizeTone, percentageTone } from '@/utils/visualization';

export function buildOpsOverviewMetrics(overview: OpsOverviewDto | null): MiniTrendItem[] {
  if (!overview) {
    return [];
  }

  return [
    {
      key: 'online',
      label: '在线主机',
      value: `${overview.onlineHosts}`,
      trend: `来源 ${overview.sourceCount} 个`,
      percent: Math.max(10, Math.min(100, overview.onlineHosts)),
      tone: 'success'
    },
    {
      key: 'offline',
      label: '离线主机',
      value: `${overview.offlineHosts}`,
      trend: `延迟 ${overview.staleHosts} 台`,
      percent: Math.min(100, overview.offlineHosts * 8 + overview.staleHosts * 5),
      tone: overview.offlineHosts > 0 ? 'danger' : overview.staleHosts > 0 ? 'warning' : 'success'
    },
    {
      key: 'cpu',
      label: '平均处理器',
      value: formatPercent(overview.averageCpuUsagePct),
      trend: '全网实时均值',
      percent: overview.averageCpuUsagePct,
      tone: percentageTone(overview.averageCpuUsagePct)
    },
    {
      key: 'memory',
      label: '平均内存',
      value: formatPercent(overview.averageMemoryUsagePct),
      trend: '全网实时均值',
      percent: overview.averageMemoryUsagePct,
      tone: percentageTone(overview.averageMemoryUsagePct)
    },
    {
      key: 'alerts',
      label: '当前告警',
      value: `${overview.openAlerts}`,
      trend: '未恢复资源告警',
      percent: Math.min(100, overview.openAlerts * 6),
      tone: overview.openAlerts > 0 ? 'warning' : 'success'
    }
  ];
}

function sourceLabel(sourceType: string, sourceSystem: string) {
  return `${statusLabel(sourceType)} · ${sourceSystemLabel(sourceSystem)}`;
}

function hostBadges(host: OpsHostSummaryDto): VisualBadgeItem[] {
  return [
    { label: statusLabel(host.status), tone: normalizeTone(host.status) },
    { label: sourceLabel(host.sourceType, host.sourceSystem), tone: 'info' }
  ];
}

function buildHostNode(host: OpsHostSummaryDto): VisualAssetNode {
  return {
    id: `host-${host.id}`,
    name: host.displayName || host.hostname,
    assetType: 'server',
    status: normalizeTone(host.status),
    description: `${host.primaryIp} · ${statusLabel(host.status)}`,
    metrics: [
      { label: '处理器', value: formatPercent(host.cpuUsagePct), tone: percentageTone(host.cpuUsagePct) },
      { label: '内存', value: formatPercent(host.memoryUsagePct), tone: percentageTone(host.memoryUsagePct) }
    ],
    badges: hostBadges(host),
    drilldownKey: String(host.id)
  };
}

function clusterHosts(hosts: OpsHostSummaryDto[]) {
  if (hosts.length <= 24) {
    return hosts.map(buildHostNode);
  }

  const groups = new Map<string, OpsHostSummaryDto[]>();
  hosts.forEach((host) => {
    const group = `${host.sourceType}-${host.status}`;
    const items = groups.get(group) ?? [];
    items.push(host);
    groups.set(group, items);
  });

  return Array.from(groups.entries()).map(([groupKey, items], index) => ({
    id: `cluster-${groupKey}-${index}`,
    name: `${statusLabel(items[0].status)}主机群`,
    assetType: 'cluster' as const,
    status: normalizeTone(items[0].status),
    description: `${sourceLabel(items[0].sourceType, items[0].sourceSystem)} · ${items.length} 台主机`,
    count: items.length,
    groupKey,
    metrics: [
      { label: '平均处理器', value: formatPercent(items.reduce((sum, item) => sum + item.cpuUsagePct, 0) / items.length) },
      { label: '平均内存', value: formatPercent(items.reduce((sum, item) => sum + item.memoryUsagePct, 0) / items.length) }
    ],
    children: items.slice(0, 16).map(buildHostNode)
  }));
}

export function buildOpsAssetCluster(hosts: OpsHostSummaryDto[]) {
  return clusterHosts(hosts);
}

export function buildOpsScene(sources: OpsSourceDto[], hosts: OpsHostSummaryDto[]) {
  const sourceNodes: VisualAssetNode[] = sources.map((source, index) => ({
    id: `source-${index}`,
    name: sourceSystemLabel(source.sourceSystem),
    assetType: 'source',
    status: normalizeTone(source.status),
    description: `${statusLabel(source.sourceType)} · ${statusLabel(source.status)}`,
    x: 14 + index * 12,
    y: 20 + (index % 2) * 18,
    metrics: [{ label: '资产', value: `${source.hostCount} 台` }],
    badges: [{ label: source.enabled ? '已启用' : '已停用', tone: source.enabled ? 'success' : 'warning' }]
  }));

  const hostGroups = clusterHosts(hosts);
  const clusterNodes: VisualAssetNode[] = hostGroups.slice(0, 6).map((node, index) => ({
    ...node,
    id: `scene-${node.id}`,
    x: 58 + (index % 2) * 18,
    y: 20 + Math.floor(index / 2) * 24
  }));

  const hubNode: VisualAssetNode = {
    id: 'ops-hub',
    name: '资源态势中枢',
    assetType: 'domain',
    status: hosts.some((host) => host.status === 'OFFLINE') ? 'warning' : 'success',
    description: '多源接入、主机归一、告警联动',
    x: 42,
    y: 50,
    metrics: [
      { label: '主机', value: `${hosts.length} 台` },
      { label: '来源', value: `${sources.length} 个` }
    ],
    badges: [{ label: '实时汇聚', tone: 'info' }]
  };

  const alertNode: VisualAssetNode = {
    id: 'ops-alerts',
    name: '异常联动',
    assetType: 'alert',
    status: hosts.some((host) => host.openAlertCount > 0) ? 'warning' : 'success',
    description: '热点进程与资源告警集中展示',
    x: 78,
    y: 78,
    metrics: [{ label: '告警主机', value: `${hosts.filter((host) => host.openAlertCount > 0).length} 台` }]
  };

  const nodes = [...sourceNodes, hubNode, ...clusterNodes, alertNode];
  const links: VisualLink[] = [
    ...sourceNodes.map((node) => ({ from: node.id, to: hubNode.id, tone: node.status })),
    ...clusterNodes.map((node) => ({ from: hubNode.id, to: node.id, tone: node.status })),
    { from: hubNode.id, to: alertNode.id, tone: alertNode.status }
  ];

  return { nodes, links };
}

export function buildOpsDrawerBadges(detail: OpsHostDetailDto | null): VisualBadgeItem[] {
  if (!detail) {
    return [];
  }

  return [
    { label: statusLabel(detail.status), tone: normalizeTone(detail.status) },
    { label: sourceLabel(detail.sourceType, detail.sourceSystem), tone: 'info' },
    { label: `${detail.cpuCores} 核`, tone: 'info' }
  ];
}

export function buildOpsDetailFacts(detail: OpsHostDetailDto | null) {
  if (!detail) {
    return [];
  }

  return [
    { label: '主机编码', value: detail.hostCode },
    { label: '主机名称', value: detail.hostname },
    { label: '主显示名', value: detail.displayName || '未设置' },
    { label: '主地址', value: detail.primaryIp },
    { label: '操作系统', value: detail.osName },
    { label: '内核版本', value: detail.kernelVersion },
    { label: '系统架构', value: archLabel(detail.arch) },
    { label: '总内存', value: formatBytes(detail.memoryTotalBytes) },
    { label: '最近观测', value: formatRelativeTime(detail.lastObservedAt) }
  ];
}

export function buildOpsRuntimeFacts(detail: OpsHostDetailDto | null) {
  if (!detail) {
    return [];
  }

  return [
    { label: '处理器利用率', value: formatPercent(detail.latestSnapshot.cpuUsagePct) },
    { label: '内存利用率', value: formatPercent(detail.latestSnapshot.memoryUsagePct) },
    { label: '磁盘利用率', value: formatPercent(detail.latestSnapshot.diskUsagePct) },
    { label: '平均负载', value: `${detail.latestSnapshot.load1.toFixed(2)} / ${detail.latestSnapshot.load5.toFixed(2)} / ${detail.latestSnapshot.load15.toFixed(2)}` },
    { label: '已用内存', value: formatBytes(detail.latestSnapshot.memUsedBytes) },
    { label: '交换区已用', value: formatBytes(detail.latestSnapshot.swapUsedBytes) },
    { label: '磁盘已用', value: formatBytes(detail.latestSnapshot.diskUsedBytes) },
    { label: '已建立连接', value: `${detail.latestSnapshot.tcpEstablishedCount}` },
    { label: '进程总数', value: `${detail.latestSnapshot.processCount}` }
  ];
}

export function buildOpsRelations(detail: OpsHostDetailDto | null) {
  if (!detail?.bindings.length) {
    return [];
  }

  return detail.bindings.map((binding) => ({
    label: sourceSystemLabel(binding.sourceSystem),
    value: `${binding.externalAssetId}${binding.externalHostName ? ` · ${binding.externalHostName}` : ''} · ${bindingStatusLabel(binding.bindingStatus)}`
  }));
}

export function buildOpsProcessNodes(processes: OpsProcessDto[]) {
  return processes.slice(0, 10).map((process) => ({
    id: `process-${process.pid}`,
    name: process.processName,
    assetType: 'service' as const,
    status: percentageTone(process.cpuUsagePct, 20, 50),
    description: `${process.pid} · ${processStateLabel(process.state)}`,
    metrics: [
      { label: '处理器', value: formatPercent(process.cpuUsagePct), tone: percentageTone(process.cpuUsagePct, 20, 50) },
      { label: '内存', value: formatBytes(process.memoryRssBytes) }
    ],
    badges: process.whitelisted ? [{ label: '白名单', tone: 'success' }] : [{ label: '观测', tone: 'warning' }]
  }));
}

export function buildOpsAlertNodes(alerts: OpsAlertDto[]) {
  return alerts.slice(0, 8).map((alert) => ({
    id: `alert-${alert.id}`,
    name: alert.title,
    assetType: 'alert' as const,
    status: normalizeTone(alert.severity),
    description: `${alert.hostName} · ${statusLabel(alert.severity)}`,
    badges: [{ label: statusLabel(alert.status), tone: normalizeTone(alert.status) }],
    metrics: [{ label: '最近发现', value: formatRelativeTime(alert.lastSeenAt) }]
  }));
}

export function buildOpsTimeseriesSummary(timeseries: OpsTimeseriesDto | null): MiniTrendItem[] {
  const points = timeseries?.points ?? [];
  if (!points.length) {
    return [];
  }

  const last = points[points.length - 1];
  return [
    {
      key: 'cpu',
      label: '处理器',
      value: formatPercent(last.cpuUsagePct),
      percent: last.cpuUsagePct,
      trend: `${timeseries?.range || '6h'} 观察窗`,
      tone: percentageTone(last.cpuUsagePct)
    },
    {
      key: 'memory',
      label: '内存',
      value: formatPercent(last.memoryUsagePct),
      percent: last.memoryUsagePct,
      trend: `${points.length} 个采样点`,
      tone: percentageTone(last.memoryUsagePct)
    },
    {
      key: 'disk',
      label: '磁盘',
      value: formatPercent(last.diskUsagePct),
      percent: last.diskUsagePct,
      trend: `负载 ${last.load1.toFixed(2)}`,
      tone: percentageTone(last.diskUsagePct)
    },
    {
      key: 'network',
      label: '网络',
      value: `${formatBytes(last.rxBytesPerSec)}/秒`,
      percent: Math.min(100, (last.rxBytesPerSec + last.txBytesPerSec) / 1024 / 1024),
      trend: `发送 ${formatBytes(last.txBytesPerSec)}/秒`,
      tone: statusTone(last.rxBytesPerSec > last.txBytesPerSec ? 'ONLINE' : 'STALE') as MiniTrendItem['tone']
    }
  ];
}
