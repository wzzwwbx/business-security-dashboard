export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
  timestamp: string;
}

export interface OpsOverviewDto {
  generatedAt: string;
  onlineHosts: number;
  staleHosts: number;
  offlineHosts: number;
  openAlerts: number;
  sourceCount: number;
  averageCpuUsagePct: number;
  averageMemoryUsagePct: number;
}

export interface OpsSourceDto {
  sourceType: 'PROBE' | 'EXTERNAL_API' | 'MANUAL_IMPORT' | string;
  sourceSystem: string;
  enabled: boolean;
  status: string;
  hostCount: number;
  lastSeenAt: string | null;
}

export interface OpsHostSummaryDto {
  id: number;
  hostCode: string;
  hostname: string;
  displayName: string | null;
  primaryIp: string;
  status: 'ONLINE' | 'STALE' | 'OFFLINE' | string;
  sourceType: string;
  sourceSystem: string;
  cpuUsagePct: number;
  memoryUsagePct: number;
  load1: number;
  diskUsagePct: number;
  openAlertCount: number;
  lastObservedAt: string;
}

export interface OpsHostListDto {
  items: OpsHostSummaryDto[];
  page: number;
  size: number;
  total: number;
}

export interface OpsHostBindingDto {
  sourceSystem: string;
  externalAssetId: string;
  externalHostName: string | null;
  bindingStatus: string;
}

export interface OpsLatestSnapshotDto {
  cpuUsagePct: number;
  memoryUsagePct: number;
  load1: number;
  load5: number;
  load15: number;
  memUsedBytes: number;
  memAvailableBytes: number;
  swapUsedBytes: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  diskUsagePct: number;
  tcpEstablishedCount: number;
  processCount: number;
}

export interface OpsHostDetailDto {
  id: number;
  hostCode: string;
  hostname: string;
  displayName: string | null;
  primaryIp: string;
  status: string;
  sourceType: string;
  sourceSystem: string;
  osName: string;
  kernelVersion: string;
  arch: string;
  cpuCores: number;
  memoryTotalBytes: number;
  lastObservedAt: string;
  latestSnapshot: OpsLatestSnapshotDto;
  bindings: OpsHostBindingDto[];
}

export interface OpsTimeseriesPointDto {
  observedAt: string;
  cpuUsagePct: number;
  memoryUsagePct: number;
  diskUsagePct: number;
  load1: number;
  rxBytesPerSec: number;
  txBytesPerSec: number;
}

export interface OpsTimeseriesDto {
  range: '1h' | '6h' | '24h' | string;
  points: OpsTimeseriesPointDto[];
}

export interface OpsProcessDto {
  pid: number;
  processName: string;
  commandLine: string | null;
  cpuUsagePct: number;
  memoryRssBytes: number;
  state: string;
  whitelisted: boolean;
  observedAt: string;
}

export interface OpsAlertDto {
  id: number;
  hostId: number;
  hostName: string;
  primaryIp: string;
  alertType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | string;
  status: 'OPEN' | 'RESOLVED' | string;
  title: string;
  detail: string;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
}
